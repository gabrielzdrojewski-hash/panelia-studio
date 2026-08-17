// Inspiracje / kierunki stylistyczne do kroku „Co Ci się podoba?" w konfiguratorze wyceny.
//
// ŹRÓDŁO: wyłącznie ISTNIEJĄCE, zatwierdzone materiały editorial (src/data/editorialMedia.ts,
// warianty WebP 480/960/1600 + srcset). Nie generujemy nowych obrazów i nie dublujemy katalogu.
//
// ZASADY: brak cen; brak automatycznego mapowania „inspiracja → pakiet" (to logika ERP, nie WWW).
// `value` to stabilny identyfikator zapisywany w answers.inspiration_ids (gotowy pod ERP).
// `mediaId` wskazuje kadr z editorialMedia (rozwiązywany responsywnie przez editorialSrcset).

import type { EstimateOption } from '../../lib/estimate';

export const inspirationOptions: EstimateOption[] = [
  { value: 'jasne-otwarte', label: 'Jasne i otwarte', mediaId: 'panelia-open-house-living-01' },
  { value: 'cieple-naturalne', label: 'Ciepłe i naturalne', mediaId: 'panelia-warm-living-dining-01' },
  { value: 'przestronne-charakter', label: 'Przestronne z charakterem', mediaId: 'panelia-cathedral-living-01' },
  { value: 'ciemne-eleganckie', label: 'Ciemne i eleganckie', mediaId: 'panelia-dark-premium-living-01' },
  { value: 'loft-industrialne', label: 'Loftowe, industrialne', mediaId: 'panelia-loft-living-01' },
  { value: 'miekka-nowoczesnosc', label: 'Miękka nowoczesność', mediaId: 'panelia-ring-ceiling-dining-01' },
];

// Wartość „nie wiem" (bez obrazu) — wzajemnie wykluczająca się z wyborami kadrów.
export const INSPIRATION_UNSURE = 'nie_wiem';

// Pełna lista opcji dla definicji pytania (kadry + „nie wiem").
export const inspirationQuestionOptions: EstimateOption[] = [
  ...inspirationOptions,
  { value: INSPIRATION_UNSURE, label: 'Nie wiem — pomóżcie dobrać kierunek' },
];
