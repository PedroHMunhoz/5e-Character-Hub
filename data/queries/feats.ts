import type { SQLiteDatabase } from 'expo-sqlite';

import type { Feat } from '@/types/reference';
import { parseJson, toEntries } from '../rows';
import { getTranslations, localizedEntries, localizedName, type TranslationDict } from './localize';

interface FeatRow {
  id: number;
  name: string;
  source: string;
  srd: number;
  basic_rules: number;
  entries: string;
  ability: string | null;
  prerequisite: string | null;
}

function mapFeatRow(row: FeatRow, translations: TranslationDict): Feat {
  return {
    id: row.id,
    name: localizedName(row.id, row.name, translations),
    englishName: row.name,
    source: row.source,
    srd: !!row.srd,
    basicRules: !!row.basic_rules,
    entries: localizedEntries(row.id, toEntries(row.entries), translations),
    ability: parseJson(row.ability),
    prerequisite: parseJson(row.prerequisite),
  };
}

// PHB-only for now, same reasoning as data/queries/races.ts's getAllRaces -
// feats from other sourcebooks exist in the reference db but aren't
// translated yet.
export async function getAllFeats(db: SQLiteDatabase): Promise<Feat[]> {
  const rows = await db.getAllAsync<FeatRow>("SELECT * FROM feats WHERE source = 'PHB' ORDER BY name");
  const translations = await getTranslations(db, 'feat');
  return rows.map((row) => mapFeatRow(row, translations));
}

export async function getFeatById(db: SQLiteDatabase, id: number): Promise<Feat | null> {
  const row = await db.getFirstAsync<FeatRow>('SELECT * FROM feats WHERE id = ?', id);
  const translations = await getTranslations(db, 'feat');
  return row ? mapFeatRow(row, translations) : null;
}

export async function getFeatsByIds(db: SQLiteDatabase, ids: number[]): Promise<Feat[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const rows = await db.getAllAsync<FeatRow>(`SELECT * FROM feats WHERE id IN (${placeholders})`, ids);
  const translations = await getTranslations(db, 'feat');
  return rows.map((row) => mapFeatRow(row, translations));
}
