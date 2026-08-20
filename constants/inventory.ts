import type { Currency } from '@/types/character';
import type { CuratedItemCategory } from '@/data/queries/base-items';

export const CURRENCY_FIELDS: { key: keyof Currency; label: string }[] = [
  { key: 'pl', label: 'PL' },
  { key: 'po', label: 'PO' },
  { key: 'pp', label: 'PP' },
  { key: 'pe', label: 'PE' },
  { key: 'pc', label: 'PC' },
];

// Section labels/order rendered by components/character/character-inventory.tsx.
// "Itens em Geral" holds a character's `items`-table-sourced inventory rows
// (packs, kits, general adventuring gear - see data/queries/items.ts's
// getItemsByIds), alongside base_items' 'general' category (SCF/instruments/
// tools not otherwise classified as a weapon/armor/consumable).
export const INVENTORY_CATEGORY_SECTIONS: { key: string; label: string; category: CuratedItemCategory }[] = [
  { key: 'armas', label: 'Armas', category: 'weapon' },
  { key: 'armaduras', label: 'Armaduras', category: 'armor' },
  { key: 'consumiveis', label: 'Consumíveis', category: 'consumable' },
  { key: 'itensGerais', label: 'Itens em Geral', category: 'general' },
];

// Shown (one at random) while components/character/item-shop.tsx loads its
// catalog - same "one random phrase while it loads" pattern as
// SPELL_LOADING_MESSAGES in constants/spells.ts.
export const SHOP_LOADING_MESSAGES: string[] = [
  'Organizando o estoque...',
  'Verificando se temos espadas...',
  'Contando moedas de ouro...',
  'Espantando as traças das capas...',
  'Afiando as lâminas para exibição...',
  'Procurando o Kit do Explorador no depósito...',
  'Negociando com o fornecedor de flechas...',
  'Tirando a poeira das armaduras...',
  'Acordando o mercador...',
];
