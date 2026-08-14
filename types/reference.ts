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
  materialText?: string;
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
  // Raw 5etools DSL JSON, deliberately left untyped here - the wizard's
  // data/wizard/equipment-resolver.ts (starting_equipment/tools) and the
  // skill-choice UI (starting_proficiencies.skills.choose) are what actually
  // parse these shapes; modeling the full DSL as TS types isn't worth it for
  // how messy/varied it is across entries.
  startingProficiencies: unknown;
  startingEquipment: unknown;
  multiclassing: unknown | null;
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

export interface SubclassFeature {
  id: number;
  subclassId: number;
  name: string;
  source: string;
  level: number;
  entries: Entries;
}

// A row from the `optional_features` table (Fighting Styles, Eldritch
// Invocations, Battle Master maneuvers, etc.) - only Fighting Styles are
// consumed today (data/queries/optional-features.ts). `englishName` mirrors
// Race.englishName's rationale: a stable key for rule lookups (e.g.
// CharacterSheet.fightingStyle) that doesn't shift with translation edits.
export interface OptionalFeatureDefinition {
  id: number;
  name: string;
  englishName: string;
  entries: Entries;
}

// Raw shape of a races.ability_bonuses JSON entry, e.g. `{"str":2,"cha":1}`
// or, when the race lets the player pick which abilities benefit (e.g.
// Half-Elf), `{"cha":2,"choose":{"from":["str","dex","con","int","wis"],"count":2}}`.
// Ability keys are kept as raw strings (not types/character.ts's AbilityKey)
// to preserve this module's documented independence from the character-sheet
// domain - the wizard maps these onto AbilityKey when resolving bonuses.
export interface RaceAbilityBonus {
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  choose?: { from: string[]; count: number };
}

export interface Race {
  id: number;
  parentRaceId: number | null;
  name: string;
  // Raw (unlocalized) name - a stable key across reimports (unlike `id`,
  // reassigned every `npm run db:import`) and across translation edits
  // (unlike `name`), used by the wizard to key rule lookups such as
  // constants/subrace-names.ts's compound display-name table and the
  // Dragonborn/Draconic Ancestry special case in app/wizard/index.tsx.
  englishName: string;
  source: string;
  srd: boolean;
  basicRules: boolean;
  size: string[];
  speed: number | null;
  darkvision: number | null;
  abilityBonuses: RaceAbilityBonus[] | null;
  // Raw JSON, same {name: true}/{any: count} shape as Background.
  // skillProficiencies / classes.starting_proficiencies.skills - only Elf,
  // Half-Elf and Half-Orc have this in the PHB. Resolved by
  // data/wizard/skill-proficiency-resolver.ts, reusing the same parsers as
  // backgrounds/classes (the DSL shape is identical).
  skillProficiencies: unknown;
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
  // Raw JSON, e.g. `[{"athletics":true,"intimidation":true}]` - always a
  // fixed grant for backgrounds (no `choose`, unlike a class's skill
  // proficiencies), confirmed by inspecting every PHB background.
  skillProficiencies: unknown;
  // Raw JSON, same {name: true}/{anyX: count} shape as
  // CharacterClassDefinition.startingProficiencies' toolProficiencies, e.g.
  // `[{"anyGamingSet":1,"thieves' tools":true}]` for the Criminal background.
  toolProficiencies: unknown;
  // Raw 5etools DSL JSON (same item-ref conventions as
  // CharacterClassDefinition.startingEquipment) - resolved by
  // data/wizard/equipment-resolver.ts.
  startingEquipment: unknown;
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
  // See categorizeItem in data/queries/items.ts - the `items` table's own
  // `type` doesn't distinguish consumable gear (Torch, Rations) from
  // durable gear (Backpack, Rope).
  category: 'consumable' | 'general';
}
