import type { SQLiteDatabase } from 'expo-sqlite';

import { getTranslations, localizedName } from './localize';

export type LanguageType = 'standard' | 'exotic' | 'secret';

export interface Language {
  id: number;
  name: string;
  // Raw (unlocalized) name - used to match the raw English language DSL
  // keys (e.g. "elvish", "anyStandard") in
  // data/wizard/language-proficiency-resolver.ts, same englishName pattern
  // as data/queries/tools.ts's ToolItem.englishName.
  englishName: string;
  type: LanguageType;
}

export async function getAllLanguages(db: SQLiteDatabase): Promise<Language[]> {
  const rows = await db.getAllAsync<{ id: number; name: string; type: LanguageType }>(
    `SELECT id, name, type FROM languages WHERE source = 'PHB' ORDER BY name`
  );
  const translations = await getTranslations(db, 'language');
  return rows.map((row) => ({
    id: row.id,
    name: localizedName(row.id, row.name, translations),
    englishName: row.name,
    type: row.type,
  }));
}

export async function getStandardLanguages(db: SQLiteDatabase): Promise<Language[]> {
  const all = await getAllLanguages(db);
  return all.filter((language) => language.type === 'standard');
}

// Looks up a specific language by its raw English name (e.g. "elvish") -
// used to resolve a race/background's fixed grants and the class-feature
// grants in data/wizard/language-proficiency-resolver.ts.
export async function getLanguageByEnglishName(db: SQLiteDatabase, englishName: string): Promise<Language | null> {
  const all = await getAllLanguages(db);
  const target = englishName.toLowerCase();
  return all.find((language) => language.englishName.toLowerCase() === target) ?? null;
}

// Looks up a specific language by its row id - used to display the concrete
// language granted by a player's choice (e.g. Ranger's Favored Enemy
// language pick, see data/queries/feature-detail.ts) back in its translated
// display name.
export async function getLanguageById(db: SQLiteDatabase, id: number): Promise<Language | null> {
  const all = await getAllLanguages(db);
  return all.find((language) => language.id === id) ?? null;
}
