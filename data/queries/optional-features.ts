import type { SQLiteDatabase } from 'expo-sqlite';

import type { OptionalFeatureDefinition } from '@/types/reference';
import { toEntries } from '../rows';
import { getTranslations, localizedEntries, localizedName } from './localize';

interface OptionalFeatureRow {
  id: number;
  name: string;
  entries: string;
}

function mapRow(row: OptionalFeatureRow, translations: Awaited<ReturnType<typeof getTranslations>>): OptionalFeatureDefinition {
  return {
    id: row.id,
    name: localizedName(row.id, row.name, translations),
    englishName: row.name,
    entries: localizedEntries(row.id, toEntries(row.entries), translations),
  };
}

// The 6 PHB Fighting Style options (Archery, Defense, Dueling, Great Weapon
// Fighting, Protection, Two-Weapon Fighting) - tagged `feature_type`
// contains "FS:F" (Fighter) in the raw 5etools data, shared with
// Paladin/Ranger's own (later-level) Fighting Style pick, which is why the
// filter is on the tag rather than a class id.
export async function getFightingStyleOptions(db: SQLiteDatabase): Promise<OptionalFeatureDefinition[]> {
  const rows = await db.getAllAsync<OptionalFeatureRow>(
    "SELECT id, name, entries FROM optional_features WHERE source = 'PHB' AND feature_type LIKE '%FS:F%'"
  );
  const translations = await getTranslations(db, 'optional_feature');
  return rows.map((row) => mapRow(row, translations));
}

export async function getOptionalFeatureById(db: SQLiteDatabase, id: number): Promise<OptionalFeatureDefinition | null> {
  const row = await db.getFirstAsync<OptionalFeatureRow>(
    'SELECT id, name, entries FROM optional_features WHERE id = ?',
    id
  );
  if (!row) return null;
  const translations = await getTranslations(db, 'optional_feature');
  return mapRow(row, translations);
}

// Looked up by the raw (English) name stored on CharacterSheet.fightingStyle
// - see types/character.ts for why that's the stable key instead of an id.
export async function getOptionalFeatureByEnglishName(
  db: SQLiteDatabase,
  englishName: string
): Promise<OptionalFeatureDefinition | null> {
  const row = await db.getFirstAsync<OptionalFeatureRow>(
    "SELECT id, name, entries FROM optional_features WHERE name = ? AND source = 'PHB'",
    englishName
  );
  if (!row) return null;
  const translations = await getTranslations(db, 'optional_feature');
  return mapRow(row, translations);
}
