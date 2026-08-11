// Build-time only: transforms a 5etools-format data dump into the app's
// internal SQLite schema (db/schema.sql). Never runs on-device.
//
// Usage:
//   node scripts/import-5e-data.mjs --source ./5e-2014-data --out ./assets/data/dnd5e.db [--srd-only]
//
// Uses the built-in node:sqlite module (stable, no extra dependency needed).

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { source: '5e-2014-data', out: 'assets/data/dnd5e.db', srdOnly: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--source') args.source = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--srd-only') args.srdOnly = true;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const sourceDir = path.resolve(repoRoot, args.source);
const outPath = path.resolve(repoRoot, args.out);

if (!fs.existsSync(sourceDir)) {
  console.error(`Source folder not found: ${sourceDir}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
for (const suffix of ['', '-wal', '-shm']) {
  const p = outPath + suffix;
  if (fs.existsSync(p)) fs.rmSync(p);
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(sourceDir, relPath), 'utf8'));
}

function bit(v) {
  return v ? 1 : 0;
}

function json(v) {
  return v === undefined ? null : JSON.stringify(v);
}

// Only relevant when --srd-only is set: excludes anything not flagged as
// part of the open-licensed SRD 5.1 (basic_rules content is stored but not
// used as a filter here — it isn't OGL-licensed, just free-to-read).
function isIncluded(entity) {
  return !args.srdOnly || !!entity.srd;
}

// Converts 5etools' inline tag DSL ({@damage 1d6}, {@item longsword|phb},
// {@condition prone}) into plain readable text.
function stripTags(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/\{@(\w+)\s+([^{}]+)\}/g, (_, tag, body) => {
    const parts = body.split('|');
    if (tag === 'hit') return /^[+-]/.test(parts[0]) ? parts[0] : `+${parts[0]}`;
    if (tag === 'dc') return `DC ${parts[0]}`;
    return parts.length >= 3 ? parts[2] : parts[0];
  });
}

// Flattens 5etools' nested "entries" structure (strings, {name, entries},
// {items: [...]}, tables, ...) into a simple array of plain-text paragraphs.
// This is a deliberate simplification: we don't preserve the original
// renderer structure, the app just displays each string as a paragraph.
function flattenEntries(entries, out = []) {
  if (entries == null) return out;
  if (typeof entries === 'string') {
    out.push(stripTags(entries));
    return out;
  }
  if (Array.isArray(entries)) {
    for (const e of entries) flattenEntries(e, out);
    return out;
  }
  if (typeof entries === 'object') {
    if (entries.name) out.push(stripTags(String(entries.name)) + (entries.entries || entries.items ? ':' : ''));
    if (entries.entries) flattenEntries(entries.entries, out);
    if (entries.items) flattenEntries(entries.items, out);
  }
  return out;
}

// Manual corrections/fill-ins for base_items.weight_lb, verified against the
// printed sourcebooks. Only entries that actually need fixing live here -
// see db/overrides/base-item-weights.json.
const weightOverridesPath = path.join(repoRoot, 'db', 'overrides', 'base-item-weights.json');
const weightOverrides = fs.existsSync(weightOverridesPath)
  ? JSON.parse(fs.readFileSync(weightOverridesPath, 'utf8'))
  : {};
function overrideWeight(name, source, fallback) {
  const key = `${name}|${source}`;
  return Object.prototype.hasOwnProperty.call(weightOverrides, key) ? weightOverrides[key] : fallback;
}

// Manual corrections for classes/backgrounds.starting_equipment entries
// that reference the wrong catalog item upstream - e.g. Outlander's gear
// list says "staff|phb", which 5etools resolves to the Arcane Focus
// "Staff" (base_items id 106, "Cajado") instead of the mundane weapon
// "Quarterstaff" (id 82, "Bordão") the printed pt-BR PHB actually lists.
// See db/overrides/equipment-ref-fixes.json for the full list.
const equipmentRefFixesPath = path.join(repoRoot, 'db', 'overrides', 'equipment-ref-fixes.json');
const equipmentRefFixes = fs.existsSync(equipmentRefFixesPath)
  ? JSON.parse(fs.readFileSync(equipmentRefFixesPath, 'utf8'))
  : {};
function applyEquipmentRefFixes(startingEquipment, name, source) {
  const fixes = equipmentRefFixes[`${name}|${source}`];
  if (!fixes || startingEquipment == null) return startingEquipment;
  // Text-level replace on the serialized JSON (via JSON.stringify of each
  // ref) rather than a deep walk - a ref can appear as a bare string
  // ("staff|phb") or nested inside an {item: "staff|phb", ...} object, and
  // stringify-then-replace covers both without duplicating the DSL's shape
  // here.
  const text = Object.entries(fixes).reduce(
    (json, [from, to]) => json.split(JSON.stringify(from)).join(JSON.stringify(to)),
    JSON.stringify(startingEquipment)
  );
  return JSON.parse(text);
}

const db = new DatabaseSync(outPath);
db.exec(fs.readFileSync(path.join(repoRoot, 'db', 'schema.sql'), 'utf8'));

const stats = {};
function bump(table) {
  stats[table] = (stats[table] || 0) + 1;
}

function runSection(label, fn) {
  try {
    fn();
  } catch (e) {
    console.error(`[import] Failed section "${label}": ${e.message}`);
  }
}

const insertSourceStmt = db.prepare('INSERT OR IGNORE INTO sources (code, name) VALUES (?, ?)');
const knownSources = new Set();
function ensureSource(code, name) {
  const key = code || 'UNKNOWN';
  if (!knownSources.has(key)) {
    knownSources.add(key);
    insertSourceStmt.run(key, name || key);
  }
  return key;
}

const insertFtsStmt = db.prepare('INSERT INTO content_fts (entity_type, entity_id, name, text) VALUES (?, ?, ?, ?)');
function addToFts(entityType, entityId, name, entriesFlat) {
  insertFtsStmt.run(entityType, entityId, name, entriesFlat.join('\n'));
}

db.exec('BEGIN');

runSection('sources', () => {
  const books = readJson('books.json');
  for (const b of books.book || []) ensureSource(b.source, b.name);
});

// ---------------------------------------------------------------------------
// Classes, subclasses, and their features
// ---------------------------------------------------------------------------

const classMap = new Map(); // `${name}|${source}` -> id
const subclassMap = new Map(); // `${className}|${classSource}|${shortName}|${subclassSource}` -> id

runSection('classes', () => {
  const insertClass = db.prepare(
    `INSERT INTO classes (name, source, srd, basic_rules, hit_die_faces, saving_throw_proficiencies, spellcasting_ability, caster_progression, subclass_title, starting_proficiencies, starting_equipment, multiclassing)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  const insertClassFeature = db.prepare(
    'INSERT INTO class_features (class_id, name, source, level, entries) VALUES (?,?,?,?,?)'
  );
  const insertSubclass = db.prepare(
    'INSERT INTO subclasses (class_id, name, short_name, source, srd) VALUES (?,?,?,?,?)'
  );
  const insertSubclassFeature = db.prepare(
    'INSERT INTO subclass_features (subclass_id, name, source, level, entries) VALUES (?,?,?,?,?)'
  );

  const classDir = path.join(sourceDir, 'class');
  if (!fs.existsSync(classDir)) return;
  const files = fs.readdirSync(classDir).filter((f) => /^class-.*\.json$/.test(f));

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(classDir, file), 'utf8'));

    for (const c of data.class || []) {
      if (!isIncluded(c)) continue;
      ensureSource(c.source);
      const info = insertClass.run(
        c.name,
        c.source,
        bit(c.srd),
        bit(c.basicRules),
        c.hd?.faces ?? null,
        json(c.proficiency ?? []),
        c.spellcastingAbility ?? null,
        c.casterProgression ?? null,
        c.subclassTitle ?? null,
        json(c.startingProficiencies ?? null),
        json(applyEquipmentRefFixes(c.startingEquipment, c.name, c.source) ?? null),
        json(c.multiclassing ?? null)
      );
      classMap.set(`${c.name}|${c.source}`, info.lastInsertRowid);
      bump('classes');
      addToFts('class', info.lastInsertRowid, c.name, [c.name]);
    }

    for (const cf of data.classFeature || []) {
      const classId = classMap.get(`${cf.className}|${cf.classSource}`);
      if (classId == null) continue;
      if (args.srdOnly && !cf.srd) continue;
      const flat = flattenEntries(cf.entries);
      insertClassFeature.run(classId, cf.name, cf.source, cf.level ?? 0, json(flat));
      bump('class_features');
    }

    for (const sc of data.subclass || []) {
      if (!isIncluded(sc)) continue;
      const classId = classMap.get(`${sc.className}|${sc.classSource}`);
      if (classId == null) continue;
      ensureSource(sc.source);
      const info = insertSubclass.run(classId, sc.name, sc.shortName, sc.source, bit(sc.srd));
      subclassMap.set(`${sc.className}|${sc.classSource}|${sc.shortName}|${sc.source}`, info.lastInsertRowid);
      bump('subclasses');
      addToFts('subclass', info.lastInsertRowid, sc.name, [sc.name]);
    }

    for (const scf of data.subclassFeature || []) {
      const key = `${scf.className}|${scf.classSource}|${scf.subclassShortName}|${scf.subclassSource}`;
      const subclassId = subclassMap.get(key);
      if (subclassId == null) continue;
      const flat = flattenEntries(scf.entries);
      insertSubclassFeature.run(subclassId, scf.name, scf.source, scf.level ?? 0, json(flat));
      bump('subclass_features');
    }
  }
});

