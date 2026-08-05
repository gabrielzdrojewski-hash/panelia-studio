# Panelia Studio — Contact Gateway → Fatica ERP (Runbook)

Operacyjny opis bezpiecznego tworzenia leadów z formularza kontaktowego `paneliastudio.pl`
w Fatica ERP. **Jedno źródło prawdy** dla integracji kontaktowej (`docs/FATICA_INTEGRATION.md`
odsyła tutaj). Repozytorium **nie zawiera** tokenów ani sekretów.

> Stan: **CODE COMPLETE — WAITING FOR ERP TOKEN**. Formularz jest domyślnie wyłączony
> (`PUBLIC_CONTACT_FORM_ENABLED=false`) — produkcja pokazuje kontakt bezpośredni.

## 1. Diagram przepływu i role

```
przeglądarka (ContactForm.astro, src/lib/contact.ts)
  → POST https://paneliastudio.pl/api/contact        (same-origin)
    ↳ Apache .htaccess: RewriteRule ^api/contact$ → api/contact.php
      → public/api/contact.php (PHP gateway)          [walidacja, antyspam, rate limit, token]
        → POST https://app.fatica.pl/api/public/leads (Authorization: Bearer <TOKEN>)
          → Fatica ERP: lead organizacji Panelia Studio
```

- **Strona (paneliastudio.pl):** UI, walidacja UX, budowa payloadu, wywołanie **wyłącznie** `/api/contact`.
  Gateway PHP: niezależna walidacja serwerowa, antyspam, rate limit, dodanie tokenu, wywołanie ERP,
  mapowanie odpowiedzi, logi. **Strona NIE wysyła e-maili powiadomień.**
- **Fatica ERP:** przyjęcie leada, `EventOutbox` i **wysyłka powiadomień e-mail** (BOK/biuro),
  zapis komunikacji, widoczność w Portalu Klienta.

Przeglądarka **nigdy** nie wywołuje `app.fatica.pl` bezpośrednio i nie zna tokenu.

## 2. Endpointy
- Publiczny endpoint strony: `POST https://paneliastudio.pl/api/contact`
- Endpoint ERP (server-side): `POST https://app.fatica.pl/api/public/leads`

## 3. Konfiguracja prywatna (poza repo)
Kolejność odczytu przez gateway: **1) `getenv()`, 2) prywatny plik**
`/domains/paneliastudio.pl/private_html/panelia-erp-config.php`
(ścieżka liczona względem `public_html/api/contact.php` przez `dirname(__DIR__, 2)` — bez hardcodu konta).

Wzór: `docs/examples/panelia-erp-config.php.example`. Klucze: `enabled`, `erp_public_leads_url`,
`erp_token`, `request_timeout_ms`, `connect_timeout_ms`, `mock`, `rate_limit_max_requests`,
`rate_limit_window_seconds` (opcjonalnie `ip_hash_salt`).

Zmienne env (opcjonalne, nadpisują plik): `FATICA_ERP_PUBLIC_LEADS_URL`, `FATICA_ERP_PANELIA_TOKEN`,
`FATICA_ERP_REQUEST_TIMEOUT_MS`, `FATICA_ERP_CONTACT_MOCK`, `FATICA_ERP_CONTACT_ENABLED`.

## 4. Feature flag (build-time)
`PUBLIC_CONTACT_FORM_ENABLED` (jedyna publiczna zmienna; token **nie** może mieć prefiksu `PUBLIC_`).
- `false` (domyślnie) — `/kontakt` pokazuje kontakt bezpośredni; formularz **nie** jest renderowany.
- `true` — `/kontakt` renderuje formularz + telefon/e-mail jako alternatywę.

Flaga steruje wyłącznie renderem HTML podczas builda Astro. **PHP nie zakłada**, że wartości z buildu
są dostępne podczas requestu — konfiguracja gatewaya pochodzi wyłącznie z env/pliku prywatnego.

## 5. Payload do ERP (snake_case)
```jsonc
{
  "name": "...", "email": "...", "phone": "... | null",
  "package_interest": "panelia_complete | ... | null",
  "message": "...", "consent": true,
  "submitted_at": "ISO-8601",
  "source": "paneliastudio.pl",           // ZAWSZE ustawiane serwerowo
  "landing_page": "... | null", "referrer": "... | null",
  "utm_source": null, "utm_medium": null, "utm_campaign": null,
  "utm_content": null, "utm_term": null,
  "idempotency_key": "panelia-contact-<UUID v4>"
}
```
Gateway **nie wysyła**: `organization_id`, `organization_slug`, adresów powiadomień, danych nadawcy e-mail,
tokenu. Nagłówki do ERP: `Authorization: Bearer <TOKEN>`, `Content-Type/Accept: application/json`,
`Idempotency-Key: <ten sam>`, `X-Correlation-ID: <correlation id>`.

## 6. Pakiety (dozwolone `package_interest`)
`panelia_concept`, `panelia_complete`, `panelia_signature`,
`panelia_finish_start`, `panelia_finish_comfort`, `panelia_finish_premium`.
Źródło prawdy: `src/lib/contact.ts` (`packageOptions`) i stała `PANELIA_ALLOWED_PACKAGES` w gatewayu.

