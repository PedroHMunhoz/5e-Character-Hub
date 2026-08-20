// End-to-end check of the item-shop purchase path through
// data/wizard/assemble-character.ts: a cart built the same way
// components/character/item-shop.tsx would (catalog -> cart ->
// explodeCartToGrants) must land as real inventory rows, and the spent
// total must come out of the character's final currency correctly (in
// copper, since shop prices go below a whole gold piece - see the
// goldFromEquipmentCp comment in assemble-character.ts).
import type { SQLiteDatabase } from 'expo-sqlite';
import { afterAll, describe, expect, it } from 'vitest';

import { getBaseItemsByNames } from '@/data/queries/equipment-lookup';
import { getShopCatalog, type ShopCatalogItem } from '@/data/queries/shop-catalog';
import { assembleCharacter } from '@/data/wizard/assemble-character';
import { computeCartTotalCp, explodeCartToGrants } from '@/data/wizard/item-purchase';
import { buildTestDraft } from '../support/build-test-draft';
import { buildLevel1Matrix } from '../support/level1-matrix';
import { openReferenceDb } from '../support/sqlite-adapter';

const db: SQLiteDatabase & { close(): void } = openReferenceDb();

afterAll(() => {
  db.close();
});

async function findCatalogItem(catalog: ShopCatalogItem[], ref: string): Promise<ShopCatalogItem> {
  const [match] = await getBaseItemsByNames(db, [ref]);
  if (!match) throw new Error(`item de referência "${ref}" não encontrado`);
  const catalogItem = catalog.find((item) => item.source === match.source && item.id === match.id);
  if (!catalogItem) throw new Error(`"${ref}" não apareceu no catálogo de compra`);
  return catalogItem;
}

describe('Compra de itens com PO -> montagem do personagem', () => {
  it('desconta o total gasto do ouro rolado e concede os itens comprados (incluindo pack de munição explodido)', async () => {
    const catalog = await getShopCatalog(db);
    const dagger = await findCatalogItem(catalog, 'dagger|phb');
    const arrowsPack = await findCatalogItem(catalog, 'arrows (20)|phb');

    // O pack deve resolver para 20 unidades de um item diferente (a flecha
    // avulsa), não para si mesmo.
    expect(arrowsPack.singleItemPackGrant).toBeDefined();
    expect(arrowsPack.singleItemPackGrant?.quantity).toBe(20);
    expect(arrowsPack.singleItemPackGrant?.itemId).not.toBe(arrowsPack.id);

    // A munição só é vendida em pack no PHB - a unidade avulsa (o item para
    // o qual o pack aponta) não deve aparecer como sua própria linha na loja.
    const componentKey = `${arrowsPack.singleItemPackGrant?.source}:${arrowsPack.singleItemPackGrant?.itemId}`;
    expect(catalog.some((item) => `${item.source}:${item.id}` === componentKey)).toBe(false);

    // 2 adagas + 3 packs de flechas (20) = 60 flechas.
    const cart = { [dagger.key]: 2, [arrowsPack.key]: 3 };
    const catalogByKey = new Map(catalog.map((item) => [item.key, item]));
    const totalCostCp = computeCartTotalCp(cart, catalogByKey);
    const grants = explodeCartToGrants(cart, catalogByKey);
    expect(totalCostCp).toBe(dagger.valueCp * 2 + arrowsPack.valueCp * 3);

    const matrix = await buildLevel1Matrix(db);
    const baseDraft = await buildTestDraft(db, matrix[0]);
    const goldRolled = 50;
    const draft = {
      ...baseDraft,
      equipmentMode: 'gold' as const,
      // A real background's chosenEquipment always grants some starting
      // currency too (every PHB background's pouch), which would need its
      // own accounting in expectedRemainingCp below - sidestepped with a
      // flavor-only placeholder (no valueCp, no inventory impact) that only
      // satisfies assembleCharacter's "some equipamento chosen" presence
      // check, so this test isolates the shop-purchase currency math.
      // Purchases live separately, same split as the real wizard flow
      // (app/wizard/equipment.tsx sets chosenEquipment, app/wizard/shop.tsx
      // sets purchasedEquipment).
      chosenEquipment: [{ kind: 'special' as const, text: 'Roupas comuns', quantity: 1 }],
      purchasedEquipment: grants,
      goldRolled,
      goldSpentCp: totalCostCp,
    };

    const character = await assembleCharacter(db, { draft, name: 'Personagem de Teste', appearance: {} });

    const expectedRemainingCp = goldRolled * 100 - totalCostCp;
    expect(character.currency.po).toBe(String(Math.floor(expectedRemainingCp / 100)));
    expect(character.currency.pc).toBe(String(expectedRemainingCp % 100));

    // Armas não se empilham (cada unidade equipável separadamente) - 2
    // adagas viram 2 linhas de inventário, cada uma quantidade '1'.
    const daggerRows = Object.values(character.inventoryItems).filter((row) => row.itemId === String(dagger.id));
    expect(daggerRows).toHaveLength(2);
    expect(daggerRows.every((row) => row.quantity === '1')).toBe(true);

    // A flecha explodida do pack se empilha em uma única linha, quantidade 60.
    const arrowKey = String(arrowsPack.singleItemPackGrant?.itemId);
    const arrowRows = Object.values(character.inventoryItems).filter((row) => row.itemId === arrowKey);
    expect(arrowRows).toHaveLength(1);
    expect(arrowRows[0].quantity).toBe('60');
  });
});
