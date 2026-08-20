// Test-only "auto-preenchedor": given a race/subrace/class/subclass/
// background combination, produces a fully-resolved WizardDraft
// (context/wizard-context.tsx) without any human interaction - so
// assembleCharacter (data/wizard/assemble-character.ts) can run against it
// directly in a test.
//
// Strategy: for every OPEN choice (where the PHB rule allows more than one
// valid option - which skill, which cantrip, which equipment option...) this
// always picks the first valid option, deterministically. The goal isn't
// randomness or covering every sub-choice combination - it's producing, for
// every race x class x subclass x background combination, at least one
// legal level-1 draft that assembleCharacter accepts. Every resolution step
// below mirrors the real wizard screen it stands in for (see the file
// comment on each function) so the produced draft matches what the app
// itself would build for the same picks.
import type { SQLiteDatabase } from 'expo-sqlite';

import { RACES_THAT_GRANT_A_FEAT } from '@/constants/race-feat-grants';
import { DRACONIC_ANCESTRIES } from '@/constants/draconic-ancestry';
import {
  FAVORED_ENEMY_NO_LANGUAGE,
  FAVORED_ENEMY_TYPES,
  getFavoredEnemyTypeLanguages,
} from '@/constants/favored-enemy';
import { FAVORED_TERRAINS } from '@/constants/favored-terrain';
import { SPELLCASTING_RULES } from '@/constants/spellcasting';
import type { WizardDraft } from '@/context/wizard-context';
import { getBackgroundById } from '@/data/queries/backgrounds';
import {
  classGrantsExpertiseAtLevel1,
  classGrantsFavoredEnemyAtLevel1,
  classGrantsFavoredTerrainAtLevel1,
  classGrantsFightingStyleAtLevel1,
  classGrantsSubclassAtLevel1,
  getClassById,
  getClassEnglishName,
  getSubclassExpandedSpellsByLevel,
} from '@/data/queries/classes';
import {
  parseBackgroundEquipment,
  parseClassEquipment,
  resolveCategoryChoiceOptions,
  resolveEquipmentItemRefs,
  type ResolvedEquipmentEntry,
} from '@/data/wizard/equipment-resolver';
import { getAllFeats } from '@/data/queries/feats';
import { getFightingStyleOptions } from '@/data/queries/optional-features';
import { getAllLanguages, type Language } from '@/data/queries/languages';
import { getRaceById } from '@/data/queries/races';
import { getSpellsByNames, getSpellsForClass } from '@/data/queries/spells';
import { getAllToolItems, getToolItemsByCategory, normalizeToolCategoryKey } from '@/data/queries/tools';
import { parseClassArmorProficiencies, parseRaceArmorProficiencies } from '@/data/wizard/armor-proficiency-resolver';
import { getFeatAbilityBonuses } from '@/data/wizard/feat-ability-bonus';
import { meetsFeatPrerequisite, type FeatPrerequisiteContext } from '@/data/wizard/feat-prerequisites';
import { parseFixedLanguageEnglishNames, parseLanguageChoiceCount } from '@/data/wizard/language-proficiency-resolver';
import { combineAbilityBonuses } from '@/data/wizard/race-ability-bonus';
import {
  ALL_SKILL_KEYS,
  parseBackgroundSkillProficiencies,
  parseClassSkillChoice,
  resolveSkillChoicePool,
  type SkillChoiceClause,
} from '@/data/wizard/skill-proficiency-resolver';
import { resolveToolProficiencies } from '@/data/wizard/tool-proficiency-resolver';
import { getPreparedSpellCount } from '@/utils/spellcasting';
import type { AbilityKey, ArmorCategory, SkillKey } from '@/types/character';

export interface DraftInput {
  raceId: number;
  subraceId: number | null;
  classId: number;
  subclassId: number | null;
  backgroundId: number;
}

