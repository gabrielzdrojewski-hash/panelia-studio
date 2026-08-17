// Kontrola statyczna integracji kontaktowej (bez sieci, bez ERP).
// Uruchomienie: npm run check:contact
//
// Weryfikuje bezpieczeństwo i spójność gatewaya /api/contact:
//  - brak tokenu / Authorization / adresu ERP w kliencie i dist,
//  - obecność endpointu PHP i reguł .htaccess,
//  - brak cen publicznych i starych nazw pakietów,
//  - (po buildzie) 11 stron + skopiowany contact.php,
//  - (jeśli PHP dostępne) lint + testy jednostkowe gatewaya.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
let failures = 0;
let warnings = 0;

const ok = (m) => console.log(`  \x1b[32mPASS\x1b[0m  ${m}`);
const fail = (m) => {
  failures++;
  console.log(`  \x1b[31mFAIL\x1b[0m  ${m}`);
};
const warn = (m) => {
  warnings++;
  console.log(`  \x1b[33mWARN\x1b[0m  ${m}`);
};

function read(p) {
  try {
    return readFileSync(join(ROOT, p), 'utf8');
  } catch {
    return null;
  }
}

function walk(dir, filterExt) {
  const out = [];
  if (!existsSync(join(ROOT, dir))) return out;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const entry of readdirSync(join(ROOT, cur))) {
      const rel = `${cur}/${entry}`;
      const st = statSync(join(ROOT, rel));
      if (st.isDirectory()) stack.push(rel);
      else if (!filterExt || rel.endsWith(filterExt)) out.push(rel);
    }
  }
  return out;
}

console.log('\n== Kontakt / gateway ERP — kontrola statyczna ==\n');

// 1. Endpoint PHP istnieje.
existsSync(join(ROOT, 'public/api/contact.php'))
  ? ok('public/api/contact.php istnieje')
  : fail('brak public/api/contact.php');

// 2. .env.example — flaga publiczna + pusty token.
const envEx = read('.env.example') ?? '';
envEx.includes('PUBLIC_CONTACT_FORM_ENABLED')
  ? ok('.env.example zawiera PUBLIC_CONTACT_FORM_ENABLED')
  : fail('.env.example bez PUBLIC_CONTACT_FORM_ENABLED');
/FATICA_ERP_PANELIA_TOKEN=\s*$/m.test(envEx)
  ? ok('.env.example: token pusty')
  : fail('.env.example: token NIE jest pusty');
/PUBLIC_.*TOKEN/i.test(envEx) && fail('.env.example: token z prefiksem PUBLIC_ (niedozwolone)');

// 3. Klient wywołuje /api/contact i NIE zna ERP/tokenu.
const clientLib = read('src/lib/contact.ts') ?? '';
clientLib.includes("'/api/contact'") || clientLib.includes('"/api/contact"')
  ? ok('src/lib/contact.ts wywołuje /api/contact')
  : fail('src/lib/contact.ts nie wywołuje /api/contact');
/app\.fatica\.pl/.test(clientLib)
  ? fail('src/lib/contact.ts zawiera adres ERP (niedozwolone w kliencie)')
  : ok('src/lib/contact.ts bez adresu ERP');
/demo:\s*true/.test(clientLib) && fail('src/lib/contact.ts nadal zwraca demo:true');

const gatewayPhp = read('public/api/contact.php') ?? '';
gatewayPhp.includes("'Idempotency-Key: '")
  ? ok('gateway wysyła Idempotency-Key')
  : fail('gateway nie wysyła Idempotency-Key');
gatewayPhp.includes("'X-Correlation-ID: '")
  ? ok('gateway wysyła X-Correlation-ID')
  : fail('gateway nie wysyła X-Correlation-ID');
gatewayPhp.includes('panelia_is_erp_success')
  ? ok('gateway weryfikuje finalny shape odpowiedzi 201/200 duplicate')
  : fail('gateway nie weryfikuje finalnego shape odpowiedzi ERP');
gatewayPhp.includes('[429, 502, 503, 504]')
  ? ok('gateway retry: 429/502/503/504')
  : fail('gateway retry nie obejmuje finalnej polityki 429/502/503/504');
existsSync(join(ROOT, 'scripts/php-router.php'))
  ? ok('lokalny router PHP do E2E istnieje')
  : fail('brak scripts/php-router.php do lokalnego E2E');

// 4. Brak sekretów / ERP w KLIENCKIM bundlu JS (dist/_astro/*.js).
const clientJs = walk('dist/_astro', '.js');
if (clientJs.length === 0) {
  warn('brak dist/_astro/*.js — uruchom build, aby sprawdzić bundle klienta');
} else {
  let leak = false;
  for (const f of clientJs) {
    const c = read(f) ?? '';
    if (/app\.fatica\.pl/.test(c)) {
      fail(`adres ERP w bundlu klienta: ${f}`);
      leak = true;
    }
    if (/Bearer\s+[A-Za-z0-9._-]/.test(c) || /Authorization/i.test(c)) {
      fail(`Authorization/Bearer w bundlu klienta: ${f}`);
      leak = true;
    }
  }
  if (!leak) ok('bundle klienta bez adresu ERP i bez Authorization/Bearer');
}

