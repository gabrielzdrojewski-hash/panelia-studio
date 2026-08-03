# Panelia Studio

Repozytorium nowej strony **paneliastudio.pl**.

## Stan początkowy

- uporządkowane logo w wariantach SVG i PNG,
- 18 wizualizacji,
- 12 zdjęć prawdziwej realizacji,
- manifest mediów: `src/data/media.json`,
- arkusze podglądowe w `docs/`,
- minimalny fundament Astro do dalszej pracy w Claude Code.

## Kluczowe zasady projektu

1. Na stronie **nie pokazujemy cen pakietów**.
2. Zachowujemy obecny kierunek wizualny Panelia Studio.
3. Docelowa domena to `https://paneliastudio.pl`.
4. Zdjęcia w `public/media/realizations/` są prawdziwymi realizacjami.
5. Materiały w `public/media/visualizations/` są wizualizacjami i nie wolno przedstawiać ich jako ukończonych realizacji.
6. Stary WordPress pozostaje kopią bezpieczeństwa do czasu zaakceptowania i sprawdzenia nowej wersji.
7. Nie usuwamy dokumentacji, brandingu ani materiałów źródłowych bez świadomej decyzji.

## Uruchomienie

```powershell
cd "C:\Projects\panelia-studio"
npm install
npm run dev
```

## Struktura

```text
public/
  brand/
  media/
    realizations/
    visualizations/
src/
  data/media.json
  pages/
  styles/
docs/
```

## Ważne

Plik `src/pages/index.astro` jest wyłącznie roboczym podglądem fundamentu. Ma `noindex` i nie powinien być wdrażany jako wersja produkcyjna bez dalszej pracy.
