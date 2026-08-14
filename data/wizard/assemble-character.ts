// Builds the final, real CharacterSheet from a completed WizardDraft. Pure
// assembly step - by the time this runs, every choice in the draft has
// already been validated by its own step (see app/wizard/*.tsx's
// `canProceed` gates), so this trusts the draft rather than re-validating.

import type { SQLiteDatabase } from 'expo-sqlite';

import { ABILITIES, SKILLS } from '@/constants/character';
import { SPELLCASTING_RULES } from '@/constants/spellcasting';
import { getSubraceDisplayName } from '@/constants/subrace-names';
import { getBackgroundById } from '@/data/queries/backgrounds';
import { getClassById, getClassEnglishName, getSubclassById } from '@/data/queries/classes';
import { itemKey } from '@/data/queries/equipment-lookup';
import { getOptionalFeatureById } from '@/data/queries/optional-features';
import { getRaceById } from '@/data/queries/races';
import { combineAbilityBonuses, getResolvedRacialBonus } from '@/data/wizard/race-ability-bonus';
import { parseBackgroundSkillProficiencies } from '@/data/wizard/skill-proficiency-resolver';
import { feetToMeters } from '@/utils/speed';
import type { WizardDraft } from '@/context/wizard-context';
import type {
  AbilityKey,
  Biography,
  CharacterClass,
  CharacterSheet,
  Currency,
  InventoryItemState,
  Skill,
  SkillKey,
  ToolState,
} from '@/types/character';

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
  const fightingStyle =
    draft.fightingStyleId !== null ? await getOptionalFeatureById(db, draft.fightingStyleId) : null;

  if (!race || !classDef || !background) {
    throw new Error('assembleCharacter: failed to load race/class/background from the reference database');
  }

  // Ability scores: base (from whichever method the player used) + racial
  // bonus (fixed grants + whatever the player picked for a `choose` clause).
  const combinedBonuses = combineAbilityBonuses(race.abilityBonuses, subrace?.abilityBonuses ?? null);
  const abilities = Object.fromEntries(
    ABILITIES.map((ability) => [
      ability.key,
      {
        base: String(draft.baseAbilityScores[ability.key] ?? 8),
        racialBonus: getResolvedRacialBonus(combinedBonuses, draft.abilityBonusChoices, ability.key),
      },
    ])
  ) as CharacterSheet['abilities'];

  // Saving throws: fixed grant from the class definition.
  const savingThrowKeys = new Set((classDef.savingThrowProficiencies ?? []).filter(isAbilityKey));
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

  // Tools: resolved entirely by the background step (fixed grants +
  // player-picked category choices) - only 'item' entries map to a
  // concrete tool id; 'special'/'unresolved' entries have no db row to
  // track proficiency against (see docs/TODO.md).
  const tools: Record<string, ToolState> = {};
  for (const entry of draft.toolProficiencies) {
    if (entry.kind !== 'item') continue;
    const key = itemKey(entry.source, entry.itemId);
    tools[key] = { proficient: true, expertise: key === draft.expertiseToolChoice };
  }

  // Inventory: resolved entirely by the equipment step. 'special' flavor
  // entries with no `valueCp` (no db row) and any leftover
  // 'categoryChoice'/'unresolved' entries (shouldn't happen - the
  // equipment step gates on full resolution) are skipped rather than
  // guessed at.
  const inventoryItems: Record<string, InventoryItemState> = {};
  let goldFromEquipment = 0;
  for (const entry of draft.chosenEquipment) {
    // Bare currency grant with no item at all (e.g. Eremita's "5 gp",
    // {value: 500} in the raw DSL - see equipment-resolver.ts) - same
    // starting-currency pool as containsValueCp below, just no inventory
    // item to attach it to.
    if (entry.kind === 'special') {
      if (entry.valueCp) goldFromEquipment += entry.valueCp / 100;
      continue;
    }
    if (entry.kind !== 'item') continue;
    // A multi-item equipment pack (Explorer's Pack, ...) never becomes an
    // inventory row itself - grant its resolved contents instead (see
    // ResolvedEquipmentEntry.packContents / equipment-resolver.ts). Sum
    // rather than overwrite, same as the plain-item case below, since a pack
    // content item can collide with something already granted elsewhere.
    if (entry.packContents) {
      for (const sub of entry.packContents) {
        const subKey = itemKey(sub.source, sub.itemId);
        const existingSubQuantity = Number(inventoryItems[subKey]?.quantity ?? 0);
        inventoryItems[subKey] = { quantity: String(existingSubQuantity + sub.quantity) };
      }
      if (entry.containsValueCp) goldFromEquipment += entry.containsValueCp / 100;
      continue;
    }
    const key = itemKey(entry.source, entry.itemId);
    // Sum rather than overwrite - the same item can be granted by more than
    // one resolved entry (e.g. an exploded ammo pack matching an item
    // already granted elsewhere), and the totals should add up.
    const existingQuantity = Number(inventoryItems[key]?.quantity ?? 0);
    inventoryItems[key] = { quantity: String(existingQuantity + entry.quantity) };
    if (entry.containsValueCp) goldFromEquipment += entry.containsValueCp / 100;
  }

  const currency: Currency = {
    ...EMPTY_CURRENCY,
    po: String((draft.equipmentMode === 'gold' ? (draft.goldRolled ?? 0) : 0) + goldFromEquipment),
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
  const spells = Object.fromEntries(draft.spellIds.map((id) => [String(id), { prepared: startsPrepared }]));

  // Hit points: level-1 max HP is always the hit die's full face value +
  // CON modifier (PHB p.12), never rolled at level 1. Draconic Bloodline
  // sorcerers get +1 to this (and +1 again per sorcerer level on level-up,
  // out of scope - the wizard only creates level 1) from Draconic
  // Resilience - `shortName` is the raw subclass identifier and unique
  // across the whole PHB, so no need to also check the class.
  const conTotal = Number(abilities.con.base) + abilities.con.racialBonus;
  const conModifier = Math.floor((conTotal - 10) / 2);
  const isDraconicSorcerer = subclass?.shortName === 'Draconic';
  const maxHp = Math.max(1, (classDef.hitDieFaces ?? 8) + conModifier + (isDraconicSorcerer ? 1 : 0));

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
    backgroundId: background.id,
    classes: [characterClass],
    inspiration: false,
    abilities,
    savingThrows,
    skills,
    speed: String(feetToMeters(subrace?.speed ?? race.speed ?? 30)),
    hitPoints: { max: String(maxHp), current: String(maxHp), temporary: '0' },
    hitDice: { current: '1', max: '1' },
    exhaustion: 0,
    deathSaves: { successes: 0, failures: 0 },
    currency,
    inventoryItems,
    tools,
    features: {},
    spells,
    spellSlotsUsed: {},
    biography: { ...EMPTY_BIOGRAPHY, ...appearance },
  };

  return character;
}