## 7. Walidacja serwerowa (niezależna od klienta)
- `name` wymagane, 2–150, bez HTML; `email` wymagane, lowercase, ≤254, `FILTER_VALIDATE_EMAIL`;
- `phone` opcjonalne, ≤40, zachowany wiodący `+`, tylko cyfry; `message` wymagane, 10–5000, bez HTML;
- `consent` dokładnie `true`; `package_interest` tylko z listy; `landing_page` tylko host
  `paneliastudio.pl`/`www.paneliastudio.pl` (odrzuca `javascript:`/`data:`); `referrer` http/https;
- UTM ≤255, plain text; `submitted_at` ISO lub czas serwera; `idempotency_key`
  `panelia-contact-<UUIDv4>` (serwer generuje tylko awaryjnie).

## 8. Antyspam
- **Honeypot** `company` — jeśli wypełniony: neutralna odpowiedź 200, brak wysyłki, log bez PII.
- **Minimalny czas formularza** — `form_started_at`; wysyłka < 2 s → neutralna odpowiedź, brak wysyłki.
- **Origin/Referer** — dozwolone tylko `https://paneliastudio.pl` i `https://www.paneliastudio.pl`;
  obcy Origin/Referer → 403. Brak Origin w zwykłym formularzu nie blokuje (inne zabezpieczenia działają).
- Nie ufamy polom: `source`, `organization_id`, `organization_slug`, `notification_recipients`,
  `sender_email`, `token`, `mock` (z klienta).

## 9. Rate limit
Lokalny, plikowy (`flock`, zapis atomowy) w `private_html/panelia-rate-limit/`.
Domyślnie **5 prób / 15 min**, klucz = hash IP (salt z konfiguracji prywatnej; IP nie jest zapisywane w jawnej
postaci). Poważny błąd ochrony → neutralny **503** (nie wyłączamy zabezpieczenia po cichu). Danych zgłoszenia
(e-mail, telefon, treść) **nie** zapisujemy w rate-limicie.

## 10. Idempotency i Correlation ID
- `idempotency_key` generuje frontend (`panelia-contact-<UUID>`), **ten sam** przy retry, nowy dopiero po sukcesie.
  Przekazywany do ERP jako `Idempotency-Key`. Idempotentne powtórzenie zwrócone przez ERP jako 200 = sukces.
- `X-Correlation-ID` (`panelia-request-<losowy>`) generuje serwer niezależnie; trafia do ERP i do logów.

## 11. Timeout i retry
cURL, TLS włączone (`VERIFYPEER=true`, `VERIFYHOST=2`). Connect 5000 ms, total 10000 ms.
Maks. **1 retry** (ten sam payload, idempotency, correlation), backoff ~350 ms. Retry **tylko** dla:
timeout / błąd transportu / 502 / 503 / 504. Brak retry dla: 400/401/403/404/409/422/429.

## 12. Mapowanie odpowiedzi (do przeglądarki)
| Wynik ERP | Odpowiedź strony |
| --- | --- |
| 200 / 201 (i idempotentne 200) | 200 `{ ok:true, message, request_id }` |
| 422 | 422 `{ ok:false, field_errors, request_id }` (tylko publiczne pola) |
| 401 / 403 | 503 „Formularz chwilowo niedostępny…" |
| 429 | 429 + `Retry-After` (jeśli dostępne) |
| timeout / transport / 500 / 502 / 503 / 504 | 503 „Nie udało się teraz wysłać…" |
| nieznane | 502 neutralny błąd |
Surowe body ERP **nie** trafia do przeglądarki.

## 13. Logi (prywatne, zamaskowane)
`private_html/logs/panelia-contact.log` (JSON per linia): timestamp, correlation id, etap, próba,
czas odpowiedzi, status ERP, timeout, rodzaj błędu, hash IP, landing (host/ścieżka), zamaskowany e-mail, wynik.
**Nie logujemy**: tokenu/Authorization, pełnego payloadu, pełnej wiadomości, jawnego e-maila/telefonu,
treści zgody, danych konfiguracji prywatnej. Błąd zapisu logu nie ujawnia ścieżki klientowi.

## 14. Bezpieczny mock
Aktywny **tylko** gdy prywatna konfiguracja spełnia **jednocześnie** `mock=true` **oraz** `allow_mock=true`
(oba domyślnie `false`). Samo `mock=true` na produkcji nie udaje sukcesu. Nie ufamy `mock`/`mock_scenario`
z klienta (sterują tylko scenariuszem, nie włączają mocka). Brak tokenu lub `enabled=false` → **zawsze**
bezpieczny błąd 503 (nigdy fałszywy sukces). Mock nie wysyła do ERP, nie zapisuje pełnych danych;
symuluje `201/422/429/503/timeout` (pole `mock_scenario`) — do testów lokalnych/staging.