// 5. Brak prawdziwego tokenu w repo/dist (FATICA_ERP_PANELIA_TOKEN=<niepuste> lub Bearer w źródłach).
const scanRoots = ['src', 'public', 'dist', 'scripts', 'docs'];
const SELF = 'scripts/check-contact-integration.mjs'; // wyklucz własny plik (zawiera wzorce)
let tokenLeak = false;
for (const rootDir of scanRoots) {
  for (const f of walk(rootDir)) {
    if (f === SELF) continue;
    if (/\.(png|jpg|jpeg|webp|svg|ico|zip|woff2?|ttf)$/i.test(f)) continue;
    const c = read(f);
    if (!c) continue;
    // Token = niepusty ciąg tuż po znaku "=" (nie łapie pustej wartości ani wzorca \s).
    for (const line of c.split('\n')) {
      if (/FATICA_ERP_PANELIA_TOKEN=[A-Za-z0-9._-]{6,}/.test(line)) {
        fail(`możliwy token w ${f}`);
        tokenLeak = true;
        break;
      }
    }
  }
}
if (!tokenLeak) ok('brak niepustego FATICA_ERP_PANELIA_TOKEN w repo/dist');

// 6. .htaccess — rewrite endpointu + zachowane legacy/410.
const ht = read('public/.htaccess') ?? '';
/RewriteRule\s+\^api\/contact/.test(ht)
  ? ok('.htaccess: rewrite /api/contact -> api/contact.php')
  : fail('.htaccess: brak rewrite /api/contact');
/pricing-plan/.test(ht) && /shop/.test(ht)
  ? ok('.htaccess: zachowane przekierowania legacy/410')
  : fail('.htaccess: brak wcześniejszych przekierowań legacy');
// Linia rewrite endpointu nie może mieć R=301/302 (sprawdzamy tę konkretną linię).
const apiLine = ht.split('\n').find((l) => /RewriteRule\s+\^api\/contact/.test(l)) ?? '';
/R=30[12]/.test(apiLine)
  ? fail('.htaccess: endpoint kontaktu ma R=301/302 (niedozwolone)')
  : ok('.htaccess: endpoint kontaktu bez R=301/302 (POST zachowany)');

// 7. Brak cen publicznych i starych nazw pakietów w dist (HTML/JS).
const distText = [...walk('dist', '.html'), ...walk('dist', '.js')];
if (distText.length === 0) {
  warn('brak zbudowanego dist — pomijam skan cen/nazw (uruchom build)');
} else {
  let priceHit = false;
  let nameHit = false;
  for (const f of distText) {
    const c = read(f) ?? '';
    if (/\b(1490|1690|1890|2190)\b|zł\s*\/\s*m|\/m²/.test(c)) {
      fail(`możliwa cena w ${f}`);
      priceHit = true;
    }
    if (/\bINVEST\b/.test(c) || /pakiet[a-z]*\s+standard/i.test(c)) {
      fail(`stara nazwa pakietu w ${f}`);
      nameHit = true;
    }
  }
  if (!priceHit) ok('dist: brak cen publicznych');
  if (!nameHit) ok('dist: brak INVEST / pakietu STANDARD');
}

// 8. Po buildzie: 11 stron + skopiowany contact.php.
const distHtml = walk('dist', '.html');
if (distHtml.length === 0) {
  warn('brak dist — pomijam liczbę stron i kopię contact.php');
} else {
  distHtml.length === 12
    ? ok(`dist: 12 stron (${distHtml.length})`)
    : warn(`dist: liczba stron = ${distHtml.length} (oczekiwano 12)`);
  existsSync(join(ROOT, 'dist/api/contact.php'))
    ? ok('dist/api/contact.php istnieje (build kopiuje endpoint)')
    : fail('dist/api/contact.php brak — build nie skopiował endpointu');
}

// 9. PHP (jeśli dostępne): lint + testy jednostkowe gatewaya.
const php = spawnSync('php', ['--version'], { encoding: 'utf8' });
if (php.status === 0) {
  const lint = spawnSync('php', ['-l', 'public/api/contact.php'], { encoding: 'utf8', cwd: ROOT });
  lint.status === 0 ? ok('php -l contact.php OK') : fail('php -l contact.php błąd');
  const t = spawnSync('php', ['tests/contact-gateway/run-tests.php'], { encoding: 'utf8', cwd: ROOT });
  t.status === 0 ? ok('testy jednostkowe gatewaya PHP OK') : fail('testy jednostkowe gatewaya PHP FAIL');
} else {
  warn('PHP niedostępne — pomiń lint/testy; uruchom: php -l public/api/contact.php oraz php tests/contact-gateway/run-tests.php');
}

console.log(`\nWynik: ${failures} FAIL, ${warnings} WARN\n`);
process.exit(failures === 0 ? 0 : 1);
