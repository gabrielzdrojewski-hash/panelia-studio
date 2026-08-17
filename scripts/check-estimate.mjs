// Kontrola statyczna modułu „Wyceń swoje wnętrze" (estimate).
// Uruchomienie: npm run check:estimate
//
// Weryfikuje niezmienniki architektury i bezpieczeństwa:
//  - brak silnika cen / cen w źródłach estymatora,
//  - brak sekretów/ERP w bundlu klienta; klient rozmawia tylko z /api/estimate i /api/contact,
//  - data-driven definicja z conditional logic (visibleWhen), source=panelia_fallback,
//  - obsługa manual_quote / not_configured / error bez fałszywej ceny,
//  - brak PII w hookach analitycznych,
//  - draft/resume, blokada double-submit, honeypot, a11y (aria-live, reduced-motion),
//  - endpoint PHP: rewrite bez R=301/302, php -l,
//  - /wycena w sitemapie.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
let failures = 0;
let warnings = 0;
const ok = (m) => console.log(`  \x1b[32mPASS\x1b[0m  ${m}`);
const fail = (m) => { failures++; console.log(`  \x1b[31mFAIL\x1b[0m  ${m}`); };
const warn = (m) => { warnings++; console.log(`  \x1b[33mWARN\x1b[0m  ${m}`); };
const read = (p) => { try { return readFileSync(join(ROOT, p), 'utf8'); } catch { return null; } };
const walk = (dir, ext) => {
  const out = [];
  if (!existsSync(join(ROOT, dir))) return out;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const e of readdirSync(join(ROOT, cur))) {
      const rel = `${cur}/${e}`;
      if (statSync(join(ROOT, rel)).isDirectory()) stack.push(rel);
      else if (!ext || rel.endsWith(ext)) out.push(rel);
    }
  }
  return out;
};

console.log('\n== Estimate / „Wyceń swoje wnętrze" — kontrola statyczna ==\n');

// 1. Pliki modułu istnieją.
const files = {
  def: 'src/data/estimate/definition.ts',
  lib: 'src/lib/estimate.ts',
  analytics: 'src/lib/analytics.ts',
  wizard: 'src/components/estimate/EstimateWizard.astro',
  page: 'src/pages/wycena.astro',
  php: 'public/api/estimate.php',
};
for (const p of Object.values(files)) {
  existsSync(join(ROOT, p)) ? ok(`istnieje ${p}`) : fail(`brak ${p}`);
}

const def = read(files.def) ?? '';
const lib = read(files.lib) ?? '';
const analytics = read(files.analytics) ?? '';
const wizard = read(files.wizard) ?? '';
const page = read(files.page) ?? '';
const php = read(files.php) ?? '';

// 2. Brak cen/silnika cen w źródłach estymatora.
const priceRe = [/\d[\d\s.,]*\s*(zł|zl|pln)\b/i, /\/\s*m[²2]\b/i, /za\s*m[²2]\b/i];
let priceHit = false;
for (const [name, src] of [['definition', def], ['estimate.ts', lib], ['wizard', wizard], ['wycena.astro', page]]) {
  for (const re of priceRe) if (re.test(src)) { fail(`możliwa cena/stawka w ${name}`); priceHit = true; }
}
if (!priceHit) ok('brak cen i stawek w źródłach estymatora (cena wyłącznie z ERP)');

// 3. Data-driven definicja z conditional logic.
/visibleWhen/.test(def) ? ok('definicja ma conditional logic (visibleWhen)') : fail('definicja bez visibleWhen');
/source:\s*'panelia_fallback'/.test(def) ? ok("definicja source='panelia_fallback'") : fail('definicja bez source panelia_fallback');
/version:/.test(def) ? ok('definicja wersjonowana') : fail('definicja bez wersji');

// 4. Obsługa wyniku bez fałszywej ceny.
/normalizeEstimateResult/.test(lib) ? ok('estimate.ts: normalizer wyniku') : fail('brak normalizera');
/'manual_quote'/.test(lib) && /'not_configured'/.test(lib) ? ok('obsługa manual_quote / not_configured') : fail('brak manual_quote/not_configured');
/sendContactForm/.test(lib) ? ok('fallback leada przez sprawdzony /api/contact') : fail('brak fallbacku /api/contact');

// 4b. Jawna klasyfikacja + ochrona przed bypassem/duplikatem.
/classifyEstimateEndpoint/.test(lib) ? ok('estimate.ts: jawna klasyfikacja odpowiedzi') : fail('brak jawnej klasyfikacji');
/FALLBACK_ALLOWED/.test(lib) ? ok('estimate.ts: FALLBACK_ALLOWED (kontrolowany fallback)') : fail('brak FALLBACK_ALLOWED');
/manual_quote_accepted/.test(lib) ? ok('estimate.ts: manual_quote_accepted (terminal, bez duplikatu)') : fail('brak manual_quote_accepted');
['validation_error', 'rate_limited', 'forbidden', 'server_error'].every((o) => lib.includes(o))
  ? ok('estimate.ts: outcomes bez fallbacku (422/429/403/5xx)') : fail('brak outcomes bez fallbacku');
/idempotency_key/.test(lib) ? ok('estimate.ts: idempotency_key w submission') : fail('brak idempotency_key');
/buildFallbackBrief/.test(lib) && /truncated/.test(lib) ? ok('estimate.ts: buildFallbackBrief (uczciwe obcinanie)') : fail('brak buildFallbackBrief');

// 5. Endpoint klienta i brak sekretów.
/'\/api\/estimate'/.test(lib) || /"\/api\/estimate"/.test(lib)
  ? ok('estimate.ts woła /api/estimate') : fail('estimate.ts nie woła /api/estimate');
