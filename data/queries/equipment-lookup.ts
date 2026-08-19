import type { SQLiteDatabase } from 'expo-sqlite';

import { getMultiItemPackContents, getSingleItemPackContents, isMultiItemPack, type MultiItemPackEntry } from './base-items';
import { getTranslations, localizedEntries, localizedName } from './localize';
import { toEntries } from '../rows';

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
  // Translated contents preview, only set for multi-item equipment packs
  // (Explorer's Pack, Burglar's Pack, ...) - see isMultiItemPack. Only
  // populated by getItemsByNames; base_items never carries this (packs
  // only live in `items`).
  entries?: string[];
  // Structured contents for a multi-item pack - the full MultiItemPackEntry
  // list from getMultiItemPackContents, still carrying unresolved refs
  // (resolved to concrete ids by equipment-resolver.ts, same second pass
  // that already resolves singleItemPack). `kind: 'special'` entries (no
  // catalog item, e.g. "10 feet of string") are redirected through
  // EQUIPMENT_SPECIAL_ITEM_REFS by equipment-resolver.ts's
  // resolvePackContentRef, same mechanism already used for top-level
  // `special` grants - not dropped here anymore (see docs/TODO.md).
  packContents?: MultiItemPackEntry[];
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
  const rows = await db.getAllAsync<{ id: number; name: string; entries: string | null; details: string | null }>(
    `SELECT id, name, entries, details FROM items WHERE source = 'PHB' AND name COLLATE NOCASE IN (${placeholders})`,
    ...names
  );
  const translations = await getTranslations(db, 'item');
  return rows.map((row) => ({
    id: row.id,
    source: 'items',
    name: localizedName(row.id, row.name, translations),
    englishName: row.name,
    singleItemPack: getSingleItemPackContents(row.details),
    entries: isMultiItemPack(row.details) ? localizedEntries(row.id, toEntries(row.entries), translations) : undefined,
    packContents: getMultiItemPackContents(row.details, row.name),
  }));
}

// equipmentType codes seen across the PHB's classes/backgrounds
// starting_equipment `defaultData` (verified live against the bundled db -
// see docs/TODO.md for the note to re-check this against every PHB
// class, not just the ones inspected during planning). Spellcasting foci
// and musical instruments turned out to be split across BOTH `base_items`
// and `items` (e.g. arcane focus items like Crystal/Orb/Wand are
// base_items, but holy symbols like Amulet/Emblem/Reliquary - plus the
// pt-BR-only "Sinete" addition from db/overrides/custom-items.json and the
// real PHB "Bell" item (doubling as "Sino"), neither of which has
// `details.scfType` - are in `items`), so each filter runs against
// whichever table(s) actually hold matches for that category instead of
// assuming one table.
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
    // Signet (custom PHB pt-BR entry - English base name of "Sinete", see
    // db/overrides/custom-items.json) has no `details` at all, so it can't
    // be matched by scfType - named explicitly instead. Bell is the real
    // PHB adventuring-gear item (p.150, type 'G', not 'SCF') that the
    // Galápagos PHB pt-BR edition also prints as the "Sino" Holy Symbol
    // variant (p.151, same price) - merged into this one item per user
    // decision (see translations/pt-BR/DUVIDAS.md), so it's named here too
    // rather than requiring type='SCF'/details IS NULL like Signet.
    { table: 'items', where: `name IN ('Signet', 'Bell')`, params: [] },
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