// ---------------------------------------------------------------------------
// Races and subraces
// ---------------------------------------------------------------------------

const raceMap = new Map(); // `${name}|${source}` -> id

runSection('races', () => {
  const insertRace = db.prepare(
    `INSERT INTO races (parent_race_id, name, source, srd, basic_rules, size, speed, ability_bonuses, skill_proficiencies, darkvision, resistances, languages)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  const insertRacialTrait = db.prepare(
    'INSERT INTO racial_traits (race_id, name, entries, sort_order) VALUES (?,?,?,?)'
  );
  const updateRaceAbilityBonuses = db.prepare('UPDATE races SET ability_bonuses = ? WHERE id = ?');
  const updateRaceSkillProficiencies = db.prepare('UPDATE races SET skill_proficiencies = ? WHERE id = ?');

  function insertRaceRow(r, parentId, { registerInMap = parentId == null } = {}) {
    ensureSource(r.source);
    const speed =
      typeof r.speed === 'number' ? r.speed : r.speed && typeof r.speed === 'object' ? (r.speed.walk ?? null) : null;
    const info = insertRace.run(
      parentId ?? null,
      r.name,
      r.source,
      bit(r.srd),
      bit(r.basicRules),
      json(r.size ?? []),
      speed,
      json(r.ability ?? null),
      json(r.skillProficiencies ?? null),
      r.darkvision ?? null,
      json(r.resist ?? null),
      json(r.languageProficiencies ?? null)
    );
    const id = info.lastInsertRowid;
    // Only base races register themselves for subrace lookup. Subraces used
    // to register too, which meant a subrace sharing its parent's raw name
    // (see the Human handling below) could shadow the real parent in
    // raceMap for whatever got processed next under that same name -
    // confirmed live: PHB Human's "Variant" subrace ended up parented under
    // the standard-Human subrace instead of the base Human race because of
    // this.
    if (registerInMap) raceMap.set(`${r.name}|${r.source}`, id);
    bump('races');

    const traitEntries = Array.isArray(r.entries) ? r.entries : [];
    let order = 0;
    for (const t of traitEntries) {
      const name = t && typeof t === 'object' && t.name ? t.name : 'Trait';
      insertRacialTrait.run(id, name, json(flattenEntries(t)), order++);
    }
    addToFts('race', id, r.name, flattenEntries(r.entries).concat([r.name]));
    return id;
  }

  const raceData = readJson('races.json');
  // Entries using 5etools' "_copy" (copy-and-modify another entry) mechanism
  // are skipped: resolving that merge is out of scope for this first pass,
  // and it affects a small minority of races (mostly late-sourcebook variants).
  for (const r of raceData.race || []) {
    if (!isIncluded(r) || r._copy) continue;
    insertRaceRow(r, null);
  }
  for (const s of raceData.subrace || []) {
    if (!isIncluded(s) || s._copy) continue;
    // Some "subrace" entries are 5etools plumbing, not real subraces: no
    // `name` (falls back to the parent race's own name below) and no
    // `ability` data either. Confirmed live against 5e-2014-data/races.json:
    // PHB Dragonborn's only "subrace" entry is actually an unexpanded
    // `_versions`/`_implementations` template that generates the 10
    // Draconic Ancestry variants (handled separately in the wizard - see
    // constants/draconic-ancestry.ts, not worth expanding this generic
    // 5etools templating mechanism for the one race that needs it), and
    // Half-Elf/Half-Orc/Tiefling each have a completely empty PHB stub
    // subrace. None of the four carry any usable data, so they're dropped
    // instead of imported as junk rows with no name and no bonuses.
    if (!s.name && !s.ability) continue;

    const parentId = raceMap.get(`${s.raceName}|${s.raceSource}`);
    if (parentId == null) continue;

    const resolvedName = s.name || s.raceName;
    if (resolvedName === s.raceName && s.ability) {
      // A "subrace" with no distinct name of its own but real ability data
      // - the only PHB case is Human (5etools models "+1 to all six
      // abilities" this way instead of putting it directly on the race
      // entry). Fold the bonus into the parent race itself rather than
      // inserting a same-named "subrace" nobody would think to open, so
      // Human ends up structured just like every other no-subrace PHB race
      // (Dragonborn, Half-Elf, Half-Orc, Tiefling).
      updateRaceAbilityBonuses.run(json(s.ability), parentId);
      if (s.skillProficiencies) updateRaceSkillProficiencies.run(json(s.skillProficiencies), parentId);
      continue;
    }

    insertRaceRow({ ...s, name: resolvedName }, parentId, { registerInMap: false });
  }
});

// ---------------------------------------------------------------------------
// Backgrounds, feats, optional features
// ---------------------------------------------------------------------------

runSection('backgrounds', () => {
  const insertBackground = db.prepare(
    `INSERT INTO backgrounds (name, source, srd, basic_rules, skill_proficiencies, tool_proficiencies, language_proficiencies, starting_equipment, entries)
     VALUES (?,?,?,?,?,?,?,?,?)`
  );
  const data = readJson('backgrounds.json');
  for (const b of data.background || []) {
    if (!isIncluded(b) || b._copy) continue;
    ensureSource(b.source);
    const flat = flattenEntries(b.entries);
    const info = insertBackground.run(
      b.name,
      b.source,
      bit(b.srd),
      bit(b.basicRules),
      json(b.skillProficiencies ?? null),
      json(b.toolProficiencies ?? null),
      json(b.languageProficiencies ?? null),
      json(applyEquipmentRefFixes(b.startingEquipment, b.name, b.source) ?? null),
      json(flat)
    );
    bump('backgrounds');
    addToFts('background', info.lastInsertRowid, b.name, flat);
  }
});

runSection('feats', () => {
  const insertFeat = db.prepare(
    'INSERT INTO feats (name, source, srd, basic_rules, prerequisite, ability, entries) VALUES (?,?,?,?,?,?,?)'
  );
  const data = readJson('feats.json');
  for (const f of data.feat || []) {
    if (!isIncluded(f) || f._copy) continue;
    ensureSource(f.source);
    const flat = flattenEntries(f.entries);
    const info = insertFeat.run(
      f.name,
      f.source,
      bit(f.srd),
      bit(f.basicRules),
      json(f.prerequisite ?? null),
      json(f.ability ?? null),
      json(flat)
    );
    bump('feats');
    addToFts('feat', info.lastInsertRowid, f.name, flat);
  }
});

runSection('optional_features', () => {
  const insertOptFeature = db.prepare(
    'INSERT INTO optional_features (name, source, srd, feature_type, prerequisite, entries) VALUES (?,?,?,?,?,?)'
  );
  const data = readJson('optionalfeatures.json');
  for (const o of data.optionalfeature || []) {
    if (!isIncluded(o) || o._copy) continue;
    ensureSource(o.source);
    const flat = flattenEntries(o.entries);
    const info = insertOptFeature.run(
      o.name,
      o.source,
      bit(o.srd),
      json(o.featureType ?? []),
      json(o.prerequisite ?? null),
      json(flat)
    );
    bump('optional_features');
    addToFts('optional_feature', info.lastInsertRowid, o.name, flat);
  }
});

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

function itemDamage(i) {
  if (!i.dmg1 && !i.dmg2 && i.dmgType == null) return null;
  return { dmg1: i.dmg1 ?? null, dmg2: i.dmg2 ?? null, dmgType: i.dmgType ?? null };
}

function extraFields(i, modeled) {
  const rest = {};
  for (const k of Object.keys(i)) if (!modeled.has(k)) rest[k] = i[k];
  return Object.keys(rest).length ? rest : null;
}

const BASE_ITEM_MODELED = new Set([
  'name',
  'source',
  'page',
  'srd',
  'basicRules',
  'type',
  'value',
  'weight',
  'dmg1',
  'dmg2',
  'dmgType',
  'property',
  'entries',
  'otherSources',
  'reprintedAs',
  'hasFluff',
  'hasFluffImages',
  'additionalSources',
]);

runSection('base_items', () => {
  const insertBaseItem = db.prepare(
    `INSERT INTO base_items (name, source, srd, basic_rules, type, value_cp, weight_lb, damage, properties, entries, details)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  );
  const data = readJson('items-base.json');
  for (const i of data.baseitem || []) {
    if (!isIncluded(i) || i._copy) continue;
    ensureSource(i.source);
    const flat = flattenEntries(i.entries);
    const info = insertBaseItem.run(
      i.name,
      i.source,
      bit(i.srd),
      bit(i.basicRules),
      i.type ?? null,
      i.value ?? null,
      overrideWeight(i.name, i.source, i.weight ?? null),
      json(itemDamage(i)),
      json(i.property ?? null),
      flat.length ? json(flat) : null,
      json(extraFields(i, BASE_ITEM_MODELED))
    );
    bump('base_items');
    addToFts('base_item', info.lastInsertRowid, i.name, flat);
  }
});

