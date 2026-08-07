import type { Currency } from '@/types/character';
import type { CuratedItemCategory } from '@/data/queries/base-items';

export const CURRENCY_FIELDS: { key: keyof Currency; label: string }[] = [
  { key: 'pl', label: 'PL' },
  { key: 'po', label: 'PO' },
  { key: 'pp', label: 'PP' },
  { key: 'pe', label: 'PE' },
  { key: 'pc', label: 'PC' },
];

// Section labels/order for the live base_items query in
// data/queries/base-items.ts. "Itens em Geral" stays as a section header even
// though it has no items yet: that category lives in the `items` table,
// which is translated (translations/pt-BR/PHB/items.json) but not queried
// by the Inventory screen yet - no getCuratedInventoryItems()-equivalent,
// no categorize() split, no UI wiring.
export const INVENTORY_CATEGORY_SECTIONS: { key: string; label: string; category: CuratedItemCategory }[] = [
  { key: 'armas', label: 'Armas', category: 'weapon' },
  { key: 'armaduras', label: 'Armaduras', category: 'armor' },
  { key: 'consumiveis', label: 'Consumíveis', category: 'consumable' },
  { key: 'itensGerais', label: 'Itens em Geral', category: 'general' },
];
