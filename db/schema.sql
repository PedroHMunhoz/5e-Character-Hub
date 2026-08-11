-- D&D 5e reference database schema.
-- Source of truth for the tables produced by scripts/import-5e-data.ts.
-- See docs/data-schema.md for the narrative explanation of these choices.

PRAGMA foreign_keys = ON;

-- Lookup table for source book codes (e.g. "PHB" -> "Player's Handbook").
CREATE TABLE sources (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- Classes
-- ---------------------------------------------------------------------------

CREATE TABLE classes (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  basic_rules INTEGER NOT NULL DEFAULT 0,
  hit_die_faces INTEGER, -- NULL for a few TCE sidekick "classes" that have no hit die
  saving_throw_proficiencies TEXT NOT NULL, -- JSON array, e.g. ["int","wis"]
  spellcasting_ability TEXT,
  caster_progression TEXT, -- 'full' | 'half' | 'third' | 'pact' | NULL
  subclass_title TEXT,
  starting_proficiencies TEXT NOT NULL, -- JSON (armor/weapons/tools/skills)
  starting_equipment TEXT NOT NULL, -- JSON
  multiclassing TEXT, -- JSON
  UNIQUE (name, source)
);

CREATE TABLE class_features (
  id INTEGER PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  level INTEGER NOT NULL,
  entries TEXT NOT NULL -- JSON array of rich-text entries
);

CREATE TABLE subclasses (
  id INTEGER PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  -- JSON {"<character level>": ["spell name", ...]}, e.g. Cleric domain
  -- spells / Circle of Spores-Wildfire's bonus spells - always prepared,
  -- don't count against the prepared limit. Only populated for the
  -- unambiguous case (single additionalSpells entry, no sub-choice
  -- required) - see scripts/import-5e-data.mjs.
  additional_spells TEXT,
  UNIQUE (class_id, short_name, source)
);

CREATE TABLE subclass_features (
  id INTEGER PRIMARY KEY,
  subclass_id INTEGER NOT NULL REFERENCES subclasses(id),
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  level INTEGER NOT NULL,
  entries TEXT NOT NULL -- JSON array
);

-- ---------------------------------------------------------------------------
-- Races
-- ---------------------------------------------------------------------------

CREATE TABLE races (
  id INTEGER PRIMARY KEY,
  parent_race_id INTEGER REFERENCES races(id), -- NULL for base races, set for subraces
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  basic_rules INTEGER NOT NULL DEFAULT 0,
  size TEXT NOT NULL, -- JSON array, e.g. ["M"]
  speed INTEGER,
  ability_bonuses TEXT, -- JSON
  skill_proficiencies TEXT, -- JSON, same {name: true}/{any: count} shape as backgrounds.skill_proficiencies / classes.starting_proficiencies.skills - only Elf ({"perception":true}), Half-Elf ({"any":2}) and Half-Orc ({"intimidation":true}) have this in the PHB
  darkvision INTEGER,
  resistances TEXT, -- JSON array
  languages TEXT, -- JSON
  -- parent_race_id is part of the key: a handful of subrace names (e.g.
  -- dragonmark variants) legitimately repeat across different base races.
  UNIQUE (parent_race_id, name, source)
);

CREATE TABLE racial_traits (
  id INTEGER PRIMARY KEY,
  race_id INTEGER NOT NULL REFERENCES races(id),
  name TEXT NOT NULL,
  entries TEXT NOT NULL, -- JSON array
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- Backgrounds / Feats / Optional features
-- ---------------------------------------------------------------------------

CREATE TABLE backgrounds (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  basic_rules INTEGER NOT NULL DEFAULT 0,
  skill_proficiencies TEXT, -- JSON
  tool_proficiencies TEXT, -- JSON, same {name: true}/{anyX: count} shape as classes.starting_proficiencies.toolProficiencies
  language_proficiencies TEXT, -- JSON
  starting_equipment TEXT, -- JSON
  entries TEXT NOT NULL, -- JSON array
  UNIQUE (name, source)
);

CREATE TABLE feats (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  basic_rules INTEGER NOT NULL DEFAULT 0,
  prerequisite TEXT, -- JSON
  ability TEXT, -- JSON
  entries TEXT NOT NULL, -- JSON array
  UNIQUE (name, source)
);

CREATE TABLE optional_features (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  feature_type TEXT NOT NULL, -- JSON array, e.g. ["EI"] (Eldritch Invocation), ["FS:W"] (Fighting Style)
  prerequisite TEXT, -- JSON
  entries TEXT NOT NULL, -- JSON array
  UNIQUE (name, source)
);

-- ---------------------------------------------------------------------------
-- Items
-- ---------------------------------------------------------------------------

CREATE TABLE base_items (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  basic_rules INTEGER NOT NULL DEFAULT 0,
  type TEXT,
  value_cp INTEGER,
  weight_lb REAL,
  damage TEXT, -- JSON {dice, type}
  properties TEXT, -- JSON array
  entries TEXT, -- JSON array
  details TEXT, -- JSON catch-all for fields not modeled explicitly (ac, range, reload, ammoType, ...)
  UNIQUE (name, source)
);

CREATE TABLE items (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  basic_rules INTEGER NOT NULL DEFAULT 0,
  type TEXT,
  rarity TEXT,
  is_magic INTEGER NOT NULL DEFAULT 0,
  requires_attunement TEXT, -- NULL, or text describing attunement requirement
  value_cp INTEGER,
  weight_lb REAL,
  damage TEXT, -- JSON {dice, type}
  properties TEXT, -- JSON array
  entries TEXT NOT NULL, -- JSON array
  details TEXT, -- JSON catch-all for fields not modeled explicitly (ac, range, reload, ammoType, bonusSpellAttack, ...)
  UNIQUE (name, source)
);

CREATE TABLE magic_variants (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  rarity TEXT,
  requires TEXT, -- JSON, which base items this variant applies to
  entries TEXT NOT NULL, -- JSON array
  UNIQUE (name, source)
);

-- ---------------------------------------------------------------------------
-- Spells
-- ---------------------------------------------------------------------------

CREATE TABLE spells (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  basic_rules INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL,
  school TEXT NOT NULL,
  casting_time TEXT NOT NULL, -- JSON
  range TEXT NOT NULL, -- JSON
  components TEXT NOT NULL, -- JSON
  duration TEXT NOT NULL, -- JSON
  ritual INTEGER NOT NULL DEFAULT 0,
  concentration INTEGER NOT NULL DEFAULT 0,
  entries TEXT NOT NULL, -- JSON array
  details TEXT, -- JSON catch-all (damageInflict, savingThrow, scalingLevelDice, miscTags, areaTags, ...)
  UNIQUE (name, source)
);

-- Which classes can learn a given spell. Populated from
-- generated/gendata-spell-source-lookup.json during import (the one file
-- allow-listed from the otherwise-excluded generated/ folder, since it's
-- the actual class<->spell mapping, not DM tooling). A spell can appear
-- for multiple classes.
CREATE TABLE spell_classes (
  spell_id INTEGER NOT NULL REFERENCES spells(id),
  class_name TEXT NOT NULL,
  class_source TEXT NOT NULL,
  PRIMARY KEY (spell_id, class_name, class_source)
);

-- ---------------------------------------------------------------------------
-- Rules glossary (mostly SRD-covered)
-- ---------------------------------------------------------------------------

CREATE TABLE languages (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  basic_rules INTEGER NOT NULL DEFAULT 0,
  type TEXT, -- 'standard' | 'exotic' | ...
  script TEXT,
  entries TEXT, -- JSON array
  UNIQUE (name, source)
);

CREATE TABLE conditions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  basic_rules INTEGER NOT NULL DEFAULT 0,
  entries TEXT NOT NULL, -- JSON array
  UNIQUE (name, source)
);

CREATE TABLE skills (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  basic_rules INTEGER NOT NULL DEFAULT 0,
  ability TEXT NOT NULL,
  entries TEXT, -- JSON array
  UNIQUE (name, source)
);

CREATE TABLE actions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  basic_rules INTEGER NOT NULL DEFAULT 0,
  time TEXT, -- JSON
  entries TEXT NOT NULL, -- JSON array
  UNIQUE (name, source)
);

