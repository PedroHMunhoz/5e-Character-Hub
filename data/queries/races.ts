import type { SQLiteDatabase } from 'expo-sqlite';

import type { Race, RaceAbilityBonus, RacialTrait } from '@/types/reference';
import { parseJson, toEntries } from '../rows';
import { getTranslations, localizedEntries, localizedName, type TranslationDict } from './localize';

interface RaceRow {
  id: number;
  parent_race_id: number | null;
  name: string;
  source: string;
  srd: number;
  basic_rules: number;
  size: string;
  speed: number | null;
  darkvision: number | null;
  ability_bonuses: string | null;
  skill_proficiencies: string | null;
  languages: string | null;
  armor_proficiencies: string | null;
  weapon_proficiencies: string | null;
  tool_proficiencies: string | null;
}

interface RacialTraitRow {
  id: number;
  race_id: number;
  name: string;
  entries: string;
}

function mapRaceRow(row: RaceRow, translations: TranslationDict): Race {
  return {
    id: row.id,
    parentRaceId: row.parent_race_id,
    name: localizedName(row.id, row.name, translations),
    englishName: row.name,
    source: row.source,
    srd: !!row.srd,
    basicRules: !!row.basic_rules,
    size: parseJson(row.size) ?? [],
    speed: row.speed,
    darkvision: row.darkvision,
    abilityBonuses: parseJson<RaceAbilityBonus[]>(row.ability_bonuses),
    skillProficiencies: parseJson(row.skill_proficiencies),
    languages: parseJson(row.languages),
    armorProficiencies: parseJson(row.armor_proficiencies),
    weaponProficiencies: parseJson(row.weapon_proficiencies),
    toolProficiencies: parseJson(row.tool_proficiencies),
  };
}

// PHB-only for now: races/subraces from other sourcebooks exist in the
// reference db but aren't translated yet, and mixing them in overwhelmed
// the wizard's race picker with ~220 entries with no clear PHB grouping.
// See docs/TODO.md for the note to add other sources once translated.
export async function getAllRaces(db: SQLiteDatabase): Promise<Race[]> {
  const rows = await db.getAllAsync<RaceRow>("SELECT * FROM races WHERE source = 'PHB' ORDER BY name");
  const translations = await getTranslations(db, 'race');
  return rows.map((row) => mapRaceRow(row, translations));
}

export async function getRaceById(db: SQLiteDatabase, id: number): Promise<Race | null> {
  const row = await db.getFirstAsync<RaceRow>('SELECT * FROM races WHERE id = ?', id);
  const translations = await getTranslations(db, 'race');
  return row ? mapRaceRow(row, translations) : null;
}

export async function getRacialTraits(db: SQLiteDatabase, raceId: number): Promise<RacialTrait[]> {
  const rows = await db.getAllAsync<RacialTraitRow>(
    'SELECT * FROM racial_traits WHERE race_id = ? ORDER BY sort_order',
    raceId
  );
  const translations = await getTranslations(db, 'racial_trait');
  return rows.map((row) => ({
    id: row.id,
    raceId: row.race_id,
    name: localizedName(row.id, row.name, translations),
    entries: localizedEntries(row.id, toEntries(row.entries), translations),
  }));
}
