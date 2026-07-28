export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type SkillKey =
  | 'acrobacia'
  | 'arcanismo'
  | 'atletismo'
  | 'atuacao'
  | 'blefar'
  | 'furtividade'
  | 'historia'
  | 'intimidacao'
  | 'intuicao'
  | 'investigacao'
  | 'lidarComAnimais'
  | 'medicina'
  | 'natureza'
  | 'percepcao'
  | 'persuasao'
  | 'prestidigitacao'
  | 'religiao'
  | 'sobrevivencia';

export interface AbilityScore {
  score: string;
  modifier: string;
}

export interface SavingThrow {
  proficient: boolean;
  modifier: string;
}

export interface Skill {
  proficient: boolean;
  modifier: string;
}

export interface HitPoints {
  max: string;
  current: string;
  temporary: string;
}

export interface CharacterSheet {
  proficiencyBonus: string;
  abilities: Record<AbilityKey, AbilityScore>;
  savingThrows: Record<AbilityKey, SavingThrow>;
  skills: Record<SkillKey, Skill>;
  passivePerception: string;
  passiveInsight: string;
  armorClass: string;
  initiative: string;
  speed: string;
  hitPoints: HitPoints;
}
