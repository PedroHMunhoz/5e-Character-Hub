// Domain types for the bundled 5e reference database (db/schema.sql).
// Distinct from types/character.ts, which models a player's character
// sheet (e.g. CharacterClass there is just {id, name, level}, a reference
// into these tables rather than a full rules definition).

export type Entries = string[];

export interface Spell {
  id: number;
  name: string;
  source: string;
  srd: boolean;
  basicRules: boolean;
  level: number;
  school: string;
  castingTime: unknown;
  range: unknown;
  components: unknown;
  duration: unknown;
  ritual: boolean;
  concentration: boolean;
  entries: Entries;
  details: Record<string, unknown> | null;
  classes?: string[];
}

export interface CharacterClassDefinition {
  id: number;
  name: string;
  source: string;
  srd: boolean;
  basicRules: boolean;
  hitDieFaces: number | null;
  savingThrowProficiencies: string[];
  spellcastingAbility: string | null;
  casterProgression: string | null;
  subclassTitle: string | null;
}

export interface ClassFeature {
  id: number;
  classId: number;
  name: string;
  source: string;
  level: number;
  entries: Entries;
}

export interface SubclassDefinition {
  id: number;
  classId: number;
  name: string;
  shortName: string;
  source: string;
  srd: boolean;
}

export interface Race {
  id: number;
  parentRaceId: number | null;
  name: string;
  source: string;
  srd: boolean;
  basicRules: boolean;
  size: string[];
  speed: number | null;
  darkvision: number | null;
}

export interface RacialTrait {
  id: number;
  raceId: number;
  name: string;
  entries: Entries;
}

export interface Background {
  id: number;
  name: string;
  source: string;
  srd: boolean;
  basicRules: boolean;
  entries: Entries;
}

export interface Feat {
  id: number;
  name: string;
  source: string;
  srd: boolean;
  basicRules: boolean;
  entries: Entries;
}

export interface Item {
  id: number;
  name: string;
  source: string;
  srd: boolean;
  basicRules: boolean;
  type: string | null;
  rarity: string | null;
  isMagic: boolean;
  requiresAttunement: string | null;
  valueCp: number | null;
  weightLb: number | null;
  entries: Entries;
  details: Record<string, unknown> | null;
}
