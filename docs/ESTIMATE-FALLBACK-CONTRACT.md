# Kontrakt fallback/ERP dla „Wyceń swoje wnętrze" (`/wycena`)

Dokument opisuje, jak frontend Panelii klasyfikuje odpowiedź `/api/estimate` i kiedy — oraz kiedy
**nie** — wolno uruchomić kanał zapasowy `/api/contact`. Kod: `src/lib/estimate.ts`
(`classifyEstimateEndpoint`, `submitEstimate`, `FALLBACK_ALLOWED`, `buildFallbackBrief`).
Dowód zachowania: `tests/estimate/decision.test.mjs` (`npm run test:estimate`).

## Przepływ
```
/api/estimate  → jawna klasyfikacja (transport + domena)
               → decyzja wg tabeli (terminal / kontrolowany fallback / neutralny błąd)
kontrolowany fallback → /api/contact (sprawdzony, E2E-validated gateway) → manual_quote
```
Cena pochodzi **wyłącznie** z Fatica ERP. Frontend nigdy nie liczy ani nie zgaduje ceny.

## Tabela decyzji
| Odpowiedź `/api/estimate` | Outcome | Fallback `/api/contact`? | UX |
| --- | --- | --- | --- |
| 2xx `ok:true` + `range`/`exact` | `calculated` | **NIE** (terminal) | pokaż cenę z ERP |
| 2xx `ok:true` (przyjęte, `manual_quote`/`lead_id`) | `manual_quote_accepted` | **NIE** (terminal) | „wycena indywidualna, opiekun się skontaktuje" |
| 503 `result_type=not_configured` | `not_configured` | **TAK** (kontrolowany) | manual_quote |
| 404 (endpoint estymacji niewdrożony) | `backend_not_ready` | **TAK** (kontrolowany, udokumentowany) | manual_quote |
| brak odpowiedzi (sieć/timeout/abort) | `network_error` | **NIE** (ERP idempotentne — patrz niżej) | neutralny błąd; klient ponawia |
| 422 | `validation_error` | **NIE** | neutralny błąd, popraw dane |
| 429 | `rate_limited` | **NIE** (nie obchodzić rate limitu) | „za dużo zgłoszeń, spróbuj za chwilę" (+`Retry-After`) |
| 401 / 403 | `forbidden` | **NIE** | neutralny błąd |
| inne 4xx | `client_error` | **NIE** | neutralny błąd |
| 5xx (poza `not_configured`) | `server_error` | **NIE** (ryzyko duplikatu) | neutralny błąd + kontakt bezpośredni |

## Kiedy wolno użyć `/api/contact`
Tylko dla `FALLBACK_ALLOWED = { not_configured, backend_not_ready }`.
Wspólny mianownik: **ERP jawnie sygnalizuje, że estymacja nie przyjęła zgłoszenia (brak leada)** → brak ryzyka duplikatu.

## Kiedy fallback jest ZABRONIONY
`validation_error (422)`, `rate_limited (429)`, `forbidden (401/403)`, `client_error (4xx)`,
`server_error (5xx)`, `network_error` (brak odpowiedzi) oraz każdy sukces (`calculated`, `manual_quote_accepted`).
Zasada: **nie tworzymy drugiego leada tylko dlatego, że estimator zwrócił błąd**, i nie omijamy
rate limitu innym endpointem.

## Ochrona przed duplikatem leada
Jeżeli `/api/estimate` odpowie sukcesem (`2xx` + `ok:true`) — niezależnie od `range`/`exact`/`manual_quote` —
zgłoszenie (zawierające `answers` + `contact`) uznajemy za **przyjęte przez ERP**. To stan **terminalny**:
frontend **nie** wykonuje `POST /api/contact`. Test dowodzi: `manual_quote accepted → 0 wywołań /api/contact`.

## Idempotency
- `submitEstimate` wysyła stabilny `idempotency_key` w submission do `/api/estimate` **oraz** w
  fallbackowym `/api/contact` (ten sam klucz).
- Klucz jest **ten sam przy ponowieniu** tego samego zgłoszenia; nowy powstaje dopiero po sukcesie
  (logika w wizardzie: klucz regenerowany tylko dla wyniku innego niż `error`).
- Deduplikację wykonuje **serwer/ERP** — frontend jedynie przekazuje identyfikator (bez dedup w przeglądarce).

