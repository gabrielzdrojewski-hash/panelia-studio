// Warstwa integracji „Wyceń swoje wnętrze" (guided estimate).
//
// GRANICA ARCHITEKTURY:
//   - Frontend NIE liczy ceny i NIE zna reguł cenowych. Cena pochodzi WYŁĄCZNIE z Fatica ERP.
//   - Klient rozmawia tylko z własnym, same-origin endpointem `/api/estimate` (server-side adapter),
//     nie zna tokenu, adresu ani sekretów ERP.
//   - Dopóki estymacja ERP nie jest gotowa, `/api/estimate` zwraca bezpiecznie `not_configured`
//     (503) — NIGDY fałszywej/losowej ceny. Lead + brief są wtedy dostarczane sprawdzonym,
//     produkcyjnym kanałem `/api/contact` (nie budujemy drugiego systemu leadowego).

import { sendContactForm, type ContactRequest, type PackageInterest } from './contact';

// Re-eksport dla warstwy danych/definicji (jedno miejsce importu typów estymacji).
export type { PackageInterest } from './contact';

// ————————————————————————————— MODEL FORMULARZA (data-driven) —————————————————————————————

export type QuestionType = 'single' | 'multi' | 'number' | 'text' | 'textarea';

export interface EstimateOption {
  value: string;
  label: string;
  hint?: string;
}

export interface VisibilityRule {
  questionId: string;
  in: string[]; // widoczne, gdy odpowiedź na questionId zawiera się w tej liście
}

export interface EstimateQuestion {
  id: string;
  type: QuestionType;
  label: string;
  help?: string;
  required?: boolean;
  options?: EstimateOption[];
  placeholder?: string;
  unit?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  autocomplete?: string;
  inputmode?: string;
  visibleWhen?: VisibilityRule;
}

export interface EstimateStep {
  id: string;
  title: string;
  intro?: string;
  questions: EstimateQuestion[];
  visibleWhen?: VisibilityRule;
}

export interface EstimateDefinition {
  version: string;
  source: 'panelia_fallback' | 'fatica_erp';
  steps: EstimateStep[];
}

export type AnswerValue = string | string[] | number | undefined;
export type EstimateAnswers = Record<string, AnswerValue>;

export interface EstimateContact {
  name: string;
  email: string;
  phone: string;
  consent: boolean;
}

export interface EstimateSession {
  session_id: string;
  form_version: string;
  path_choice: string | null; // wybrana ścieżka (projekt / wykończenie / oba / nie wiem)
  page_url: string;
  landing_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  started_at: string; // ISO
  answers: EstimateAnswers;
}

// ————————————————————————————— WYNIK / BŁĄD —————————————————————————————

export type EstimateResultType = 'range' | 'exact' | 'manual_quote' | 'not_configured' | 'error';

// Jawna klasyfikacja odpowiedzi endpointu estymacji (transport + domena).
// Steruje decyzją, czy WOLNO uruchomić fallback do /api/contact.
export type EstimateOutcome =
  | 'calculated' //           2xx + range/exact — TERMINAL, pokaż cenę
  | 'manual_quote_accepted' // 2xx + ok, ERP przyjął zgłoszenie — TERMINAL, bez fallbacku
  | 'not_configured' //       503 result_type=not_configured — kontrolowany fallback
  | 'backend_not_ready' //    404 — endpoint estymacji jeszcze nie wdrożony — kontrolowany fallback
  | 'validation_error' //     422 — NIE fallbackować
  | 'rate_limited' //         429 — NIE fallbackować (nie omijać rate limitu)
  | 'forbidden' //            401/403 — NIE fallbackować (błąd autoryzacji/konfiguracji)
  | 'client_error' //         inne 4xx — NIE fallbackować
  | 'server_error' //         5xx (poza not_configured) — NIE fallbackować (ryzyko duplikatu)
  | 'network_error'; //       brak odpowiedzi (sieć/timeout/abort) — kontrolowany fallback