const ITEM_MODELED = new Set([
  'name',
  'source',
  'page',
  'srd',
  'basicRules',
  'type',
  'rarity',
  'value',
  'weight',
  'dmg1',
  'dmg2',
  'dmgType',
  'property',
  'entries',
  'reqAttune',
  'wondrous',
  'otherSources',
  'reprintedAs',
  'hasFluff',
  'hasFluffImages',
  'additionalSources',
]);

runSection('items', () => {
  const insertItem = db.prepare(
    `INSERT INTO items (name, source, srd, basic_rules, type, rarity, is_magic, requires_attunement, value_cp, weight_lb, damage, properties, entries, details)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  const data = readJson('items.json');
  for (const i of data.item || []) {
    if (!isIncluded(i) || i._copy) continue;
    ensureSource(i.source);
    const flat = flattenEntries(i.entries);
    const isMagic = i.rarity && i.rarity !== 'none' && i.rarity !== 'unknown' ? 1 : 0;
    const info = insertItem.run(
      i.name,
      i.source,
      bit(i.srd),
      bit(i.basicRules),
      i.type ?? null,
      i.rarity ?? null,
      isMagic,
      i.reqAttune == null ? null : String(i.reqAttune),
      i.value ?? null,
      i.weight ?? null,
      json(itemDamage(i)),
      json(i.property ?? null),
      json(flat),
      json(extraFields(i, ITEM_MODELED))
    );
    bump('items');
    addToFts('item', info.lastInsertRowid, i.name, flat);
  }

  // Items printed in a localized sourcebook's table with no equivalent row in
  // the English 5etools dataset (ex: pt-BR PHB's "Sinete"/"Sino" holy symbol
  // variants - see translations/pt-BR/DUVIDAS.md, "PHB — Itens Gerais"). Their
  // `name` is already the localized text (there's no English name to translate
  // from), so these skip the translations overlay entirely.
  const customItemsPath = path.join(repoRoot, 'db', 'overrides', 'custom-items.json');
  if (fs.existsSync(customItemsPath)) {
    const customItems = JSON.parse(fs.readFileSync(customItemsPath, 'utf8'));
    for (const i of customItems) {
      ensureSource(i.source);
      const info = insertItem.run(
        i.name,
        i.source,
        0,
        0,
        i.type ?? null,
        i.rarity ?? null,
        0,
        null,
        i.value ?? null,
        i.weight ?? null,
        null,
        null,
        json(i.entries ?? []),
        null
      );
      bump('items');
      addToFts('item', info.lastInsertRowid, i.name, i.entries ?? []);
    }
  }
});

runSection('magic_variants', () => {
  const insertMagicVariant = db.prepare(
    'INSERT INTO magic_variants (name, source, srd, rarity, requires, entries) VALUES (?,?,?,?,?,?)'
  );
  const data = readJson('magicvariants.json');
  for (const m of data.magicvariant || []) {
    // Magic variants (e.g. "+1 Weapon") store their real source/srd/rarity/entries
    // under `inherits`, not at the top level - the top level is just name + requires.
    const src = m.inherits ?? m;
    if (!isIncluded(src) || m._copy) continue;
    ensureSource(src.source);
    const flat = flattenEntries(src.entries);
    const info = insertMagicVariant.run(
      m.name,
      src.source,
      bit(src.srd),
      src.rarity ?? null,
      json(m.requires ?? null),
      json(flat)
    );
    bump('magic_variants');
    addToFts('magic_variant', info.lastInsertRowid, m.name, flat);
  }
});

// ---------------------------------------------------------------------------
// Spells + spell/class mapping
// ---------------------------------------------------------------------------

const spellMap = new Map(); // `${nameLower}|${sourceUpper}` -> id

const SPELL_MODELED = new Set([
  'name',
  'source',
  'page',
  'srd',
  'basicRules',
  'level',
  'school',
  'time',
  'range',
  'components',
  'duration',
  'entries',
  'entriesHigherLevel',
  'classes',
  'meta',
  'otherSources',
  'hasFluff',
  'hasFluffImages',
]);

runSection('spells', () => {
  const insertSpell = db.prepare(
    `INSERT INTO spells (name, source, srd, basic_rules, level, school, casting_time, range, components, duration, ritual, concentration, entries, details)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  const spellsDir = path.join(sourceDir, 'spells');
  if (!fs.existsSync(spellsDir)) return;
  const files = fs.readdirSync(spellsDir).filter((f) => /^spells-.*\.json$/.test(f));

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(spellsDir, file), 'utf8'));
    for (const s of data.spell || []) {
      if (!isIncluded(s) || s._copy) continue;
      ensureSource(s.source);
      const concentration = Array.isArray(s.duration) && s.duration.some((d) => d?.concentration) ? 1 : 0;
      const flat = flattenEntries(s.entries).concat(flattenEntries(s.entriesHigherLevel));
      const info = insertSpell.run(
        s.name,
        s.source,
        bit(s.srd),
        bit(s.basicRules),
        s.level ?? 0,
        s.school ?? null,
        json(s.time ?? null),
        json(s.range ?? null),
        json(s.components ?? null),
        json(s.duration ?? null),
        bit(s.meta?.ritual),
        concentration,
        json(flat),
        json(extraFields(s, SPELL_MODELED))
      );
      const id = info.lastInsertRowid;
      spellMap.set(`${s.name.toLowerCase()}|${s.source.toUpperCase()}`, id);
      bump('spells');
      addToFts('spell', id, s.name, flat);
    }
  }
});

