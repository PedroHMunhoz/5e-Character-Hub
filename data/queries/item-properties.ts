import type { SQLiteDatabase } from 'expo-sqlite';

import { toEntries } from '../rows';
import { getTranslations, localizedEntries, localizedName } from './localize';

export interface ItemPropertyDetail {
  name: string;
  description: string;
}

interface ItemPropertyRow {
  id: number;
  code: string;
  name: string;
  entries: string | null;
}

export async function getItemPropertyDescriptions(
  db: SQLiteDatabase,
  codes: string[],
  source = 'PHB'
): Promise<Map<string, ItemPropertyDetail>> {
  if (codes.length === 0) return new Map();

  const placeholders = codes.map(() => '?').join(', ');
  const rows = await db.getAllAsync<ItemPropertyRow>(
    `SELECT id, code, name, entries FROM item_properties WHERE source = ? AND code IN (${placeholders})`,
    source,
    ...codes
  );
  const translations = await getTranslations(db, 'item_property');

  const result = new Map<string, ItemPropertyDetail>();
  for (const row of rows) {
    const name = localizedName(row.id, row.name, translations);
    const description = localizedEntries(row.id, toEntries(row.entries), translations).join('\n\n');
    result.set(row.code, { name, description });
  }
  return result;
}