// PHB standard array (components/wizard/standard-array-assigner.tsx) -
// duplicated here (not imported) because that module drags in
// react-native/expo-router through its component tree, which has no place
// in a Node test process. Assigned in fixed str/dex/con/int/wis/cha order -
// assembleCharacter doesn't care whether the assignment is optimal for the
// class, only that every ability has a value, so any fixed assignment is a
// valid, deterministic "some ability method was used" pick.
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const ABILITY_ORDER: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

function take<T>(items: T[], count: number, context: string): T[] {
  if (items.length < count) {
    throw new Error(`build-test-draft: ${context} precisa de ${count} opções, só há ${items.length} disponíveis`);
  }
  return items.slice(0, count);
}

async function resolveEquipmentCategoryChoice(
  db: SQLiteDatabase,
  entry: ResolvedEquipmentEntry
): Promise<ResolvedEquipmentEntry> {
  if (entry.kind !== 'categoryChoice') return entry;
  const options = await resolveCategoryChoiceOptions(db, entry.equipmentType);
  if (options.length === 0) {
    throw new Error(`build-test-draft: nenhuma opção de equipamento para a categoria "${entry.equipmentType}"`);
  }
  const [first] = options;
  return { kind: 'item', itemId: first.id, source: first.source, name: first.name, quantity: entry.quantity };
}

// Tool-proficiency categoryChoice/namedChoice resolution mirrors
// components/wizard/tool-choice-list.tsx exactly (a different DSL/category
// space than the equipment step's own categoryChoice above - see the file
// comment on data/wizard/tool-proficiency-resolver.ts).
async function resolveToolChoiceEntry(
  db: SQLiteDatabase,
  entry: ResolvedEquipmentEntry
): Promise<ResolvedEquipmentEntry> {
  if (entry.kind === 'categoryChoice') {
    const category = normalizeToolCategoryKey(entry.equipmentType);
    const options = category ? await getToolItemsByCategory(db, category) : [];
    if (options.length === 0) {
      throw new Error(`build-test-draft: nenhuma ferramenta disponível para a categoria "${entry.equipmentType}"`);
    }
    const [first] = options;
    return { kind: 'item', itemId: first.id, source: first.source, name: first.name, quantity: entry.quantity };
  }
  if (entry.kind === 'namedChoice') {
    if (entry.options.length === 0) {
      throw new Error(`build-test-draft: namedChoice "${entry.label}" sem opções`);
    }
    const [first] = entry.options;
    return { kind: 'item', itemId: first.itemId, source: first.source, name: first.name, quantity: 1 };
  }
  return entry;
}

async function resolveAllToolEntries(db: SQLiteDatabase, entries: ResolvedEquipmentEntry[]) {
  const resolved: ResolvedEquipmentEntry[] = [];
  for (const entry of entries) resolved.push(await resolveToolChoiceEntry(db, entry));
  return resolved;
}

