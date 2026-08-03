import type { SQLiteDatabase } from 'expo-sqlite';

import type { Item } from '@/types/reference';
import { parseJson, toEntries } from '../rows';

interface ItemRow {
  id: number;
  name: string;
  source: string;
  srd: number;
  basic_rules: number;
  type: string | null;
  rarity: string | null;
  is_magic: number;
  requires_attunement: string | null;
  value_cp: number | null;
  weight_lb: number | null;
  entries: string;
  details: string | null;
}

function mapItemRow(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    source: row.source,
    srd: !!row.srd,
    basicRules: !!row.basic_rules,
    type: row.type,
    rarity: row.rarity,
    isMagic: !!row.is_magic,
    requiresAttunement: row.requires_attunement,
    valueCp: row.value_cp,
    weightLb: row.weight_lb,
    entries: toEntries(row.entries),
    details: parseJson(row.details),
  };
}

export async function getAllItems(db: SQLiteDatabase): Promise<Item[]> {
  const rows = await db.getAllAsync<ItemRow>('SELECT * FROM items ORDER BY name');
  return rows.map(mapItemRow);
}

export async function getItemById(db: SQLiteDatabase, id: number): Promise<Item | null> {
  const row = await db.getFirstAsync<ItemRow>('SELECT * FROM items WHERE id = ?', id);
  return row ? mapItemRow(row) : null;
}