runSection('spell_classes', () => {
  const insertSpellClass = db.prepare(
    'INSERT OR IGNORE INTO spell_classes (spell_id, class_name, class_source) VALUES (?,?,?)'
  );
  const lookup = readJson(path.join('generated', 'gendata-spell-source-lookup.json'));
  for (const bookKey of Object.keys(lookup)) {
    const bySpell = lookup[bookKey];
    for (const spellNameLower of Object.keys(bySpell)) {
      const spellId = spellMap.get(`${spellNameLower}|${bookKey.toUpperCase()}`);
      if (spellId == null) continue;
      const classInfo = bySpell[spellNameLower].class;
      if (!classInfo) continue;
      for (const sourceCode of Object.keys(classInfo)) {
        for (const className of Object.keys(classInfo[sourceCode])) {
          insertSpellClass.run(spellId, className, sourceCode);
          bump('spell_classes');
        }
      }
    }
  }
});

// ---------------------------------------------------------------------------
// Rules glossary (mostly SRD-covered)
// ---------------------------------------------------------------------------

runSection('languages', () => {
  const insertLanguage = db.prepare(
    'INSERT INTO languages (name, source, srd, basic_rules, type, script, entries) VALUES (?,?,?,?,?,?,?)'
  );
  const data = readJson('languages.json');
  for (const l of data.language || []) {
    if (!isIncluded(l) || l._copy) continue;
    ensureSource(l.source);
    const flat = flattenEntries(l.entries);
    const info = insertLanguage.run(
      l.name,
      l.source,
      bit(l.srd),
      bit(l.basicRules),
      l.type ?? null,
      l.script ?? null,
      flat.length ? json(flat) : null
    );
    bump('languages');
    addToFts('language', info.lastInsertRowid, l.name, flat);
  }
});

