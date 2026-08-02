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
}

export interface SavingThrow {
  proficient: boolean;
}

export interface Skill {
  proficient: boolean;
}

export interface HitPoints {
  max: string;
  current: string;
  temporary: string;
}

export interface HitDice {
  current: string;
  max: string;
}

export interface CharacterClass {
  id: string;
  name: string;
  level: string;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface Currency {
  pl: string;
  po: string;
  pp: string;
  pe: string;
  pc: string;
}

export interface InventoryItemState {
  quantity: string;
  equipped: boolean;
}

export interface FeatureItemState {
  usesCurrent: string;
}

export interface SpellItemState {
  prepared: boolean;
}

export interface Biography {
  alignment: string;
  eyes: string;
  height: string;
  faith: string;
  hair: string;
  weight: string;
  gender: string;
  skin: string;
  age: string;
  ideals: string;
  personalityTraits: string;
  bonds: string;
  flaws: string;
  notes: string;
}

export interface CharacterSheet {
  name: string;
  race: string;
  classes: CharacterClass[];
  inspiration: boolean;
  abilities: Record<AbilityKey, AbilityScore>;
  savingThrows: Record<AbilityKey, SavingThrow>;
  skills: Record<SkillKey, Skill>;
  speed: string;
  hitPoints: HitPoints;
  hitDice: HitDice;
  exhaustion: number;
  deathSaves: DeathSaves;
  currency: Currency;
  inventoryItems: Record<string, InventoryItemState>;
  features: Record<string, FeatureItemState>;
  spells: Record<string, SpellItemState>;
  spellSlotsUsed: Record<string, number>;
  biography: Biography;
}
