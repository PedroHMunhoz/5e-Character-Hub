import type { SQLiteDatabase } from 'expo-sqlite';

import type { Spell } from '@/types/reference';
import { parseJson, toEntries } from '../rows';
import {
  getTranslations,
  localizedEntries,
  localizedMaterialText,
  localizedName,
  type TranslationDict,
} from './localize';

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

function mapSpellRow(row: SpellRow, translations: TranslationDict): Spell {
  return {
    id: row.id,
    name: localizedName(row.id, row.name, translations),
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
    entries: localizedEntries(row.id, toEntries(row.entries), translations),
    details: parseJson(row.details),
    materialText: localizedMaterialText(row.id, translations),
  };
}

// expo-sqlite's SQLiteDatabase isn't safe for overlapping queries on the same
// connection (see the lifecycle note in app/_layout.tsx) - queries against a
// shared `db` must be sequential (await one, then the other), never
// Promise.all'd, or native builds intermittently throw "Cannot use shared
// object that was already released".

// PHB-only for now - see the same note on data/queries/races.ts's getAllRaces.
export async function getAllSpells(db: SQLiteDatabase): Promise<Spell[]> {
  const rows = await db.getAllAsync<SpellRow>("SELECT * FROM spells WHERE source = 'PHB' ORDER BY level, name");
  const translations = await getTranslations(db, 'spell');
  return rows.map((row) => mapSpellRow(row, translations));
}

export async function getSpellsForClass(db: SQLiteDatabase, className: string): Promise<Spell[]> {
  const rows = await db.getAllAsync<SpellRow>(
    `SELECT s.* FROM spells s
     JOIN spell_classes sc ON sc.spell_id = s.id
     WHERE sc.class_name = ? AND s.source = 'PHB'
     ORDER BY s.level, s.name`,
    className
  );
  const translations = await getTranslations(db, 'spell');
  return rows.map((row) => mapSpellRow(row, translations));
}

export async function getSpellById(db: SQLiteDatabase, id: number): Promise<Spell | null> {
  const row = await db.getFirstAsync<SpellRow>('SELECT * FROM spells WHERE id = ?', id);
  const translations = await getTranslations(db, 'spell');
  return row ? mapSpellRow(row, translations) : null;
}

// Loads exactly a character's known/prepared spells by id - replaces the
// hardcoded getCuratedSpellbook() once a character carries its own spell
// list (set by the creation wizard's spell-picking step).
export async function getSpellsByIds(db: SQLiteDatabase, ids: number[]): Promise<Spell[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.getAllAsync<SpellRow>(
    `SELECT * FROM spells WHERE id IN (${placeholders}) ORDER BY level, name`,
    ...ids
  );
  const translations = await getTranslations(db, 'spell');
  return rows.map((row) => mapSpellRow(row, translations));
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
  const translations = await getTranslations(db, 'spell');
  return rows.map((row) => mapSpellRow(row, translations));
}
