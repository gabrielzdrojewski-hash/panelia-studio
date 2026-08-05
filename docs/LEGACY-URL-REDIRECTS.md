# Mapowanie starych adresów WordPress → nowa strona (propozycja)

Dokument **wewnętrzny, propozycja**. Przekierowań **NIE wdrożono** w tej rundzie.
Do wdrożenia na poziomie hostingu/serwera (np. reguły serwera, nie w kodzie Astro), po backupie WordPressa.

Legenda:
- **301** — trwałe przekierowanie do odpowiednika na nowej stronie (przenosi wartość SEO).
- **410** — treść trwale usunięta (WooCommerce, demo) — „Gone", by wypadła z indeksu.
- **noindex** — tymczasowo, jeśli strona musi chwilowo istnieć przed usunięciem.

| Stary URL (WordPress) | Akcja | Cel / uwaga |
| --- | --- | --- |
| `/` (stara strona główna) | 301 | `/` |
| `/home-2-2/` | 301 | `/` |
| `/about-us/` | 301 | `/o-nas` |
| `/contact-us/` | 301 | `/kontakt` |
| `/pricing-plan/` | 301 | `/pakiety` (bez cen na nowej stronie) |
| `/services/` , `/uslugi/` | 301 | `/oferta` |
| stare pojedyncze usługi `/service/...` | 301 | `/oferta` (lub `/oferta#…`) |
| stare projekty / portfolio `/project/...`, `/portfolio/...` | 301 | `/realizacje` lub `/wizualizacje` (zależnie od typu) |
| stare galerie `/gallery/...` | 301 | `/wizualizacje` |
| `/blog/`, `/blog/*` | 301 lub 410 | brak bloga na nowej stronie — 301 do `/` albo 410, jeśli treści demo |
| `/sample-page/` | 410 | strona przykładowa WordPress |
| strony testowe / demo (`/test/`, `/demo/`, `/elementor-*`) | 410 | treści demonstracyjne |
| `/shop/` | 410 | brak sklepu (WooCommerce usunięty) |
| `/cart/` | 410 | brak koszyka |
| `/checkout/` | 410 | brak kasy |
| `/my-account/` | 410 | brak konta klienta |
| `/wishlist/` | 410 | brak listy życzeń |
| `/product/*`, `/product-category/*` | 410 | produkty WooCommerce |
| `/wp-content/uploads/*` | 301 (wybrane) / 410 | nowa strona nie zależy od starych uploadów; przekierować tylko jeśli konkretny plik ma odpowiednik |
| feed/`/feed/`, `/?p=…` | 301 | `/` |

## Zasady

- Nie przekierowywać automatycznie wszystkiego do `/` — mapować sensownie; resztę 410.
- WooCommerce (`shop/cart/checkout/my-account/product`) → **410** (nie ma odpowiednika i nie wróci).
- Zachować listę realnych starych URL-i po eksporcie z WordPressa (Screaming Frog / mapa witryny) i uzupełnić tabelę.
- Po wdrożeniu przekierowań zweryfikować w Google Search Console (raport indeksowania).

## DO USTALENIA

- Pełna lista rzeczywistych starych URL-i (eksport z obecnego WordPressa) — **wymaga uzupełnienia**.
- Czy blog będzie kontynuowany (jeśli tak — 301 do przyszłej sekcji, nie 410).
