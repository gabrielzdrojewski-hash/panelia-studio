# Dane prawne — braki do uzupełnienia (wewnętrzne)

Dokument **wewnętrzny**. Na stronie **NIE publikujemy placeholderów jako danych prawnych**.
Pola poniżej są wymagane przed publikacją produkcyjną i muszą zostać dostarczone przez właściciela.

> Struktura podmiotów (potwierdzone założenie biznesowe):
> - **Projekt** — realizowany przez działalność projektową / JDG (umowa projektowa).
> - **Wykonanie** — realizowane przez spółkę z o.o. (umowa wykonawcza).
> Projekt i realizacja to jeden skoordynowany proces, ale **dwie odrębne umowy**.

## Działalność projektowa (JDG)

- [ ] Pełna nazwa JDG — **DO UZUPEŁNIENIA**
- [ ] NIP — **DO UZUPEŁNIENIA**
- [ ] Adres — **DO UZUPEŁNIENIA**

## Spółka realizacyjna (sp. z o.o.)

- [ ] Pełna nazwa spółki — **DO UZUPEŁNIENIA**
- [ ] NIP — **DO UZUPEŁNIENIA**
- [ ] KRS — **DO UZUPEŁNIENIA**
- [ ] Adres — **DO UZUPEŁNIENIA**

## Role i procesy

- [ ] Administrator danych osobowych (który podmiot?) — **DO UZUPEŁNIENIA**
- [ ] Podmiot przyjmujący lead z formularza — **DO UZUPEŁNIENIA**
- [ ] Podmiot podpisujący **umowę projektową** — JDG (potwierdzić dane)
- [ ] Podmiot podpisujący **umowę wykonawczą** — sp. z o.o. (potwierdzić dane)
- [ ] Polityka prywatności — pełne dane administratora (obecnie `polityka-prywatnosci` zawiera
      komentarz „do uzupełnienia" zamiast pełnych danych rejestrowych)
- [ ] Przekazywanie danych do Fatica ERP — podstawa prawna, umowa powierzenia, zakres danych

## Gdzie w kodzie/tekście czeka na te dane

- `src/pages/polityka-prywatnosci.astro` — administrator, dane rejestrowe (komentarz TODO w pliku).
- `src/pages/proces.astro` — nota o dwóch umowach (tekst ogólny, bez danych rejestrowych — OK do czasu uzupełnienia).
- `src/data/site.ts` — `contact` (telefon/e-mail/adres potwierdzone z żywej strony); brak NIP/KRS/nazw podmiotów.
- Stopka — copyright „Panelia Studio" (bez danych rejestrowych; do rozważenia dopisanie po uzupełnieniu).

**Zasada:** dopóki dane nie zostaną dostarczone, nie wpisywać zmyślonych NIP/KRS/nazw. Używać
sformułowań ogólnych i oznaczać braki.
