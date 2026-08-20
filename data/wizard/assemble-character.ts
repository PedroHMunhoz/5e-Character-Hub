// Builds the final, real CharacterSheet from a completed WizardDraft. Every
// choice below is normally already validated by its own step (see
// app/wizard/*.tsx's `canProceed` gates) - this only re-checks presence
// (was *something* picked for each mandatory choice), as a defensive
// backstop against reaching this screen out of order; see the comment on
// the `missingChoices` block inside assembleCharacter for why.

import type { SQLiteDatabase } from 'expo-sqlite';

import { ABILITIES, SKILLS } from '@/constants/character';
import { BREATH_WEAPON_ITEM_ID } from '@/constants/draconic-ancestry';
import { FAVORED_ENEMY_HUMANOID_KEY } from '@/constants/favored-enemy';
import { SPELLCASTING_RULES } from '@/constants/spellcasting';
import { getSubraceDisplayName } from '@/constants/subrace-names';
import { parseClassArmorProficiencies, parseRaceArmorProficiencies } from '@/data/wizard/armor-proficiency-resolver';
import { getBackgroundById } from '@/data/queries/backgrounds';
import { getBaseItemCategoriesByIds } from '@/data/queries/base-items';
import {
  classGrantsExpertiseAtLevel1,
  classGrantsFavoredEnemyAtLevel1,
  classGrantsFavoredTerrainAtLevel1,
  classGrantsFightingStyleAtLevel1,
  classGrantsSubclassAtLevel1,
  getClassById,
  getClassEnglishName,
  getSubclassById,
} from '@/data/queries/classes';
import { itemKey } from '@/data/queries/equipment-lookup';
import { getFeatById } from '@/data/queries/feats';
import { getAllLanguages } from '@/data/queries/languages';
import { getOptionalFeatureById } from '@/data/queries/optional-features';
import { getAllRaces, getRaceById } from '@/data/queries/races';
import { RACES_THAT_GRANT_A_FEAT } from '@/constants/race-feat-grants';
import { getFeatAbilityBonuses } from '@/data/wizard/feat-ability-bonus';
import {
  getClassGrantedLanguageNames,
  parseFixedLanguageEnglishNames,
} from '@/data/wizard/language-proficiency-resolver';
import { combineAbilityBonuses, getResolvedRacialBonus } from '@/data/wizard/race-ability-bonus';
import { getRaceGrantedSpellIds } from '@/data/wizard/race-granted-spells';
import type { ResolvedEquipmentEntry } from '@/data/wizard/equipment-resolver';
import { parseBackgroundSkillProficiencies, parseClassSkillChoice } from '@/data/wizard/skill-proficiency-resolver';
import {
  resolveClassWeaponProficiencies,
  resolveRaceWeaponProficiencies,
} from '@/data/wizard/weapon-proficiency-resolver';
import { feetToMeters } from '@/utils/speed';
import type { WizardDraft } from '@/context/wizard-context';
import type {
  AbilityKey,
  ArmorCategory,
  Biography,
  CharacterClass,
  CharacterFeatState,
  CharacterSheet,
  Currency,
  InventoryItemState,
  Skill,
  SkillKey,
  ToolState,
  WeaponCategory,
} from '@/types/character';

// The 3 PHB "Armored" feats each grant armor-category proficiency directly
// (PHB p.165-172) - not modeled as a generic "proficiency" effect since
// they're the only PHB feats that grant one.
const FEAT_ARMOR_PROFICIENCY_GRANTS: Record<string, ArmorCategory[]> = {
  'Lightly Armored': ['light'],
  'Moderately Armored': ['medium', 'shield'],
  'Heavily Armored': ['heavy'],
};

// Some Cleric Divine Domains grant bonus armor/weapon proficiency at 1st
// level via their "Bonus Proficiencies" feature (PHB): unstructured prose in
// subclass_features.entries, not parsed elsewhere - same reasoning as
// FEAT_ARMOR_PROFICIENCY_GRANTS above, just hardcoded for the 4 PHB domains
// that grant one instead of added as generic schema data. Keyed by
// subclass.shortName, same stable identifier used at `subclass?.shortName
// === 'Draconic'` below and in constants/subclass-info.ts.
const DOMAIN_ARMOR_PROFICIENCY_GRANTS: Record<string, ArmorCategory[]> = {
  Life: ['heavy'],
  Nature: ['heavy'],
  Tempest: ['heavy'],
  War: ['heavy'],
};

