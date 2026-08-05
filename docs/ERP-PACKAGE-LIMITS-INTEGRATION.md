# Integracja limitów pakietów z Fatica ERP (wewnętrzne)

Dokument **wewnętrzny** — opisuje docelowe pobieranie ilości/limitów zakresu z Fatica ERP dla
strony `/pakiety`. **Nie trafia do publicznego `dist/`** (katalog `docs/` nie jest kopiowany do buildu).
Na obecnym etapie **integracja NIE jest wdrożona** — teksty limitów są tymczasowe/ogólne.

> Zasady bezpieczeństwa (bez zmian):
> - **Nie publikować** cen, marż, stawek, kwot, danych dostawców ani wewnętrznych warunków.
> - Nie tworzyć fikcyjnych wartości limitów na froncie.
> - Nie tworzyć obecnie atrapy endpointu.

## 1. Pola strony wymagające danych z ERP

Wartości ilościowe/limitowe, które docelowo powinny pochodzić z ERP (dziś ogólne):

| Miejsce | Pole / wiersz | Stan obecny (tymczasowy) |
| --- | --- | --- |
| `finishComparison` (packages.ts) | „Zmiany elektryczne” · COMFORT | „Zakres w ofercie” |
| `finishComparison` (packages.ts) | „Zmiany wodno-kanalizacyjne” · COMFORT | „Zakres w ofercie” |
| `materialTableShort` (materialStandards.ts) | „Zmiany instalacyjne” · COMFORT | „Zakres w ofercie” |
| moduł „Łazienka” / „Sufity” | ilości, formaty | opisy jakościowe, bez liczb |
| pasy COMFORT/PREMIUM | „w ramach oferty” | fraza ogólna |

Nota zbiorcza na stronie (raz, nie przy każdym wierszu):
„Dokładne ilości, limity oraz ewentualne elementy dodatkowe są wskazywane w indywidualnej ofercie
przygotowanej na podstawie powierzchni, projektu i wybranego standardu.”

## 2. Teksty tymczasowe

Wszystkie sformułowania typu „Zakres w ofercie”, „Zakres określony w indywidualnej ofercie”,
„w ramach oferty” są **tymczasowymi placeholderami**. Po udostępnieniu zatwierdzonych danych z ERP
mogą (opcjonalnie) zostać zastąpione konkretami — wyłącznie po stronie warstwy danych, nie w wielu
komponentach.

## 3. Docelowy payload (publiczny, bez cen)

Proponowany endpoint (docelowo): `GET /api/public/organizations/panelia-studio/package-limits`

```jsonc
{
  "version": "2026-01-15",           // wersjonowanie zestawu limitów
  "packages": {
    "panelia_finish_comfort": {
      "electrical_changes": { "label": "Zmiany elektryczne", "value": "…" },
      "plumbing_changes":   { "label": "Zmiany wod-kan",     "value": "…" },
      "bathrooms":          { "label": "Łazienki",           "value": "…" }
      // wyłącznie wartości bezpieczne publicznie (bez cen/kwot/dostawców)
    },
    "panelia_finish_premium": { /* … */ }
  }
}
```

Mapowanie: `value` → komórka w `finishComparison` / `materialTableShort` / opis modułu.
Pola dozwolone publicznie: `label`, `value`, `version`. **Zabronione**: cena, marża, kwota, dostawca, limit kwotowy.

## 4. Zasady fallbacku

- Źródłem prawdy na froncie pozostają lokalne pliki danych (`packages.ts`, `materialStandards.ts`).
- Jeśli API niedostępne / błąd / brak pola → **fallback do wartości lokalnej** („Zakres w ofercie”).
- Brak twardego wymogu API do renderowania strony (strona działa bez ERP).

## 5. Cache i wersjonowanie

- Odpowiedź cache’ować po `version` (np. build-time fetch + rewalidacja; ETag/`Cache-Control`).
- Zmiana `version` → invalidacja i ponowne pobranie przy następnym buildzie/rewalidacji.
- Wcześniej wygenerowane strony/oferty **nie zmieniają się automatycznie** po aktualizacji limitów
  (spójne z zasadą snapshotów z `docs/FATICA_INTEGRATION.md`).

## 6. Zachowanie po braku API

- Renderuj wartości lokalne (placeholdery).
- Nie pokazuj błędu użytkownikowi, nie blokuj strony.
- Zaloguj po stronie serwera (bez danych wrażliwych).

## 7. Architektura danych (przygotowanie)

- Warstwa danych już oddzielona (`packages.ts`, `materialStandards.ts`) — limity trzymane
  **w jednym miejscu na typ tabeli**, nie rozsypane po komponentach.
- Docelowo dodać cienką warstwę `getPackageLimits()` (analogiczną do `getShowcaseProjects()`),
  która pobierze dane z ERP i scali z lokalnymi (fallback). **Nie implementować teraz.**
