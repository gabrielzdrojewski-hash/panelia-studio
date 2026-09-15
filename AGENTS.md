# AGENTS.md — zasady pracy AI

Przed rozpoczęciem pracy przeczytaj `README.md`, `CLAUDE.md` (jeśli istnieje), dokumentację projektu oraz instrukcje w podkatalogach. Zasady projektowe pozostają nadrzędne, gdy są bardziej restrykcyjne.

<!-- SHARED-AI-WORK-RULES-V1:START -->
## Wspólny standard promptów i raportowania

Przed każdym kompletnym promptem zawsze podaj po polsku:

1. **Co robi ten prompt** — krótki opis wyniku biznesowego i technicznego.
2. **Co jest już zrobione** — wyłącznie stan potwierdzony w repozytorium, PR-ach i testach.
3. **Co przed nami do samego końca** — bieżąca paczka, następne znane paczki, finalne QA/security, review właściciela, merge, wdrożenie i weryfikacja produkcyjna. Oddziel fakty, plan, blockery i decyzje właściciela.
4. **Co użytkownik ma zrobić teraz** — tylko gdy akcja jest potrzebna, zawsze z bezpośrednim linkiem Markdown do dokładnego PR-a, workflow, runu, ustawienia, pliku lub strony.

Nie nazywaj projektu ani paczki ukończoną, jeśli istnieje jedynie otwarty PR, nieukończone testy, brak aktualnej zgody właściciela albo brak weryfikacji po wdrożeniu.

Każdy prompt przekazuj w dokładnym formacie:

```text
:::writing{variant="standard" id="<unikalny identyfikator 5-cyfrowy>"}
#NNN[-CONTINUE-N] — NAZWA PROMPTU

[Treść promptu]

#NNN[-CONTINUE-N] — NAZWA PROMPTU — END
:::
```

Numer ustal z istniejącego rejestru promptów lub historii projektu — nie zgaduj. Kontynuacja zachowuje numer i dostaje przyrostek `-CONTINUE-N`. Pierwszy i ostatni nagłówek muszą mieć identyczny numer i nazwę; ostatni zawsze kończy się `END`.

Dodatkowe reguły:

- jedna paczka = jedna gałąź i jeden PR, o ile właściciel nie zdecyduje inaczej;
- nie mieszaj niezwiązanych tematów ani repozytoriów;
- nie merguj, nie wdrażaj i nie wykonuj mutacji produkcyjnych bez osobnej, aktualnej zgody właściciela;
- przed pracą sprawdź świeży `origin/main`, otwarte PR-y, workflow, kod, testy, ADR-y i dokumentację;
- zielone testy lokalne nie zastępują świeżego Release Gate na dokładnym finalnym HEAD;
- nie ujawniaj sekretów, tokenów, haseł ani danych produkcyjnych;
- raport końcowy zawiera root cause, base SHA, finalny HEAD, zmienione pliki, bezpieczeństwo/izolację, testy, linki do PR-a i Release Gate, świadomie niewykonane akcje oraz jednoznaczny status;
- reguły specyficzne dla tego repo pozostają wiążące, a zasada bardziej restrykcyjna ma pierwszeństwo.

Kanoniczny wzorzec: https://github.com/gabrielzdrojewski-hash/zasady-pracy-gpt
<!-- SHARED-AI-WORK-RULES-V1:END -->
