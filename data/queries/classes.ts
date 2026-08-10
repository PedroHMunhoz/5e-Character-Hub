import type { SQLiteDatabase } from 'expo-sqlite';

import type { CharacterClassDefinition, ClassFeature, SubclassDefinition, SubclassFeature } from '@/types/reference';
import { parseJson, toEntries } from '../rows';
import { getTranslations, localizedEntries, localizedName, localizedSubclassTitle, type TranslationDict } from './localize';

interface ClassRow {
  id: number;
  name: string;
  source: string;
  srd: number;
  basic_rules: number;
  hit_die_faces: number | null;
  saving_throw_proficiencies: string;
  spellcasting_ability: string | null;
  caster_progression: string | null;
  subclass_title: string | null;
  starting_proficiencies: string;
  starting_equipment: string;
  multiclassing: string | null;
}

interface ClassFeatureRow {
  id: number;
  class_id: number;
  name: string;
  source: string;
  level: number;
  entries: string;
}

interface SubclassRow {
  id: number;
  class_id: number;
  name: string;
  short_name: string;
  source: string;
  srd: number;
}

interface SubclassFeatureRow {
  id: number;
  subclass_id: number;
  name: string;
  source: string;
  level: number;
  entries: string;
}

function mapClassRow(row: ClassRow, translations: TranslationDict): CharacterClassDefinition {
  return {
    id: row.id,
    name: localizedName(row.id, row.name, translations),
    source: row.source,
    srd: !!row.srd,
    basicRules: !!row.basic_rules,
    hitDieFaces: row.hit_die_faces,
    savingThrowProficiencies: parseJson(row.saving_throw_proficiencies) ?? [],
    spellcastingAbility: row.spellcasting_ability,
    casterProgression: row.caster_progression,
    subclassTitle: row.subclass_title ? localizedSubclassTitle(row.id, row.subclass_title, translations) : null,
    startingProficiencies: parseJson(row.starting_proficiencies),
    startingEquipment: parseJson(row.starting_equipment),
    multiclassing: parseJson(row.multiclassing),
  };
}

// PHB-only for now - see the same note on data/queries/races.ts's getAllRaces.
export async function getAllClasses(db: SQLiteDatabase): Promise<CharacterClassDefinition[]> {
  const rows = await db.getAllAsync<ClassRow>("SELECT * FROM classes WHERE source = 'PHB' ORDER BY name");
  const translations = await getTranslations(db, 'class');
  return rows.map((row) => mapClassRow(row, translations));
}

export async function getClassById(db: SQLiteDatabase, id: number): Promise<CharacterClassDefinition | null> {
  const row = await db.getFirstAsync<ClassRow>('SELECT * FROM classes WHERE id = ?', id);
  const translations = await getTranslations(db, 'class');
  return row ? mapClassRow(row, translations) : null;
}

export async function getClassFeatures(db: SQLiteDatabase, classId: number): Promise<ClassFeature[]> {
  const rows = await db.getAllAsync<ClassFeatureRow>(
    "SELECT id, class_id, name, source, level, entries FROM class_features WHERE class_id = ? AND source = 'PHB' ORDER BY level, name",
    classId
  );
  const translations = await getTranslations(db, 'class_feature');
  return rows.map((row) => ({
    id: row.id,
    classId: row.class_id,
    name: localizedName(row.id, row.name, translations),
    source: row.source,
    level: row.level,
    entries: localizedEntries(row.id, toEntries(row.entries), translations),
  }));
}

export async function getSubclassesForClass(db: SQLiteDatabase, classId: number): Promise<SubclassDefinition[]> {
  const rows = await db.getAllAsync<SubclassRow>(
    "SELECT * FROM subclasses WHERE class_id = ? AND source = 'PHB' ORDER BY name",
    classId
  );
  const translations = await getTranslations(db, 'subclass');
  return rows.map((row) => ({
    id: row.id,
    classId: row.class_id,
    name: localizedName(row.id, row.name, translations),
    shortName: row.short_name,
    source: row.source,
    srd: !!row.srd,
  }));
}

export async function getSubclassById(db: SQLiteDatabase, id: number): Promise<SubclassDefinition | null> {
  const row = await db.getFirstAsync<SubclassRow>('SELECT * FROM subclasses WHERE id = ?', id);
  if (!row) return null;
  const translations = await getTranslations(db, 'subclass');
  return {
    id: row.id,
    classId: row.class_id,
    name: localizedName(row.id, row.name, translations),
    shortName: row.short_name,
    source: row.source,
    srd: !!row.srd,
  };
}

export async function getSubclassFeatures(db: SQLiteDatabase, subclassId: number): Promise<SubclassFeature[]> {
  const rows = await db.getAllAsync<SubclassFeatureRow>(
    "SELECT id, subclass_id, name, source, level, entries FROM subclass_features WHERE subclass_id = ? AND source = 'PHB' ORDER BY level, name",
    subclassId
  );
  const translations = await getTranslations(db, 'subclass_feature');
  return rows.map((row) => ({
    id: row.id,
    subclassId: row.subclass_id,
    name: localizedName(row.id, row.name, translations),
    source: row.source,
    level: row.level,
    entries: localizedEntries(row.id, toEntries(row.entries), translations),
  }));
}

// Whether any of this class's subclasses grant a feature at level 1 (e.g.
// Cleric's Divine Domain, Sorcerer's Sorcerous Origin, Warlock's Otherworldly
// Patron - all chosen at character creation) - queried directly instead of
// hardcoding a class name list, so it stays correct if the underlying
// dataset changes. PHB classes whose first subclass feature is level 2/3
// (Barbarian, Bard, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Wizard)
// return false, deferring the subclass choice to later (out of scope here).
export async function classGrantsSubclassAtLevel1(db: SQLiteDatabase, classId: number): Promise<boolean> {
  const row = await db.getFirstAsync<{ min_level: number | null }>(
    `SELECT MIN(sf.level) as min_level FROM subclass_features sf
     JOIN subclasses s ON s.id = sf.subclass_id
     WHERE s.class_id = ? AND s.source = 'PHB' AND sf.source = 'PHB'`,
    classId
  );
  return row?.min_level === 1;
}

// Raw (unlocalized) class name - for internal rule lookups that must match
// a fixed English identifier (e.g. constants/spellcasting.ts, keyed by
// English class name since 5e's known-vs-prepared caster distinction isn't
// encoded anywhere in the reference schema) rather than for display.
export async function getClassEnglishName(db: SQLiteDatabase, classId: number): Promise<string | null> {
  const row = await db.getFirstAsync<{ name: string }>('SELECT name FROM classes WHERE id = ?', classId);
  return row?.name ?? null;
}

// Whether this class grants the "Expertise" feature (doubled proficiency
// bonus for chosen skills) at level 1 - true for Rogue in the PHB (Bard
// also has Expertise, but not until level 3, so it correctly returns false
// there). Queried by name/level rather than hardcoded by class id, same
// reasoning as classGrantsSubclassAtLevel1.
export async function classGrantsExpertiseAtLevel1(db: SQLiteDatabase, classId: number): Promise<boolean> {
  const row = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM class_features WHERE class_id = ? AND level = 1 AND name = 'Expertise' AND source = 'PHB'`,
    classId
  );
  return row != null;
}
