import type { Biography } from '@/types/character';

export const BIOGRAPHY_SHORT_FIELDS: { key: keyof Biography; label: string }[] = [
  { key: 'age', label: 'Idade' },
  { key: 'height', label: 'Altura' },
  { key: 'weight', label: 'Peso' },
  { key: 'eyes', label: 'Cor dos Olhos' },
  { key: 'skin', label: 'Cor da Pele' },
  { key: 'hair', label: 'Cor do Cabelo' },
  { key: 'gender', label: 'Gênero' },
  { key: 'faith', label: 'Fé' },
  { key: 'alignment', label: 'Tendência' },
];

export const BIOGRAPHY_TEXTAREA_FIELDS: { key: keyof Biography; label: string }[] = [
  { key: 'personalityTraits', label: 'Traços de Personalidade' },
  { key: 'ideals', label: 'Ideais' },
  { key: 'bonds', label: 'Vínculos' },
  { key: 'flaws', label: 'Defeitos' },
];
