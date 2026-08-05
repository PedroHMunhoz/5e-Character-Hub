// Dev tooling only: prints a page range from a translations/pt-BR/_raw-extracts/<CODE>.txt
// cache produced by scripts/extract-book-text.mjs. Page numbers are whatever
// the cache's "-- N of TOTAL --" markers use (usually the printed page
// number - see translations/pt-BR/_page-maps/<CODE>.json).
//
// Usage:
//   node scripts/read-book-pages.mjs PHB 146 150
//   node scripts/read-book-pages.mjs PHB --find "Trajetória Primitiva"

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const [, , bookCode, a, b] = process.argv;
const textPath = path.join(repoRoot, 'translations', 'pt-BR', '_raw-extracts', `${bookCode}.txt`);
const text = fs.readFileSync(textPath, 'utf8');

const marks = [...text.matchAll(/-- (\d+) of \d+ --/g)];
function pageAt(idx) {
  const before = marks.filter((m) => m.index < idx);
  return before.length ? Number(before[before.length - 1][1]) : null;
}

if (a === '--find') {
  const positions = [...text.matchAll(new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))].map((m) => m.index);
  for (const p of positions) console.log(`page ${pageAt(p)}: ...${text.slice(Math.max(0, p - 60), p + 100).replace(/\n/g, ' | ')}...`);
  process.exit(0);
}

const fromN = Number(a);
const toN = Number(b ?? a);
for (let i = 0; i < marks.length; i++) {
  const page = Number(marks[i][1]);
  if (page < fromN || page > toN) continue;
  const start = marks[i].index + marks[i][0].length;
  const end = i + 1 < marks.length ? marks[i + 1].index : text.length;
  console.log(`\n===== PAGE ${page} =====`);
  console.log(text.slice(start, end).trim());
}