runSection('conditions', () => {
  const insertCondition = db.prepare(
    'INSERT INTO conditions (name, source, srd, basic_rules, entries) VALUES (?,?,?,?,?)'
  );
  const data = readJson('conditionsdiseases.json');
  for (const c of data.condition || []) {
    if (!isIncluded(c)) continue;
    ensureSource(c.source);
    const flat = flattenEntries(c.entries);
    const info = insertCondition.run(c.name, c.source, bit(c.srd), bit(c.basicRules), json(flat));
    bump('conditions');
    addToFts('condition', info.lastInsertRowid, c.name, flat);
  }
});

runSection('skills', () => {
  const insertSkill = db.prepare(
    'INSERT INTO skills (name, source, srd, basic_rules, ability, entries) VALUES (?,?,?,?,?,?)'
  );
  const data = readJson('skills.json');
  for (const s of data.skill || []) {
    if (!isIncluded(s)) continue;
    ensureSource(s.source);
    const flat = flattenEntries(s.entries);
    const info = insertSkill.run(
      s.name,
      s.source,
      bit(s.srd),
      bit(s.basicRules),
      s.ability ?? null,
      flat.length ? json(flat) : null
    );
    bump('skills');
    addToFts('skill', info.lastInsertRowid, s.name, flat);
  }
});

