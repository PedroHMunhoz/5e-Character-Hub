import type { SQLiteDatabase } from 'expo-sqlite';

import type { Feat } from '@/types/reference';
import { toEntries } from '../rows';

interface FeatRow {
  id: number;
  name: string;
  source: string;
  srd: number;
  basic_rules: number;
  entries: string;
}

function mapFeatRow(row: FeatRow): Feat {
  return {
    id: row.id,
    name: row.name,
    source: row.source,
    srd: !!row.srd,
    basicRules: !!row.basic_rules,
    entries: toEntries(row.entries),
  };
}

export async function getAllFeats(db: SQLiteDatabase): Promise<Feat[]> {
  const rows = await db.getAllAsync<FeatRow>('SELECT * FROM feats ORDER BY name');
  return rows.map(mapFeatRow);
}

export async function getFeatById(db: SQLiteDatabase, id: number): Promise<Feat | null> {
  const row = await db.getFirstAsync<FeatRow>('SELECT * FROM feats WHERE id = ?', id);
  return row ? mapFeatRow(row) : null;
}
