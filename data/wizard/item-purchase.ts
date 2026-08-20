// Pure helpers for the "buy items with gold" screen (components/character/
// item-shop.tsx) - search filtering, cart pricing, and turning a cart into
// the same ResolvedEquipmentEntry[] shape the wizard's starting-equipment
// resolver already produces, so assemble-character.ts's stacking/currency
// logic needs no changes to also grant purchased items. No SQLiteDatabase
// here - same pure-transformation split as equipment-resolver.ts's
// parse-then-resolve pattern (see data/wizard/step-validation.ts for the
// same "extracted, DB-free" test-friendly shape).
import type { ResolvedEquipmentEntry } from '@/data/wizard/equipment-resolver';
import type { ShopCatalogItem } from '@/data/queries/shop-catalog';
import { sortByLocalizedName } from '@/utils/sort-by-name';

export type ShopCart = Record<string, number>;

export function filterShopCatalog(catalog: ShopCatalogItem[], query: string): ShopCatalogItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return catalog;
  return catalog.filter((item) => item.name.toLowerCase().includes(normalized));
}

export function computeCartTotalCp(cart: ShopCart, catalogByKey: Map<string, ShopCatalogItem>): number {
  let total = 0;
  for (const [key, count] of Object.entries(cart)) {
    if (count <= 0) continue;
    const item = catalogByKey.get(key);
    if (!item) continue;
    total += item.valueCp * count;
  }
  return total;
}

// Turns a cart (catalog key -> quantity purchased) into the grants it
// actually resolves to: a plain item keeps its own catalog id, a
// single-item pack (ammo, bulk-bag consumables) explodes into N of its
// component, and a multi-item pack (Explorer's Pack, ...) explodes into one
// entry per distinct item it contains.
export function explodeCartToGrants(cart: ShopCart, catalogByKey: Map<string, ShopCatalogItem>): ResolvedEquipmentEntry[] {
  const grants: ResolvedEquipmentEntry[] = [];

  for (const [key, count] of Object.entries(cart)) {
    if (count <= 0) continue;
    const item = catalogByKey.get(key);
    if (!item) continue;

    if (item.multiItemPackGrant) {
      for (const grant of item.multiItemPackGrant) {
        grants.push({
          kind: 'item',
          itemId: grant.itemId,
          source: grant.source,
          name: item.name,
          quantity: grant.quantity * count,
        });
      }
      continue;
    }

    if (item.singleItemPackGrant) {
      grants.push({
        kind: 'item',
        itemId: item.singleItemPackGrant.itemId,
        source: item.singleItemPackGrant.source,
        name: item.name,
        quantity: item.singleItemPackGrant.quantity * count,
      });
      continue;
    }

    grants.push({ kind: 'item', itemId: item.id, source: item.source, name: item.name, quantity: count });
  }

  return grants;
}

export interface PurchaseSummaryLine {
  key: string;
  name: string;
  quantity: number;
  subtotalCp: number;
}

// One line per catalog row actually in the cart (not the exploded grants -
// "3 packs de Flechas (20)" is what the player chose and recognizes, not
// "60 Flecha") - used by both the purchase-confirmation modal and the
// Equipamento step's "Equipamento comprado" summary, so both always agree.
export function buildPurchaseSummaryLines(cart: ShopCart, catalogByKey: Map<string, ShopCatalogItem>): PurchaseSummaryLine[] {
  const lines: PurchaseSummaryLine[] = [];
  for (const [key, quantity] of Object.entries(cart)) {
    if (quantity <= 0) continue;
    const item = catalogByKey.get(key);
    if (!item) continue;
    lines.push({ key, name: item.name, quantity, subtotalCp: item.valueCp * quantity });
  }
  return sortByLocalizedName(lines);
}
