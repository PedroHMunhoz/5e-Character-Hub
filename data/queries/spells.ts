import type { SQLiteDatabase } from 'expo-sqlite';

import type { Spell } from '@/types/reference';
import { parseJson, toEntries } from '../rows';
import { getTranslations, localizedEntries, localizedMaterialText, localizedName, type TranslationDict } from './localize';

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

export async function getAllSpells(db: SQLiteDatabase): Promise<Spell[]> {
  const rows = await db.getAllAsync<SpellRow>('SELECT * FROM spells ORDER BY level, name');
  const translations = await getTranslations(db, 'spell');
  return rows.map((row) => mapSpellRow(row, translations));
}

export async function getSpellsForClass(db: SQLiteDatabase, className: string): Promise<Spell[]> {
  const rows = await db.getAllAsync<SpellRow>(
    `SELECT s.* FROM spells s
     JOIN spell_classes sc ON sc.spell_id = s.id
     WHERE sc.class_name = ?
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

// Curated spellbook for the app's level-2 Evocation Wizard demo character:
// the 3 cantrips known at level 1-3, plus the 8 1st-level spells in their
// spellbook (6 learned at level 1 + 2 more learned on reaching level 2).
const CURATED_SPELLBOOK_NAMES = [
  'Fire Bolt',
  'Mage Hand',
  'Prestidigitation',
  'Magic Missile',
  'Burning Hands',
  'Shield',
  'Mage Armor',
  'Detect Magic',
  'Identify',
  'Thunderwave',
  'Sleep',
  // Not part of the level-2 Evocation Wizard's "known" spells, but kept here
  // to give the spell detail screen coverage of range shapes/components not
  // otherwise represented above: Gust of Wind (line-shaped range,
  // concentration) and Sending (unlimited range).
  'Gust of Wind',
  'Sending',
];

export async function getCuratedSpellbook(db: SQLiteDatabase): Promise<Spell[]> {
  const placeholders = CURATED_SPELLBOOK_NAMES.map(() => '?').join(', ');
  const rows = await db.getAllAsync<SpellRow>(
    `SELECT * FROM spells WHERE source = 'PHB' AND name IN (${placeholders}) ORDER BY level, name`,
    ...CURATED_SPELLBOOK_NAMES
  );
  const translations = await getTranslations(db, 'spell');
  return rows.map((row) => mapSpellRow(row, translations));
}
