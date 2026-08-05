// Bramka bezpieczeństwa uruchamiana przed `astro build` (skrypt "build" w package.json).
//
// Cel: zablokować produkcyjny build, jeśli w treści pojawi się coś, czego na stronie być nie może.
// Po ukończeniu właściwej strony gate przechodzi automatycznie — nie wymaga żadnych flag.
//
// Blokujemy build, gdy:
//   1. Strona główna (src/pages/index.astro) zawiera `noindex` (oznaka wersji roboczej).
//   2. W treści stron/danych/komponentów pojawiają się ceny lub stawki (reguła marki: bez cen).
//   3. W treści pozostał placeholder ("lorem ipsum", "wersja robocza", "TODO_PRICE").
//
// Świadome wyjątki (np. `noindex` na stronach 404 i polityce prywatności) są dozwolone —
// sprawdzamy noindex wyłącznie na stronie głównej.

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const scanDirs = ['src/pages', 'src/data', 'src/components', 'src/layouts'];

async function collectFiles(dir) {
  const abs = path.join(root, dir);
  const out = [];
  let entries;
  try {
    entries = await readdir(abs, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await collectFiles(rel)));
    else out.push(rel);
  }
  return out;
}

const problems = [];

// 1. Strona główna nie może być oznaczona jako noindex.
const indexPath = path.join(root, 'src/pages/index.astro');
const indexSource = await readFile(indexPath, 'utf8');
if (/noindex/i.test(indexSource)) {
  problems.push('Strona główna (index.astro) zawiera "noindex" — to wersja robocza, nie produkcyjna.');
}

// 2 + 3. Skan treści pod kątem cen i placeholderów.
const pricePatterns = [
  { re: /\d[\d\s.,]*\s*(zł|zl|pln)\b/i, label: 'kwota / cena (np. „1 490 zł”)' },
  { re: /\/\s*m[²2]\b/i, label: 'stawka za metr (np. „/m²”)' },
  { re: /za\s*m[²2]\b/i, label: 'stawka za metr (np. „za m²”)' },
];
const placeholderPatterns = [
  { re: /lorem ipsum/i, label: 'placeholder „lorem ipsum”' },
  { re: /wersja robocza/i, label: 'oznaczenie „wersja robocza”' },
  { re: /TODO_PRICE/i, label: 'znacznik TODO_PRICE' },
];

const files = (await Promise.all(scanDirs.map(collectFiles))).flat();

for (const file of files) {
  const source = await readFile(path.join(root, file), 'utf8');
  for (const { re, label } of [...pricePatterns, ...placeholderPatterns]) {
    if (re.test(source)) {
      problems.push(`${file}: wykryto ${label}.`);
    }
  }
}

if (problems.length > 0) {
  console.error('\nBuild zablokowany przez bramkę gotowości produkcyjnej:\n');
  for (const problem of problems) console.error(`  • ${problem}`);
  console.error('\nUsuń powyższe elementy przed produkcyjnym buildem.\n');
  process.exit(1);
}

console.log('Bramka gotowości produkcyjnej: OK — brak cen, placeholderów i noindex na stronie głównej.');
