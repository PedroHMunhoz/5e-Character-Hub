import type { Biography } from '@/types/character';

export const BIOGRAPHY_SHORT_FIELDS: { key: keyof Biography; label: string }[] = [
  { key: 'alignment', label: 'Tendência' },
  { key: 'eyes', label: 'Olhos' },
  { key: 'height', label: 'Altura' },
  { key: 'faith', label: 'Fé' },
  { key: 'hair', label: 'Cabelo' },
  { key: 'weight', label: 'Peso' },
  { key: 'gender', label: 'Gênero' },
  { key: 'skin', label: 'Pele' },
  { key: 'age', label: 'Idade' },
];

export const BIOGRAPHY_TEXTAREA_FIELDS: { key: keyof Biography; label: string }[] = [
  { key: 'personalityTraits', label: 'Traços de Personalidade' },
  { key: 'ideals', label: 'Ideais' },
  { key: 'bonds', label: 'Vínculos' },
  { key: 'flaws', label: 'Defeitos' },
];
