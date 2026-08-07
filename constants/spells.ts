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

// 5etools school codes -> pt-BR display label. Verified against
// translations/pt-BR/_raw-extracts/PHB.txt (spell list parentheticals).
export const SPELL_SCHOOL_LABELS: Record<string, string> = {
  A: 'Abjuração',
  C: 'Conjuração',
  D: 'Adivinhação',
  E: 'Encantamento',
  V: 'Evocação',
  I: 'Ilusão',
  N: 'Necromancia',
  T: 'Transmutação',
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

// 5etools castingTime.unit -> pt-BR label. Verified against "Tempo de
// Conjuração: 1 ação" / "1 minuto" / "10 minutos" / "1 hora" in
// translations/pt-BR/_raw-extracts/PHB.txt.
export const SPELL_CASTING_TIME_UNIT_LABELS: Record<string, { singular: string; plural: string }> = {
  action: { singular: 'Ação', plural: 'Ações' },
  bonus: { singular: 'Ação Bônus', plural: 'Ações Bônus' },
  reaction: { singular: 'Reação', plural: 'Reações' },
  round: { singular: 'Rodada', plural: 'Rodadas' },
  minute: { singular: 'Minuto', plural: 'Minutos' },
  hour: { singular: 'Hora', plural: 'Horas' },
  day: { singular: 'Dia', plural: 'Dias' },
};

// 5etools range.type (area shape) -> pt-BR label used when a spell's range
// originates from the caster, e.g. "Pessoal (cone de 18 metros)" / "Pessoal
// (9 metros de raio)" / "Pessoal (linha de 18 metros)" - verified against
// translations/pt-BR/_raw-extracts/PHB.txt. `hemisphere` is the one shape
// that takes both a leading word AND the trailing "de raio": "Pessoal
// (hemisfério de 3 metros de raio)".
export const SPELL_RANGE_SHAPE_LABELS: Record<string, { prefix?: string; suffix?: string }> = {
  cone: { prefix: 'cone de' },
  line: { prefix: 'linha de' },
  cube: { prefix: 'cubo de' },
  radius: { suffix: 'de raio' },
  sphere: { suffix: 'de raio' },
  hemisphere: { prefix: 'hemisfério de', suffix: 'de raio' },
};

// 5etools duration.type/unit -> pt-BR label. Verified against "Duração:
// Instantânea" / "Especial" / "8 horas" / "Concentração, até 1 minuto" in
// translations/pt-BR/_raw-extracts/PHB.txt.
export const SPELL_DURATION_TYPE_LABELS: Record<string, string> = {
  instant: 'Instantânea',
  permanent: 'Permanente',
  special: 'Especial',
};

export const SPELL_DURATION_UNIT_LABELS: Record<string, { singular: string; plural: string }> = {
  round: { singular: 'Rodada', plural: 'Rodadas' },
  minute: { singular: 'Minuto', plural: 'Minutos' },
  hour: { singular: 'Hora', plural: 'Horas' },
  day: { singular: 'Dia', plural: 'Dias' },
};
