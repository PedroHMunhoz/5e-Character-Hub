// Direct unit tests for data/wizard/item-purchase.ts - no DB, fake catalog
// fixtures, same "extracted, DB-free" shape as tests/wizard/step-validation.test.ts.
import { describe, expect, it } from 'vitest';

import type { ShopCatalogItem } from '@/data/queries/shop-catalog';
import { buildPurchaseSummaryLines, computeCartTotalCp, explodeCartToGrants, filterShopCatalog } from '@/data/wizard/item-purchase';

const dagger: ShopCatalogItem = {
  key: '1',
  id: 1,
  source: 'base_items',
  category: 'weapon',
  name: 'Adaga',
  valueCp: 200,
  weight: '0,5',
  weightKg: 0.5,
};

const arrowsPack: ShopCatalogItem = {
  key: '2',
  id: 2,
  source: 'base_items',
  category: 'consumable',
  name: 'Flechas (20)',
  valueCp: 100,
  weight: '0,5',
  weightKg: 0.5,
  singleItemPackGrant: { itemId: 3, source: 'base_items', quantity: 20 },
};

const explorersPack: ShopCatalogItem = {
  key: 'item:4',
  id: 4,
  source: 'items',
  category: 'general',
  name: "Kit do Explorador",
  valueCp: 1000,
  weight: '5',
  weightKg: 5,
  multiItemPackGrant: [
    { itemId: 5, source: 'items', quantity: 1 },
    { itemId: 6, source: 'items', quantity: 10 },
  ],
};

const catalog = [dagger, arrowsPack, explorersPack];
const catalogByKey = new Map(catalog.map((item) => [item.key, item]));

describe('filterShopCatalog', () => {
  it('retorna o catálogo inteiro quando a busca está vazia', () => {
    expect(filterShopCatalog(catalog, '')).toEqual(catalog);
  });

  it('filtra por substring do nome, sem diferenciar maiúsculas', () => {
    expect(filterShopCatalog(catalog, 'adaga')).toEqual([dagger]);
    expect(filterShopCatalog(catalog, 'FLECHA')).toEqual([arrowsPack]);
  });

  it('retorna vazio quando nada corresponde', () => {
    expect(filterShopCatalog(catalog, 'inexistente')).toEqual([]);
  });
});

describe('computeCartTotalCp', () => {
  it('soma preço unitário x quantidade para cada item no carrinho', () => {
    const cart = { [dagger.key]: 2, [arrowsPack.key]: 3 };
    expect(computeCartTotalCp(cart, catalogByKey)).toBe(200 * 2 + 100 * 3);
  });

  it('ignora entradas com quantidade zero ou negativa', () => {
    const cart = { [dagger.key]: 0, [arrowsPack.key]: -1 };
    expect(computeCartTotalCp(cart, catalogByKey)).toBe(0);
  });
});

describe('explodeCartToGrants', () => {
  it('item simples mantém o próprio id do catálogo e a quantidade comprada', () => {
    const grants = explodeCartToGrants({ [dagger.key]: 2 }, catalogByKey);
    expect(grants).toEqual([{ kind: 'item', itemId: 1, source: 'base_items', name: 'Adaga', quantity: 2 }]);
  });

  it('pack de item único explode para N unidades do componente, N = pacotes x tamanho do pack', () => {
    const grants = explodeCartToGrants({ [arrowsPack.key]: 3 }, catalogByKey);
    expect(grants).toEqual([{ kind: 'item', itemId: 3, source: 'base_items', name: 'Flechas (20)', quantity: 60 }]);
  });

  it('pack multi-item explode para uma entrada por item contido, escalada pela quantidade de packs', () => {
    const grants = explodeCartToGrants({ [explorersPack.key]: 2 }, catalogByKey);
    expect(grants).toEqual([
      { kind: 'item', itemId: 5, source: 'items', name: "Kit do Explorador", quantity: 2 },
      { kind: 'item', itemId: 6, source: 'items', name: "Kit do Explorador", quantity: 20 },
    ]);
  });

  it('ignora entradas com quantidade zero e chaves fora do catálogo', () => {
    const grants = explodeCartToGrants({ [dagger.key]: 0, missing: 5 }, catalogByKey);
    expect(grants).toEqual([]);
  });
});

describe('buildPurchaseSummaryLines', () => {
  it('uma linha por item do CARRINHO (não do grant explodido), com subtotal e ordenada por nome', () => {
    const cart = { [arrowsPack.key]: 3, [dagger.key]: 2 };
    const lines = buildPurchaseSummaryLines(cart, catalogByKey);
    // "Adaga" antes de "Flechas (20)" (ordem alfabética pt-BR), não a ordem
    // de inserção do carrinho - e a linha do pack mostra "3x Flechas (20)",
    // não os 60 itens explodidos que ele concede.
    expect(lines).toEqual([
      { key: dagger.key, name: 'Adaga', quantity: 2, subtotalCp: 400 },
      { key: arrowsPack.key, name: 'Flechas (20)', quantity: 3, subtotalCp: 300 },
    ]);
  });

  it('ignora entradas com quantidade zero/negativa e chaves fora do catálogo', () => {
    const lines = buildPurchaseSummaryLines({ [dagger.key]: 0, [arrowsPack.key]: -1, missing: 5 }, catalogByKey);
    expect(lines).toEqual([]);
  });

  it('carrinho vazio produz lista vazia', () => {
    expect(buildPurchaseSummaryLines({}, catalogByKey)).toEqual([]);
  });
});
