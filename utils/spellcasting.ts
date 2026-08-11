// PHB 2014 spell slot progression tables. Index 0 = character level 1 ...
// index 19 = level 20. Each row is a 9-element array, index 0 = spell
// level 1 ... index 8 = spell level 9.

// Bard/Cleric/Druid/Sorcerer/Wizard (classes.caster_progression = 'full').
const FULL_CASTER_SLOTS: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 1
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 2
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 3
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 4
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 5
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 6
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 7
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 8
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 9
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 10
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 11
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 12
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 13
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 14
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 15
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // 20
];

// Paladin/Ranger (classes.caster_progression = '1/2', not 'half' despite
// db/schema.sql's comment - confirmed against the actual bundled DB).
// Only spell levels 1-5 are ever used by half-casters (6-9 stay 0).
const HALF_CASTER_SLOTS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0], // 1 - no spells yet
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 2
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 3
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 4
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 5
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 6
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 7
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 8
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 9
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 10
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 11
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 12
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 13
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 14
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 15
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 16
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 17
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 18
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 19
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 20
];

// Warlock's Pact Magic (classes.caster_progression = 'pact') doesn't use
// the standard per-spell-level table above - every slot sits at a single
// "slot level" that scales with character level.
const WARLOCK_PACT_MAGIC: { slots: number; slotLevel: number }[] = [
  { slots: 1, slotLevel: 1 }, // 1
  { slots: 2, slotLevel: 1 }, // 2
  { slots: 2, slotLevel: 2 }, // 3
  { slots: 2, slotLevel: 2 }, // 4
  { slots: 2, slotLevel: 3 }, // 5
  { slots: 2, slotLevel: 3 }, // 6
  { slots: 2, slotLevel: 4 }, // 7
  { slots: 2, slotLevel: 4 }, // 8
  { slots: 2, slotLevel: 5 }, // 9
  { slots: 2, slotLevel: 5 }, // 10
  { slots: 3, slotLevel: 5 }, // 11
  { slots: 3, slotLevel: 5 }, // 12
  { slots: 3, slotLevel: 5 }, // 13
  { slots: 3, slotLevel: 5 }, // 14
  { slots: 3, slotLevel: 5 }, // 15
  { slots: 3, slotLevel: 5 }, // 16
  { slots: 4, slotLevel: 5 }, // 17
  { slots: 4, slotLevel: 5 }, // 18
  { slots: 4, slotLevel: 5 }, // 19
  { slots: 4, slotLevel: 5 }, // 20
];

// Returns a 9-element array (index 0 = spell level 1 ... index 8 = spell
// level 9) of slot counts for the given caster progression and character
// level. Unknown/null progressions (non-casters, or a future sourcebook's
// progression this app doesn't model, e.g. 'artificer') return all zeros.
export function getSpellSlots(casterProgression: string | null, characterLevel: number): number[] {
  const levelIndex = Math.min(Math.max(characterLevel, 1), 20) - 1;

  if (casterProgression === 'full') return [...FULL_CASTER_SLOTS[levelIndex]];
  if (casterProgression === '1/2') return [...HALF_CASTER_SLOTS[levelIndex]];
  if (casterProgression === 'pact') {
    const { slots, slotLevel } = WARLOCK_PACT_MAGIC[levelIndex];
    const row = new Array(9).fill(0);
    row[slotLevel - 1] = slots;
    return row;
  }
  return new Array(9).fill(0);
}

export function getSpellSaveDC(proficiencyBonus: number, abilityModifier: number): number {
  return 8 + proficiencyBonus + abilityModifier;
}

export function getSpellAttackBonus(proficiencyBonus: number, abilityModifier: number): number {
  return proficiencyBonus + abilityModifier;
}

// PHB "prepared" caster formula (Cleric/Druid/Wizard-style): ability
// modifier + class level, minimum 1.
export function getPreparedSpellCount(abilityModifier: number, characterLevel: number): number {
  return Math.max(1, abilityModifier + characterLevel);
}
