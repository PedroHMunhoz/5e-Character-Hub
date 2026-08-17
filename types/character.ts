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
  // Granted by a racial/class feature rather than owned gear - the UI must
  // not let the player unequip or remove it (e.g. Dragonborn's Breath
  // Weapon, see constants/draconic-ancestry.ts's BREATH_WEAPON_ITEM_ID).
  locked?: boolean;
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
  // Ranger-only at level 1 - see constants/favored-enemy.ts. A stable
  // creature-type key (or FAVORED_ENEMY_HUMANOID_KEY), not a DB row id.
  favoredEnemyType?: string | null;
  // Only set when favoredEnemyType === FAVORED_ENEMY_HUMANOID_KEY - two
  // distinct HumanoidRaceOption keys.
  favoredEnemyHumanoidRaces?: [string, string] | null;
  // Ranger-only at level 1 - see constants/favored-terrain.ts. Lives inside
  // the "Natural Explorer" class feature, not a feature of its own.
  favoredTerrainType?: string | null;
  // Ranger-only at level 1 - the language(s) granted alongside
  // favoredEnemyType (see constants/favored-enemy.ts). Slot 0 is the single
  // creature type's language (or the first humanoid race's); slot 1 is only
  // used for the second humanoid race, since each favored enemy grants its
  // own language independently. Each slot is a languages.id, the string
  // 'none' (FAVORED_ENEMY_NO_LANGUAGE - that type/race doesn't speak one),
  // or null. Absent entirely for characters created before this field
  // existed. Only merged into `languages` below when a slot is a real id.
  favoredEnemyLanguageIds?: [number | 'none' | null, number | 'none' | null];
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
