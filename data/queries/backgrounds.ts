import type { SQLiteDatabase } from 'expo-sqlite';

import type { Background } from '@/types/reference';
import { parseJson, toEntries } from '../rows';
import { getTranslations, localizedEntries, localizedName, type TranslationDict } from './localize';

interface BackgroundRow {
  id: number;
  name: string;
  source: string;
  srd: number;
  basic_rules: number;
  entries: string;
  skill_proficiencies: string | null;
  tool_proficiencies: string | null;
  starting_equipment: string | null;
}

function mapBackgroundRow(row: BackgroundRow, translations: TranslationDict): Background {
  return {
    id: row.id,
    name: localizedName(row.id, row.name, translations),
    source: row.source,
    srd: !!row.srd,
    basicRules: !!row.basic_rules,
    entries: localizedEntries(row.id, toEntries(row.entries), translations),
    skillProficiencies: parseJson(row.skill_proficiencies),
    toolProficiencies: parseJson(row.tool_proficiencies),
    startingEquipment: parseJson(row.starting_equipment),
  };
}

// PHB-only for now - see the same note on data/queries/races.ts's getAllRaces.
// Also excludes "Custom Background" - a DMG-style toolkit entry (pick any 2
// skills/tools/languages) rather than a real PHB background, same reasoning
// as getAllRaces excluding "Variant" (Variant Human).
export async function getAllBackgrounds(db: SQLiteDatabase): Promise<Background[]> {
  const rows = await db.getAllAsync<BackgroundRow>(
    "SELECT * FROM backgrounds WHERE source = 'PHB' AND name != 'Custom Background' ORDER BY name"
  );
  const translations = await getTranslations(db, 'background');
  return rows.map((row) => mapBackgroundRow(row, translations));
}

export async function getBackgroundById(db: SQLiteDatabase, id: number): Promise<Background | null> {
  const row = await db.getFirstAsync<BackgroundRow>('SELECT * FROM backgrounds WHERE id = ?', id);
  const translations = await getTranslations(db, 'background');
  return row ? mapBackgroundRow(row, translations) : null;
}
