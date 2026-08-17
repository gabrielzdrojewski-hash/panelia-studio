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

async function tryEstimateEndpoint(
  submission: EstimateSubmission,
  signal?: AbortSignal,
): Promise<EstimateResult | null> {
  let res: Response;
  try {
    res = await fetch(ESTIMATE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(submission),
      signal,
    });
  } catch {
    return null; // sieć/timeout/przerwanie → spróbuj kanału zapasowego
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

  // Sukces z realnym wynikiem ERP (obecnie: nieosiągalne, dopóki API estymacji nie istnieje).
  if (res.ok && b.ok === true && (b.result || b.estimate_type || b.result_type)) {
    const normalized = normalizeEstimateResult(b.result ?? b);
    normalized.request_id = requestId;
    return normalized;
  }
  // Jawne not_configured / 503 / 404 → kanał zapasowy (manual quote).
  return null;
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

/**
 * Wysyła wycenę. Zwraca zawsze rozstrzygnięty EstimateResult (nie rzuca).
 * Kolejność: 1) endpoint estymacji ERP (jeśli policzy — pokaż cenę),
 *            2) fallback: dostarcz lead+brief kanałem `/api/contact` → manual_quote.
 * Nigdy nie zwraca zmyślonej ceny.
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
    answers: s.answers,
    contact: input.contact,
  };

  const erp = await tryEstimateEndpoint(submission, input.signal);
  if (erp && (erp.result_type === 'range' || erp.result_type === 'exact')) {
    return erp; // realna wycena z ERP
  }

  // Kanał zapasowy — dostarcz lead+brief sprawdzonym /api/contact (bez ceny).
  const contactResult = await sendContactForm(briefToContactRequest(input), input.signal);
  if (contactResult.ok) {
    const r = emptyResult('manual_quote');
    r.lead_delivered = true;
    r.request_id = contactResult.requestId;
    return r;
  }

  // Nie udało się dostarczyć leada — zwróć błąd (bez ceny), z zachowaniem outcome kontaktu.
  const err = emptyResult(contactResult.outcome === 'rate_limit' ? 'error' : 'error');
  err.summary = contactResult.message;
  err.request_id = contactResult.requestId;
  return err;
}
