// Redakcyjna prezentacja pakietów na /pakiety (pasy editorial zamiast tabel na wstępie).
// Treść skrótowa, sprzedażowa, bez cen i bez powtarzania pełnych list ✓ (te zostają w zwijanej tabeli).
// Kody package_interest bez zmian.

export type BandVariant = 'light' | 'warm' | 'dark' | 'signature';
export type CtaStyle = 'solid' | 'ghost' | 'gold';

export interface BandCta {
  label: string;
  href: string;
  style: CtaStyle;
}

export interface PackageBand {
  slug: string;
  number: string;
  short: string;
  name: string;
  positioning: string; // krótkie pozycjonowanie (jedno zdanie)
  audience: string; // dla kogo
  label?: string; // etykieta wyróżnika
  highlights: string[]; // konkretne, krótkie informacje (bez ✓)
  meta?: string; // np. warianty / rundy (pakiety projektowe)
  notInclude?: string; // krótka informacja o wyłączeniu
  note?: string; // nota potwierdzenia
  variant: BandVariant;
  imageId?: string; // detal materiałowy (COMFORT)
  ctas: BandCta[];
}

// ————————————————————— PAKIETY WYKOŃCZENIOWE —————————————————————
export const finishBands: PackageBand[] = [
  {
    slug: 'start',
    number: '01',
    short: 'START',
    name: 'Panelia Start',
    positioning: 'Funkcjonalny i przewidywalny standard wykończenia.',
    audience: 'Dla klienta posiadającego projekt albo wybierającego prosty, uporządkowany zakres.',
    highlights: [
      'Projekt: brak w zakresie — dostępny osobno',
      'Podstawowy standard materiałowy',
      'Standardowe wykończenie',
      'Jedna standardowa łazienka',
      'Podstawowa koordynacja',
    ],
    variant: 'light',
    ctas: [
      { label: 'Poznaj PANELIA START', href: '/kontakt?pakiet=panelia_finish_start', style: 'solid' },
      { label: 'Zobacz materiały w START', href: '#materialy-start', style: 'ghost' },
    ],
  },
  {
    slug: 'comfort',
    number: '02',
    short: 'COMFORT',
    name: 'Panelia Comfort',
    positioning: 'Pełny projekt i rozszerzony wybór wykończenia.',
    audience: 'Dla klientów oczekujących pełnego projektu i szerszego wyboru materiałów.',
    label: 'Projekt + rozszerzone wykończenie',
    highlights: [
      'Zawiera Panelia Complete',
      'Większy wybór materiałów',
      'Wybrane kolekcje importowane',
      'Możliwość paneli dekoracyjnych i paneli węglowych',
      'Rozbudowane łazienki',
      'Zmiany instalacyjne w ramach oferty',
      'Możliwość zastosowania sufitów napinanych',
      'Koordynacja ekip i dostaw',
      'Dokumentacja zdjęciowa i protokoły',
    ],
    variant: 'warm',
    imageId: 'panelia-warm-living-dining-01',
    ctas: [
      { label: 'Poznaj PANELIA COMFORT', href: '/kontakt?pakiet=panelia_finish_comfort', style: 'solid' },
      { label: 'Zobacz materiały w COMFORT', href: '#materialy-comfort', style: 'ghost' },
    ],
  },
  {
    slug: 'premium',
    number: '03',
    short: 'PREMIUM',
    name: 'Panelia Premium',
    positioning: 'Najwyższy poziom indywidualizacji i obsługi.',
    audience:
      'Dla klientów, którzy oczekują indywidualnego efektu, materiałów premium i rozszerzonej kontroli realizacji.',
    label: 'Panele węglowe i kolekcje importowane',
    highlights: [
      'Zawiera Panelia Signature',
      'Indywidualna selekcja materiałów',
      'Szeroki dostęp do aktualnych kolekcji importowych',
      'Panele węglowe jako jeden z głównych wyróżników',
      'Dekoracyjne powierzchnie ścienne',
      'Możliwość rozwiązań wielkoformatowych',
      'Możliwość zastosowania sufitów napinanych',
      'Bardziej zaawansowane detale',
      'Rozszerzona koordynacja i odbiory etapowe',
      'Raportowanie i wsparcie architekta',
    ],
    note: 'Szczegółowy zakres, konkretne rozwiązania i dostępność materiałów potwierdzane są w indywidualnej ofercie i karcie materiałowej.',
    variant: 'dark',
    imageId: 'panelia-dark-premium-living-01',
    ctas: [
      { label: 'Poznaj PANELIA PREMIUM', href: '/kontakt?pakiet=panelia_finish_premium', style: 'gold' },
      { label: 'Zobacz materiały w PREMIUM', href: '#materialy-premium', style: 'ghost' },
      { label: 'Zapytaj o dostępne kolekcje', href: '/kontakt?pakiet=panelia_finish_premium', style: 'ghost' },
    ],
  },
];

