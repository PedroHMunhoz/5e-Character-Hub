import type { SQLiteDatabase } from 'expo-sqlite';

import type { Spell } from '@/types/reference';
import { parseJson, toEntries } from '../rows';

interface SpellRow {
  id: number;
  name: string;
  source: string;
  srd: number;
  basic_rules: number;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: string;
  duration: string;
  ritual: number;
  concentration: number;
  entries: string;
  details: string | null;
}

function mapSpellRow(row: SpellRow): Spell {
  return {
    id: row.id,
    name: row.name,
    source: row.source,
    srd: !!row.srd,
    basicRules: !!row.basic_rules,
    level: row.level,
    school: row.school,
    castingTime: parseJson(row.casting_time),
    range: parseJson(row.range),
    components: parseJson(row.components),
    duration: parseJson(row.duration),
    ritual: !!row.ritual,
    concentration: !!row.concentration,
    entries: toEntries(row.entries),
    details: parseJson(row.details),
  };
}

export async function getAllSpells(db: SQLiteDatabase): Promise<Spell[]> {
  const rows = await db.getAllAsync<SpellRow>('SELECT * FROM spells ORDER BY level, name');
  return rows.map(mapSpellRow);
}

export async function getSpellsForClass(db: SQLiteDatabase, className: string): Promise<Spell[]> {
  const rows = await db.getAllAsync<SpellRow>(
    `SELECT s.* FROM spells s
     JOIN spell_classes sc ON sc.spell_id = s.id
     WHERE sc.class_name = ?
     ORDER BY s.level, s.name`,
    className
  );
  return rows.map(mapSpellRow);
}

export async function getSpellById(db: SQLiteDatabase, id: number): Promise<Spell | null> {
  const row = await db.getFirstAsync<SpellRow>('SELECT * FROM spells WHERE id = ?', id);
  return row ? mapSpellRow(row) : null;
}

// Sanitizes to alphanumerics/spaces only, then does a prefix match per term -
// keeps the FTS5 MATCH syntax from breaking on stray quotes/operators in
// free-form user input.
export async function searchSpells(db: SQLiteDatabase, query: string): Promise<Spell[]> {
  const sanitized = query.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
  if (!sanitized) return [];
  const match = sanitized
    .split(/\s+/)
    .map((term) => `${term}*`)
    .join(' ');
  const rows = await db.getAllAsync<SpellRow>(
    `SELECT s.* FROM spells s
     JOIN content_fts f ON f.entity_type = 'spell' AND f.entity_id = s.id
     WHERE content_fts MATCH ?
     ORDER BY s.name`,
    match
  );
  return rows.map(mapSpellRow);
}
