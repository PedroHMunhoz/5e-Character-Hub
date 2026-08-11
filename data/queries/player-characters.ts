import type { SQLiteDatabase } from 'expo-sqlite';

import type { CharacterSheet, CharacterSummary } from '@/types/character';

interface PlayerCharacterRow {
  id: string;
  name: string;
  race_name: string;
  classes_summary: string;
  sheet_json: string;
  created_at: string;
  updated_at: string;
}

function mapSummaryRow(row: PlayerCharacterRow): CharacterSummary {
  return {
    id: row.id,
    name: row.name,
    race: row.race_name,
    classes: JSON.parse(row.classes_summary),
  };
}

function classesSummary(character: CharacterSheet): string {
  return JSON.stringify(character.classes.map((characterClass) => ({ ...characterClass })));
}

export async function getAllCharacterSummaries(db: SQLiteDatabase): Promise<CharacterSummary[]> {
  const rows = await db.getAllAsync<PlayerCharacterRow>(
    'SELECT * FROM player_characters ORDER BY updated_at DESC'
  );
  return rows.map(mapSummaryRow);
}

export async function getCharacterById(db: SQLiteDatabase, id: string): Promise<CharacterSheet | null> {
  const row = await db.getFirstAsync<PlayerCharacterRow>('SELECT * FROM player_characters WHERE id = ?', id);
  return row ? (JSON.parse(row.sheet_json) as CharacterSheet) : null;
}

export async function createCharacter(db: SQLiteDatabase, character: CharacterSheet): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO player_characters (id, name, race_name, classes_summary, sheet_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    character.id,
    character.name,
    character.race,
    classesSummary(character),
    JSON.stringify(character),
    now,
    now
  );
}

export async function saveCharacter(db: SQLiteDatabase, character: CharacterSheet): Promise<void> {
  await db.runAsync(
    `UPDATE player_characters
     SET name = ?, race_name = ?, classes_summary = ?, sheet_json = ?, updated_at = ?
     WHERE id = ?`,
    character.name,
    character.race,
    classesSummary(character),
    JSON.stringify(character),
    new Date().toISOString(),
    character.id
  );
}

export async function deleteCharacter(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM player_characters WHERE id = ?', id);
}