export interface EstimateResult {
  result_type: EstimateResultType;
  price_from: number | null;
  price_to: number | null;
  price_gross: number | null;
  currency: string | null;
  package: Record<string, unknown> | null;
  summary: string | null;
  included_items: string[];
  excluded_items: string[];
  disclaimer: string | null;
  lead_id: string | null;
  lead_delivered: boolean;
  request_id?: string;
  outcome?: EstimateOutcome; // skąd wynik (diagnostyka/analytics; bez PII)
  retry_after?: number; // sekundy (dla rate_limited)
}

function emptyResult(type: EstimateResultType): EstimateResult {
  return {
    result_type: type,
    price_from: null,
    price_to: null,
    price_gross: null,
    currency: null,
    package: null,
    summary: null,
    included_items: [],
    excluded_items: [],
    disclaimer: null,
    lead_id: null,
    lead_delivered: false,
  };
}

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/**
 * Normalizuje LUŹNĄ odpowiedź ERP na stabilny kształt UI. Nigdy nie wymyśla ceny:
 * jeśli typ jest nieznany lub brak danych cenowych — degraduje do 'manual_quote'.
 */
export function normalizeEstimateResult(raw: unknown): EstimateResult {
  if (!raw || typeof raw !== 'object') return emptyResult('manual_quote');
  const r = raw as Record<string, unknown>;

  const rawType = str(r.estimate_type) ?? str(r.result_type);
  const priceFrom = num(r.price_from);
  const priceTo = num(r.price_to);
  const priceGross = num(r.price_gross);

  let type: EstimateResultType;
  if (rawType === 'range' && (priceFrom !== null || priceTo !== null)) type = 'range';
  else if (rawType === 'exact' && (priceGross !== null || priceFrom !== null)) type = 'exact';
  else if (rawType === 'not_configured') type = 'not_configured';
  else if (rawType === 'error') type = 'error';
  else type = 'manual_quote'; // nieznane / brak ceny → bezpieczna wycena indywidualna

  const result = emptyResult(type);
  if (type === 'range' || type === 'exact') {
    result.price_from = priceFrom;
    result.price_to = priceTo;
    result.price_gross = priceGross;
    result.currency = str(r.currency) ?? 'PLN';
  }
  result.package = r.package && typeof r.package === 'object' ? (r.package as Record<string, unknown>) : null;
  result.summary = str(r.summary);
  result.included_items = strList(r.included_items);
  result.excluded_items = strList(r.excluded_items);
  result.disclaimer = str(r.disclaimer);
  result.lead_id = str(r.lead_id);
  return result;
}

// ————————————————————————————— WYSYŁKA —————————————————————————————

export interface EstimateSubmission {
  source: 'paneliastudio.pl';
  form_version: string;
  session_id: string;
  page_url: string;
  landing_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  submitted_at: string;
  consent: boolean;
  // Stabilny klucz idempotencji — TEN SAM dla /api/estimate i fallbackowego /api/contact,
  // TEN SAM przy ponowieniu tego samego zgłoszenia (nowy dopiero po sukcesie). Deduplikację
  // wykonuje serwer/ERP — frontend jedynie przekazuje identyfikator.
  idempotency_key: string;
  answers: EstimateAnswers;
  contact: EstimateContact;
}

export interface SubmitEstimateInput {
  session: EstimateSession;
  contact: EstimateContact;
  brief: string; // czytelny opis odpowiedzi — do leada w kanale kontaktowym (manual quote)
  packageInterest: PackageInterest | null;
  idempotencyKey: string;
  signal?: AbortSignal;
}

const ESTIMATE_ENDPOINT = '/api/estimate';

