// Level-1 spellcasting rules (PHB p.113 spellcasting tables) - not derivable
// from db/schema.sql (no per-level spells-known/prepared progression table
// exists), so these are fixed constants, keyed by the class's raw English
// name (see data/queries/classes.ts's getClassEnglishName - the localized
// display name isn't a stable lookup key).
//
// Only the 6 classes with spellcasting at level 1 are listed - Paladin and
// Ranger are half-casters (spells start at level 2), so they're correctly
// absent; the wizard's spell step only shows for classes present here (see
// SPELLCASTING_RULES's keys, gated by classes.caster_progression IN
// ('full','pact') in app/wizard/spells.tsx).
export interface SpellcastingRule {
  cantripsKnown: number;
  // "Known" casters (Bard/Sorcerer/Warlock/Wizard) learn a fixed number of
  // 1st-level spells at creation. "Prepared" casters (Cleric/Druid) instead
  // prepare from their whole class list each day - preparedFromFullList
  // marks that case, and the count is computed at runtime (spellcasting
  // ability modifier + level, minimum 1) since it depends on the character's
  // final ability scores.
  spellsKnownFixed?: number;
  preparedFromFullList?: boolean;
  // Whether the character sheet's "Preparadas" max (aba Magias) uses the
  // ability-modifier + level formula instead of `spellsKnownFixed`. This is
  // independent from `preparedFromFullList` above: Cleric/Druid choose which
  // spells to prepare from the ENTIRE class list (so both creation-time
  // selection count AND the sheet's max use the formula), but Wizard chooses
  // from a personal spellbook whose starting size is a flat number
  // (spellsKnownFixed: 6, correct for the creation step) while still
  // *preparing* a daily subset of it via the same mod+level formula (so only
  // the sheet's max needs it, not creation).
  maxPreparedFormula?: boolean;
}

export const SPELLCASTING_RULES: Record<string, SpellcastingRule> = {
  Bard: { cantripsKnown: 2, spellsKnownFixed: 4 },
  Cleric: { cantripsKnown: 3, preparedFromFullList: true, maxPreparedFormula: true },
  Druid: { cantripsKnown: 2, preparedFromFullList: true, maxPreparedFormula: true },
  Sorcerer: { cantripsKnown: 4, spellsKnownFixed: 2 },
  Warlock: { cantripsKnown: 2, spellsKnownFixed: 2 },
  Wizard: { cantripsKnown: 3, spellsKnownFixed: 6, maxPreparedFormula: true },
};
