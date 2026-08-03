import type { SQLiteDatabase } from 'expo-sqlite';

import type { Background } from '@/types/reference';
import { toEntries } from '../rows';

interface BackgroundRow {
  id: number;
  name: string;
  source: string;
  srd: number;
  basic_rules: number;
  entries: string;
}

function mapBackgroundRow(row: BackgroundRow): Background {
  return {
    id: row.id,
    name: row.name,
    source: row.source,
    srd: !!row.srd,
    basicRules: !!row.basic_rules,
    entries: toEntries(row.entries),
  };
}

export async function getAllBackgrounds(db: SQLiteDatabase): Promise<Background[]> {
  const rows = await db.getAllAsync<BackgroundRow>('SELECT * FROM backgrounds ORDER BY name');
  return rows.map(mapBackgroundRow);
}

export async function getBackgroundById(db: SQLiteDatabase, id: number): Promise<Background | null> {
  const row = await db.getFirstAsync<BackgroundRow>('SELECT * FROM backgrounds WHERE id = ?', id);
  return row ? mapBackgroundRow(row) : null;
}