// Outcomy, przy których WOLNO uruchomić kontrolowany fallback do /api/contact.
// Wspólny mianownik: ERP NIE potwierdził przyjęcia żadnego zgłoszenia → brak ryzyka duplikatu.
//   - not_configured / backend_not_ready: adapter jawnie sygnalizuje brak estymacji ERP.
//   - network_error: brak odpowiedzi. Bezpieczne DOPÓKI /api/estimate nie tworzy leada w ERP.
//     ERP GAP: gdy estymacja ERP zacznie zapisywać lead, timeout/network musi albo NIE fallbackować,
//     albo ERP musi deduplikować po idempotency_key (patrz raport / runbook).
const FALLBACK_ALLOWED: ReadonlySet<EstimateOutcome> = new Set([
  'not_configured',
  'backend_not_ready',
  'network_error',
]);

export interface EstimateEndpointClassification {
  outcome: EstimateOutcome;
  result?: EstimateResult; // dla calculated / manual_quote_accepted
  message?: string;
  retryAfter?: number;
  requestId?: string;
}

/**
 * Woła /api/estimate i JAWNIE klasyfikuje odpowiedź (transport + domena).
 * NIE decyduje o fallbacku — decyzję podejmuje submitEstimate wg FALLBACK_ALLOWED.
 */
export async function classifyEstimateEndpoint(
  submission: EstimateSubmission,
  signal?: AbortSignal,
): Promise<EstimateEndpointClassification> {
  let res: Response;
  try {
    res = await fetch(ESTIMATE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(submission),
      signal,
    });
  } catch {
    return { outcome: 'network_error' }; // brak odpowiedzi (sieć/timeout/abort)
  }

  let body: unknown = {};
  try {
    const text = await res.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const requestId = typeof b.request_id === 'string' ? b.request_id : undefined;
  const message = typeof b.message === 'string' ? b.message : undefined;
  const rawType =
    typeof b.result_type === 'string' ? b.result_type
      : typeof b.estimate_type === 'string' ? b.estimate_type
        : undefined;

  // 2xx + ok=true → ERP PRZYJĄŁ zgłoszenie (i ewentualnie policzył). TERMINAL — bez fallbacku.
  if (res.ok && b.ok === true) {
    const normalized = normalizeEstimateResult(b.result ?? b);
    normalized.request_id = requestId;
    const explicitDelivered = b.lead_delivered === true || typeof b.lead_id === 'string';
    if (normalized.result_type === 'range' || normalized.result_type === 'exact') {
      normalized.lead_delivered = explicitDelivered;
      return { outcome: 'calculated', result: normalized, requestId };
    }
    // manual_quote / inny typ przy sukcesie → ERP zaakceptował zgłoszenie (zawiera answers+kontakt).
    normalized.result_type = 'manual_quote';
    normalized.lead_delivered = true;
    return { outcome: 'manual_quote_accepted', result: normalized, requestId };
  }

  // Błędy — jawna klasyfikacja po statusie HTTP.
  const status = res.status;
  const retryHeader = Number(res.headers.get('Retry-After'));
  const retryAfter = Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : undefined;

  if (status === 503 && rawType === 'not_configured') return { outcome: 'not_configured', requestId, message };
  if (status === 404) return { outcome: 'backend_not_ready', requestId, message };
  if (status === 422) return { outcome: 'validation_error', requestId, message };
  if (status === 429) return { outcome: 'rate_limited', requestId, message, retryAfter };
  if (status === 401 || status === 403) return { outcome: 'forbidden', requestId, message };
  if (status >= 400 && status < 500) return { outcome: 'client_error', requestId, message };
  return { outcome: 'server_error', requestId, message }; // 5xx (poza jawnym not_configured)
}

/**
 * Deterministyczny „fallback brief" — czytelny opis odpowiedzi do leada wysyłanego kanałem
 * /api/contact, gdy estymacja ERP nie jest dostępna. To NIE jest strukturalny payload answers:
 * kontrakt /api/contact przenosi go w polu `message` (tekst). Uwzględnia tylko pytania AKTUALNIE
 * widoczne i odpowiedziane; nie obcina po cichu — przy przekroczeniu limitu ustawia `truncated`.
 */