runSection('actions', () => {
  const insertAction = db.prepare(
    'INSERT INTO actions (name, source, srd, basic_rules, time, entries) VALUES (?,?,?,?,?,?)'
  );
  const data = readJson('actions.json');
  for (const a of data.action || []) {
    if (!isIncluded(a)) continue;
    ensureSource(a.source);
    const flat = flattenEntries(a.entries);
    const info = insertAction.run(a.name, a.source, bit(a.srd), bit(a.basicRules), json(a.time ?? null), json(flat));
    bump('actions');
    addToFts('action', info.lastInsertRowid, a.name, flat);
  }
});

// Weapon property codes actually used by base_items/items.properties in this
// dataset - the rest of items-base.json's itemProperty array (AF, BF, RLD,
// Vst, ...) are DMG/other-supplement variants not present in our data.
const WEAPON_PROPERTY_CODES = new Set(['2H', 'A', 'F', 'H', 'L', 'LD', 'R', 'S', 'T', 'V']);

runSection('item_properties', () => {
  const insertItemProperty = db.prepare('INSERT INTO item_properties (code, name, source, entries) VALUES (?,?,?,?)');
  const data = readJson('items-base.json');
  for (const p of data.itemProperty || []) {
    if (!WEAPON_PROPERTY_CODES.has(p.abbreviation)) continue;
    ensureSource(p.source);
    const sub = p.entries?.[0];
    const name = sub?.name ?? p.name;
    const flat = sub?.entries ? flattenEntries(sub.entries) : [];
    const info = insertItemProperty.run(p.abbreviation, name, p.source, flat.length ? json(flat) : null);
    bump('item_properties');
    addToFts('item_property', info.lastInsertRowid, name, flat);
  }
});