// Realne wskaźniki sekretu (nie zwykłe wzmianki architektoniczne w komentarzach).
let clientLeak = false;
for (const [name, src] of [['estimate.ts', lib], ['wizard', wizard], ['analytics', analytics]]) {
  if (/app\.fatica\.pl\/api|erp_token\s*[:=]|Bearer\s+[A-Za-z0-9._-]{6,}/.test(src)) {
    fail(`sekret/ERP w kliencie: ${name}`);
    clientLeak = true;
  }
}
if (!clientLeak) ok('brak realnego adresu ERP / tokenu / Bearer w kodzie klienta');

// 6. Analityka bez PII.
const forbidden = ['name', 'email', 'phone', 'message', 'answers'];
forbidden.every((k) => analytics.includes(`'${k}'`))
  ? ok('analytics: lista FORBIDDEN_KEYS chroni PII')
  : fail('analytics: brak pełnej listy FORBIDDEN_KEYS');
/sanitize/.test(analytics) ? ok('analytics: sanitizacja payloadu') : fail('analytics: brak sanitizacji');

// 7. UX/a11y/anti-abuse w wizardzie.
/submitting/.test(wizard) ? ok('wizard: blokada double-submit') : fail('wizard: brak blokady double-submit');
/localStorage/.test(wizard) && /DRAFT_KEY/.test(wizard) ? ok('wizard: draft/resume (localStorage, wersjonowany)') : fail('wizard: brak draft/resume');
/data-hp|honeypot|company/.test(wizard) ? ok('wizard: honeypot') : fail('wizard: brak honeypota');
/aria-live/.test(wizard) ? ok('wizard: aria-live dla statusów') : fail('wizard: brak aria-live');
/prefers-reduced-motion/.test(wizard) ? ok('wizard: prefers-reduced-motion') : fail('wizard: brak reduced-motion');
/AbortController/.test(wizard) ? ok('wizard: timeout klienta (AbortController)') : fail('wizard: brak timeoutu');

// 8. Analytics hooki (semantyczne zdarzenia).
const events = ['estimate_started', 'estimate_step_completed', 'estimate_contact_reached', 'estimate_submitted', 'estimate_requires_manual_quote', 'estimate_failed'];
events.every((e) => wizard.includes(e))
  ? ok('wizard: komplet semantycznych zdarzeń analitycznych')
  : warn('wizard: część zdarzeń analitycznych może brakować');

// 9. .htaccess + endpoint PHP.
const ht = read('public/.htaccess') ?? '';
/RewriteRule\s+\^api\/estimate/.test(ht) ? ok('.htaccess: rewrite /api/estimate') : fail('.htaccess: brak rewrite /api/estimate');
const apiLine = ht.split('\n').find((l) => /RewriteRule\s+\^api\/estimate/.test(l)) ?? '';
/R=30[12]/.test(apiLine) ? fail('.htaccess: endpoint wyceny ma R=301/302') : ok('.htaccess: endpoint wyceny bez R=301/302');
/result_type.*not_configured|not_configured/.test(php) ? ok('estimate.php: bezpieczny not_configured') : fail('estimate.php: brak not_configured');

// 10. /wycena w sitemapie.
/\/wycena/.test(read('src/pages/sitemap.xml.ts') ?? '') ? ok('/wycena w sitemapie') : fail('/wycena brak w sitemapie');

// 11. Bundle klienta (po buildzie) — bez sekretów, tylko własne endpointy.
const clientJs = walk('dist/_astro', '.js');
if (clientJs.length === 0) {
  warn('brak dist/_astro/*.js — uruchom build, aby sprawdzić bundle klienta');
} else {
  let leak = false;
  for (const f of clientJs) {
    const c = read(f) ?? '';
    if (/app\.fatica\.pl|erp_token|secure_config|Bearer\s+[A-Za-z0-9]/.test(c)) { fail(`sekret/ERP w bundlu: ${f}`); leak = true; }
  }
  if (!leak) ok('bundle klienta bez adresu ERP / tokenu / secure_config');
}

// 11b. Runtime testy tabeli decyzji (fallback/ERP) — dowód zachowania, nie tylko statyka.
const rt = spawnSync('node', ['--import', './tests/estimate/hooks.mjs', 'tests/estimate/decision.test.mjs'], { encoding: 'utf8', cwd: ROOT });
if (rt.status === 0) {
  const m = (rt.stdout || '').match(/Wynik:\s*(\d+)\s*PASS,\s*(\d+)\s*FAIL/);
  ok(`runtime testy decyzji fallback/ERP OK${m ? ` (${m[1]} PASS)` : ''}`);
} else {
  fail('runtime testy decyzji fallback/ERP FAIL');
  if (rt.stdout) console.log(rt.stdout.split('\n').filter((l) => l.includes('FAIL')).join('\n'));
}

// 12. php -l estimate.php (jeśli PHP dostępne).
const phpBin = spawnSync('php', ['--version'], { encoding: 'utf8' });
if (phpBin.status === 0) {
  const lint = spawnSync('php', ['-l', 'public/api/estimate.php'], { encoding: 'utf8', cwd: ROOT });
  lint.status === 0 ? ok('php -l estimate.php OK') : fail('php -l estimate.php błąd');
} else {
  warn('PHP niedostępne — uruchom później: php -l public/api/estimate.php');
}

console.log(`\nWynik: ${failures} FAIL, ${warnings} WARN\n`);
process.exit(failures === 0 ? 0 : 1);
