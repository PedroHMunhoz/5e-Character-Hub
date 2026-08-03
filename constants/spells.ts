export interface SpellLevelLabel {
  key: string;
  label: string;
  level: number;
}

export const SPELL_LEVEL_LABELS: SpellLevelLabel[] = [
  { key: 'truques', label: 'Truques', level: 0 },
  { key: 'nivel-1', label: 'Nível 1', level: 1 },
  { key: 'nivel-2', label: 'Nível 2', level: 2 },
  { key: 'nivel-3', label: 'Nível 3', level: 3 },
  { key: 'nivel-4', label: 'Nível 4', level: 4 },
  { key: 'nivel-5', label: 'Nível 5', level: 5 },
  { key: 'nivel-6', label: 'Nível 6', level: 6 },
  { key: 'nivel-7', label: 'Nível 7', level: 7 },
  { key: 'nivel-8', label: 'Nível 8', level: 8 },
  { key: 'nivel-9', label: 'Nível 9', level: 9 },
];

// 5etools school codes -> display label. Content stays in English until the
// localization pipeline (see docs/data-schema.md) exists.
export const SPELL_SCHOOL_LABELS: Record<string, string> = {
  A: 'Abjuration',
  C: 'Conjuration',
  D: 'Divination',
  E: 'Enchantment',
  V: 'Evocation',
  I: 'Illusion',
  N: 'Necromancy',
  T: 'Transmutation',
};

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

export const SPELL_LOADING_MESSAGES: string[] = [
  'Lendo o grimório...',
  'Rezando para os Deuses...',
  'Pedindo bênçãos da natureza...',
  'Decifrando runas arcanas...',
  'Consultando os planos exteriores...',
  'Memorizando fórmulas mágicas...',
];

export const MOCK_MAX_PREPARED_SPELLS = 7;
export const MOCK_SPELL_SAVE_DC = 15;
export const MOCK_SPELL_ATTACK_BONUS = '+2';