## `network_error` — USUNIĘTY z fallbacku (final integration)
Odkąd ERP `POST /api/public/estimate` **ma prawdziwą idempotencję** (unikat `(organization_id, idempotency_key)`)
i **sam tworzy lead**, brak odpowiedzi (timeout/abort) przestał być jednoznaczny — ERP mógł przyjąć zgłoszenie
mimo braku odpowiedzi. Fallback trafiłby do **innego** endpointu (`/api/contact` → `/api/public/leads`, osobna
tabela idempotencji `public_lead_submissions`), więc mógłby utworzyć **drugi** lead. Dlatego `network_error`
→ neutralny błąd; **klient ponawia z tym samym `idempotency_key`**, a ERP deduplikuje. Pozostałe warunki
fallbacku (`not_configured`, `backend_not_ready`) są bezpieczne, bo oznaczają, że ERP **nie** przyjął zgłoszenia.

## Bramka `/api/estimate` (proxy do ERP) i server-side config
`public/api/estimate.php` jest **config-gated proxy** do ERP (analogicznie do `public/api/contact.php`):
przeglądarka → `POST /api/estimate` → `POST {erp_estimate_url}` (server-side, token z secure_config).
Adres i token pozostają **wyłącznie** po stronie serwera (secure_config poza web-rootem) — nigdy w bundlu klienta.

Wymagane klucze w `secure_config/panelia-erp-config.php` (ustawia operator; repo ich NIE zapisuje):
- `erp_estimate_url` — pełny URL, np. `https://app.fatica.pl/api/public/estimate` **[WYMAGANE — bez niego bramka zwraca `not_configured`]**
- `erp_estimate_token` — token ze scope **`public_estimates:create`** *(opcjonalne; brak → reuse `erp_token`; wtedy ten token musi mieć dodane `public_estimates:create` po stronie ERP)*
- opcjonalnie: `request_timeout_ms`, `connect_timeout_ms`, oraz do E2E `mock` + `allow_mock` + `is_production=false`

Mapowanie ERP→klient (w `estimate.php`): 2xx `ok:true` → `200` (terminal); `422`→`422`; `401/403`→`403`;
`429`→`429`(+`Retry-After`); `503`→`503 not_configured` (fallback); `5xx`/timeout/transport → `502` (server_error,
**bez** fallbacku — unik duplikatu). Dopóki `erp_estimate_url` nie jest ustawione, bramka zwraca `not_configured`
i obowiązuje dotychczasowy, sprawdzony fallback do `/api/contact`.

## „Fallback brief" — co zachowuje, a czego NIE gwarantuje
`buildFallbackBrief` buduje **czytelny tekst** (pole `message` w `/api/contact`) z pytań **aktualnie
widocznych i odpowiedzianych** (etykiety opcji, nie surowe `value`) + prowenansu (`session_id`,
`form_version`). Nie obcina po cichu — przy przekroczeniu limitu ustawia `truncated` i widoczny marker.

**Fallback brief NIE jest strukturalnym payloadem `answers`.** Kontrakt `/api/contact` przenosi go
jako tekst w `message` (limit ~5000 znaków) i **nie** posiada pól `answers`/`form_version`.

**ERP GAP:** pełne, strukturalne `answers` + `form_version` + provenance/audit trail są gwarantowane
dopiero przez docelowy endpoint estymacji Fatica ERP (`/api/estimate` → ERP). Do tego czasu leady z
konfiguratora docierają przez `/api/contact` z briefem tekstowym.

## Status kontraktu ERP (zewnętrzne API)
Dostarczone przez Fatica ERP `POST /api/public/estimate` (scope `public_estimates:create`):
1. ✅ Publiczny endpoint estymacji z zapisem leada + strukturalne `answers` + `form_version` (provenance).
2. ✅ Jednoznaczny kontrakt akceptacji (`ok`, `lead_id`, `lead_delivered`) i kody 200/201/422/429/503.
3. ✅ Deduplikacja po `idempotency_key` (unikat `(organization_id, idempotency_key)`) — bezpieczny retry/timeout.
4. ✅ Prowenans/audit (ActivityLog + EventOutbox po stronie ERP).
5. Pricing: obecnie `NotConfiguredPricingEngine` → `manual_quote` (poprawny sukces 2xx; ERP nie zgaduje ceny).
   Priced `estimate` (gdy pojawi się silnik) będzie wymagał dopięcia mapowania cen w bramce/`normalizeEstimateResult`.

## Pozostałe kroki wdrożeniowe (poza kodem Panelii)
- Wdrożenie ERP na produkcję (endpoint dostępny publicznie).
- Ustawienie `erp_estimate_url` (+ scope `public_estimates:create` na tokenie) w secure_config.
- Dopiero wtedy bramka przechodzi z `not_configured` (fallback do `/api/contact`) na realne proxy do ERP.
