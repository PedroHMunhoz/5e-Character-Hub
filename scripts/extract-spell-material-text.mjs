// Dev tooling only, not part of the app build: reads the material-component
// description ("M (...)") printed for each PHB spell directly from
// translations/pt-BR/_raw-extracts/PHB.txt and merges it as a new
// `materialText` field into translations/pt-BR/PHB/spells.json, alongside
// the existing `name`/`entries` fields. Leaves `name`/`entries` untouched.
//
// Rerunnable: only touches spells it can resolve unambiguously (a single
// heading match followed by a valid "N° nível de <escola>"/"Truque de
// <escola>" header line, with a "Componentes:" section containing "M (...)")
// - anything else is logged and skipped, never guessed.
//
// Usage:
//   node scripts/extract-spell-material-text.mjs [--db ./assets/data/dnd5e.db]

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { db: 'assets/data/dnd5e.db' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--db') args.db = argv[++i];
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const dbPath = path.resolve(repoRoot, args.db);
const spellsJsonPath = path.join(repoRoot, 'translations', 'pt-BR', 'PHB', 'spells.json');
const rawExtractPath = path.join(repoRoot, 'translations', 'pt-BR', '_raw-extracts', 'PHB.txt');

for (const p of [dbPath, spellsJsonPath, rawExtractPath]) {
  if (!fs.existsSync(p)) {
    console.error(`[extract-spell-material-text] Missing required file: ${p}`);
    process.exit(1);
  }
}

const db = new DatabaseSync(dbPath, { readOnly: true });
const translations = JSON.parse(fs.readFileSync(spellsJsonPath, 'utf8'));
const rawLines = fs.readFileSync(rawExtractPath, 'utf8').split('\n');

const HEADER_RE = /^(Truque de [\wÀ-ú]+|\d° nível de [\wÀ-ú]+)( \(ritual\))?$/;
const LABELS = ['Tempo de Conjuração:', 'Alcance:', 'Componentes:', 'Duração:'];
const PAGE_MARKER_RE = /^-- \d+ of \d+ --$/;

function labelOf(line) {
  for (const label of LABELS) {
    if (line.startsWith(label)) return label;
  }
  return null;
}

// Finds every occurrence of `ptName` as its own line immediately followed by
// a valid spell-header line, then walks forward collecting each labeled
// section (handling multi-line wraps, e.g. a long material description or a
// reaction's trigger clause) until "Duração:" is fully read.
function findStatBlocks(ptName) {
  const target = ptName.toUpperCase();
  const blocks = [];

  for (let i = 0; i < rawLines.length; i++) {
    if (rawLines[i].trim() !== target) continue;
    const headerLine = (rawLines[i + 1] || '').trim();
    if (!HEADER_RE.test(headerLine)) continue;

    const sections = {};
    let current = null;
    let j = i + 2;
    let steps = 0;
    while (j < rawLines.length && steps < 20) {
      const line = (rawLines[j] || '').trim();
      if (PAGE_MARKER_RE.test(line)) {
        j++;
        continue;
      }
      const label = labelOf(line);
      if (label) {
        current = label;
        sections[label] = [line.slice(label.length).trim()];
      } else if (current === 'Duração:' && sections['Duração:']) {
        break; // first non-label line after Duração: is the spell's body text
      } else if (current) {
        sections[current].push(line);
      } else {
        break;
      }
      j++;
      steps++;
    }

    blocks.push({ components: sections['Componentes:']?.join(' ') ?? null });
  }

  return blocks;
}

const rows = db.prepare("SELECT name, components FROM spells WHERE source = 'PHB'").all();

let updated = 0;
let unresolved = 0;
let skippedNoTranslation = 0;

for (const row of rows) {
  const components = JSON.parse(row.components);
  if (!components.m) continue;

  const key = `${row.name}|PHB`;
  const entry = translations[key];
  if (!entry?.name) {
    console.warn(`[extract-spell-material-text] No pt-BR name for "${row.name}" - skipping.`);
    skippedNoTranslation++;
    continue;
  }

  const blocks = findStatBlocks(entry.name);
  if (blocks.length !== 1) {
    console.warn(
      `[extract-spell-material-text] "${row.name}" (${entry.name}): expected exactly 1 stat block, found ${blocks.length} - skipping.`
    );
    unresolved++;
    continue;
  }

  const match = /M \((.+)\)$/.exec(blocks[0].components ?? '');
  if (!match) {
    console.warn(
      `[extract-spell-material-text] "${row.name}" (${entry.name}): no "M (...)" found in Componentes line ("${blocks[0].components}") - skipping.`
    );
    unresolved++;
    continue;
  }

  entry.materialText = match[1];
  updated++;
}

db.close();

fs.writeFileSync(spellsJsonPath, `${JSON.stringify(translations, null, 2)}\n`, 'utf8');

console.log(`[extract-spell-material-text] Updated ${updated} spell(s) with materialText.`);
if (unresolved)
  console.log(`[extract-spell-material-text] ${unresolved} spell(s) could not be resolved - see warnings above.`);
if (skippedNoTranslation)
  console.log(
    `[extract-spell-material-text] ${skippedNoTranslation} spell(s) have no pt-BR name yet - see warnings above.`
  );