export interface FallbackBrief {
  text: string;
  truncated: boolean;
  included_question_ids: string[];
  omitted_question_ids: string[];
}

export function buildFallbackBrief(
  def: EstimateDefinition,
  answers: EstimateAnswers,
  meta: { session_id: string; form_version: string },
  maxLength = 4900,
): FallbackBrief {
  const matches = (rule?: VisibilityRule): boolean => {
    if (!rule) return true;
    const val = answers[rule.questionId];
    if (Array.isArray(val)) return val.some((v) => rule.in.includes(v));
    return typeof val === 'string' && rule.in.includes(val);
  };
  const labelForValue = (q: EstimateQuestion, value: string): string =>
    q.options?.find((o) => o.value === value)?.label ?? value;

  const lines: { id: string; line: string }[] = [];
  for (const step of def.steps) {
    if (!matches(step.visibleWhen)) continue;
    for (const q of step.questions) {
      if (!matches(q.visibleWhen)) continue;
      const v = answers[q.id];
      if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
      let text: string;
      if (Array.isArray(v)) text = v.map((x) => labelForValue(q, x)).join(', ');
      else if (q.type === 'single') text = labelForValue(q, String(v));
      else text = String(v) + (q.unit ? ` ${q.unit}` : '');
      lines.push({ id: q.id, line: `• ${q.label}: ${text}` });
    }
  }

  const header = 'Zgłoszenie z konfiguratora „Wyceń swoje wnętrze".';
  const provenance = ['', `Sesja: ${meta.session_id}`, `Wersja formularza: ${meta.form_version}`];
  const marker = '… [dalsze szczegóły przekażemy podczas kontaktu]';
  const overhead = header.length + provenance.join('\n').length + marker.length + 8;
  const budget = Math.max(0, maxLength - overhead);

  const included: string[] = [];
  const omitted: string[] = [];
  let body = '';
  let truncated = false;
  for (const { id, line } of lines) {
    const next = body ? `${body}\n${line}` : line;
    if (next.length <= budget) {
      body = next;
      included.push(id);
    } else {
      omitted.push(id);
      truncated = true;
    }
  }

  const parts = [header, '', body];
  if (truncated) parts.push(marker);
  parts.push(...provenance);
  const full = parts.join('\n');
  const finalText = full.length <= maxLength ? full : full.slice(0, maxLength);
  return { text: finalText, truncated, included_question_ids: included, omitted_question_ids: omitted };
}

/**
 * Buduje ContactRequest do dostarczenia leada+briefu sprawdzonym kanałem `/api/contact`.
 * Używane, gdy estymacja ERP nie jest jeszcze dostępna — nie tracimy leada.
 */
function briefToContactRequest(input: SubmitEstimateInput): ContactRequest {
  const s = input.session;
  return {
    name: input.contact.name,
    email: input.contact.email,
    phone: input.contact.phone || undefined,
    package_interest: input.packageInterest,
    message: input.brief,
    consent: input.contact.consent,
    submitted_at: new Date().toISOString(),
    landing_page: s.landing_page,
    referrer: s.referrer,
    utm_source: s.utm_source,
    utm_medium: s.utm_medium,
    utm_campaign: s.utm_campaign,
    utm_content: s.utm_content,
    utm_term: s.utm_term,
    idempotency_key: input.idempotencyKey,
    client_request_id: s.session_id,
    form_started_at: Date.parse(s.started_at) || undefined,
  };
}

// Neutralne komunikaty UX — bez kodów HTTP, nazw systemów, tokenów, ścieżek serwera i stack trace.
const ESTIMATE_MESSAGES = {
  validation: 'Sprawdź poprawność wprowadzonych informacji i spróbuj ponownie.',
  rate_limited: 'Wysłano zbyt wiele zgłoszeń. Spróbuj ponownie za chwilę.',
  unavailable:
    'Nie udało się teraz przygotować wyceny. Spróbuj ponownie za chwilę lub skontaktuj się z nami bezpośrednio.',
} as const;

