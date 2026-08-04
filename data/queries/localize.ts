// Reads the `translations` table (see db/schema.sql) and overlays pt-BR text
// onto reference rows, falling back to the English value when a given
// entity/field hasn't been translated yet.

import type { SQLiteDatabase } from 'expo-sqlite';

interface TranslationFields {
  name?: string;
  entries?: string;
}

export type TranslationDict = Map<number, TranslationFields>;

export async function getTranslations(
  db: SQLiteDatabase,
  entityType: string,
  locale = 'pt-BR'
): Promise<TranslationDict> {
  const rows = await db.getAllAsync<{ entity_id: number; field: string; value: string }>(
    'SELECT entity_id, field, value FROM translations WHERE entity_type = ? AND locale = ?',
    entityType,
    locale
  );

  const dict: TranslationDict = new Map();
  for (const row of rows) {
    const fields = dict.get(row.entity_id) ?? {};
    if (row.field === 'name' || row.field === 'entries') {
      fields[row.field] = row.value;
    }
    dict.set(row.entity_id, fields);
  }
  return dict;
}

export function localizedName(id: number, fallback: string, dict: TranslationDict): string {
  return dict.get(id)?.name ?? fallback;
}

export function localizedEntries(id: number, fallback: string[], dict: TranslationDict): string[] {
  const raw = dict.get(id)?.entries;
  if (!raw) return fallback;
  return JSON.parse(raw) as string[];
}
