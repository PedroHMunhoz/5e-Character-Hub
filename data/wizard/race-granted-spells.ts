// Resolves RACE_GRANTED_CANTRIPS (constants/spellcasting.ts) - a PHB race or
// subrace name mapped to a cantrip it grants outright at 1st level - to the
// real spells.id it corresponds to, same "resolve a hardcoded PHB name to a
// catalog row" pattern as getClassGrantedLanguageNames
// (data/wizard/language-proficiency-resolver.ts).

import type { SQLiteDatabase } from 'expo-sqlite';

import { RACE_GRANTED_CANTRIPS } from '@/constants/spellcasting';
import { getSpellsByNames } from '@/data/queries/spells';

export async function getRaceGrantedSpellIds(
  db: SQLiteDatabase,
  raceEnglishName: string | null,
  subraceEnglishName: string | null = null
): Promise<number[]> {
  const cantripNames = [raceEnglishName, subraceEnglishName]
    .map((name) => (name ? RACE_GRANTED_CANTRIPS[name] : undefined))
    .filter((name): name is string => name != null);
  if (cantripNames.length === 0) return [];
  const spells = await getSpellsByNames(db, cantripNames);
  return spells.map((spell) => spell.id);
}
