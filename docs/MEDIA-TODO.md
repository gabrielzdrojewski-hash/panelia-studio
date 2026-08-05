# Media do uzupełnienia (wewnętrzne — NIE publikować na stronie)

Lista docelowych, dedykowanych materiałów, których obecnie brakuje w repozytorium.
Do czasu ich dodania karty slidera usług używają zdjęć/wizualizacji zastępczych, opisanych
bezpiecznym językiem (bez sugerowania, że dany kadr przedstawia konkretny produkt).

## Brakujące materiały

- [ ] **Rzeczywiste zdjęcie panelu węglowego** — realny produkt z kolekcji Panelia Studio.
      Karta „Panele dekoracyjne i powierzchnie ścienne” używa obecnie zdjęcia realizacji jako
      ilustracji powierzchni dekoracyjnej (nie panelu węglowego).
- [ ] **Zdjęcie lub wizualizacja sufitu napinanego** — potwierdzony materiał.
      Karta „Sufity i oświetlenie” używa obecnie wizualizacji ilustracyjnej; widocznego sufitu
      nie nazywamy napinanym.
- [x] **Estetyczna makieta dokumentacji wykonawczej** — rzut / widok ściany / plan instalacji.
      Uzupełnione grafiką koncepcyjną `05-panelia-dokumentacja-wykonawcza-01`
      (paczka `panelia-category-visuals-4k`), użytą na `/proces` (sekcja „Etapy w obrazach”).
- [ ] **Zdjęcia próbek i kolekcji materiałowych** — do sekcji „Standard materiałowy”.
      Tymczasowo etap „Dobór materiałów” na `/proces` ilustruje grafika koncepcyjna
      `06-panelia-dobor-materialow-01` (próbnik) — to nie zdjęcia realnych kolekcji.

## Media ODRZUCONE — NIE używać

- **`public/media/editorial/panelia-concepts/panelia-premium/panelia-premium-02-soft-contemporary/`**
  (paczka `panelia-premium-02-soft-contemporary-wizualizacje.zip`) — **jakość odrzucona** (`rejected`).
  - NIE generować wariantów WebP; NIE dodawać do `src/data/editorialMedia.ts`;
    NIE używać w hero, galeriach ani kartach pakietów.
  - Pliki pozostają w repo (nie usuwać), oznaczone jako odrzucone. **Uwaga:** katalog został
    w międzyczasie opróżniony poza tym procesem (0 plików) — wpis pozostaje jako blokada
    (nie rejestrować, nie używać), gdyby pliki wróciły.
  - Skutek: **brak zatwierdzonego zestawu mieszkania PREMIUM** — do dostarczenia nowa paczka
    zgodna z preferowaną paletą (jasne beże / greige / ciepła biel / jasne–średnie drewno /
    kamień / drobne czarne akcenty / ograniczone złoto).

- **`public/media/editorial/panelia-concepts/panelia-category-visuals-4k/` — pliki 03, 07, 09, 10:**
  - `07-panelia-panele-dekoracyjne-weglowe-01` — **`rejected`**: ciemny brąz/czerń/złoto, efekt
    hotelowy; sprzeczne z preferowaną, jasną paletą. NIE używać (mimo nazwy „panele dekoracyjne”).
  - `03-panelia-koncepcja-wnetrza-01` — **`review`**: kolaż/moodboard (kilka kadrów + próbnik na
    jednej planszy), a nie pojedynczy kadr. Nie używać do czasu decyzji.
  - `09-panelia-koordynacja-realizacji-01`, `10-panelia-odbior-i-wsparcie-01` — **`review`**:
    nakładki UI (checklisty/klucz) wyglądające jak placeholdery. Nie używać.
  - Dla tych plików **NIE generowano** wariantów WebP i **NIE** rejestrowano ich w `editorialMedia.ts`.

## Media ZATWIERDZONE (zarejestrowane w editorialMedia.ts)

- **Kadry ogólne (koncepcje):** 12 kadrów w `panelia-concepts/` (+ warianty 480/960/1600 WebP).
- **Mieszkania koncepcyjne (zestawy pomieszczeń, `qualityStatus: approved`):**
  - START: `panelia-start-01-jasne-mieszkanie` (3), `panelia-start-02-greige-mieszkanie` (3) — 4:3
  - COMFORT: `panelia-comfort-01-cieple-greige-mieszkanie` (5), `panelia-comfort-02-soft-japandi-mieszkanie` (5) — 4:3
  - SIGNATURE (apartament, prezentowany jako mieszkanie PREMIUM na /wizualizacje):
    `panelia-signature-01-elegancki-apartament` (6) — 16:9
  - Wszystkie z wariantami 480/960/1600 WebP; publiczna etykieta „Wizualizacja koncepcyjna".
- **Paczka `panelia-category-visuals-4k` (kadry tematyczne 4K, `qualityStatus: approved` — 6 z 10):**
  - `01-panelia-hero-cathedral-living-01` (16:9) — baner otwarcia `/pakiety`, inspiracje `/wizualizacje`.
  - `04-panelia-wizualizacje-3d-01` (16:9) — `/proces` (etap projekt i wizualizacje), inspiracje `/wizualizacje`.
  - `08-panelia-sufity-i-oswietlenie-01` (16:9) — `/proces` (etap realizacja), inspiracje `/wizualizacje`.
  - `02-panelia-projekt-funkcjonalny-01`, `05-panelia-dokumentacja-wykonawcza-01`,
    `06-panelia-dobor-materialow-01` (16:9, **grafiki schematyczne**, `isSchematic`) — tylko `/proces`
    (sekcja „Etapy w obrazach”); bez etykiety „Wizualizacja koncepcyjna” (to czytelne schematy).
  - Wszystkie 6 z wariantami 480/960/1600 WebP; oryginały JPG 3840×2160 zachowane.

## Klasyfikacja mediów (obowiązująca)

- `realization` — rzeczywista wykonana realizacja (tylko Ustronie Morskie, `public/media/realizations/`).
- `design_visualization` — wizualizacja konkretnego projektu (`public/media/visualizations/`).
- `editorial_generated_concept` — wygenerowana wizualizacja koncepcyjna (`public/media/editorial/`).
- `moodboard` — typ przyszły.

## Zasady

- Nie tworzyć fikcyjnych rzutów, dokumentów ani parametrów produktu.
- Nie przedstawiać wizualizacji/koncepcji jako realizacji.
- Po dodaniu realnych plików: umieścić w `public/media/…`, dopisać do właściwego rejestru
  (`src/data/media.json` dla realizacji/wizualizacji projektowych, `src/data/editorialMedia.ts`
  dla koncepcji) i podmienić `mediaId` w `src/data/content.ts` (`serviceReel`) — usuwając `TODO(media)`.
