import type { SQLiteDatabase } from 'expo-sqlite';

import type { Race, RacialTrait } from '@/types/reference';
import { parseJson, toEntries } from '../rows';

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
}

interface RacialTraitRow {
  id: number;
  race_id: number;
  name: string;
  entries: string;
}

function mapRaceRow(row: RaceRow): Race {
  return {
    id: row.id,
    parentRaceId: row.parent_race_id,
    name: row.name,
    source: row.source,
    srd: !!row.srd,
    basicRules: !!row.basic_rules,
    size: parseJson(row.size) ?? [],
    speed: row.speed,
    darkvision: row.darkvision,
  };
}

export async function getAllRaces(db: SQLiteDatabase): Promise<Race[]> {
  const rows = await db.getAllAsync<RaceRow>('SELECT * FROM races ORDER BY name');
  return rows.map(mapRaceRow);
}

export async function getRaceById(db: SQLiteDatabase, id: number): Promise<Race | null> {
  const row = await db.getFirstAsync<RaceRow>('SELECT * FROM races WHERE id = ?', id);
  return row ? mapRaceRow(row) : null;
}

export async function getRacialTraits(db: SQLiteDatabase, raceId: number): Promise<RacialTrait[]> {
  const rows = await db.getAllAsync<RacialTraitRow>(
    'SELECT * FROM racial_traits WHERE race_id = ? ORDER BY sort_order',
    raceId
  );
  return rows.map((row) => ({
    id: row.id,
    raceId: row.race_id,
    name: row.name,
    entries: toEntries(row.entries),
  }));
}
