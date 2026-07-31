export interface SpellItemDefinition {
  id: string;
  name: string;
  castingTime?: string;
  ritual?: boolean;
}

export interface SpellLevelSection {
  key: string;
  label: string;
  level: number;
  items: SpellItemDefinition[];
}

export const SPELL_LEVEL_SECTIONS: SpellLevelSection[] = [
  {
    key: 'truques',
    label: 'Truques',
    level: 0,
    items: [
      { id: 'fire-bolt', name: 'Raio de Fogo', castingTime: 'Ação' },
      { id: 'light', name: 'Luz', castingTime: 'Ação' },
      { id: 'mage-hand', name: 'Mão Mágica', castingTime: 'Ação' },
    ],
  },
  {
    key: 'nivel-1',
    label: 'Nível 1',
    level: 1,
    items: [
      { id: 'alarm', name: 'Alarme', castingTime: '1 Minuto', ritual: true },
      { id: 'burning-hands', name: 'Mãos Flamejantes', castingTime: 'Ação' },
      { id: 'cure-wounds', name: 'Curar Ferimentos', castingTime: 'Ação' },
      { id: 'find-familiar', name: 'Encontrar Familiar', castingTime: '1 Hora', ritual: true },
    ],
  },
  { key: 'nivel-2', label: 'Nível 2', level: 2, items: [] },
  { key: 'nivel-3', label: 'Nível 3', level: 3, items: [] },
  { key: 'nivel-4', label: 'Nível 4', level: 4, items: [] },
  { key: 'nivel-5', label: 'Nível 5', level: 5, items: [] },
  { key: 'nivel-6', label: 'Nível 6', level: 6, items: [] },
  { key: 'nivel-7', label: 'Nível 7', level: 7, items: [] },
  { key: 'nivel-8', label: 'Nível 8', level: 8, items: [] },
  { key: 'nivel-9', label: 'Nível 9', level: 9, items: [] },
];

export const SPELL_SLOT_MAX: Record<string, string> = {
  '1': '4',
  '2': '3',
  '3': '3',
  '4': '2',
  '5': '2',
  '6': '1',
  '7': '1',
  '8': '1',
  '9': '1',
};

export const MOCK_MAX_PREPARED_SPELLS = 7;
export const MOCK_SPELL_SAVE_DC = 15;
