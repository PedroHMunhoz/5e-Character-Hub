// getShopCatalog against the real bundled PHB dataset - same pattern as
// tests/support/sqlite-adapter.smoke.test.ts (a real query-layer function
// run against the reference db, not a mock).
import type { SQLiteDatabase } from 'expo-sqlite';
import { afterAll, describe, expect, it } from 'vitest';

import { getAllItems } from '@/data/queries/items';
import { getShopCatalog, type ShopCatalogItem } from '@/data/queries/shop-catalog';
import { openReferenceDb } from '../support/sqlite-adapter';

const db: SQLiteDatabase & { close(): void } = openReferenceDb();
let catalog: ShopCatalogItem[] | undefined;

afterAll(() => {
  db.close();
});

describe('getShopCatalog', () => {
  it('carrega o catálogo e cobre as 4 seções (Armas/Armaduras/Consumíveis/Itens em Geral)', async () => {
    catalog = await getShopCatalog(db);
    for (const category of ['weapon', 'armor', 'consumable', 'general'] as const) {
      expect(catalog.some((item) => item.category === category)).toBe(true);
    }
  });

  it('exclui as unidades avulsas de munição, mantendo só o pack, resolvido para a unidade correta', async () => {
    catalog = catalog ?? (await getShopCatalog(db));
    const arrow = catalog.find((item) => item.source === 'base_items' && item.name.toLowerCase().includes('flecha') && !item.name.includes('('));
    const arrowsPack = catalog.find((item) => item.source === 'base_items' && /flechas?\s*\(20\)/i.test(item.name));

    expect(arrow).toBeUndefined();
    expect(arrowsPack).toBeDefined();
    expect(arrowsPack?.singleItemPackGrant?.quantity).toBe(20);
    expect(arrowsPack?.singleItemPackGrant?.itemId).not.toBe(arrowsPack?.id);
  });

  it('explode o Kit do Explorador nos 8 itens distintos que ele contém', async () => {
    catalog = catalog ?? (await getShopCatalog(db));
    const explorersPack = catalog.find((item) => item.source === 'items' && item.name.toLowerCase().includes('explorador'));

    expect(explorersPack).toBeDefined();
    expect(explorersPack?.multiItemPackGrant).toHaveLength(8);
    expect(explorersPack?.multiItemPackGrant?.every((grant) => grant.quantity > 0)).toBe(true);
  });

  it('não inclui itens mágicos', async () => {
    catalog = catalog ?? (await getShopCatalog(db));
    const allItems = await getAllItems(db);
    const magicItemIds = new Set(allItems.filter((item) => item.isMagic).map((item) => item.id));

    const catalogItemsIds = catalog.filter((item) => item.source === 'items').map((item) => item.id);
    expect(catalogItemsIds.some((id) => magicItemIds.has(id))).toBe(false);
  });
});
