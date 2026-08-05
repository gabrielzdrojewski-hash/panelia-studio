# Integracja z Fatica ERP — dokumentacja techniczna

Dokument opisuje **docelową** integrację strony `paneliastudio.pl` (Astro + TypeScript) z Fatica ERP.
Na obecnym etapie integracja **nie jest wdrożona** — strona działa na danych lokalnych.

> Zasady bezpieczeństwa:
> - W repozytorium **nie ma i nie może być** żadnych tokenów ani sekretów.
> - **Nie** tworzymy atrap (fałszywych) endpointów zwracających udawane dane.
> - Sekrety (adres API, token organizacji) trzymamy wyłącznie po stronie serwera, w zmiennych środowiskowych.
> - Strona docelowa pozostaje w Astro + TypeScript. **Nie** tworzymy wtyczki WordPress.

---

## 1. Formularz kontaktowy → `POST /api/public/leads`

> **Źródło prawdy tej integracji: [`docs/PANELIA-ERP-CONTACT-RUNBOOK.md`](./PANELIA-ERP-CONTACT-RUNBOOK.md).**
> Poniżej skrót; szczegóły (walidacja, antyspam, rate limit, idempotency, retry, mock, aktywacja,
> rollback, rotacja tokenu, dane wymagane z ERP) znajdują się w runbooku.

Zgłoszenia z formularza kontaktowego trafiają do Fatica ERP jako lead przez **gateway PHP** na
tym samym hoście (Astro pozostaje static, bez adaptera Node/SSR).

- **Warstwa klienta:** `src/components/ContactForm.astro` (UI + walidacja UX) oraz
  `src/lib/contact.ts` → `sendContactForm(payload, signal)` — wywołuje **wyłącznie** `/api/contact`.
  Klient nie zna adresu ERP ani tokenu. Tryb demo został usunięty.
- **Warstwa serwerowa (gateway):** `public/api/contact.php` → po buildzie `dist/api/contact.php`.
  Waliduje niezależnie, dodaje token (Bearer) po stronie serwera i wywołuje ERP.
- **Feature flag:** `PUBLIC_CONTACT_FORM_ENABLED` (build-time). Domyślnie `false` → kontakt bezpośredni.

### Przepływ

```
przeglądarka → POST https://paneliastudio.pl/api/contact (Apache rewrite → api/contact.php)
  → public/api/contact.php  (token wyłącznie po stronie serwera)
  → POST https://app.fatica.pl/api/public/leads
```

Gateway PHP jest konieczny, aby token organizacji nie trafił do przeglądarki. Sekrety pochodzą z
`getenv()` lub prywatnego pliku `/domains/paneliastudio.pl/private_html/panelia-erp-config.php`
(wzór: `docs/examples/panelia-erp-config.php.example`).

### Kształt payloadu (z `ContactPayload`)

```jsonc
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "packageInterest": "panelia_concept | panelia_complete | panelia_signature | panelia_finish_start | panelia_finish_comfort | panelia_finish_premium | ''",
  "message": "string",
  "consent": true,
  "submittedAt": "ISO 8601"
}
```

### Dozwolone wartości `package_interest`

Pole przyjmuje **wyłącznie** poniższe wartości (lub pusty string „do ustalenia”):

| Wartość                    | Pakiet            | Kategoria              |
| -------------------------- | ----------------- | ---------------------- |
| `panelia_concept`          | Panelia Concept   | projektowy             |
| `panelia_complete`         | Panelia Complete  | projektowy             |
| `panelia_signature`        | Panelia Signature | projektowy             |
| `panelia_finish_start`     | Panelia Start     | projektowo-wykończeniowy |
| `panelia_finish_comfort`   | Panelia Comfort   | projektowo-wykończeniowy |
| `panelia_finish_premium`   | Panelia Premium   | projektowo-wykończeniowy |

Źródło prawdy dla tych wartości: `src/lib/contact.ts` (`packageOptions`, typ `PackageInterest`).

### Zalecana odpowiedź endpointu

- `200/201` — lead przyjęty; front pokazuje komunikat sukcesu.
- `4xx/5xx` — front pokazuje komunikat błędu i zachęca do kontaktu telefonicznego/e-mailowego.

---

## 2. Katalog realizacji → `GET /api/public/organizations/panelia-studio/showcase`

Katalog realizacji (case studies) będzie docelowo pobierany z Fatica ERP.

- **Warstwa danych:** `src/data/projects.ts` → funkcja `getShowcaseProjects()`.
  Obecnie zwraca dane lokalne (`projects`) jako **fallback**.
- **Fallback lokalny:** `src/data/media.json` (manifest mediów) + `src/data/projects.ts`.
  Rozróżnienie `realization` / `visualization` musi zostać zachowane również po stronie ERP.

### Docelowy przepływ

```
Build / render strony
  → GET {FATICA_API_URL}/api/public/organizations/panelia-studio/showcase
  → mapowanie odpowiedzi na typ `Project`
  → w razie błędu / braku odpowiedzi: fallback do danych lokalnych
```

### Oczekiwane mapowanie na typ `Project`

Pola po stronie ERP należy zmapować na `Project` (`src/data/projects.ts`). Łączenie/aktualizacja
rekordów po `slug` lub `externalId`. Minimalny zestaw pól potrzebny stronie:

```jsonc
{
  "slug": "string",
  "name": "string",
  "location": "string",
  "summary": "string",
  "intro": "string",
  "cover": "url | ścieżka",
  "realizations": ["url | ścieżka", "..."],   // typ: realization
  "visualizations": ["url | ścieżka", "..."], // typ: visualization (oznaczane osobno)
  "scope": ["string", "..."],
  "externalId": "string"
}
```

---

## 3. Kolejne kroki wdrożenia (checklista)

- [x] Serwerowy gateway `public/api/contact.php` (proxy do `POST /api/public/leads`) — **gotowy**.
- [x] `sendContactForm` wywołuje `/api/contact` (tryb demo usunięty) — **gotowy**.
- [ ] Skonfigurować sekrety na serwerze: token organizacji w `private_html/panelia-erp-config.php`
      (poza repo) — **oczekuje na token z Fatica ERP** (patrz runbook, sekcja „Dane wymagane z ERP").
- [ ] Zaimplementować pobieranie showcase w `getShowcaseProjects()` z fallbackiem lokalnym.
- [ ] Dodać mapowanie odpowiedzi ERP → `Project` oraz obsługę błędów.
- [ ] Testy: walidacja `package_interest`, obsługa błędów sieci, zachowanie fallbacku.