const DOMAIN_WEAPON_PROFICIENCY_GRANTS: Record<string, WeaponCategory[]> = {
  Tempest: ['martial'],
  War: ['martial'],
};

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const EMPTY_BIOGRAPHY: Biography = {
  alignment: '',
  eyes: '',
  height: '',
  faith: '',
  hair: '',
  weight: '',
  gender: '',
  skin: '',
  age: '',
  ideals: '',
  personalityTraits: '',
  bonds: '',
  flaws: '',
  notes: '',
};

const EMPTY_CURRENCY: Currency = { pl: '0', po: '0', pp: '0', pe: '0', pc: '0' };

// 5etools' saving_throw_proficiencies is a JSON array of lowercase ability
// abbreviations, e.g. ["str","con"] - matches AbilityKey directly.
function isAbilityKey(value: string): value is AbilityKey {
  return (ABILITIES.map((a) => a.key) as string[]).includes(value);
}

export interface AssembleCharacterInput {
  draft: WizardDraft;
  name: string;
  appearance: Partial<Biography>;
}

export async function assembleCharacter(db: SQLiteDatabase, input: AssembleCharacterInput): Promise<CharacterSheet> {
  const { draft, name, appearance } = input;
  if (draft.raceId === null || draft.classId === null || draft.backgroundId === null) {
    throw new Error('assembleCharacter: draft is missing a required choice (raça/classe/antecedente)');
  }

  const race = await getRaceById(db, draft.raceId);
  const subrace = draft.subraceId !== null ? await getRaceById(db, draft.subraceId) : null;
  const classDef = await getClassById(db, draft.classId);
  const classEnglishName = await getClassEnglishName(db, draft.classId);
  const subclass = draft.subclassId !== null ? await getSubclassById(db, draft.subclassId) : null;
  const background = await getBackgroundById(db, draft.backgroundId);
  const fightingStyle = draft.fightingStyleId !== null ? await getOptionalFeatureById(db, draft.fightingStyleId) : null;
  const feat = draft.featId !== null ? await getFeatById(db, draft.featId) : null;

  if (!race || !classDef || !background) {
    throw new Error('assembleCharacter: failed to load race/class/background from the reference database');
  }

  // Variant Human REPLACES the standard Human's own fixed "+1 to all six"
  // bonus with its own +1/+1 `choose` clause rather than adding to it - see
  // the identical note in app/wizard/index.tsx and app/wizard/abilities.tsx.
  // Computed once here (rather than separately for validation below and for
  // ability-score assembly further down) since both need it.
  const isVariantHuman = subrace?.englishName === 'Variant';
  const combinedBonuses = combineAbilityBonuses(
    isVariantHuman ? null : race.abilityBonuses,
    subrace?.abilityBonuses ?? null
  );

  // Defensive re-validation: every choice below is normally already
  // confirmed by its own step's `canProceed` gate before the player can
  // reach Detalhes (see the file-level comment) - but expo-router's
  // `<Stack>` doesn't structurally prevent reaching this screen out of
  // order (e.g. browser back/forward on a web build), so nothing else
  // guarantees it. These are presence checks (was *something* picked),
  // not exact-count re-validation - the per-step gates already own getting
  // the count right; this only exists to catch a step being skipped
  // entirely, turning a silently incomplete character into a loud failure.
  const missingChoices: string[] = [];
  const raceBonusClause = combinedBonuses.choices[0];
  if (raceBonusClause && Object.values(draft.abilityBonusChoices).every((v) => !v)) {
    missingChoices.push('bônus de atributo racial');
  }
  const raceSkillClauseCheck =
    parseClassSkillChoice(race.skillProficiencies) ??
    (subrace ? parseClassSkillChoice(subrace.skillProficiencies) : null);
  if (raceSkillClauseCheck && draft.raceSkillChoices.length === 0) missingChoices.push('perícia racial');
  if (race.englishName === 'Dragonborn' && draft.draconicAncestry === null) missingChoices.push('linhagem dracônica');
  if (subrace === null) {
    // Variant Human isn't a real "pick a subrace" option (see the identical
    // exclusion in app/wizard/index.tsx's `subraces` list) - it's surfaced
    // as its own top-level Raça entry instead, so a plain Human never has a
    // subrace step to complete and must not be flagged as missing one.
    const allRaces = await getAllRaces(db);
    if (allRaces.some((r) => r.parentRaceId === race.id && r.englishName !== 'Variant')) {
      missingChoices.push('sub-raça');
    }
  }

  if ((await classGrantsSubclassAtLevel1(db, classDef.id)) && subclass === null) {
    missingChoices.push(classDef.subclassTitle ?? 'subclasse');
  }
  if ((await classGrantsFightingStyleAtLevel1(db, classDef.id)) && fightingStyle === null) {
    missingChoices.push('estilo de luta');
  }
  if (await classGrantsFavoredEnemyAtLevel1(db, classDef.id)) {
    if (draft.favoredEnemyType === null) {
      missingChoices.push('inimigo favorito');
    } else {
      const humanoidRacesMissing =
        draft.favoredEnemyType === FAVORED_ENEMY_HUMANOID_KEY &&
        (draft.favoredEnemyHumanoidRaces[0] === null || draft.favoredEnemyHumanoidRaces[1] === null);
      if (humanoidRacesMissing) missingChoices.push('raças humanoides do inimigo favorito');
      const languagesMissing =
        draft.favoredEnemyType === FAVORED_ENEMY_HUMANOID_KEY
          ? draft.favoredEnemyLanguageIds[0] === null || draft.favoredEnemyLanguageIds[1] === null
          : draft.favoredEnemyLanguageIds[0] === null;
      if (!humanoidRacesMissing && languagesMissing) missingChoices.push('idioma do inimigo favorito');
    }
  }
  if ((await classGrantsFavoredTerrainAtLevel1(db, classDef.id)) && draft.favoredTerrainType === null) {
    missingChoices.push('terreno favorito');
  }

  if (draft.abilityMethod === null || ABILITIES.some((a) => draft.baseAbilityScores[a.key] === undefined)) {
    missingChoices.push('valores de atributo');
  }
  if (subrace !== null && RACES_THAT_GRANT_A_FEAT.has(subrace.englishName)) {
    if (draft.featId === null) {
      missingChoices.push('talento');
    } else if (feat && getFeatAbilityBonuses(feat.ability).choice && draft.featAbilityChoice === null) {
      missingChoices.push('atributo do talento');
    }
  }

  const classSkillsField = (classDef.startingProficiencies as { skills?: unknown } | null)?.skills;
  if (parseClassSkillChoice(classSkillsField) && draft.classSkillChoices.length === 0) {
    missingChoices.push('perícia de classe');
  }
  if ((await classGrantsExpertiseAtLevel1(db, classDef.id)) && draft.expertiseSkillChoices.length === 0) {
    missingChoices.push('especialização');
  }
  const isToolEntryUnresolved = (entry: ResolvedEquipmentEntry) =>
    entry.kind === 'unresolved' || entry.kind === 'categoryChoice' || entry.kind === 'namedChoice';
  if (draft.toolProficiencies.some(isToolEntryUnresolved) || draft.raceToolProficiencies.some(isToolEntryUnresolved)) {
    missingChoices.push('proficiência em ferramentas');
  }

  if (draft.equipmentMode === null) {
    missingChoices.push('equipamento');
  } else if (draft.equipmentMode === 'gold' && draft.goldRolled === null) {
    missingChoices.push('ouro inicial');
  }
  if (draft.chosenEquipment.length === 0) missingChoices.push('equipamento');

  if (classEnglishName && SPELLCASTING_RULES[classEnglishName] && draft.spellIds.length === 0) {
    missingChoices.push('magias');
  }
  if (subrace?.englishName === 'High' && draft.highElfCantripId === null) {
    missingChoices.push('truque de Alto Elfo');
  }
  if (name.trim().length === 0) missingChoices.push('nome');

  if (missingChoices.length > 0) {
    throw new Error(`assembleCharacter: escolhas pendentes no wizard: ${[...new Set(missingChoices)].join(', ')}`);
  }

  // Ability scores: base (from whichever method the player used) + racial
  // bonus (fixed grants + whatever the player picked for a `choose` clause,
  // combinedBonuses computed above) + feat bonus (if the chosen feat has its
  // own ability-bonus clause, e.g. Athlete).
  // Fixed component (e.g. Heavily Armored's flat +1 Strength, Actor's flat
  // +1 Charisma) applies unconditionally; the `choose` component (e.g.
  // Athlete's Strength-or-Dexterity) only applies once the player has
  // actually picked one in the Abilities step.
  const featAbilityBonuses = feat ? getFeatAbilityBonuses(feat.ability) : { fixed: {}, choice: null };
  const featAbilityChoice = featAbilityBonuses.choice ? draft.featAbilityChoice : null;
  const abilities = Object.fromEntries(
    ABILITIES.map((ability) => [
      ability.key,
      {
        base: String(draft.baseAbilityScores[ability.key] ?? 8),
        racialBonus: getResolvedRacialBonus(combinedBonuses, draft.abilityBonusChoices, ability.key),
        featBonus: (featAbilityBonuses.fixed[ability.key] ?? 0) + (ability.key === featAbilityChoice ? 1 : 0),
      },
    ])
  ) as CharacterSheet['abilities'];

  // Saving throws: fixed grant from the class definition + Resilient's own
  // grant (proficiency in saving throws using the chosen ability - PHB
  // p.170, not modeled as a generic "ability choice" effect since it's the
  // only PHB feat that grants a saving throw proficiency).
  const savingThrowKeys = new Set((classDef.savingThrowProficiencies ?? []).filter(isAbilityKey));
  if (feat?.englishName === 'Resilient' && featAbilityChoice) savingThrowKeys.add(featAbilityChoice);
  const savingThrows = Object.fromEntries(
    ABILITIES.map((ability) => [ability.key, { proficient: savingThrowKeys.has(ability.key) }])
  ) as CharacterSheet['savingThrows'];

  // Skills: background's fixed grant + the class skills the player chose,
  // with Expertise (doubled proficiency) for whichever of those the player
  // picked in the Expertise sub-step (Rogue only, at level 1). classSkillChoices
  // only holds the class's own picks (the background step already excluded
  // background-granted skills from that pool - see app/wizard/background.tsx),
  // so the background's grant is re-derived here and unioned in.
  const backgroundSkillKeys = parseBackgroundSkillProficiencies(background.skillProficiencies);
  const raceSkillKeys = [
    ...parseBackgroundSkillProficiencies(race.skillProficiencies),
    ...(subrace ? parseBackgroundSkillProficiencies(subrace.skillProficiencies) : []),
  ];
  const proficientSkillKeys = new Set<SkillKey>([
    ...draft.classSkillChoices,
    ...backgroundSkillKeys,
    ...raceSkillKeys,
    ...draft.raceSkillChoices,
  ]);
  const expertiseKeys = new Set<SkillKey>(draft.expertiseSkillChoices);

  const skills = Object.fromEntries(
    SKILLS.map((skill) => [
      skill.key,
      { proficient: proficientSkillKeys.has(skill.key), expertise: expertiseKeys.has(skill.key) } satisfies Skill,
    ])
  ) as CharacterSheet['skills'];

  // Tools: resolved by the background step (class + background, fixed
  // grants + player-picked category choices) plus race/subrace's own grant
  // (Dwarf/Rock Gnome - kept as a separate draft field, see the note on
  // raceToolProficiencies in context/wizard-context.tsx, but merged back
  // together here since the final character doesn't care which step granted
  // a proficiency). 'item' entries map to a concrete tool id; 'special'/
  // 'unresolved' entries have no catalog row to track proficiency against,
  // so they're persisted as freeform text instead (CharacterSheet.
  // freeformToolProficiencies) rather than silently dropped - e.g. Folk
  // Hero/Soldier/Sailor's vehicle proficiency.
  const tools: Record<string, ToolState> = {};
  const freeformToolProficiencies: string[] = [];
  for (const entry of [...draft.toolProficiencies, ...draft.raceToolProficiencies]) {
    if (entry.kind === 'item') {
      const key = itemKey(entry.source, entry.itemId);
      tools[key] = { proficient: true, expertise: key === draft.expertiseToolChoice };
    } else if (entry.kind === 'special') {
      freeformToolProficiencies.push(entry.text);
    } else if (entry.kind === 'unresolved') {
      freeformToolProficiencies.push(String(entry.raw));
    }
  }

  // Languages: race's fixed grant (Common + own language; a subrace's own
  // `languages` value - only High Elf in the PHB - overwrites the base
  // race's grant rather than adding to it, same as the wizard's background
  // step) + background's fixed grant (none in the PHB, but checked for
  // future sourcebooks) + whatever the player picked for either's
  // anyStandard choice + any level-1 class feature that grants a specific
  // language outright (Druid's Druidic, Rogue's Thieves' Cant).
  const allLanguages = await getAllLanguages(db);
  const languageByEnglishName = new Map(allLanguages.map((language) => [language.englishName.toLowerCase(), language]));
  const effectiveRaceLanguagesRaw = subrace?.languages ?? race.languages;
  const fixedLanguageNames = [
    ...parseFixedLanguageEnglishNames(effectiveRaceLanguagesRaw),
    ...parseFixedLanguageEnglishNames(background.languageProficiencies),
    ...(await getClassGrantedLanguageNames(db, classDef.id, 1)),
  ];
  const fixedLanguageIds = fixedLanguageNames
    .map((name) => languageByEnglishName.get(name.toLowerCase())?.id)
    .filter((id): id is number => id != null);
  // The Ranger's Favored Enemy language pick(s) (see constants/favored-
  // enemy.ts) - one per favored enemy (up to two for the humanoid
  // alternative) - only contribute a real id here; FAVORED_ENEMY_NO_LANGUAGE/
  // null mean that particular favored enemy doesn't grant a language.
  const favoredEnemyLanguageIds = draft.favoredEnemyLanguageIds.filter((id): id is number => typeof id === 'number');
  const languages = [
    ...new Set([
      ...fixedLanguageIds,
      ...draft.raceLanguageChoices,
      ...draft.backgroundLanguageChoices,
      ...favoredEnemyLanguageIds,
    ]),
  ];

  // Armor/weapon proficiency: class + race/subrace's fixed grants, no player
  // choice involved (unlike languages/skills above) - always re-derived here
  // rather than tracked in the wizard draft. See
  // data/wizard/armor-proficiency-resolver.ts and
  // data/wizard/weapon-proficiency-resolver.ts.
  const classArmorField = (classDef.startingProficiencies as { armor?: unknown } | null)?.armor;
  const armorProficiencies = [
    ...new Set([
      ...parseClassArmorProficiencies(classArmorField),
      ...parseRaceArmorProficiencies(race.armorProficiencies),
      ...parseRaceArmorProficiencies(subrace?.armorProficiencies),
      ...(feat ? (FEAT_ARMOR_PROFICIENCY_GRANTS[feat.englishName] ?? []) : []),
      ...(subclass ? (DOMAIN_ARMOR_PROFICIENCY_GRANTS[subclass.shortName] ?? []) : []),
    ]),
  ];

  const classWeaponsField = (classDef.startingProficiencies as { weapons?: unknown } | null)?.weapons;
  const classWeapons = await resolveClassWeaponProficiencies(db, classWeaponsField);
  const raceWeaponItems = await resolveRaceWeaponProficiencies(db, race.weaponProficiencies);
  const subraceWeaponItems = await resolveRaceWeaponProficiencies(db, subrace?.weaponProficiencies);
  const weaponProficiencies = {
    categories: [
      ...new Set([
        ...classWeapons.categories,
        ...(subclass ? (DOMAIN_WEAPON_PROFICIENCY_GRANTS[subclass.shortName] ?? []) : []),
      ]),
    ],
    items: [
      ...new Set(
        [...classWeapons.items, ...raceWeaponItems, ...subraceWeaponItems].map((item) => itemKey(item.source, item.id))
      ),
    ],
  };

  // Inventory: resolved entirely by the equipment step. 'special' flavor
  // entries with no `valueCp` (no db row) and any leftover
  // 'categoryChoice'/'unresolved' entries (shouldn't happen - the
  // equipment step gates on full resolution) are skipped rather than
  // guessed at.
  //
  // Weapon/armor grants (base_items only - see getBaseItemCategoriesByIds)
  // are non-stackable: each unit becomes its own inventoryItems row (its own
  // future weaponSlot/armorSlot), so e.g. 2x Handaxe from a class's starting
  // equipment shows as two separate items the player can dual-wield, instead
  // of collapsing into one row with quantity "2" and a single equip slot.
  // Everything else (consumables, general gear) still sums into one row per
  // catalog item, same as before.
  // Class/background starting-equipment grants plus whatever was bought on
  // the item-shop screen (app/wizard/shop.tsx) - both resolve to the same
  // ResolvedEquipmentEntry shape (see data/wizard/item-purchase.ts's
  // explodeCartToGrants), so they're granted through this one combined loop.
  const allEquipmentEntries = [...draft.chosenEquipment, ...draft.purchasedEquipment];

  const baseItemIdsToCategorize = new Set<number>();
  for (const entry of allEquipmentEntries) {
    if (entry.kind !== 'item') continue;
    if (entry.packContents) {
      for (const sub of entry.packContents) {
        if (sub.source === 'base_items') baseItemIdsToCategorize.add(sub.itemId);
      }
    } else if (entry.source === 'base_items') {
      baseItemIdsToCategorize.add(entry.itemId);
    }
  }
  const categoriesById = await getBaseItemCategoriesByIds(db, [...baseItemIdsToCategorize]);

  function isNonStackable(source: 'base_items' | 'items', id: number): boolean {
    if (source !== 'base_items') return false;
    const category = categoriesById.get(id);
    return category === 'weapon' || category === 'armor';
  }

  const inventoryItems: Record<string, InventoryItemState> = {};
  // Tracks the single instance row for each stackable catalog item, so
  // repeated grants of the same stackable item keep summing into it instead
  // of creating duplicate rows.
  const stackInstanceByKey = new Map<string, string>();

  function addStackable(key: string, quantity: number) {
    const existingId = stackInstanceByKey.get(key);
    if (existingId) {
      const existing = inventoryItems[existingId];
      inventoryItems[existingId] = { ...existing, quantity: String(Number(existing.quantity) + quantity) };
      return;
    }
    const instanceId = randomId('item');
    inventoryItems[instanceId] = { itemId: key, quantity: String(quantity) };
    stackInstanceByKey.set(key, instanceId);
  }

  function addNonStackable(key: string, quantity: number) {
    for (let i = 0; i < quantity; i++) {
      inventoryItems[randomId('item')] = { itemId: key, quantity: '1' };
    }
  }

  // Accumulated in copper pieces (not divided down to gp here) so the final
  // currency calc below can net it against goldSpentCp before splitting into
  // po/pc - dividing per-entry the way this used to would produce a
  // fractional-gp intermediate that can't be reassembled into whole po/pc
  // afterward.
  let goldFromEquipmentCp = 0;
  for (const entry of allEquipmentEntries) {
    // Bare currency grant with no item at all (e.g. Eremita's "5 gp",
    // {value: 500} in the raw DSL - see equipment-resolver.ts) - same
    // starting-currency pool as containsValueCp below, just no inventory
    // item to attach it to.
    if (entry.kind === 'special') {
      if (entry.valueCp) goldFromEquipmentCp += entry.valueCp;
      continue;
    }
    if (entry.kind !== 'item') continue;
    // A multi-item equipment pack (Explorer's Pack, ...) never becomes an
    // inventory row itself - grant its resolved contents instead (see
    // ResolvedEquipmentEntry.packContents / equipment-resolver.ts).
    if (entry.packContents) {
      for (const sub of entry.packContents) {
        const subKey = itemKey(sub.source, sub.itemId);
        if (isNonStackable(sub.source, sub.itemId)) addNonStackable(subKey, sub.quantity);
        else addStackable(subKey, sub.quantity);
      }
      if (entry.containsValueCp) goldFromEquipmentCp += entry.containsValueCp;
      continue;
    }
    const key = itemKey(entry.source, entry.itemId);
    if (isNonStackable(entry.source, entry.itemId)) addNonStackable(key, entry.quantity);
    else addStackable(key, entry.quantity);
    if (entry.containsValueCp) goldFromEquipmentCp += entry.containsValueCp;
  }

  // Dragonborn's Breath Weapon: a natural weapon, not catalog gear - never
  // goes through the equipment resolver above, granted directly here instead.
  // See constants/draconic-ancestry.ts's BREATH_WEAPON_ITEM_ID.
  if (draft.draconicAncestry) {
    inventoryItems[randomId('item')] = { itemId: BREATH_WEAPON_ITEM_ID, quantity: '1', locked: true };
  }

  // Total wealth in copper pieces (rolled starting gold, minus whatever was
  // spent on the item-shop screen in the Equipamento step's 'gold' mode,
  // plus any currency granted alongside chosen equipment - see
  // goldFromEquipmentCp above), then split into whole po + leftover pc.
  // Shop prices go down to the copper piece (e.g. Tocha = 1 pc), unlike the
  // starting-equipment currency grants above (always whole gp in the PHB
  // DSL), so this is the first place a real copper remainder can occur.
  const totalCurrencyCp =
    (draft.equipmentMode === 'gold' ? (draft.goldRolled ?? 0) * 100 : 0) +
    goldFromEquipmentCp -
    (draft.equipmentMode === 'gold' ? draft.goldSpentCp : 0);
  const currency: Currency = {
    ...EMPTY_CURRENCY,
    po: String(Math.floor(totalCurrencyCp / 100)),
    pc: String(totalCurrencyCp % 100),
  };

  // Spells: everything the player picked in the (conditional) spells step.
  // Wizard is the only class with BOTH a fixed spellbook size
  // (spellsKnownFixed) AND a separately-computed daily prepared cap
  // (maxPreparedFormula) - it starts with nothing prepared so the player
  // chooses what to prepare via the Spells tab's toggle. Every other caster
  // (known casters, and Cleric/Druid whose creation step already limits the
  // pick to the prepared cap) starts with everything prepared.
  const spellcastingRule = classEnglishName ? SPELLCASTING_RULES[classEnglishName] : undefined;
  const startsPrepared = !(spellcastingRule?.spellsKnownFixed && spellcastingRule?.maxPreparedFormula);
  // Racial cantrips (e.g. Tiefling's Infernal Legacy) are granted outright,
  // independent of the class spellcasting step above - runs unconditionally
  // even for a non-caster (same "doesn't depend on any wizard step having
  // run" shape as the Breath Weapon grant above). Skipped if the player
  // already picked the same cantrip through their class, so it isn't
  // double-listed or has its prepared state clobbered.
  const raceGrantedSpellIds = await getRaceGrantedSpellIds(db, race.englishName, subrace?.englishName ?? null);
  const classSpellEntries = draft.spellIds.map((id) => [String(id), { prepared: startsPrepared }] as const);
  const racialSpellEntries = raceGrantedSpellIds
    .filter((id) => !draft.spellIds.includes(id))
    .map((id) => [String(id), { prepared: true }] as const);
  // Elfo Alto's "Cantrip" (PHB p.24): unlike Tiefling/Drow/Forest Gnome above
  // (a fixed name resolved via RACE_GRANTED_CANTRIPS), this is a Wizard-list
  // cantrip the player picked in the wizard's Spells step - already an id in
  // the draft (context/wizard-context.tsx's highElfCantripId), so it just
  // needs the same dedup guard as racialSpellEntries (a High Elf Wizard who
  // picks the same cantrip through both the class and the racial choice).
  const highElfSpellEntries =
    draft.highElfCantripId !== null && !draft.spellIds.includes(draft.highElfCantripId)
      ? [[String(draft.highElfCantripId), { prepared: true }] as const]
      : [];
  const spells = Object.fromEntries([...classSpellEntries, ...racialSpellEntries, ...highElfSpellEntries]);

  // Hit points: level-1 max HP is always the hit die's full face value +
  // CON modifier (PHB p.12), never rolled at level 1. Draconic Bloodline
  // sorcerers get +1 to this (and +1 again per sorcerer level on level-up,
  // out of scope - the wizard only creates level 1) from Draconic
  // Resilience - `shortName` is the raw subclass identifier and unique
  // across the whole PHB, so no need to also check the class.
  const conTotal = Number(abilities.con.base) + abilities.con.racialBonus + (abilities.con.featBonus ?? 0);
  const conModifier = Math.floor((conTotal - 10) / 2);
  const isDraconicSorcerer = subclass?.shortName === 'Draconic';
  // Dwarven Toughness (Hill Dwarf, PHB p.20): "+1 hit point, and it
  // increases by 1 every time you gain a level" - +1 at level 1 here (a
  // future level-up flow would need to add another +1 per level gained
  // afterward).
  const isHillDwarf = subrace?.englishName === 'Hill';
  // Tough (PHB p.171): "+2 hit points per character level" at the level it's
  // taken, i.e. +2 at level 1 here (the wizard only creates level-1
  // characters - a future level-up flow would need to add another +2 per
  // level gained afterward).
  const toughBonus = feat?.englishName === 'Tough' ? 2 : 0;
  const maxHp = Math.max(
    1,
    (classDef.hitDieFaces ?? 8) + conModifier + (isDraconicSorcerer ? 1 : 0) + (isHillDwarf ? 1 : 0) + toughBonus
  );

  const raceDisplayName = subrace ? getSubraceDisplayName(subrace.englishName, subrace.name) : race.name;
  const classDisplayName = subclass ? `${classDef.name} (${subclass.name})` : classDef.name;

  const characterClass: CharacterClass = {
    id: randomId('class'),
    classId: classDef.id,
    subclassId: subclass?.id ?? null,
    name: classDisplayName,
    level: '1',
  };

  const character: CharacterSheet = {
    id: randomId('character'),
    name,
    raceId: race.id,
    subraceId: subrace?.id ?? null,
    race: raceDisplayName,
    draconicAncestry: draft.draconicAncestry,
    fightingStyle: fightingStyle?.englishName ?? null,
    favoredEnemyType: draft.favoredEnemyType,
    favoredEnemyHumanoidRaces:
      draft.favoredEnemyType === FAVORED_ENEMY_HUMANOID_KEY &&
      draft.favoredEnemyHumanoidRaces[0] !== null &&
      draft.favoredEnemyHumanoidRaces[1] !== null
        ? [draft.favoredEnemyHumanoidRaces[0], draft.favoredEnemyHumanoidRaces[1]]
        : null,
    favoredTerrainType: draft.favoredTerrainType,
    favoredEnemyLanguageIds: draft.favoredEnemyLanguageIds,
    feats: feat
      ? [
          {
            featId: feat.id,
            englishName: feat.englishName,
            abilityChoice: featAbilityChoice,
          } satisfies CharacterFeatState,
        ]
      : [],
    backgroundId: background.id,
    classes: [characterClass],
    inspiration: false,
    abilities,
    savingThrows,
    skills,
    languages,
    armorProficiencies,
    weaponProficiencies,
    speed: String(feetToMeters(subrace?.speed ?? race.speed ?? 30)),
    hitPoints: { max: String(maxHp), current: String(maxHp), temporary: '0' },
    hitDice: { current: '1', max: '1' },
    exhaustion: 0,
    deathSaves: { successes: 0, failures: 0 },
    currency,
    inventoryItems,
    tools,
    freeformToolProficiencies,
    features: {},
    spells,
    spellSlotsUsed: {},
    biography: { ...EMPTY_BIOGRAPHY, ...appearance },
  };

  return character;
}
