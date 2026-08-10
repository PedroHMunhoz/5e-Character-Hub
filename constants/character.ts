import type { AbilityKey, SkillKey } from '@/types/character';

export const ABILITIES: { key: AbilityKey; label: string; abbr: string }[] = [
  { key: 'str', label: 'Força', abbr: 'For' },
  { key: 'dex', label: 'Destreza', abbr: 'Des' },
  { key: 'con', label: 'Constituição', abbr: 'Con' },
  { key: 'int', label: 'Inteligência', abbr: 'Int' },
  { key: 'wis', label: 'Sabedoria', abbr: 'Sab' },
  { key: 'cha', label: 'Carisma', abbr: 'Car' },
];

export const ABILITIES_BY_KEY = Object.fromEntries(ABILITIES.map((ability) => [ability.key, ability])) as Record<
  AbilityKey,
  (typeof ABILITIES)[number]
>;

// Maps the English skill names used by the 5etools DSL (e.g.
// classes.starting_proficiencies.skills.choose.from,
// backgrounds.skill_proficiencies) onto this app's pt-BR SkillKey. Needed
// by the wizard's skill-choice step since the reference database's DSL
// content isn't translated the way display strings are (see data/queries/
// localize.ts) - it's a fixed set of English identifiers, not book prose.
export const SKILL_KEY_BY_ENGLISH_NAME: Record<string, SkillKey> = {
  acrobatics: 'acrobacia',
  'animal handling': 'lidarComAnimais',
  arcana: 'arcanismo',
  athletics: 'atletismo',
  deception: 'blefar',
  history: 'historia',
  insight: 'intuicao',
  intimidation: 'intimidacao',
  investigation: 'investigacao',
  medicine: 'medicina',
  nature: 'natureza',
  perception: 'percepcao',
  performance: 'atuacao',
  persuasion: 'persuasao',
  religion: 'religiao',
  'sleight of hand': 'prestidigitacao',
  stealth: 'furtividade',
  survival: 'sobrevivencia',
};

export const SKILLS: { key: SkillKey; label: string; ability: AbilityKey }[] = [
  { key: 'acrobacia', label: 'Acrobacia', ability: 'dex' },
  { key: 'arcanismo', label: 'Arcanismo', ability: 'int' },
  { key: 'atletismo', label: 'Atletismo', ability: 'str' },
  { key: 'atuacao', label: 'Atuação', ability: 'cha' },
  { key: 'blefar', label: 'Blefar', ability: 'cha' },
  { key: 'furtividade', label: 'Furtividade', ability: 'dex' },
  { key: 'historia', label: 'História', ability: 'int' },
  { key: 'intimidacao', label: 'Intimidação', ability: 'cha' },
  { key: 'intuicao', label: 'Intuição', ability: 'wis' },
  { key: 'investigacao', label: 'Investigação', ability: 'int' },
  { key: 'lidarComAnimais', label: 'Lidar com Animais', ability: 'wis' },
  { key: 'medicina', label: 'Medicina', ability: 'wis' },
  { key: 'natureza', label: 'Natureza', ability: 'int' },
  { key: 'percepcao', label: 'Percepção', ability: 'wis' },
  { key: 'persuasao', label: 'Persuasão', ability: 'cha' },
  { key: 'prestidigitacao', label: 'Prestidigitação', ability: 'dex' },
  { key: 'religiao', label: 'Religião', ability: 'int' },
  { key: 'sobrevivencia', label: 'Sobrevivência', ability: 'wis' },
];