// ---------------------------------------------------------------------------
// Low priority / optional
// ---------------------------------------------------------------------------

runSection('vehicles', () => {
  const insertVehicle = db.prepare(
    'INSERT INTO vehicles (name, source, srd, vehicle_type, entries) VALUES (?,?,?,?,?)'
  );
  const data = readJson('vehicles.json');
  for (const v of data.vehicle || []) {
    if (!isIncluded(v) || v._copy) continue;
    ensureSource(v.source);
    const flat = flattenEntries(v.entries);
    const info = insertVehicle.run(
      v.name,
      v.source,
      bit(v.srd),
      v.vehicleType ?? null,
      flat.length ? json(flat) : null
    );
    bump('vehicles');
    addToFts('vehicle', info.lastInsertRowid, v.name, flat);
  }
});

runSection('deities', () => {
  const insertDeity = db.prepare(
    'INSERT INTO deities (name, source, srd, pantheon, alignment, domains, entries) VALUES (?,?,?,?,?,?,?)'
  );
  const data = readJson('deities.json');
  for (const d of data.deity || []) {
    if (!isIncluded(d) || d._copy) continue;
    ensureSource(d.source);
    const flat = flattenEntries(d.entries);
    const info = insertDeity.run(
      d.name,
      d.source,
      bit(d.srd),
      d.pantheon ?? null,
      json(d.alignment ?? null),
      json(d.domains ?? null),
      flat.length ? json(flat) : null
    );
    bump('deities');
    addToFts('deity', info.lastInsertRowid, d.name, flat);
  }
});

db.exec('COMMIT');
db.close();

console.log(`Imported into ${outPath}${args.srdOnly ? ' (SRD-only)' : ''}:`);
for (const [table, count] of Object.entries(stats).sort()) {
  console.log(`  ${table.padEnd(20)} ${count}`);
}