// ————————————————————— PAKIETY PROJEKTOWE —————————————————————
export const designBands: PackageBand[] = [
  {
    slug: 'concept',
    number: '01',
    short: 'CONCEPT',
    name: 'Panelia Concept',
    positioning: 'Spójna, funkcjonalna koncepcja wnętrza.',
    audience: 'Dla klientów potrzebujących koncepcji bez pełnej dokumentacji technicznej i realizacji.',
    highlights: [
      'Dwa warianty układu, wybór jednego',
      'Moodboard, paleta kolorów i materiałów',
      'Wizualizacje kluczowych pomieszczeń (do 8 ujęć)',
      'PDF z zatwierdzoną koncepcją',
    ],
    meta: 'Warianty układu: 2 · Rundy zmian: 1',
    notInclude: 'Bez pełnej dokumentacji technicznej i prowadzenia realizacji.',
    variant: 'light',
    ctas: [{ label: 'Poznaj PANELIA CONCEPT', href: '/kontakt?pakiet=panelia_concept', style: 'solid' }],
  },
  {
    slug: 'complete',
    number: '02',
    short: 'COMPLETE',
    name: 'Panelia Complete',
    positioning: 'Kompletny projekt z dokumentacją dla ekip.',
    audience: 'Dla klientów, którzy chcą pełny projekt wraz z dokumentacją wykonawczą i doborem wyposażenia.',
    highlights: [
      'Wizualizacje wszystkich pomieszczeń',
      'Pełna dokumentacja dla ekip wykonawczych',
      'Dobór materiałów, oświetlenia i armatury',
      'Rzuty, plany instalacji i widoki ścian',
    ],
    meta: 'Układy funkcjonalne: 2 · Rundy: układ 2, wizualizacje 2, dokumentacja 1',
    notInclude: 'Bez stałego nadzoru i pełnej koordynacji zamówień.',
    variant: 'warm',
    imageId: 'panelia-loft-living-01',
    ctas: [{ label: 'Poznaj PANELIA COMPLETE', href: '/kontakt?pakiet=panelia_complete', style: 'solid' }],
  },
  {
    slug: 'signature',
    number: '03',
    short: 'SIGNATURE',
    name: 'Panelia Signature',
    positioning: 'Indywidualna koncepcja i rozbudowane projekty zabudów.',
    audience: 'Dla klientów oczekujących indywidualnej koncepcji i wsparcia przy zamówieniach.',
    label: 'Najbardziej rozbudowany projekt',
    highlights: [
      'Cały zakres Panelia Complete',
      'Do trzech wariantów układu',
      'Rozbudowane projekty zabudów (kuchnia, garderoby)',
      'Wsparcie przy zamówieniach i konsultacje na inwestycji',
    ],
    meta: 'Warianty: do 3 · Rundy: układ 3, wizualizacje 3, dokumentacja 1',
    notInclude: 'Projekt zabudów nie oznacza produkcji, dostawy ani montażu mebli.',
    variant: 'signature',
    imageId: 'panelia-luxury-staircase-01',
    ctas: [{ label: 'Poznaj PANELIA SIGNATURE', href: '/kontakt?pakiet=panelia_signature', style: 'gold' }],
  },
];
