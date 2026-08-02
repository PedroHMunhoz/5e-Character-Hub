import type { Currency } from '@/types/character';

export const CURRENCY_FIELDS: { key: keyof Currency; label: string }[] = [
  { key: 'pl', label: 'PL' },
  { key: 'po', label: 'PO' },
  { key: 'pp', label: 'PP' },
  { key: 'pe', label: 'PE' },
  { key: 'pc', label: 'PC' },
];

export type InventoryItemCategory = 'weapon' | 'armor' | 'consumable' | 'general';

export interface InventoryItemDefinition {
  id: string;
  name: string;
  properties?: string;
  weight: string;
  damageDice?: string;
  armorClassBonus?: string;
  defaultQuantity?: string;
}

export interface InventorySectionDefinition {
  key: string;
  label: string;
  category: InventoryItemCategory;
  items: InventoryItemDefinition[];
}

export const INVENTORY_SECTIONS: InventorySectionDefinition[] = [
  {
    key: 'armas',
    label: 'Armas',
    category: 'weapon',
    items: [
      {
        id: 'besta-leve',
        name: 'Besta Leve',
        properties: 'Duas Mãos, Simples, Munição (80/320), Recarregar, À Distância',
        weight: '2,3',
        damageDice: 'd8',
      },
      {
        id: 'espada-curta',
        name: 'Espada Curta',
        properties: 'Marcial, Precisão, Leve',
        weight: '0,9',
        damageDice: 'd6',
      },
    ],
  },
  {
    key: 'armaduras',
    label: 'Armaduras',
    category: 'armor',
    items: [
      { id: 'peitoral', name: 'Peitoral', properties: 'Média', weight: '9', armorClassBonus: '4' },
      { id: 'escudo', name: 'Escudo', properties: 'Escudo', weight: '2,7', armorClassBonus: '2' },
    ],
  },
  {
    key: 'consumiveis',
    label: 'Consumíveis',
    category: 'consumable',
    items: [
      {
        id: 'virote-de-besta',
        name: 'Virote de Besta',
        properties: 'Munição',
        weight: '0,03',
        defaultQuantity: '19',
      },
      { id: 'pocao-de-cura', name: 'Poção de Cura', weight: '0,2', defaultQuantity: '10' },
      { id: 'tocha', name: 'Tocha', weight: '0,5', defaultQuantity: '5' },
      { id: 'corda-de-canhamo', name: 'Corda de Cânhamo (15m)', weight: '4,5', defaultQuantity: '1' },
    ],
  },
  {
    key: 'itensGerais',
    label: 'Itens em Geral',
    category: 'general',
    items: [
      { id: 'vestes', name: 'Vestes', weight: '1,4', defaultQuantity: '1' },
      { id: 'saco-de-dormir', name: 'Saco de Dormir', weight: '3,2', defaultQuantity: '1' },
      { id: 'kit-de-refeicao', name: 'Kit de Refeição', weight: '0,5', defaultQuantity: '1' },
      { id: 'faca-pequena', name: 'Faca Pequena', weight: '0,5', defaultQuantity: '1' },
      { id: 'livro-de-magias', name: 'Livro de Magias', weight: '1,4', defaultQuantity: '1' },
    ],
  },
];