function errorResult(outcome: EstimateOutcome, summary: string, cls: EstimateEndpointClassification): EstimateResult {
  const r = emptyResult('error');
  r.outcome = outcome;
  r.summary = summary;
  r.retry_after = cls.retryAfter;
  r.request_id = cls.requestId;
  return r;
}

/**
 * Wysyła wycenę. Zwraca zawsze rozstrzygnięty EstimateResult (nie rzuca).
 *
 * Tabela decyzji (patrz EstimateOutcome / FALLBACK_ALLOWED):
 *   calculated / manual_quote_accepted → TERMINAL (ERP obsłużył zgłoszenie) — BEZ /api/contact.
 *   not_configured / backend_not_ready / network_error → kontrolowany fallback do /api/contact.
 *   validation_error / rate_limited / forbidden / client_error / server_error → neutralny błąd, BEZ fallbacku.
 * Nigdy nie zwraca zmyślonej ceny i nie obchodzi rate limitu innym endpointem.
 */
export async function submitEstimate(input: SubmitEstimateInput): Promise<EstimateResult> {
  const s = input.session;
  const submission: EstimateSubmission = {
    source: 'paneliastudio.pl',
    form_version: s.form_version,
    session_id: s.session_id,
    page_url: s.page_url,
    landing_page: s.landing_page,
    referrer: s.referrer,
    utm_source: s.utm_source,
    utm_medium: s.utm_medium,
    utm_campaign: s.utm_campaign,
    utm_content: s.utm_content,
    utm_term: s.utm_term,
    submitted_at: new Date().toISOString(),
    consent: input.contact.consent,
    idempotency_key: input.idempotencyKey,
    answers: s.answers,
    contact: input.contact,
  };

  const cls = await classifyEstimateEndpoint(submission, input.signal);

  switch (cls.outcome) {
    case 'calculated':
    case 'manual_quote_accepted':
      // ERP obsłużył zgłoszenie (policzył lub przyjął). TERMINAL — NIE wołamy /api/contact
      // (ochrona przed duplikatem leada).
      return cls.result!;
    case 'validation_error':
      return errorResult('validation_error', ESTIMATE_MESSAGES.validation, cls);
    case 'rate_limited':
      return errorResult('rate_limited', ESTIMATE_MESSAGES.rate_limited, cls);
    case 'forbidden':
    case 'client_error':
    case 'server_error':
      return errorResult(cls.outcome, ESTIMATE_MESSAGES.unavailable, cls);
    case 'not_configured':
    case 'backend_not_ready':
    case 'network_error':
      break; // kontrolowany fallback poniżej
  }

  // Zabezpieczenie: fallback tylko dla jawnie dozwolonych outcomes.
  if (!FALLBACK_ALLOWED.has(cls.outcome)) {
    return errorResult(cls.outcome, ESTIMATE_MESSAGES.unavailable, cls);
  }

  // KONTROLOWANY FALLBACK — dostarcz lead+brief sprawdzonym /api/contact (bez ceny).
  // Ten sam idempotency_key co w submission ERP (dedup po stronie serwera).
  const contactResult = await sendContactForm(briefToContactRequest(input), input.signal);
  if (contactResult.ok) {
    const r = emptyResult('manual_quote');
    r.outcome = cls.outcome;
    r.lead_delivered = true;
    r.request_id = contactResult.requestId;
    return r;
  }

  const err = emptyResult('error');
  err.outcome = cls.outcome;
  err.retry_after = contactResult.retryAfter;
  err.summary = contactResult.message ?? ESTIMATE_MESSAGES.unavailable;
  err.request_id = contactResult.requestId;
  return err;
}
