// Runtime testy kontraktu fallback/ERP dla /wycena (bez sieci, bez ERP, bez sekretów).
// Uruchomienie: node tests/estimate/decision.test.mjs  (Node 24 wykonuje TS natywnie).
//
// Dowodzi kluczowych zachowań:
//   - range/exact/manual_quote_accepted → 0 wywołań /api/contact (ochrona przed duplikatem),
//   - 422/429/403/5xx → 0 wywołań /api/contact (brak bypassu walidacji/rate-limitu),
//   - not_configured/404/network → kontrolowany fallback (dokładnie 1 /api/contact),
//   - ten sam idempotency_key w /api/estimate i /api/contact,
//   - fallback brief zachowuje wszystkie odpowiedziane, widoczne pytania (w granicach limitu).

import { submitEstimate, buildFallbackBrief } from '../../src/lib/estimate.ts';
import { estimateDefinition } from '../../src/data/estimate/definition.ts';

let pass = 0;
let failCount = 0;
const check = (name, cond) => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { failCount++; console.log(`  FAIL  ${name}`); }
};

// —— Mock fetch ——
let estimateResponder = null;
let contactResponder = null;
let contactCalls = 0;
let estimateBody = null;
let contactBody = null;

const makeRes = (status, bodyObj, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (k) => headers[String(k).toLowerCase()] ?? null },
  text: async () => JSON.stringify(bodyObj),
});

globalThis.fetch = async (url, opts) => {
  const body = opts?.body ? JSON.parse(opts.body) : null;
  if (url === '/api/estimate') { estimateBody = body; return estimateResponder(); }
  if (url === '/api/contact') { contactCalls++; contactBody = body; return contactResponder(); }
  throw new Error('nieoczekiwany url: ' + url);
};

const baseInput = () => ({
  session: {
    session_id: 'sid-123',
    form_version: estimateDefinition.version,
    path_choice: 'projekt_wnetrza',
    page_url: 'https://paneliastudio.pl/wycena',
    landing_page: 'https://paneliastudio.pl/wycena',
    referrer: null,
    utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, utm_term: null,
    started_at: new Date(Date.now() - 60000).toISOString(),
    answers: { path: 'projekt_wnetrza', property_type: 'mieszkanie', area: 68, city: 'Warszawa', standard: 'optymalny' },
  },
  contact: { name: 'Jan Kowalski', email: 'jan@example.com', phone: '+48601000000', consent: true },
  brief: 'Zgłoszenie z konfiguratora — proszę o kontakt w sprawie wyceny.',
  packageInterest: 'panelia_complete',
  idempotencyKey: 'panelia-contact-3f2504e0-4f89-41d3-9a0c-0305e82c3301',
});

const reset = () => { contactCalls = 0; estimateBody = null; contactBody = null; contactResponder = () => makeRes(200, { ok: true, message: 'ok', request_id: 'c1' }); };

