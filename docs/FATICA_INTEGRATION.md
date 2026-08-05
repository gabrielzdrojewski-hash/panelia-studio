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

Zgłoszenia z formularza kontaktowego trafiają docelowo do Fatica ERP jako lead.

- **Warstwa klienta:** `src/components/ContactForm.astro` waliduje dane i buduje payload.
- **Warstwa integracji:** `src/lib/contact.ts` → funkcja `sendContactForm(payload)`.
  Obecnie zwraca stan demonstracyjny; docelowo wykona `fetch` do serwerowego endpointu, który
  przekaże dane do Fatica ERP.

### Rekomendowany przepływ

```
Formularz (klient)
  → endpoint serwerowy strony (proxy, np. Astro server endpoint z adapterem / funkcja serverless)
  → POST {FATICA_API_URL}/api/public/leads   (nagłówek autoryzacji dodawany po stronie serwera)
```

Proxy jest konieczne, aby token organizacji nie trafił do przeglądarki.

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

- [ ] Dodać serwerowy endpoint proxy dla `POST /api/public/leads` (adapter Astro / serverless).
- [ ] Skonfigurować zmienne środowiskowe: adres API i token organizacji (poza repo).
- [ ] Zaimplementować `sendContactForm` tak, aby wywoływała proxy zamiast trybu demo.
- [ ] Zaimplementować pobieranie showcase w `getShowcaseProjects()` z fallbackiem lokalnym.
- [ ] Dodać mapowanie odpowiedzi ERP → `Project` oraz obsługę błędów.
- [ ] Testy: walidacja `package_interest`, obsługa błędów sieci, zachowanie fallbacku.
