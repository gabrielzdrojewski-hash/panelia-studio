// Warstwa klienta formularza kontaktowego.
//
// Klient wywołuje WYŁĄCZNIE własny endpoint `/api/contact` (PHP gateway na paneliastudio.pl).
// Klient NIE zna adresu Fatica ERP, tokenu, organizacji ani odbiorców powiadomień —
// te dane są wyłącznie po stronie serwera. Runbook: docs/PANELIA-ERP-CONTACT-RUNBOOK.md.

// Dozwolone wartości pola package_interest — wyłącznie te sześć.
export type PackageInterest =
  | 'panelia_concept'
  | 'panelia_complete'
  | 'panelia_signature'
  | 'panelia_finish_start'
  | 'panelia_finish_comfort'
  | 'panelia_finish_premium';

export interface PackageOption {
  value: PackageInterest;
  label: string;
  group: 'Pakiety projektowe' | 'Pakiety wykończeniowe';
}

export const packageOptions: PackageOption[] = [
  { value: 'panelia_concept', label: 'Panelia Concept', group: 'Pakiety projektowe' },
  { value: 'panelia_complete', label: 'Panelia Complete', group: 'Pakiety projektowe' },
  { value: 'panelia_signature', label: 'Panelia Signature', group: 'Pakiety projektowe' },
  { value: 'panelia_finish_start', label: 'Panelia Start', group: 'Pakiety wykończeniowe' },
  { value: 'panelia_finish_comfort', label: 'Panelia Comfort', group: 'Pakiety wykończeniowe' },
  { value: 'panelia_finish_premium', label: 'Panelia Premium', group: 'Pakiety wykończeniowe' },
];

export const ALLOWED_PACKAGE_VALUES: PackageInterest[] = packageOptions.map((o) => o.value);

export function isPackageInterest(value: string): value is PackageInterest {
  return (ALLOWED_PACKAGE_VALUES as string[]).includes(value);
}

// Granica API — snake_case, zgodnie z payloadem ERP. `source` ustawia serwer (nie klient).
export interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  package_interest?: PackageInterest | null;
  message: string;
  consent: boolean;
  submitted_at: string;
  landing_page?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  idempotency_key: string;
  client_request_id?: string;
  form_started_at?: number; // epoch ms
  company?: string; // honeypot (zwykle pusty)
}

export type ContactOutcome =
  | 'success'
  | 'validation'
  | 'rate_limit'
  | 'unavailable'
  | 'network';

export interface ContactResult {
  ok: boolean;
  outcome: ContactOutcome;
  status: number; // HTTP status z gatewaya (0 = sieć/timeout)
  message: string;
  fieldErrors?: Record<string, string>;
  requestId?: string;
  retryAfter?: number; // sekundy, jeśli dostępne
}

const ENDPOINT = '/api/contact';

const MESSAGES: Record<Exclude<ContactOutcome, 'success'>, string> = {
  validation: 'Sprawdź zaznaczone pola formularza.',
  rate_limit: 'Wysłano zbyt wiele zgłoszeń. Spróbuj ponownie za chwilę.',
  unavailable:
    'Nie udało się teraz wysłać zgłoszenia. Spróbuj ponownie za chwilę lub skontaktuj się z nami bezpośrednio.',
  network:
    'Nie udało się połączyć. Sprawdź połączenie i spróbuj ponownie lub skontaktuj się z nami bezpośrednio.',
};

/**
 * Wysyła zgłoszenie do własnego gatewaya `/api/contact`.
 * Zwraca zawsze rozstrzygnięty wynik (nie rzuca), z jednoznacznym `outcome`.
 * Nigdy nie udaje sukcesu i nie zwraca trybu demo.
 */
export async function sendContactForm(
  payload: ContactRequest,
  signal?: AbortSignal,
): Promise<ContactResult> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
  } catch {
    // Przerwanie (AbortController) lub błąd sieci/timeout.
    return { ok: false, outcome: 'network', status: 0, message: MESSAGES.network };
  }

  // Bezpieczne parsowanie JSON (endpoint zawsze zwraca JSON, ale nie zakładamy tego ślepo).
  let body: Record<string, unknown> = {};
  try {
    const text = await res.text();
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    body = {};
  }

  const requestId = typeof body.request_id === 'string' ? body.request_id : undefined;
  const serverMessage = typeof body.message === 'string' ? body.message : undefined;
  const retryHeader = Number(res.headers.get('Retry-After'));
  const retryAfter = Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : undefined;

  if (res.ok && body.ok === true) {
    return {
      ok: true,
      outcome: 'success',
      status: res.status,
      message:
        serverMessage ??
        'Dziękujemy. Otrzymaliśmy Twoje zgłoszenie. Zespół Panelia Studio skontaktuje się z Tobą.',
      requestId,
    };
  }

  if (res.status === 422) {
    const fe = body.field_errors;
    const fieldErrors =
      fe && typeof fe === 'object' ? (fe as Record<string, string>) : undefined;
    return {
      ok: false,
      outcome: 'validation',
      status: 422,
      message: serverMessage ?? MESSAGES.validation,
      fieldErrors,
      requestId,
    };
  }

  if (res.status === 429) {
    return {
      ok: false,
      outcome: 'rate_limit',
      status: 429,
      message: serverMessage ?? MESSAGES.rate_limit,
      retryAfter,
      requestId,
    };
  }

  // 503 (niedostępny/konfiguracja/5xx), 502, 400, 401, 403, 405, 413, 415 → traktuj jako niedostępny.
  return {
    ok: false,
    outcome: 'unavailable',
    status: res.status,
    message: serverMessage ?? MESSAGES.unavailable,
    requestId,
  };
}
