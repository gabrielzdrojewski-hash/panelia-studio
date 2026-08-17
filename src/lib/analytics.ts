// Lekkie, semantyczne hooki analityczne — BEZ danych osobowych.
//
// Nie dodajemy zewnętrznego frameworka. Zdarzenia trafiają do:
//   1. window.dataLayer (jeśli w przyszłości podpięty GTM/consent-mode),
//   2. CustomEvent('panelia:analytics') na window (dowolny nasłuch),
//   3. console.debug w trybie DEV.
//
// ZASADA: payload NIGDY nie zawiera imienia, telefonu, e-maila, pełnych odpowiedzi
// ani szczegółowego briefu. Wyłącznie metadane techniczne (krok, wersja formularza, typ wyniku).

export type EstimateEvent =
  | 'estimate_cta_clicked'
  | 'estimate_started'
  | 'estimate_step_completed'
  | 'estimate_contact_reached'
  | 'estimate_submitted'
  | 'estimate_calculated'
  | 'estimate_requires_manual_quote'
  | 'estimate_failed';

export interface AnalyticsPayload {
  path?: string;
  route?: string;
  step_id?: string;
  step_index?: number;
  step_count?: number;
  form_version?: string;
  result_type?: string;
  // Nigdy nie umieszczać tutaj PII ani treści odpowiedzi.
}

// Klucze, które NIGDY nie mogą pojawić się w payloadzie analitycznym (obrona głęboka).
const FORBIDDEN_KEYS = [
  'name',
  'email',
  'phone',
  'message',
  'consent',
  'answers',
  'brief',
  'address',
  'postal_code',
  'contact',
];

function sanitize(payload: AnalyticsPayload): AnalyticsPayload {
  const out: AnalyticsPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (FORBIDDEN_KEYS.includes(key.toLowerCase())) continue;
    if (value === undefined || value === null) continue;
    // Tylko proste, nie-PII wartości.
    if (typeof value === 'string' || typeof value === 'number') {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

export function trackEstimate(event: EstimateEvent, payload: AnalyticsPayload = {}): void {
  if (typeof window === 'undefined') return;
  const detail = { event, ...sanitize(payload) };
  try {
    const w = window as unknown as { dataLayer?: unknown[] };
    if (Array.isArray(w.dataLayer)) w.dataLayer.push(detail);
    window.dispatchEvent(new CustomEvent('panelia:analytics', { detail }));
    if (import.meta.env.DEV) console.debug('[analytics]', detail);
  } catch {
    /* analityka nigdy nie może zablokować UX */
  }
}
