// Build-time only: overlays localized text on top of an already-imported
// dnd5e.db, from translations/pt-BR/ (never committed - see .gitignore and
// docs/data-schema.md). Safe to run against a db that has no translations
// yet, or where translations/ doesn't exist at all (no-op).
//
// Usage:
//   node scripts/import-translations.mjs [--db ./assets/data/dnd5e.db] [--translations ./translations/pt-BR] [--locale pt-BR]
//
// Translations are keyed by natural key (name|source, or a longer
// parent-chain key for child entities like class features), never by the
// numeric row id - ids are reassigned by scripts/import-5e-data.mjs on every
// run, so resolving by natural key is what lets this survive a re-import of
// the English dataset.

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { db: 'assets/data/dnd5e.db', translations: 'translations/pt-BR', locale: 'pt-BR' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--db') args.db = argv[++i];
    else if (a === '--translations') args.translations = argv[++i];
    else if (a === '--locale') args.locale = argv[++i];
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const dbPath = path.resolve(repoRoot, args.db);
const translationsDir = path.resolve(repoRoot, args.translations);

if (!fs.existsSync(translationsDir)) {
  console.log(`[translate] No translations found at ${translationsDir} - skipping.`);
  process.exit(0);
}
if (!fs.existsSync(dbPath)) {
  console.error(`[translate] Database not found at ${dbPath} - run "npm run db:import" first.`);
  process.exit(1);
}

const db = new DatabaseSync(dbPath);
const insertTranslation = db.prepare(
  'INSERT OR REPLACE INTO translations (entity_type, entity_id, locale, field, value) VALUES (?,?,?,?,?)'
);

// ---------------------------------------------------------------------------
// Entity resolvers: pipe-delimited natural key -> { entityType, id } in the
// just-imported English data. Return null (never throw) on no match, so one
// stale key doesn't abort the whole run - the source data may simply have
// changed since the translation was extracted.
// ---------------------------------------------------------------------------

function simpleResolver(table, entityType) {
  const stmt = db.prepare(`SELECT id FROM ${table} WHERE name = ? AND source = ?`);
  return ([name, source]) => {
    const row = stmt.get(name, source);
    return row ? { entityType, id: row.id } : null;
  };
}

const classIdStmt = db.prepare('SELECT id FROM classes WHERE name = ? AND source = ?');
const resolveClassId = (name, source) => classIdStmt.get(name, source)?.id ?? null;

const subclassIdStmt = db.prepare('SELECT id FROM subclasses WHERE class_id = ? AND short_name = ? AND source = ?');
function resolveSubclassId(className, classSource, shortName, subclassSource) {
  const classId = resolveClassId(className, classSource);
  if (classId == null) return null;
  return subclassIdStmt.get(classId, shortName, subclassSource)?.id ?? null;
}

// Races can nest more than one level deep in this dataset - e.g. base "Human"
// has a same-named child row carrying its ability score bonus, which in turn
// has a "Variant" child row. A handful of PHB races (Dragonborn, Half-Elf,
// Half-Orc, Human, Tiefling) have a subrace row that repeats the parent's own
// name, so resolving "Human" by name+source alone is ambiguous. Race keys are
// therefore an even-length chain of name/source pairs walked root-to-leaf:
// "Human|PHB" (base), "Human|PHB|Human|PHB" (the ability-bonus child),
// "Human|PHB|Human|PHB|Variant|PHB" (Variant Human).
const raceBaseIdStmt = db.prepare('SELECT id FROM races WHERE name = ? AND source = ? AND parent_race_id IS NULL');
const raceChildIdStmt = db.prepare('SELECT id FROM races WHERE name = ? AND source = ? AND parent_race_id = ?');
function resolveRaceChain(parts) {
  let id = null;
  for (let i = 0; i < parts.length; i += 2) {
    const [name, source] = [parts[i], parts[i + 1]];
    const row = id == null ? raceBaseIdStmt.get(name, source) : raceChildIdStmt.get(name, source, id);
    if (!row) return null;
    id = row.id;
  }
  return id;
}

const classFeatureIdStmt = db.prepare('SELECT id FROM class_features WHERE class_id = ? AND name = ? AND level = ?');
const subclassFeatureIdStmt = db.prepare('SELECT id FROM subclass_features WHERE subclass_id = ? AND name = ? AND level = ?');
const racialTraitIdStmt = db.prepare('SELECT id FROM racial_traits WHERE race_id = ? AND name = ?');
const deityByNameSourceStmt = db.prepare('SELECT id FROM deities WHERE name = ? AND source = ?');
const deityByPantheonStmt = db.prepare('SELECT id FROM deities WHERE name = ? AND source = ? AND pantheon = ?');

const RESOLVERS = {
  classes: simpleResolver('classes', 'class'),
  subclasses: ([className, classSource, shortName, subclassSource]) => {
    const id = resolveSubclassId(className, classSource, shortName, subclassSource);
    return id == null ? null : { entityType: 'subclass', id };
  },
  'class-features': ([className, classSource, featureName, level]) => {
    const classId = resolveClassId(className, classSource);
    if (classId == null) return null;
    const row = classFeatureIdStmt.get(classId, featureName, Number(level));
    return row ? { entityType: 'class_feature', id: row.id } : null;
  },
  'subclass-features': ([className, classSource, shortName, subclassSource, featureName, level]) => {
    const subclassId = resolveSubclassId(className, classSource, shortName, subclassSource);
    if (subclassId == null) return null;
    const row = subclassFeatureIdStmt.get(subclassId, featureName, Number(level));
    return row ? { entityType: 'subclass_feature', id: row.id } : null;
  },
  races: (parts) => {
    const id = resolveRaceChain(parts);
    return id == null ? null : { entityType: 'race', id };
  },
  'racial-traits': (parts) => {
    const traitName = parts[parts.length - 1];
    const raceId = resolveRaceChain(parts.slice(0, -1));
    if (raceId == null) return null;
    const row = racialTraitIdStmt.get(raceId, traitName);
    return row ? { entityType: 'racial_trait', id: row.id } : null;
  },
  backgrounds: simpleResolver('backgrounds', 'background'),
  feats: simpleResolver('feats', 'feat'),
  'optional-features': simpleResolver('optional_features', 'optional_feature'),
  'base-items': simpleResolver('base_items', 'base_item'),
  'item-properties': simpleResolver('item_properties', 'item_property'),
  items: simpleResolver('items', 'item'),
  'magic-variants': simpleResolver('magic_variants', 'magic_variant'),
  spells: simpleResolver('spells', 'spell'),
  languages: simpleResolver('languages', 'language'),
  conditions: simpleResolver('conditions', 'condition'),
  skills: simpleResolver('skills', 'skill'),
  actions: simpleResolver('actions', 'action'),
  vehicles: simpleResolver('vehicles', 'vehicle'),
  deities: ([name, source, pantheon]) => {
    const row = pantheon ? deityByPantheonStmt.get(name, source, pantheon) : deityByNameSourceStmt.get(name, source);
    return row ? { entityType: 'deity', id: row.id } : null;
  },
};

// ---------------------------------------------------------------------------
// Walk translations/<locale>/<BOOK>/<category>.json
// ---------------------------------------------------------------------------

let inserted = 0;
let unresolved = 0;

const bookDirs = fs
  .readdirSync(translationsDir, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('_'));

for (const book of bookDirs) {
  const bookDir = path.join(translationsDir, book.name);
  const files = fs.readdirSync(bookDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const category = file.replace(/\.json$/, '');
    const resolver = RESOLVERS[category];
    if (!resolver) {
      console.warn(`[translate] Unknown category "${category}" in ${book.name}/ - skipping.`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(path.join(bookDir, file), 'utf8'));
    for (const [key, fields] of Object.entries(data)) {
      const resolved = resolver(key.split('|'));
      if (!resolved) {
        console.warn(`[translate] Could not resolve ${category} key "${key}" (${book.name}) - source data may have changed.`);
        unresolved++;
        continue;
      }
      for (const [field, value] of Object.entries(fields)) {
        const serialized = Array.isArray(value) ? JSON.stringify(value) : String(value);
        insertTranslation.run(resolved.entityType, resolved.id, args.locale, field, serialized);
        inserted++;
      }
    }
  }
}

db.close();
console.log(`[translate] Inserted/updated ${inserted} translation rows (${args.locale}).`);
if (unresolved) console.log(`[translate] ${unresolved} keys could not be resolved - see warnings above.`);
