# CLAUDE.md — Panelia Studio

Pracuj po polsku. To jest nowa strona Panelia Studio przeznaczona bezpośrednio dla `paneliastudio.pl`.

## Bezwzględne reguły

- Nie pokazuj cen pakietów ani stawek za m².
- Zachowaj obecny, elegancki i minimalistyczny kierunek wizualny marki.
- Nie usuwaj dokumentacji, logo, zdjęć ani manifestu mediów.
- Nie przedstawiaj materiałów z `public/media/visualizations/` jako prawdziwych realizacji.
- Sekcja „Realizacje” może korzystać wyłącznie z `public/media/realizations/`, chyba że treść wyraźnie oznacza materiał jako wizualizację lub koncepcję.
- Nie wdrażaj na produkcję bez wcześniejszego backupu WordPressa i planu rollbacku.
- Nie nadpisuj konfiguracji hostingu ani domeny bez jednoznacznej instrukcji.
- Nie dodawaj WooCommerce, sklepu, koszyka, konta klienta ani demonstracyjnych treści z poprzedniego motywu.

## Praca z mediami

- Źródłem prawdy jest `src/data/media.json`.
- Każdy obraz ma stabilne `id`, `path`, `type`, `title` i `alt`.
- Zachowuj rozróżnienie `realization` / `visualization`.
- Nie zmieniaj nazw plików bez równoczesnej aktualizacji manifestu.

## Kierunek techniczny

- Astro + TypeScript.
- Komponenty proste, semantyczne, responsywne i dostępne.
- Minimalna liczba zależności.
- SEO i wydajność są wymagane, ale najpierw zgodność wizualna i poprawna treść.
- Polskie znaki muszą działać poprawnie.