async function run() {
  // 1. range → terminal, brak fallbacku
  reset();
  estimateResponder = () => makeRes(200, { ok: true, estimate_type: 'range', price_from: 168000, price_to: 182000, currency: 'PLN', lead_id: 'L1' });
  let r = await submitEstimate(baseInput());
  check('range → result_type=range', r.result_type === 'range');
  check('range → 0 wywołań /api/contact', contactCalls === 0);

  // 2. exact → terminal, brak fallbacku
  reset();
  estimateResponder = () => makeRes(201, { ok: true, estimate_type: 'exact', price_gross: 175000, currency: 'PLN' });
  r = await submitEstimate(baseInput());
  check('exact → result_type=exact', r.result_type === 'exact');
  check('exact → 0 wywołań /api/contact', contactCalls === 0);

  // 3. manual_quote zaakceptowany przez ERP → terminal, BEZ duplikatu
  reset();
  estimateResponder = () => makeRes(200, { ok: true, result_type: 'manual_quote', lead_id: 'L2', lead_delivered: true });
  r = await submitEstimate(baseInput());
  check('manual_quote accepted → result_type=manual_quote', r.result_type === 'manual_quote');
  check('manual_quote accepted → lead_delivered', r.lead_delivered === true);
  check('manual_quote accepted → 0 wywołań /api/contact (DUPLICATE PROTECTION)', contactCalls === 0);

  // 4. not_configured → kontrolowany fallback (1 kontakt)
  reset();
  estimateResponder = () => makeRes(503, { ok: false, result_type: 'not_configured', request_id: 'e4' });
  r = await submitEstimate(baseInput());
  check('not_configured → result_type=manual_quote (lead dostarczony)', r.result_type === 'manual_quote' && r.lead_delivered === true);
  check('not_configured → dokładnie 1 wywołanie /api/contact', contactCalls === 1);
  check('not_configured → ten sam idempotency_key w estimate i contact',
    estimateBody?.idempotency_key === 'panelia-contact-3f2504e0-4f89-41d3-9a0c-0305e82c3301' &&
    contactBody?.idempotency_key === estimateBody?.idempotency_key);
  check('not_configured → estimate submission niesie answers + form_version',
    !!estimateBody?.answers && estimateBody?.form_version === estimateDefinition.version);

  // 5. 404 backend-not-ready → kontrolowany fallback
  reset();
  estimateResponder = () => makeRes(404, { ok: false, message: 'nie znaleziono' });
  r = await submitEstimate(baseInput());
  check('404 → kontrolowany fallback (1 kontakt)', contactCalls === 1 && r.result_type === 'manual_quote');

  // 6. 422 → BEZ fallbacku
  reset();
  estimateResponder = () => makeRes(422, { ok: false, message: 'walidacja' });
  r = await submitEstimate(baseInput());
  check('422 → result_type=error, outcome=validation_error', r.result_type === 'error' && r.outcome === 'validation_error');
  check('422 → 0 wywołań /api/contact', contactCalls === 0);

  // 7. 429 → ABSOLUTNIE bez fallbacku, retry_after zachowany
  reset();
  estimateResponder = () => makeRes(429, { ok: false, message: 'za dużo' }, { 'retry-after': '30' });
  r = await submitEstimate(baseInput());
  check('429 → result_type=error, outcome=rate_limited', r.result_type === 'error' && r.outcome === 'rate_limited');
  check('429 → 0 wywołań /api/contact (brak obejścia rate limitu)', contactCalls === 0);
  check('429 → retry_after=30', r.retry_after === 30);

  // 8. 403 → bez fallbacku
  reset();
  estimateResponder = () => makeRes(403, { ok: false });
  r = await submitEstimate(baseInput());
  check('403 → error, 0 wywołań /api/contact', r.result_type === 'error' && r.outcome === 'forbidden' && contactCalls === 0);

  // 9. 500 → jawnie zdefiniowane: error, bez fallbacku (ryzyko duplikatu)
  reset();
  estimateResponder = () => makeRes(500, { ok: false });
  r = await submitEstimate(baseInput());
  check('500 → error, outcome=server_error, 0 wywołań /api/contact', r.result_type === 'error' && r.outcome === 'server_error' && contactCalls === 0);

  // 10. network/timeout → kontrolowany fallback (jawna decyzja, nie efekt uboczny)
  reset();
  estimateResponder = () => { throw new Error('network down'); };
  r = await submitEstimate(baseInput());
  check('network → kontrolowany fallback (1 kontakt), outcome=network_error', contactCalls === 1 && r.outcome === 'network_error' && r.result_type === 'manual_quote');

  // 11. fallback: gdy /api/contact zawiedzie → error, bez fałszywego sukcesu
  reset();
  estimateResponder = () => makeRes(503, { ok: false, result_type: 'not_configured' });
  contactResponder = () => makeRes(503, { ok: false, message: 'kontakt niedostępny' });
  r = await submitEstimate(baseInput());
  check('not_configured + contact 503 → result_type=error (bez ceny)', r.result_type === 'error' && r.price_from === null);

  // 12. buildFallbackBrief — deterministyczny, zachowuje odpowiedziane+widoczne pytania
  const answers = { path: 'projekt_wnetrza', property_type: 'mieszkanie', area: 68, city: 'Warszawa', standard: 'optymalny', notes: 'Styl skandynawski.' };
  const brief = buildFallbackBrief(estimateDefinition, answers, { session_id: 'sid', form_version: estimateDefinition.version });
  const answeredVisible = ['path', 'property_type', 'area', 'city', 'standard', 'notes'];
  check('brief → wszystkie odpowiedziane pytania uwzględnione', answeredVisible.every((id) => brief.included_question_ids.includes(id)));
  check('brief → nie obcięty (typowy rozmiar)', brief.truncated === false && brief.omitted_question_ids.length === 0);
  check('brief → zawiera etykiety opcji, nie surowe value', brief.text.includes('Projekt wnętrza') && brief.text.includes('Mieszkanie'));
  check('brief → provenance (sesja + wersja)', brief.text.includes('sid') && brief.text.includes(estimateDefinition.version));

  // 13. buildFallbackBrief — pomija pytania niewidoczne warunkowo
  const hiddenAnswers = { path: 'projekt_wnetrza', property_type: 'mieszkanie', rooms_selected: ['salon'] };
  const brief2 = buildFallbackBrief(estimateDefinition, hiddenAnswers, { session_id: 'sid', form_version: 'v' });
  check('brief → pomija odpowiedź na pytanie ukryte warunkowo (rooms_selected)', !brief2.included_question_ids.includes('rooms_selected'));

  // 13b. buildFallbackBrief — zawiera inspiracje (etykiety, nie surowe id)
  const inspAnswers = { path: 'projekt_wnetrza', property_type: 'mieszkanie', inspiration_ids: ['jasne-otwarte', 'ciemne-eleganckie'] };
  const brief4 = buildFallbackBrief(estimateDefinition, inspAnswers, { session_id: 'sid', form_version: 'v' });
  check('brief → zawiera wybrane inspiracje', brief4.included_question_ids.includes('inspiration_ids'));
  check('brief → inspiracje jako etykiety', brief4.text.includes('Jasne i otwarte') && brief4.text.includes('Ciemne i eleganckie'));

  // 13c. definicja ma krok inspiracji z opcjami media + „nie wiem", bez mapowania na pakiet
  const inspStep = estimateDefinition.steps.find((s) => s.id === 'inspiration');
  const inspQ = inspStep && inspStep.questions[0];
  check('definicja: krok inspiracji istnieje', !!inspStep);
  check('definicja: typ inspiration + maxSelect', inspQ && inspQ.type === 'inspiration' && inspQ.maxSelect === 3);
  check('definicja: opcje inspiracji mają mediaId', !!inspQ && inspQ.options.some((o) => o.mediaId));
  check('definicja: opcja „nie wiem" bez mediaId', !!inspQ && inspQ.options.some((o) => o.value === 'nie_wiem' && !o.mediaId));

  // 14. buildFallbackBrief — przy przekroczeniu limitu NIE obcina po cichu
  const bigAnswers = { path: 'projekt_wnetrza', property_type: 'mieszkanie', notes: 'x'.repeat(500), city: 'Warszawa' };
  const brief3 = buildFallbackBrief(estimateDefinition, bigAnswers, { session_id: 'sid', form_version: 'v' }, 120);
  check('brief → przy przekroczeniu limitu ustawia truncated + marker', brief3.truncated === true && brief3.text.includes('[dalsze szczegóły'));
  check('brief → mieści się w limicie', brief3.text.length <= 120);

  console.log(`\nWynik: ${pass} PASS, ${failCount} FAIL\n`);
  process.exit(failCount === 0 ? 0 : 1);
}

run().catch((e) => { console.error(e); process.exit(1); });