CREATE TABLE item_properties (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL, -- 5etools abbreviation, e.g. 'F', 'LD', '2H'
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  entries TEXT, -- JSON array; null for properties with no rules text (e.g. 'special')
  UNIQUE (code, source)
);

-- ---------------------------------------------------------------------------
-- Low priority / optional
-- ---------------------------------------------------------------------------

CREATE TABLE vehicles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  vehicle_type TEXT,
  entries TEXT, -- JSON array
  UNIQUE (name, source)
);

CREATE TABLE deities (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL REFERENCES sources(code),
  srd INTEGER NOT NULL DEFAULT 0,
  pantheon TEXT,
  alignment TEXT, -- JSON array
  domains TEXT, -- JSON array
  entries TEXT, -- JSON array
  -- the same deity name+source can appear under multiple pantheons
  -- (e.g. Tyr in both Forgotten Realms and Norse)
  UNIQUE (name, source, pantheon)
);

-- ---------------------------------------------------------------------------
-- Localization (schema prepared now, populated later — see docs/data-schema.md)
-- ---------------------------------------------------------------------------

CREATE TABLE translations (
  entity_type TEXT NOT NULL, -- e.g. 'spell', 'race', 'feat', ...
  entity_id INTEGER NOT NULL,
  locale TEXT NOT NULL, -- e.g. 'pt-BR'
  field TEXT NOT NULL, -- e.g. 'name', 'entries'
  value TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id, locale, field)
);

-- ---------------------------------------------------------------------------
-- Full-text search
-- ---------------------------------------------------------------------------

CREATE VIRTUAL TABLE content_fts USING fts5 (
  entity_type UNINDEXED,
  entity_id UNINDEXED,
  name,
  text
);
