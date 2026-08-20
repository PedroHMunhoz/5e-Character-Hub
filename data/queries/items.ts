import type { SQLiteDatabase } from 'expo-sqlite';

import type { Item } from '@/types/reference';
import { parseJson, toEntries } from '../rows';
import {
  formatWeightKg,
  getMultiItemPackContents,
  getSingleItemPackContents,
  getWeightKg,
  isMultiItemPack,
  type MultiItemPackEntry,
} from './base-items';
import { getTranslations, localizedName } from './localize';

interface ItemRow {
  id: number;
  name: string;
  source: string;
  srd: number;
  basic_rules: number;
  type: string | null;
  rarity: string | null;
  is_magic: number;
  requires_attunement: string | null;
  value_cp: number | null;
  weight_lb: number | null;
  entries: string;
  details: string | null;
}

function mapItemRow(row: ItemRow): Item {
  const details = parseJson<Record<string, unknown>>(row.details);
  return {
    id: row.id,
    name: row.name,
    source: row.source,
    srd: !!row.srd,
    basicRules: !!row.basic_rules,
    type: row.type,
    rarity: row.rarity,
    isMagic: !!row.is_magic,
    requiresAttunement: row.requires_attunement,
    valueCp: row.value_cp,
    weightLb: row.weight_lb,
    entries: toEntries(row.entries),
    details,
    category: categorizeItem({ englishName: row.name, details }),
  };
}

export async function getAllItems(db: SQLiteDatabase): Promise<Item[]> {
  const rows = await db.getAllAsync<ItemRow>('SELECT * FROM items ORDER BY name');
  return rows.map(mapItemRow);
}

export async function getItemById(db: SQLiteDatabase, id: number): Promise<Item | null> {
  const row = await db.getFirstAsync<ItemRow>('SELECT * FROM items WHERE id = ?', id);
  return row ? mapItemRow(row) : null;
}

// The `items` table's own `type` never distinguishes consumable gear from
// durable gear - both Torch and Backpack are type 'G' ("adventuring gear").
// 5etools' raw dataset does carry that distinction as a `miscTags: ["CNS"]`
// flag though, which already survives into `details` unchanged (it's outside
// the ITEM_MODELED whitelist in scripts/import-5e-data.mjs, so it lands in
// the details catch-all). Confirmed live against the bundled PHB dataset:
// exactly the real consumables carry it (Torch, Candle, Rations, Oil (flask),
// Ink, Perfume, Acid, Alchemist's Fire, Antitoxin, Poison, Holy Water, food/
// drink) - everything else (Backpack, Bedroll, Rope, Tinderbox, Waterskin,
// Crowbar, Piton, Lantern, Chest, ...) is unflagged.
//
// CNS alone misses a second, real category of consumable though: items sold
// in bulk and expended a few at a time in play - Ball Bearings/Caltrops/Iron
// Spikes bags each explode (see getSingleItemPackContents in base-items.ts)
// into N of one of these three, none of which carry CNS. Verified live
// against the bundled PHB dataset: these are the only 3 items-table rows
// referenced as a singleItemPack component, so a small curated Set (same
// pattern as GENERAL_ITEM_TYPE_LABELS/EQUIPMENT_FLAVOR_TEXT_LABELS
// elsewhere) is enough - no need for a dynamic query.
//
// `englishName` (not the translated `Item.name`) is required here - this
// runs inside mapItemRow, before translation is applied, so the comparison
// stays correct once these items get a pt-BR name.
const BULK_PACK_COMPONENT_NAMES = new Set(['Ball Bearing', 'Caltrop', 'Iron Spike']);

export function categorizeItem(item: { englishName: string; details: Record<string, unknown> | null }): 'consumable' | 'general' {
  const miscTags = item.details?.miscTags;
  if (Array.isArray(miscTags) && miscTags.includes('CNS')) return 'consumable';
  if (BULK_PACK_COMPONENT_NAMES.has(item.englishName)) return 'consumable';
  return 'general';
}

// A character's items-table-sourced inventory rows (packs, kits, general
// adventuring gear granted by the creation wizard) by id - unlike
// getAllItems/getItemById above, this applies the pt-BR translations
// overlay (entity_type 'item', confirmed populated in the bundled db),
// since these rows are shown directly to the player in the Inventory tab.
export async function getItemsByIds(db: SQLiteDatabase, ids: number[]): Promise<Item[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.getAllAsync<ItemRow>(`SELECT * FROM items WHERE id IN (${placeholders})`, ...ids);
  const translations = await getTranslations(db, 'item');
  return rows.map((row) => ({ ...mapItemRow(row), name: localizedName(row.id, row.name, translations) }));
}

export interface PurchasableItem extends Item {
  // Raw (unlocalized) name - needed to look up ITEM_WEIGHT_KG_OVERRIDES
  // (keyed by English name, see getWeightKg/formatWeightKg in base-items.ts)
  // and to match against packContents refs (always English) once `name`
  // below has been overwritten with the translated display name.
  englishName: string;
  weight: string;
  weightKg: number;
  // Buying 1 unit grants N of a different catalog item (ammo-style single-
  // item pack, e.g. a bag of Caltrops) - see getSingleItemPackContents.
  singleItemPackRef?: { itemRef: string; quantity: number };
  // Buying 1 unit grants several distinct items (Explorer's Pack, ...) -
  // see getMultiItemPackContents. Both refs are mutually exclusive, same as
  // the underlying packContents shapes they come from.
  multiItemPackRef?: MultiItemPackEntry[];
}

// Every PHB items-table row with a real price, excluding magic items - the
// other half of the catalog source for data/queries/shop-catalog.ts's
// purchase screen (base_items covers weapons/armor/ammo/tools).
export async function getAllPurchasableItems(db: SQLiteDatabase): Promise<PurchasableItem[]> {
  const rows = await db.getAllAsync<ItemRow>(
    `SELECT * FROM items WHERE source = 'PHB' AND value_cp IS NOT NULL AND is_magic = 0 ORDER BY name`
  );
  const translations = await getTranslations(db, 'item');
  return rows.map((row) => ({
    ...mapItemRow(row),
    name: localizedName(row.id, row.name, translations),
    englishName: row.name,
    weight: formatWeightKg(row.name, row.weight_lb),
    weightKg: getWeightKg(row.name, row.weight_lb),
    singleItemPackRef: getSingleItemPackContents(row.details),
    multiItemPackRef: isMultiItemPack(row.details) ? getMultiItemPackContents(row.details, row.name) : undefined,
  }));
}
