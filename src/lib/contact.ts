// Warstwa integracji formularza kontaktowego.
//
// STAN OBECNY: tryb demonstracyjny. Formularz NIE wysyła danych do żadnego systemu.
// Nie ma tu żadnych tokenów ani sekretów.
//
// PUNKT INTEGRACJI Z FATICA ERP (Panelia Studio):
// Docelowo zgłoszenie trafi do Fatica ERP przez publiczny endpoint:
//   POST /api/public/leads
// Rekomendowany przepływ:
//   1. Utworzyć endpoint po stronie serwera (np. Astro server endpoint z adapterem,
//      funkcja serverless lub proxy), który przyjmie payload i wywoła API Fatica.
//   2. Sekrety (adres API, token organizacji) trzymać wyłącznie po stronie serwera
//      w zmiennych środowiskowych — nigdy w kodzie klienta ani w repozytorium.
//   3. Podmienić implementację `sendContactForm` tak, aby wykonywała `fetch` do tego endpointu.
//
// Szczegóły w docs/FATICA_INTEGRATION.md.

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

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  // Wybrany pakiet (opcjonalnie) — jedna z dozwolonych wartości PackageInterest.
  packageInterest: PackageInterest | '';
  message: string;
  consent: boolean;
  // Znacznik czasu ustawiany przy wysyłce (po stronie klienta).
  submittedAt: string;
}

export interface ContactResult {
  ok: boolean;
  demo: boolean;
  message: string;
}

// Docelowo: fetch do serwerowego endpointu integrującego z Fatica ERP (POST /api/public/leads).
// Obecnie: brak realnej wysyłki — zwraca stan demonstracyjny.
export async function sendContactForm(payload: ContactPayload): Promise<ContactResult> {
  // MIEJSCE INTEGRACJI (po stronie serwera):
  // const response = await fetch('/api/public/leads', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload),
  // });
  // if (!response.ok) throw new Error('Nie udało się wysłać zgłoszenia.');
  // return { ok: true, demo: false, message: 'Dziękujemy — wiadomość została wysłana.' };

  void payload; // Payload jest gotowy do przekazania do integracji.
  return {
    ok: true,
    demo: true,
    message:
      'To jest wersja demonstracyjna formularza. Wiadomość nie została wysłana. Prosimy o kontakt telefoniczny lub e-mailowy.',
  };
}