export async function buildTestDraft(db: SQLiteDatabase, input: DraftInput): Promise<WizardDraft> {
  const { raceId, subraceId, classId, subclassId, backgroundId } = input;

  // --- Passo 1: Raça (mirrors app/wizard/index.tsx) ---
  const race = await getRaceById(db, raceId);
  const subrace = subraceId !== null ? await getRaceById(db, subraceId) : null;
  if (!race) throw new Error(`build-test-draft: raça ${raceId} não encontrada`);

  const isVariantHuman = subrace?.englishName === 'Variant';
  const combinedRaceBonuses = combineAbilityBonuses(
    isVariantHuman ? null : race.abilityBonuses,
    subrace?.abilityBonuses ?? null
  );
  const bonusChoiceClause = combinedRaceBonuses.choices[0];
  const abilityBonusChoices: Partial<Record<AbilityKey, number>> = {};
  if (bonusChoiceClause) {
    for (const key of take(bonusChoiceClause.from, bonusChoiceClause.count, `bônus racial de ${race.name}`)) {
      abilityBonusChoices[key] = 1;
    }
  }

  const raceSkillClause =
    parseClassSkillChoice(race.skillProficiencies) ?? (subrace ? parseClassSkillChoice(subrace.skillProficiencies) : null);
  const raceSkillChoicesStep1: SkillKey[] = raceSkillClause
    ? take(raceSkillClause.from, raceSkillClause.count, `perícia racial de ${race.name}`)
    : [];

  const isDragonborn = race.englishName === 'Dragonborn';
  const draconicAncestry = isDragonborn ? DRACONIC_ANCESTRIES[0].key : null;

  // --- Passo 2: Classe (mirrors app/wizard/class.tsx) ---
  const classDef = await getClassById(db, classId);
  if (!classDef) throw new Error(`build-test-draft: classe ${classId} não encontrada`);

  const grantsFightingStyle = await classGrantsFightingStyleAtLevel1(db, classId);
  let fightingStyleId: number | null = null;
  if (grantsFightingStyle) {
    const options = await getFightingStyleOptions(db);
    if (options.length === 0) throw new Error('build-test-draft: nenhum estilo de luta disponível');
    fightingStyleId = options[0].id;
  }

  const grantsFavoredEnemy = await classGrantsFavoredEnemyAtLevel1(db, classId);
  let favoredEnemyType: string | null = null;
  const favoredEnemyLanguageIds: [number | typeof FAVORED_ENEMY_NO_LANGUAGE | null, number | typeof FAVORED_ENEMY_NO_LANGUAGE | null] =
    [null, null];
  if (grantsFavoredEnemy) {
    // First non-humanoid type (Aberration) - avoids the "two humanoid races"
    // alternative's extra picks entirely, keeping this deterministic and
    // simple. Any PHB type is an equally legal choice per the rule itself.
    favoredEnemyType = FAVORED_ENEMY_TYPES[0].key;
    const possibleNames = getFavoredEnemyTypeLanguages(favoredEnemyType);
    if (possibleNames.length === 0) {
      favoredEnemyLanguageIds[0] = FAVORED_ENEMY_NO_LANGUAGE;
    } else {
      const allLanguages = await getAllLanguages(db);
      const match = resolveFirstLanguageMatch(possibleNames, allLanguages);
      favoredEnemyLanguageIds[0] = match ? match.id : FAVORED_ENEMY_NO_LANGUAGE;
    }
  }

  const grantsFavoredTerrain = await classGrantsFavoredTerrainAtLevel1(db, classId);
  const favoredTerrainType = grantsFavoredTerrain ? FAVORED_TERRAINS[0].key : null;

  // --- Passo 3: Atributos (mirrors app/wizard/abilities.tsx) ---
  const baseAbilityScores: Partial<Record<AbilityKey, number>> = {};
  ABILITY_ORDER.forEach((key, index) => {
    baseAbilityScores[key] = STANDARD_ARRAY[index];
  });

  let featId: number | null = null;
  let featAbilityChoice: AbilityKey | null = null;
  const grantsFeat = subrace !== null && RACES_THAT_GRANT_A_FEAT.has(subrace.englishName);
  if (grantsFeat) {
    const totalAbilityScores = Object.fromEntries(
      ABILITY_ORDER.map((key) => [
        key,
        (baseAbilityScores[key] ?? 0) + (combinedRaceBonuses.fixed[key] ?? 0) + (abilityBonusChoices[key] ?? 0),
      ])
    ) as Record<AbilityKey, number>;

    const classArmorField = (classDef.startingProficiencies as { armor?: unknown } | null)?.armor;
    const armorProficiencies = new Set<ArmorCategory>([
      ...parseClassArmorProficiencies(classArmorField),
      ...parseRaceArmorProficiencies(race.armorProficiencies),
      ...parseRaceArmorProficiencies(subrace?.armorProficiencies),
    ]);
    const featContext: FeatPrerequisiteContext = {
      abilityScores: totalAbilityScores,
      armorProficiencies,
      canCastSpells: classDef.spellcastingAbility != null,
    };

    const feats = await getAllFeats(db);
    const eligibleFeats = feats.filter((feat) => meetsFeatPrerequisite(feat.prerequisite, featContext));
    if (eligibleFeats.length === 0) {
      throw new Error(`build-test-draft: nenhum talento elegível para ${race.name}/${classDef.name}`);
    }
    const [chosenFeat] = eligibleFeats;
    featId = chosenFeat.id;
    const featAbilityBonuses = getFeatAbilityBonuses(chosenFeat.ability);
    if (featAbilityBonuses.choice) {
      featAbilityChoice = take(featAbilityBonuses.choice.from, 1, `bônus de atributo do talento ${chosenFeat.name}`)[0];
    }
  }

  // --- Passo 4: Antecedente, Perícias e Ferramentas (mirrors app/wizard/background.tsx) ---
  const background = await getBackgroundById(db, backgroundId);
  if (!background) throw new Error(`build-test-draft: antecedente ${backgroundId} não encontrado`);

  const backgroundSkills = parseBackgroundSkillProficiencies(background.skillProficiencies);
  const raceSkillsFixed = [
    ...parseBackgroundSkillProficiencies(race.skillProficiencies),
    ...(subrace ? parseBackgroundSkillProficiencies(subrace.skillProficiencies) : []),
  ];

  // PHB p.127: a race-step skill pick that collides with the background's
  // fixed grant gets swapped for a different skill instead of wasted - see
  // the identical resolution in app/wizard/background.tsx.
  const raceSkillCollisions = raceSkillChoicesStep1.filter((key) => backgroundSkills.includes(key));
  let raceSkillChoices = raceSkillChoicesStep1;
  if (raceSkillCollisions.length > 0) {
    const replacementClause = resolveSkillChoicePool({ from: ALL_SKILL_KEYS, count: raceSkillCollisions.length }, [
      ...backgroundSkills,
      ...raceSkillsFixed,
      ...raceSkillChoicesStep1,
    ]);
    const replacement = take(replacementClause.from, replacementClause.count, 'substituição de perícia racial colidida');
    raceSkillChoices = [...raceSkillChoicesStep1.filter((key) => !backgroundSkills.includes(key)), ...replacement];
  }
  const raceSkillsEffective = [...new Set([...raceSkillsFixed, ...raceSkillChoices])];

  const classSkillsField = (classDef.startingProficiencies as { skills?: unknown } | null)?.skills;
  const rawClassSkillClause = parseClassSkillChoice(classSkillsField);
  const classSkillClause: SkillChoiceClause | null = rawClassSkillClause
    ? resolveSkillChoicePool(rawClassSkillClause, [...backgroundSkills, ...raceSkillsEffective])
    : null;
  const classSkillChoices: SkillKey[] = classSkillClause
    ? take(classSkillClause.from, classSkillClause.count, `perícia de classe de ${classDef.name}`)
    : [];

  // Tool proficiencies: class + background (draft.toolProficiencies) resolved
  // separately from race/subrace's own grant (draft.raceToolProficiencies) -
  // same split as the real step, see context/wizard-context.tsx's note on
  // raceToolProficiencies.
  const classToolProfs = (classDef.startingProficiencies as { toolProficiencies?: unknown })?.toolProficiencies;
  const combinedToolProfs = [...((classToolProfs as unknown[]) ?? []), ...((background.toolProficiencies as unknown[]) ?? [])];
  const toolProficiencies = await resolveAllToolEntries(db, await resolveToolProficiencies(db, combinedToolProfs));

  const raceToolProfsRaw = [...((race.toolProficiencies as unknown[]) ?? []), ...((subrace?.toolProficiencies as unknown[]) ?? [])];
  const raceToolProficiencies = await resolveAllToolEntries(db, await resolveToolProficiencies(db, raceToolProfsRaw));

  const expertiseAllowed = await classGrantsExpertiseAtLevel1(db, classId);
  let expertiseSkillChoices: SkillKey[] = [];
  if (expertiseAllowed) {
    // Never swaps in thieves' tools (expertiseToolChoice stays null) - two
    // ordinary skill picks from the already-proficient pool is always a
    // legal Rogue Expertise pick (PHB p.96).
    const proficientSkillPool = [...new Set([...backgroundSkills, ...raceSkillsEffective, ...classSkillChoices])];
    expertiseSkillChoices = take(proficientSkillPool, 2, `Expertise de ${classDef.name}`);
  }

  // Languages: race's anyStandard pick and background's anyStandard pick,
  // resolved from a shared "standard, not already fixed/chosen elsewhere"
  // pool - mirrors the cross-exclusion in app/wizard/background.tsx (each
  // side excludes what the other side already granted) without needing that
  // screen's two-way reactive state.
  const allLanguages = await getAllLanguages(db);
  const standardLanguages = allLanguages.filter((l) => l.type === 'standard' && l.englishName.toLowerCase() !== 'common');
  const effectiveRaceLanguagesRaw = subrace?.languages ?? race.languages;
  const raceLanguagesFixedNames = new Set(parseFixedLanguageEnglishNames(effectiveRaceLanguagesRaw).map((n) => n.toLowerCase()));
  const backgroundLanguagesFixedNames = new Set(
    parseFixedLanguageEnglishNames(background.languageProficiencies).map((n) => n.toLowerCase())
  );
  const favoredEnemyLanguageIdSet = new Set(
    favoredEnemyLanguageIds.filter((id): id is number => typeof id === 'number')
  );
  const languagePool = standardLanguages.filter(
    (l) =>
      !raceLanguagesFixedNames.has(l.englishName.toLowerCase()) &&
      !backgroundLanguagesFixedNames.has(l.englishName.toLowerCase()) &&
      !favoredEnemyLanguageIdSet.has(l.id)
  );
  const raceLanguageCount = parseLanguageChoiceCount(effectiveRaceLanguagesRaw) ?? 0;
  const raceLanguageChoices = take(languagePool, raceLanguageCount, `idioma racial de ${race.name}`).map((l) => l.id);
  const remainingLanguagePool = languagePool.filter((l) => !raceLanguageChoices.includes(l.id));
  const backgroundLanguageCount = parseLanguageChoiceCount(background.languageProficiencies) ?? 0;
  const backgroundLanguageChoices = take(
    remainingLanguagePool,
    backgroundLanguageCount,
    `idioma de antecedente de ${background.name}`
  ).map((l) => l.id);

  // --- Passo 5: Equipamento (mirrors app/wizard/equipment.tsx) ---
  const { groups: classEquipmentGroups } = parseClassEquipment(classDef.startingEquipment);
  const backgroundEquipmentGroups = parseBackgroundEquipment(background.startingEquipment);
  const resolvedClassGroups = await resolveEquipmentItemRefs(db, classEquipmentGroups);
  const resolvedBackgroundGroups = await resolveEquipmentItemRefs(db, backgroundEquipmentGroups);

  async function resolveGroupsToEntries(groups: Awaited<ReturnType<typeof resolveEquipmentItemRefs>>) {
    const entries: ResolvedEquipmentEntry[] = [];
    for (const group of groups) {
      // Always the first option (key 'a', or whichever sorts first) of a
      // choice group - any option is an equally legal PHB pick.
      const rawEntries = group.kind === 'fixed' ? group.entries : group.options[0].entries;
      for (const entry of rawEntries) entries.push(await resolveEquipmentCategoryChoice(db, entry));
    }
    return entries;
  }

  const chosenEquipment = [...(await resolveGroupsToEntries(resolvedClassGroups)), ...(await resolveGroupsToEntries(resolvedBackgroundGroups))];

  // --- Passo 6: Magias (mirrors app/wizard/spells.tsx) ---
  const classEnglishName = await getClassEnglishName(db, classId);
  const isLevel1Caster = classDef.casterProgression === 'full' || classDef.casterProgression === 'pact';
  const rule = classEnglishName ? SPELLCASTING_RULES[classEnglishName] : undefined;
  let spellIds: number[] = [];
  if (isLevel1Caster && rule && classEnglishName) {
    const classSpells = await getSpellsForClass(db, classEnglishName);
    let allSpells = classSpells;
    if (subclassId !== null) {
      const expandedByLevel = await getSubclassExpandedSpellsByLevel(db, subclassId);
      const expandedNames = expandedByLevel?.s1 ?? [];
      if (expandedNames.length > 0) {
        const expandedSpells = await getSpellsByNames(db, expandedNames);
        const classSpellIds = new Set(classSpells.map((s) => s.id));
        allSpells = [...classSpells, ...expandedSpells.filter((s) => !classSpellIds.has(s.id))];
      }
    }
    const cantrips = allSpells.filter((s) => s.level === 0);
    const level1Spells = allSpells.filter((s) => s.level === 1);

    let level1Count = rule.spellsKnownFixed ?? 1;
    if (rule.preparedFromFullList && classDef.spellcastingAbility) {
      const abilityKey = classDef.spellcastingAbility as AbilityKey;
      const combined = combineAbilityBonuses(race.abilityBonuses, subrace?.abilityBonuses ?? null);
      const racialBonus = (combined.fixed[abilityKey] ?? 0) + (abilityBonusChoices[abilityKey] ?? 0);
      const base = baseAbilityScores[abilityKey] ?? 10;
      const modifier = Math.floor((base + racialBonus - 10) / 2);
      level1Count = getPreparedSpellCount(modifier, 1);
    }

    const selectedCantrips = take(cantrips, rule.cantripsKnown, `truques de ${classDef.name}`);
    const selectedLevel1 = take(level1Spells, level1Count, `magias de 1º nível de ${classDef.name}`);
    spellIds = [...selectedCantrips.map((s) => s.id), ...selectedLevel1.map((s) => s.id)];
  }

  // Elfo Alto ("Cantrip", PHB p.24, mirrors app/wizard/spells.tsx): um truque
  // do Mago à escolha, independente da classe do personagem - excluindo os
  // já escolhidos pela própria classe (só relevante pra um Alto Elfo Mago)
  // pra sempre produzir uma escolha genuinamente distinta, igual a UI faz.
  let highElfCantripId: number | null = null;
  if (subrace?.englishName === 'High') {
    const wizardCantrips = (await getSpellsForClass(db, 'Wizard')).filter((s) => s.level === 0);
    const availableWizardCantrips = wizardCantrips.filter((s) => !spellIds.includes(s.id));
    const [picked] = take(availableWizardCantrips, 1, 'truque de Alto Elfo');
    highElfCantripId = picked.id;
  }

  // --- Passo 7: Detalhes ---
  const name = 'Personagem de Teste';

  return {
    raceId,
    subraceId,
    abilityBonusChoices,
    draconicAncestry,
    featId,
    featAbilityChoice,
    classId,
    subclassId,
    fightingStyleId,
    favoredEnemyType,
    favoredEnemyHumanoidRaces: [null, null],
    favoredTerrainType,
    favoredEnemyLanguageIds,
    abilityMethod: 'array',
    baseAbilityScores,
    backgroundId,
    classSkillChoices,
    raceSkillChoices,
    raceLanguageChoices,
    backgroundLanguageChoices,
    expertiseSkillChoices,
    expertiseToolChoice: null,
    toolProficiencies,
    raceToolProficiencies,
    equipmentMode: 'starting',
    chosenEquipment,
    goldRolled: null,
    purchasedEquipment: [],
    goldSpentCp: 0,
    purchaseCart: {},
    spellIds,
    highElfCantripId,
    name,
  };
}

function resolveFirstLanguageMatch(englishNames: string[], languages: Language[]): Language | null {
  for (const name of englishNames) {
    const match = languages.find((l) => l.englishName.toLowerCase() === name.toLowerCase());
    if (match) return match;
  }
  return null;
}
