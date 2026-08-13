import type { SQLiteDatabase } from 'expo-sqlite';

import { getSingleItemPackContents } from './base-items';
import { getTranslations, localizedName } from './localize';

// Item lookups by arbitrary name/category, for the wizard's equipment
// resolver (data/wizard/equipment-resolver.ts), which needs to resolve
// "name|source" refs and equipmentType category filters pulled live from
// classes/backgrounds.starting_equipment - not just a fixed set of items.

export interface EquipmentLookupItem {
  id: number;
  source: 'base_items' | 'items';
  name: string;
  // Raw (unlocalized) name - the wizard's item refs ("name|source") are
  // always English, so matching against this instead of the localized
  // `name` is what lets data/wizard/equipment-resolver.ts's lookup index
  // actually find translated items. Same englishName pattern already used
  // by data/queries/races.ts (Race.englishName) and data/queries/tools.ts
  // (ToolItem.englishName).
  englishName: string;
  // Set when this item is a "pack" of N units of one other catalog item
  // (ammo bundles like "Crossbow Bolts (20)", or Ball Bearings/Caltrops/
  // Iron Spikes) - granting it should explode into N of the referenced
  // component item instead of 1 of the pack itself. Absent for items with
  // no pack, and for multi-item bundles (Explorer's Pack, ...), which stay
  // as one granted item - see getSingleItemPackContents.
  singleItemPack?: { itemRef: string; quantity: number };
}

// A 5etools item ref like "chain mail|phb" or bare "thieves' tools" (no
// pipe - some entries omit the source). Only the name half matters for
// lookup: base_items/items are unique per (name, source), but the DSL is
// inconsistent about including the source suffix, so matching on name alone
// (case-insensitively) is the pragmatic choice here.
export function refName(ref: string): string {
  return ref.split('|')[0];
}

// base_items and items are separate autoincrement id spaces - a base_items
// row and an items row can (and, verified live, sometimes do) share the
// same numeric id. CharacterSheet.inventoryItems/tools are single flat
// Record<string, ...> maps keyed by "item id", so storing bare numeric ids
// from both tables risks one silently overwriting the other. `base_items`
// keeps the bare id (matches the existing convention already used
// everywhere in the app, e.g. data/queries/base-items.ts's curated
// inventory, so no existing code needs to change); only `items`-sourced
// entries get a prefix.
export function itemKey(source: 'base_items' | 'items', id: number): string {
  return source === 'items' ? `item:${id}` : String(id);
}

export function parseItemKey(key: string): { source: 'base_items' | 'items'; id: number } {
  if (key.startsWith('item:')) return { source: 'items', id: Number(key.slice('item:'.length)) };
  return { source: 'base_items', id: Number(key) };
}

export async function getBaseItemsByNames(db: SQLiteDatabase, refs: string[]): Promise<EquipmentLookupItem[]> {
  if (refs.length === 0) return [];
  const names = refs.map(refName);
  const placeholders = names.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{ id: number; name: string; details: string | null }>(
    `SELECT id, name, details FROM base_items WHERE source = 'PHB' AND name COLLATE NOCASE IN (${placeholders})`,
    ...names
  );
  const translations = await getTranslations(db, 'base_item');
  return rows.map((row) => ({
    id: row.id,
    source: 'base_items',
    name: localizedName(row.id, row.name, translations),
    englishName: row.name,
    singleItemPack: getSingleItemPackContents(row.details),
  }));
}

export async function getItemsByNames(db: SQLiteDatabase, refs: string[]): Promise<EquipmentLookupItem[]> {
  if (refs.length === 0) return [];
  const names = refs.map(refName);
  const placeholders = names.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{ id: number; name: string; details: string | null }>(
    `SELECT id, name, details FROM items WHERE source = 'PHB' AND name COLLATE NOCASE IN (${placeholders})`,
    ...names
  );
  const translations = await getTranslations(db, 'item');
  return rows.map((row) => ({
    id: row.id,
    source: 'items',
    name: localizedName(row.id, row.name, translations),
    englishName: row.name,
    singleItemPack: getSingleItemPackContents(row.details),
  }));
}

