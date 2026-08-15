// Parses the language-proficiency DSL shared by races (races.languages) and
// backgrounds (backgrounds.language_proficiencies) - both are an array of
// objects whose keys are either an exact language's raw English name mapped
// to `true` (a fixed grant, e.g. `{"common":true,"elvish":true}`) or
// `anyStandard` mapped to a choice count (e.g. `{"anyStandard":1}`). Same
// "anyX" choice convention as tool_proficiencies, not skillProficiencies'
// free `any`. Confirmed live against every PHB race/subrace and background
// (see docs/TODO.md) - no PHB background grants a fixed named language,
// only anyStandard; every PHB race grants at least Common + one fixed
// language, with Human/Half-Elf/High Elf also granting anyStandard:1.

import type { SQLiteDatabase } from 'expo-sqlite';

type RawLanguageGroup = Record<string, boolean | number>;

export function parseFixedLanguageEnglishNames(raw: unknown): string[] {
  const groups = (raw as RawLanguageGroup[] | null) ?? [];
  const names: string[] = [];
  for (const group of groups) {
    for (const [name, value] of Object.entries(group)) {
      if (value === true) names.push(name);
    }
  }
  return names;
}

export function parseLanguageChoiceCount(raw: unknown): number | null {
  const groups = (raw as RawLanguageGroup[] | null) ?? [];
  for (const group of groups) {
    if (typeof group.anyStandard === 'number') return group.anyStandard;
  }
  return null;
}

// PHB class features that grant a specific language outright, outside the
// languageProficiencies DSL above - the feature's own name happens to equal
// the language's name in the `languages` catalog (Druid's "Druidic",
// Rogue's "Thieves' Cant", both level 1, both `languages.type = 'secret'`).
// A small explicit list rather than a generic name-match against every
// feature, same "finite known PHB case" pattern as
// tool-proficiency-resolver.ts's VEHICLE_PROFICIENCY_LABELS.
const LANGUAGE_GRANTING_CLASS_FEATURE_NAMES = ['Druidic', "Thieves' Cant"];

export async function getClassGrantedLanguageNames(
  db: SQLiteDatabase,
  classId: number,
  level: number
): Promise<string[]> {
  const placeholders = LANGUAGE_GRANTING_CLASS_FEATURE_NAMES.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM class_features WHERE class_id = ? AND level <= ? AND source = 'PHB' AND name IN (${placeholders})`,
    classId,
    level,
    ...LANGUAGE_GRANTING_CLASS_FEATURE_NAMES
  );
  return rows.map((row) => row.name);
}