## 15. Testy
- **PHP jednostkowe:** `php tests/contact-gateway/run-tests.php` (walidacja, HTML strip, idempotency,
  landing/UTM/URL, maskowanie).
- **Statyczne/sekrety/build:** `npm run check:contact` (brak tokenu/ERP/Authorization w kliencie i dist,
  rewrite `.htaccess`, brak cen/INVEST/STANDARD, 11 stron, `dist/api/contact.php`, php lint+testy jeśli dostępne).
- **Lint PHP:** `php -l public/api/contact.php`.
- Dwa buildy kontrolne: `PUBLIC_CONTACT_FORM_ENABLED=false` (formularz ukryty) oraz `=true` (formularz widoczny).

### Test staging
Ustaw prywatną konfigurację z `mock=true` (lub token stagingowy), włącz `PUBLIC_CONTACT_FORM_ENABLED=true`,
wyślij zgłoszenia symulujące 201/422/429/503/timeout, sprawdź komunikaty i logi (maskowanie).

### Test produkcyjny
Po otrzymaniu tokenu: prywatny plik z `enabled=true` + `mock=false`, wyślij **jeden** testowy lead,
potwierdź w Fatica ERP (lead + powiadomienia), następnie usuń testowy lead.

## 16. Aktywacja
1. Serwer: utwórz `private_html/panelia-erp-config.php` (na wzór example) z realnym tokenem, `enabled=true`, `mock=false`.
2. Zbuduj front z `PUBLIC_CONTACT_FORM_ENABLED=true`, wgraj `dist/` (w tym `dist/api/contact.php`).
3. Potwierdź `.htaccess` (rewrite `/api/contact`), uprawnienia katalogów `private_html/logs` i `.../panelia-rate-limit`.
4. Wykonaj test produkcyjny (jeden lead) i usuń go.

## 17. Wyłączenie / rollback
- Szybkie wyłączenie UI: rebuild z `PUBLIC_CONTACT_FORM_ENABLED=false` (powrót do kontaktu bezpośredniego).
- Wyłączenie backendu: w prywatnej konfiguracji `enabled=false` lub usunięcie tokenu → gateway zwraca 503.
- Rollback: przywróć poprzedni `dist/` (kontakt bezpośredni); endpoint bez tokenu jest bezpieczny (503).

## 18. Rotacja tokenu
Token wyłącznie w `private_html` (lub env serwera). Rotacja: uzyskaj nowy token w Fatica ERP → podmień w
prywatnej konfiguracji → zweryfikuj testowym leadem → unieważnij stary token. Token nigdy nie trafia do repo,
bundla, logów ani do przeglądarki.

## 19. Troubleshooting
- Klient widzi 503 mimo poprawnych danych → brak tokenu/`enabled=false`, albo ERP 401/403 (sprawdź log: `erp_status`).
- 429 → lokalny rate limit lub ERP 429 (log: `stage`, `retry_after`).
- Timeout → log `timeout=true`, `attempts=2`; sprawdź dostępność ERP/sieci.
- Formularz niewidoczny → flaga `PUBLIC_CONTACT_FORM_ENABLED` w buildzie.
- Brak logów → uprawnienia `private_html/logs` (błąd zapisu nie jest pokazywany klientowi).

## 20. Bezpieczeństwo (podsumowanie)
Token/endpoint ERP tylko po stronie serwera; TLS wymuszone; brak sekretów w repo/bundlu; walidacja i sanityzacja
serwerowa; rate limit i honeypot; logi zamaskowane; `source` wymuszany serwerowo; brak CORS dla obcych domen.

## 21. Odpowiedzialność EventOutbox / powiadomień
**Wysyłka powiadomień e-mail (BOK/biuro), EventOutbox i zapis komunikacji leada należą do Fatica ERP.**
Strona `paneliastudio.pl` **nie** odpowiada za wysyłkę e-maili — jedynie przekazuje lead do ERP.

---

## DANE WYMAGANE Z FATICA ERP PRZED AKTYWACJĄ
1. Potwierdzenie endpointu `POST https://app.fatica.pl/api/public/leads`.
2. Token przypisany **wyłącznie** do organizacji Panelia Studio.
3. Scope: `public_leads:create` (lub rzeczywista nazwa odpowiedniego scope).
4. Potwierdzenie obsługi `Authorization: Bearer`.
5. Potwierdzenie obsługi `Idempotency-Key`.
6. Potwierdzenie obsługi `X-Correlation-ID`.
7. Dokładne odpowiedzi dla: 200, 201, 401, 403, 422, 429, 500, 502, 503, 504.
8. Format odpowiedzi idempotentnego powtórzenia.
9. Konfiguracja organizacji: `source = paneliastudio.pl`.
10. Powiadomienia: `bok@paneliastudio.pl`, `biuro@paneliastudio.pl`.
11. Sender wiadomości: `Panelia Studio <bok@paneliastudio.pl>`.
12. Zapis komunikacji przy leadzie.
13. Widoczność komunikacji w Portalu Klienta.
14. Testowy lead możliwy do późniejszego usunięcia.
15. Instrukcja rotacji i unieważnienia tokenu.
