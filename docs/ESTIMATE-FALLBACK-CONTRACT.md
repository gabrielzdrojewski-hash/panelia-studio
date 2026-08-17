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
| brak odpowiedzi (sieć/timeout/abort) | `network_error` | **TAK** (jawna decyzja, patrz niżej) | manual_quote |
| 422 | `validation_error` | **NIE** | neutralny błąd, popraw dane |
| 429 | `rate_limited` | **NIE** (nie obchodzić rate limitu) | „za dużo zgłoszeń, spróbuj za chwilę" (+`Retry-After`) |
| 401 / 403 | `forbidden` | **NIE** | neutralny błąd |
| inne 4xx | `client_error` | **NIE** | neutralny błąd |
| 5xx (poza `not_configured`) | `server_error` | **NIE** (ryzyko duplikatu) | neutralny błąd + kontakt bezpośredni |

## Kiedy wolno użyć `/api/contact`
Tylko dla `FALLBACK_ALLOWED = { not_configured, backend_not_ready, network_error }`.
Wspólny mianownik: **ERP nie potwierdził przyjęcia żadnego zgłoszenia** → brak ryzyka duplikatu.

## Kiedy fallback jest ZABRONIONY
`validation_error (422)`, `rate_limited (429)`, `forbidden (401/403)`, `client_error (4xx)`,
`server_error (5xx)` oraz każdy sukces (`calculated`, `manual_quote_accepted`).
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

## `network_error` — jawna decyzja i warunek bezpieczeństwa
Dziś `/api/estimate` (adapter) **nie tworzy leada** (zwraca `not_configured`), więc brak odpowiedzi
oznacza, że ERP niczego nie zapisał → fallback jest bezpieczny i nie gubi leada.
**ERP GAP:** gdy estymacja ERP zacznie **zapisywać lead**, `network_error`/timeout przestaje być
jednoznaczny (ERP mógł przyjąć zgłoszenie mimo braku odpowiedzi). Wtedy należy albo usunąć
`network_error` z `FALLBACK_ALLOWED`, albo ERP musi deduplikować po `idempotency_key`.

## „Fallback brief" — co zachowuje, a czego NIE gwarantuje
`buildFallbackBrief` buduje **czytelny tekst** (pole `message` w `/api/contact`) z pytań **aktualnie
widocznych i odpowiedzianych** (etykiety opcji, nie surowe `value`) + prowenansu (`session_id`,
`form_version`). Nie obcina po cichu — przy przekroczeniu limitu ustawia `truncated` i widoczny marker.

**Fallback brief NIE jest strukturalnym payloadem `answers`.** Kontrakt `/api/contact` przenosi go
jako tekst w `message` (limit ~5000 znaków) i **nie** posiada pól `answers`/`form_version`.

**ERP GAP:** pełne, strukturalne `answers` + `form_version` + provenance/audit trail są gwarantowane
dopiero przez docelowy endpoint estymacji Fatica ERP (`/api/estimate` → ERP). Do tego czasu leady z
konfiguratora docierają przez `/api/contact` z briefem tekstowym.

## Czego jeszcze musi dostarczyć Fatica ERP (ERP GAPS)
1. Publiczny endpoint estymacji (kalkulacja + zapis leada z pełnymi `answers`/`form_version`).
2. Jednoznaczny kontrakt akceptacji zgłoszenia (`ok`, `lead_id`, `lead_delivered`) i kodów 200/201/422/429/503.
3. Deduplikacja po `idempotency_key` (warunek bezpiecznego retry/timeout).
4. Prowenans/audit trail konfiguracji po stronie ERP.