// equipmentType codes seen across the PHB's classes/backgrounds
// starting_equipment `defaultData` (verified live against the bundled db -
// see docs/wizard-todo.md for the note to re-check this against every PHB
// class, not just the ones inspected during planning). Spellcasting foci
// and musical instruments turned out to be split across BOTH `base_items`
// and `items` (e.g. arcane focus items like Crystal/Orb/Wand are
// base_items, but holy symbols like Amulet/Emblem/Reliquary - plus the
// pt-BR-only "Sinete"/"Sino" additions from db/overrides/custom-items.json,
// which have no `details.scfType` at all - are in `items`), so each filter
// runs against whichever table(s) actually hold matches for that category
// instead of assuming one table.
interface EquipmentTypeFilter {
  table: 'base_items' | 'items';
  where: string;
  params: string[];
}

const EQUIPMENT_TYPE_FILTERS: Record<string, EquipmentTypeFilter[]> = {
  weaponMartial: [
    { table: 'base_items', where: `type IN ('M','R') AND json_extract(details,'$.weaponCategory') = ?`, params: ['martial'] },
  ],
  weaponMartialMelee: [
    { table: 'base_items', where: `type = 'M' AND json_extract(details,'$.weaponCategory') = ?`, params: ['martial'] },
  ],
  weaponSimple: [
    { table: 'base_items', where: `type IN ('M','R') AND json_extract(details,'$.weaponCategory') = ?`, params: ['simple'] },
  ],
  weaponSimpleMelee: [
    { table: 'base_items', where: `type = 'M' AND json_extract(details,'$.weaponCategory') = ?`, params: ['simple'] },
  ],
  instrumentMusical: [
    { table: 'base_items', where: `type = 'INS'`, params: [] },
    { table: 'items', where: `type = 'INS'`, params: [] },
  ],
  toolArtisan: [{ table: 'base_items', where: `type = 'AT'`, params: [] }],
  focusSpellcastingArcane: [
    { table: 'base_items', where: `type = 'SCF' AND json_extract(details,'$.scfType') = ?`, params: ['arcane'] },
    { table: 'items', where: `type = 'SCF' AND json_extract(details,'$.scfType') = ?`, params: ['arcane'] },
  ],
  focusSpellcastingDruidic: [
    { table: 'base_items', where: `type = 'SCF' AND json_extract(details,'$.scfType') = ?`, params: ['druid'] },
    { table: 'items', where: `type = 'SCF' AND json_extract(details,'$.scfType') = ?`, params: ['druid'] },
  ],
  focusSpellcastingHoly: [
    { table: 'items', where: `type = 'SCF' AND json_extract(details,'$.scfType') = ?`, params: ['holy'] },
    // Sinete/Sino (custom PHB pt-BR entries) have no `details` at all, so
    // they can't be matched by scfType - name them explicitly instead.
    { table: 'items', where: `type = 'SCF' AND details IS NULL AND name IN ('Sinete', 'Sino')`, params: [] },
  ],
};

export async function getBaseItemsByEquipmentType(
  db: SQLiteDatabase,
  equipmentType: string
): Promise<EquipmentLookupItem[]> {
  const filters = EQUIPMENT_TYPE_FILTERS[equipmentType];
  if (!filters) return [];

  const results: EquipmentLookupItem[] = [];
  // Sequential, not Promise.all - overlapping queries on the same
  // SQLiteDatabase connection can crash on native (see data/queries/spells.ts).
  for (const filter of filters) {
    const rows = await db.getAllAsync<{ id: number; name: string }>(
      `SELECT id, name FROM ${filter.table} WHERE source = 'PHB' AND ${filter.where} ORDER BY name`,
      ...filter.params
    );
    const translations = await getTranslations(db, filter.table === 'base_items' ? 'base_item' : 'item');
    results.push(
      ...rows.map((row) => ({
        id: row.id,
        source: filter.table,
        name: localizedName(row.id, row.name, translations),
        englishName: row.name,
      }))
    );
  }
  return results;
}
