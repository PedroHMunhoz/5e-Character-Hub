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
// though it has no items yet: that category lives in the untranslated
// `items` table (see docs/data-schema.md), so there's no pt-BR content to
// show for it until that table gets translated too.
export const INVENTORY_CATEGORY_SECTIONS: { key: string; label: string; category: CuratedItemCategory }[] = [
  { key: 'armas', label: 'Armas', category: 'weapon' },
  { key: 'armaduras', label: 'Armaduras', category: 'armor' },
  { key: 'consumiveis', label: 'Consumíveis', category: 'consumable' },
  { key: 'itensGerais', label: 'Itens em Geral', category: 'general' },
];
