// Dev tooling only, not part of the app build: extracts raw text from a
// translated sourcebook PDF (books/*.pdf, gitignored - see AGENTS.md /
// docs/data-schema.md) into translations/pt-BR/_raw-extracts/<CODE>.txt.
//
// This cache is what makes the pt-BR extraction work resumable across
// sessions without reopening the PDF each time: once a book is extracted
// here, building translations/pt-BR/<CODE>/<categoria>.json is just reading
// and grepping this text file for the relevant page range.
//
// Usage:
//   node scripts/extract-book-text.mjs "books/Livro do Jogador.pdf" PHB
//
// Page markers in the output look like "-- N of TOTAL --". For most of
// these PDFs, N lines up 1:1 with the book's own printed page numbers -
// verify per book by finding a chapter heading in both the table of
// contents and its actual page (see translations/pt-BR/_page-maps/PHB.json
// for a worked example) before trusting page numbers across a whole book.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFParse } from 'pdf-parse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const [, , pdfPathArg, bookCode] = process.argv;
if (!pdfPathArg || !bookCode) {
  console.error('Usage: node scripts/extract-book-text.mjs <path-to-pdf> <BOOK_CODE>');
  process.exit(1);
}

const pdfPath = path.resolve(repoRoot, pdfPathArg);
const outDir = path.join(repoRoot, 'translations', 'pt-BR', '_raw-extracts');
const outPath = path.join(outDir, `${bookCode}.txt`);

fs.mkdirSync(outDir, { recursive: true });

const buf = fs.readFileSync(pdfPath);
const parser = new PDFParse({ data: buf });
const result = await parser.getText();
fs.writeFileSync(outPath, result.text, 'utf8');
console.log(`Extracted ${result.pages?.length ?? '?'} pages -> ${outPath}`);
