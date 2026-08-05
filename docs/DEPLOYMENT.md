# Wdrożenie — Panelia Studio (paneliastudio.pl)

Dokument **operacyjny**. Nie zawiera danych dostępowych do hostingu.
Sekrety (loginy FTP/SSH, tokeny, hasła DB) trzymaj poza repozytorium.

> **Zasada bezpieczeństwa:** przed jakimkolwiek wdrożeniem wykonaj **pełny backup obecnego
> WordPressa** (pliki + baza) i przygotuj plan rollbacku (sekcja 12). Nie nadpisuj konfiguracji
> domeny/hostingu bez jednoznacznej decyzji właściciela.

## 1. Wymagania środowiska
- Node.js 20 LTS lub nowszy (build wykonywany lokalnie/CI, nie na serwerze produkcyjnym).
- npm (lockfile `package-lock.json` w repo).
- Hosting serwujący **pliki statyczne** (Apache / Nginx / CDN). Astro buduje stronę statyczną —
  nie wymaga Node po stronie produkcyjnej (poza opcjonalnym endpointem formularza, sekcja 16).

## 2. Komenda build
```bash
cd "C:\Projects\panelia-studio"
npm ci
npm run build
```
`npm run build` uruchamia też gate produkcyjny (`scripts/check-production-readiness.mjs`),
który blokuje build przy cenach, `noindex` na produkcji i placeholderach.

## 3. Lokalizacja artefaktu
- Katalog `dist/` (statyczny HTML/CSS/JS + `/media`, `/sitemap.xml`, `/robots.txt`).
- To zawartość do wgrania na serwer (root domeny).

## 4. Kopia (backup) obecnej strony
1. Backup plików WordPressa (cały katalog www) — pobierz przez FTP/SSH lub panel hostingu.
2. Backup bazy danych (eksport SQL z phpMyAdmin lub `mysqldump`).
3. Zapisz kopię w bezpiecznym miejscu z datą. **Nie usuwaj** starego backupu do czasu
   potwierdzenia stabilności nowej strony.

## 5. Wdrożenie wersji statycznej
1. Zbuduj lokalnie (`npm run build`).
2. Wgraj **zawartość** `dist/` do katalogu głównego domeny (np. `public_html/`).
   - Zalecane wdrożenie atomowe: wgraj do nowego katalogu i przełącz symlink/rewrite,
     aby uniknąć stanu pośredniego.
3. Zachowaj/uzupełnij `.htaccess` (sekcja 6) lub konfigurację serwera.

## 6. Apache `.htaccess` (jeśli hosting na Apache)
Przykład (dostosuj do realnej listy URL z sekcji 7 i `docs/LEGACY-URL-REDIRECTS.md`):
```apache
# HTTPS + www→bez-www (lub odwrotnie — jeden wariant kanoniczny)
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Ładne URL bez /index.html
Options -MultiViews
DirectoryIndex index.html

# 404
ErrorDocument 404 /404.html

# Kompresja
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
</IfModule>

# Cache dla zasobów statycznych (obrazy/webp/fonty)
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
```

## 7. Przekierowania (301/410)
- Źródło mapowania: **`docs/LEGACY-URL-REDIRECTS.md`**.
- WooCommerce (`/shop`, `/cart`, `/checkout`, `/my-account`, `/wishlist`, `/product/*`) → **410**.
- `/pricing-plan/` → 301 `/pakiety`; `/about-us/` → 301 `/o-nas`; `/contact-us/` → 301 `/kontakt`;
  `/services/` → 301 `/oferta`; `/home-2-2/` → 301 `/`.
- Uzupełnij realną listę starych URL po eksporcie z WordPressa (Screaming Frog / mapa witryny).

## 8. Cache
- HTML: krótki/zerowy cache (`text/html` 0 s) — szybkie propagowanie zmian treści.
- Zasoby z hashem/wariantami WebP: długi cache (do 1 roku), są niemutowalne.
- Po wdrożeniu wyczyść cache CDN/hostingu, jeśli aktywny.

## 9. Kompresja
- Włącz Gzip/Brotli dla `text/html`, `text/css`, `application/javascript`, `image/svg+xml`.
- WebP/JPG nie kompresować ponownie (już skompresowane).

## 10. HTTPS
- Wymuś HTTPS (redirect 301 z http→https).
- Ważny certyfikat (Let's Encrypt lub certyfikat hostingu). `site.url` = `https://paneliastudio.pl`.

## 11. Testy po wdrożeniu
- Strona główna i wszystkie podstrony ładują się (200).
- Brak mieszanych treści (mixed content) — wszystko po HTTPS.
- OG/preview linku (Facebook/LinkedIn debugger).
- Wydajność: Lighthouse (LCP, CLS) na `/` i `/pakiety`.

## 12. Plan rollbacku
1. Zachowaj poprzedni katalog www i backup DB (sekcja 4).
2. W razie problemu: przywróć poprzedni katalog (lub przełącz symlink z powrotem) i bazę.
3. Zweryfikuj działanie starej strony po przywróceniu.
4. Dopiero po potwierdzeniu stabilności nowej wersji rozważ usunięcie backupu.

## 13. Google Search Console
- Dodaj/zweryfikuj własność domeny.
- Prześlij `sitemap.xml`.
- Po wdrożeniu przekierowań sprawdź raport indeksowania i „Usunięcia” dla 410.

## 14. Sitemapa
- Generowana automatycznie: `/sitemap.xml` (endpoint `src/pages/sitemap.xml.ts`).
- Zawiera publiczne strony; nie zawiera cen ani stron `noindex`.

## 15. robots.txt
- Plik `public/robots.txt` → serwowany jako `/robots.txt`.
- Wskazuje sitemapę; nie blokuje istotnych zasobów.

## 16. Test formularza
- **UWAGA (BLOCKER):** formularz działa w trybie **demonstracyjnym** — nie wysyła leada do
  Fatica ERP (`src/lib/contact.ts`, `sendContactForm` zwraca `demo: true`).
- Przed produkcją: wdrożyć serwerowy endpoint `POST /api/public/leads` (sekrety po stronie
  serwera) i podmienić implementację. Szczegóły: `docs/FATICA_INTEGRATION.md`.
- Test po integracji: wysłanie zgłoszenia, poprawny zapis w Fatica, walidacja pól i zgód.

## 17. Test 404
- Wejście na nieistniejący URL zwraca `/404.html` (sekcja 6, `ErrorDocument`).

## 18. Test starych URL-i
- Sprawdź próbkę z `docs/LEGACY-URL-REDIRECTS.md`: każdy 301 prowadzi do właściwej strony,
  każdy 410 zwraca „Gone”. Zweryfikuj kod odpowiedzi (np. `curl -I`).

---
### Kolejność wdrożenia (skrót)
1. Backup WP (pliki + DB) → 2. `npm ci && npm run build` → 3. Wgraj `dist/` →
4. `.htaccess` (redirecty, 404, cache, HTTPS) → 5. Testy (200, HTTPS, 404, stare URL, formularz) →
6. Search Console (sitemap) → 7. Monitoruj; w razie problemu rollback (sekcja 12).
