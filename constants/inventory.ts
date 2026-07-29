import type { Currency } from '@/types/character';

export const CURRENCY_FIELDS: { key: keyof Currency; label: string }[] = [
  { key: 'pl', label: 'PL' },
  { key: 'po', label: 'PO' },
  { key: 'pp', label: 'PP' },
  { key: 'pe', label: 'PE' },
  { key: 'pc', label: 'PC' },
];

export interface InventoryItemDefinition {
  id: string;
  name: string;
  subtitle?: string;
}

export interface InventorySectionDefinition {
  key: string;
  label: string;
  items: InventoryItemDefinition[];
}

export const INVENTORY_SECTIONS: InventorySectionDefinition[] = [
  {
    key: 'armas',
    label: 'Armas',
    items: [
      { id: 'cajado', name: 'Cajado', subtitle: 'Ação | +2 para acertar | 1d6 - 1 (2.5)' },
      {
        id: 'cajado-de-golpear',
        name: 'Cajado de Golpear',
        subtitle: 'Ação | +5 para acertar | 1d6 + 2 (5.5)',
      },
    ],
  },
  {
    key: 'equipamentos',
    label: 'Equipamentos',
    items: [{ id: 'vestes', name: 'Vestes' }],
  },
  {
    key: 'consumiveis',
    label: 'Consumíveis',
    items: [{ id: 'corda-de-canhamo', name: 'Corda de Cânhamo (15m)', subtitle: 'Ação' }],
  },
  {
    key: 'itensGerais',
    label: 'Itens em Geral',
    items: [
      { id: 'saco-de-dormir', name: 'Saco de Dormir' },
      { id: 'kit-de-refeicao', name: 'Kit de Refeição' },
      { id: 'faca-pequena', name: 'Faca Pequena' },
      { id: 'livro-de-magias', name: 'Livro de Magias' },
    ],
  },
];
