// Unified purchasable-item catalog for the "buy items with gold" screen
// (components/character/item-shop.tsx) - merges base_items (weapons, armor,
// ammo, tools, instruments, foci) and items (general gear, consumables,
// equipment packs), reusing the exact same pack-resolution machinery the
// wizard's starting-equipment resolver already relies on
// (data/wizard/equipment-resolver.ts) so a purchased pack grants exactly
// what a granted one would.
import type { SQLiteDatabase } from 'expo-sqlite';

import { packContentEntryRef, substituteSingleItemPack } from '@/data/wizard/equipment-resolver';
import { getAllPurchasableBaseItems, type CuratedItemCategory } from './base-items';
import { getBaseItemsByNames, getItemsByNames, itemKey, refName, type EquipmentLookupItem } from './equipment-lookup';
import { getAllPurchasableItems } from './items';

export interface ShopGrant {
  itemId: number;
  source: 'base_items' | 'items';
  quantity: number;
}

export interface ShopCatalogItem {
  key: string;
  id: number;
  source: 'base_items' | 'items';
  category: CuratedItemCategory;
  name: string;
  valueCp: number;
  properties?: string;
  weight: string;
  weightKg: number;
  // Buying 1 unit of this row actually grants N of a different item (ammo
  // "(20)"/"(50)" packs, bulk-bag consumables) instead of the row itself.
  singleItemPackGrant?: ShopGrant;
  // Buying 1 unit grants several distinct items (Explorer's Pack, ...)
  // instead of the pack row itself.
  multiItemPackGrant?: ShopGrant[];
}

function buildLookupIndex(items: EquipmentLookupItem[]): Map<string, EquipmentLookupItem> {
  const index = new Map<string, EquipmentLookupItem>();
  for (const item of items) index.set(item.englishName.toLowerCase(), item);
  return index;
}

export async function getShopCatalog(db: SQLiteDatabase): Promise<ShopCatalogItem[]> {
  const baseItems = await getAllPurchasableBaseItems(db);
  const items = await getAllPurchasableItems(db);

  // Every English name ref that needs resolving to a concrete catalog row:
  // single-item pack components (ammo, bulk-bag contents) and multi-item
  // pack contents (Explorer's Pack, ...).
  const refs = new Set<string>();
  for (const row of [...baseItems, ...items]) {
    if (row.singleItemPackRef) refs.add(refName(row.singleItemPackRef.itemRef).toLowerCase());
  }
  for (const row of items) {
    for (const pc of row.multiItemPackRef ?? []) {
      const ref = packContentEntryRef(pc);
      if (ref) refs.add(refName(ref).toLowerCase());
    }
  }

  // Sequential, not Promise.all - overlapping queries on the same
  // SQLiteDatabase connection can crash on native (see data/queries/spells.ts).
  const uniqueRefs = [...refs];
  const resolvedBaseItems = await getBaseItemsByNames(db, uniqueRefs);
  const resolvedItems = await getItemsByNames(db, uniqueRefs);
  let index = buildLookupIndex([...resolvedBaseItems, ...resolvedItems]);

  // A resolved component can itself be a single-item pack one level down
  // (e.g. Burglar's Pack's "ball bearings (bag of 1,000)") - loop until a
  // pass finds nothing new, same bounded approach as
  // equipment-resolver.ts's resolveEquipmentItemRefs.
  for (let pass = 0; pass < 3; pass++) {
    const nextRefs = [...index.values()]
      .map((item) => item.singleItemPack?.itemRef)
      .filter((ref): ref is string => ref !== undefined && !index.has(refName(ref).toLowerCase()));
    const uniqueNextRefs = [...new Set(nextRefs)];
    if (uniqueNextRefs.length === 0) break;
    const nextBaseItems = await getBaseItemsByNames(db, uniqueNextRefs);
    const nextItems = await getItemsByNames(db, uniqueNextRefs);
    index = buildLookupIndex([...index.values(), ...nextBaseItems, ...nextItems]);
  }

  function resolveGrant(ref: string): ShopGrant | undefined {
    const match = index.get(refName(ref).toLowerCase());
    if (!match) return undefined;
    const { resolved, quantityMultiplier } = substituteSingleItemPack(match, index);
    return { itemId: resolved.id, source: resolved.source, quantity: quantityMultiplier };
  }

  function resolveSingleItemPackGrant(packRef: { itemRef: string; quantity: number }): ShopGrant | undefined {
    const grant = resolveGrant(packRef.itemRef);
    return grant ? { ...grant, quantity: grant.quantity * packRef.quantity } : undefined;
  }

  // Any catalog row that's only ever sold as part of a pack (Arrow,
  // Crossbow Bolt, Blowgun Needle, Sling Bullet, Ball Bearing, Caltrop, Iron
  // Spike, ...) isn't itself a PHB purchase option - only the pack is.
  // Computed dynamically from what's actually referenced as a pack
  // component, rather than a hardcoded name list.
  const componentOnlyKeys = new Set<string>();
  for (const row of [...baseItems, ...items]) {
    if (!row.singleItemPackRef) continue;
    const grant = resolveGrant(row.singleItemPackRef.itemRef);
    if (grant) componentOnlyKeys.add(itemKey(grant.source, grant.itemId));
  }

  const catalog: ShopCatalogItem[] = [];

  for (const row of baseItems) {
    const key = itemKey('base_items', row.id);
    if (componentOnlyKeys.has(key) || row.valueCp == null) continue;
    catalog.push({
      key,
      id: row.id,
      source: 'base_items',
      category: row.category,
      name: row.name,
      valueCp: row.valueCp,
      properties: row.properties,
      weight: row.weight,
      weightKg: row.weightKg,
      singleItemPackGrant: row.singleItemPackRef ? resolveSingleItemPackGrant(row.singleItemPackRef) : undefined,
    });
  }

  for (const row of items) {
    const key = itemKey('items', row.id);
    if (componentOnlyKeys.has(key) || row.valueCp == null) continue;
    const multiItemPackGrant = row.multiItemPackRef
      ?.map((pc) => {
        const ref = packContentEntryRef(pc);
        const grant = ref ? resolveGrant(ref) : undefined;
        return grant ? { ...grant, quantity: grant.quantity * pc.quantity } : undefined;
      })
      .filter((grant): grant is ShopGrant => grant !== undefined);

    catalog.push({
      key,
      id: row.id,
      source: 'items',
      category: row.category,
      name: row.name,
      valueCp: row.valueCp,
      weight: row.weight,
      weightKg: row.weightKg,
      singleItemPackGrant: row.singleItemPackRef ? resolveSingleItemPackGrant(row.singleItemPackRef) : undefined,
      multiItemPackGrant: multiItemPackGrant && multiItemPackGrant.length > 0 ? multiItemPackGrant : undefined,
    });
  }

  return catalog;
}
