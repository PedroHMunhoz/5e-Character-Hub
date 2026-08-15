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
  // Kept apart from any racial bonus so the wizard-assigned bonus survives
  // independently of further edits to the base score, and so a future
  // "base + bônus racial" breakdown UI can be built without re-deriving it.
  base: string;
  racialBonus: number;
}

export interface SavingThrow {
  proficient: boolean;
}

export interface Skill {
  proficient: boolean;
  // Doubles the proficiency bonus for this skill (e.g. Rogue's "Expertise"
  // class feature at level 1). Only meaningful when `proficient` is true.
  expertise: boolean;
}

export interface ToolState {
  proficient: boolean;
  // Doubles the proficiency bonus for this tool (e.g. Rogue's "Expertise"
  // class feature at level 1, swapping one of the two skill picks for
  // thieves' tools). Only meaningful when `proficient` is true.
  expertise: boolean;
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
  // Reference into the classes/subclasses tables (db/schema.sql) - set by
  // the creation wizard. `name` stays the denormalized display string
  // (already how every existing sheet component reads it) so this addition
  // doesn't ripple into unrelated display code.
  classId?: number;
  subclassId?: number | null;
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

export type WeaponSlot = 'main' | 'off' | 'twoHanded';
export type ArmorSlot = 'body' | 'shield';

export interface InventoryItemState {
  // Catalog reference (itemKey() - see data/queries/equipment-lookup.ts).
  // The dictionary key this state lives under (CharacterSheet.inventoryItems)
  // is an opaque per-instance id instead, so two physical copies of the same
  // catalog item (e.g. 2x Dagger) can each carry their own weaponSlot/
  // armorSlot and be equipped independently (dual-wield).
  itemId: string;
  quantity: string;
  weaponSlot?: WeaponSlot;
  armorSlot?: ArmorSlot;
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

export interface CharacterSummary {
  id: string;
  name: string;
  race: string;
  classes: CharacterClass[];
}

export interface CharacterSheet {
  id: string;
  name: string;
  // Reference into the races table - set by the creation wizard. `race`
  // stays the denormalized display string (race name, or subrace name when
  // one was chosen - already how ClassLevels/character-sheet.tsx read it).
  raceId?: number;
  subraceId?: number | null;
  race: string;
  // Dragonborn-only - see constants/draconic-ancestry.ts.
  draconicAncestry?: string | null;
  // Fighter-only at level 1 (PHB p.72) - the raw (English) optional_features
  // name, e.g. "Archery", not the translated display name or the row id.
  // Kept stable across reimports/translation edits so rule logic (armor
  // class, weapon attack/damage bonuses) can key off it directly instead of
  // round-tripping through the database. See data/wizard/assemble-character.ts.
  fightingStyle?: string | null;
  backgroundId?: number;
  classes: CharacterClass[];
  inspiration: boolean;
  abilities: Record<AbilityKey, AbilityScore>;
  savingThrows: Record<AbilityKey, SavingThrow>;
  skills: Record<SkillKey, Skill>;
  // Ids into the reference languages table (data/queries/languages.ts) -
  // race's fixed grant + race/background's anyStandard picks + any class
  // feature that grants a language outright (Druidic, Thieves' Cant). No
  // proficient/expertise state like Skill/ToolState - a language is just
  // known or not. See data/wizard/assemble-character.ts.
  languages: number[];
  speed: string;
  hitPoints: HitPoints;
  hitDice: HitDice;
  exhaustion: number;
  deathSaves: DeathSaves;
  currency: Currency;
  inventoryItems: Record<string, InventoryItemState>;
  tools: Record<string, ToolState>;
  features: Record<string, FeatureItemState>;
  spells: Record<string, SpellItemState>;
  spellSlotsUsed: Record<string, number>;
  biography: Biography;
}
