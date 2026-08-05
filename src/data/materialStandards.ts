// Standard materiałowy pakietów wykończeniowych (publiczny, bez cen i parametrów technicznych).
// Dane oddzielone od komponentów. Nie dodawać marek, formatów, klas odporności ani cen.
// Rozwiązania zależne opisywać jako „możliwość zależnie od projektu i indywidualnej oferty”.

export type FinishKey = 'start' | 'comfort' | 'premium';

// ————————————————————— A. PROFILE MATERIAŁOWE —————————————————————
export interface MaterialProfile {
  key: FinishKey;
  number: string; // 01 / 02 / 03
  short: string; // START / COMFORT / PREMIUM
  name: string; // Panelia Start / …
  formValue: string; // package_interest
  heading: string;
  intro: string; // krótka nota „Dla klientów…”
  label?: string; // etykieta wyróżnika (COMFORT / PREMIUM)
  points: string[]; // 6–8 konkretnych punktów
}

export const materialProfiles: MaterialProfile[] = [
  {
    key: 'start',
    number: '01',
    short: 'START',
    name: 'Panelia Start',
    formValue: 'panelia_finish_start',
    heading: 'Sprawdzona, podstawowa selekcja',
    intro: 'Dla klientów, którym zależy na estetycznym, funkcjonalnym i przewidywalnym standardzie.',
    points: [
      'Zatwierdzona paleta materiałów',
      'Standardowe formaty',
      'Bezpieczne, łatwo dostępne dekory',
      'Proste wykończenia ścian i sufitów',
      'Materiały umożliwiające przewidywalne zamienniki',
      'Brak materiałów importowanych w standardzie',
    ],
  },
  {
    key: 'comfort',
    number: '02',
    short: 'COMFORT',
    name: 'Panelia Comfort',
    formValue: 'panelia_finish_comfort',
    heading: 'Większy wybór i lepsze dopasowanie do projektu',
    intro: 'Dla klientów oczekujących pełnego projektu i wyraźnie szerszego wyboru materiałów.',
    label: 'Wybrane kolekcje importowane',
    points: [
      'Rozszerzona paleta kolorów, dekorów i struktur',
      'Większy wybór formatów',
      'Wybrane materiały z aktualnej kolekcji importowej',
      'Możliwość zastosowania paneli dekoracyjnych i paneli węglowych',
      'Bardziej rozbudowane rozwiązania łazienkowe',
      'Możliwość zastosowania wybranych sufitów napinanych',
      'Większy zakres detali i zmian instalacyjnych',
    ],
  },
  {
    key: 'premium',
    number: '03',
    short: 'PREMIUM',
    name: 'Panelia Premium',
    formValue: 'panelia_finish_premium',
    heading: 'Indywidualna selekcja i materiały wyróżniające wnętrze',
    intro:
      'Dla klientów, którzy oczekują indywidualnego efektu, materiałów premium i rozszerzonej kontroli realizacji.',
    label: 'Panele węglowe i kolekcje importowane',
    points: [
      'Szeroki dostęp do aktualnej kolekcji importowej',
      'Panele węglowe jako jeden z głównych wyróżników',
      'Dekoracyjne powierzchnie ścienne',
      'Możliwość zastosowania rozwiązań wielkoformatowych',
      'Indywidualne zestawienia materiałów',
      'Możliwość zastosowania sufitów napinanych i zintegrowanego oświetlenia',
      'Bardziej zaawansowane detale',
      'Większy zakres rozwiązań wykonywanych na wymiar',
    ],
  },
];

export function getProfile(key: string): MaterialProfile | undefined {
  return materialProfiles.find((profile) => profile.key === key);
}

// Nota potwierdzenia przy COMFORT i PREMIUM.
export const confirmNote =
  'Konkretne rozwiązania, kolekcje i parametry są potwierdzane w projekcie, karcie materiałowej i indywidualnej ofercie.';

// ————————————————————— B. TEMATYCZNE MODUŁY PORÓWNAWCZE —————————————————————
export interface MaterialModule {
  number: string;
  title: string;
  intro: string;
  start: string[];
  comfort: string[];
  premium: string[];
  note?: string;
  imageId?: string; // opcjonalna grafika redakcyjna (editorialMedia)
}

export const materialModules: MaterialModule[] = [
  {
    number: '01',
    title: 'Ściany i powierzchnie',
    intro: 'Przygotowanie, wykończenia i powierzchnie dekoracyjne ścian.',
    start: ['Standardowe przygotowanie powierzchni', 'Zatwierdzona paleta wykończeń', 'Proste detale'],
    comfort: [
      'Większy wybór kolorów i struktur',
      'Wybrane powierzchnie dekoracyjne',
      'Możliwość zastosowania paneli dekoracyjnych',
    ],
    premium: [
      'Indywidualna kompozycja ścian',
      'Panele węglowe',
      'Rozszerzona selekcja powierzchni dekoracyjnych',
      'Możliwość ograniczenia liczby widocznych podziałów zależnie od formatu',
    ],
  },
  {
    number: '02',
    title: 'Podłogi, drzwi i listwy',
    intro: 'Podłogi, drzwi wewnętrzne i wykończenia.',
    start: ['Podstawowa kolekcja', 'Standardowe dekory i formaty', 'Przewidywalne zamienniki'],
    comfort: [
      'Więcej dekorów, struktur i wariantów wykończenia',
      'Większy wybór drzwi i listew',
      'Lepsze dopasowanie do projektu',
    ],
    premium: [
      'Indywidualna selekcja',
      'Możliwość zastosowania rozwiązań o większym formacie',
      'Bardziej rozbudowane detale',
      'Rozwiązania niestandardowe zależne od oferty',
    ],
  },
  {
    number: '03',
    title: 'Łazienka',
    intro: 'Płytki, ceramika, armatura i detale.',
    start: ['Standardowa kolekcja płytek', 'Podstawowa ceramika i armatura', 'Funkcjonalne rozwiązania'],
    comfort: [
      'Większy wybór płytek, ceramiki i armatury',
      'Bardziej rozbudowane wykończenie',
      'Większa liczba dostępnych detali',
    ],
    premium: [
      'Indywidualna selekcja materiałów',
      'Rozwiązania dopasowane do projektu',
      'Możliwość elementów na wymiar',
      'Niestandardowe rozwiązania wymagające osobnej kalkulacji',
    ],
    note: 'Rozwiązań typu walk-in, armatury podtynkowej, wanny wolnostojącej ani konkretnych marek nie gwarantujemy z góry — zależą od projektu i indywidualnej oferty.',
    imageId: 'panelia-premium-bathroom-01',
  },
  {
    number: '04',
    title: 'Sufity i oświetlenie',
    intro: 'Wykończenie sufitu i rozwiązania oświetleniowe.',
    start: ['Standardowe wykończenie sufitu', 'Podstawowe rozwiązania oświetleniowe'],
    comfort: [
      'Rozszerzone rozwiązania sufitowe',
      'Większy zakres oświetlenia',
      'Możliwość zastosowania wybranych sufitów napinanych zależnie od projektu',
    ],
    premium: [
      'Indywidualna koncepcja sufitu i oświetlenia',
      'Promowane rozwiązania z sufitami napinanymi',
      'Możliwość integracji światła z detalami architektonicznymi',
      'Rozwiązania zależne od projektu i kalkulacji',
    ],
    imageId: 'panelia-ring-ceiling-dining-01',
  },
  {
    number: '05',
    title: 'Materiały importowane i dekoracyjne',
    intro: 'Kolekcje importowane, panele dekoracyjne i panele węglowe.',
    start: ['Materiały z zatwierdzonej kolekcji', 'Brak kolekcji importowej w standardzie'],
    comfort: [
      'Wybrane produkty z aktualnej kolekcji importowej',
      'Możliwość zastosowania paneli dekoracyjnych',
      'Możliwość zastosowania wybranych paneli węglowych',
    ],
    premium: [
      'Szeroki dostęp do aktualnej kolekcji importowej',
      'Panele węglowe jako główny wyróżnik',
      'Dekoracyjne powierzchnie inspirowane kamieniem, marmurem i drewnem',
      'Możliwość rozwiązań wielkoformatowych',
      'Większa indywidualizacja',
    ],
    note: 'Dostępność, format, sposób montażu i parametry techniczne konkretnego materiału są każdorazowo potwierdzane przed zamówieniem.',
  },
  {
    number: '06',
    title: 'Koordynacja i odbiory',
    intro: 'Prowadzenie realizacji, protokoły i odbiory.',
    start: ['Podstawowa koordynacja', 'Odbiór końcowy', 'Obsługa zgłoszonych usterek'],
    comfort: ['Koordynacja ekip i dostaw', 'Protokoły', 'Dokumentacja zdjęciowa', 'Aktualizacje statusu'],
    premium: [
      'Rozszerzona koordynacja',
      'Weryfikacja dostaw',
      'Raportowanie',
      'Odbiory etapowe',
      'Wsparcie architekta',
      'Ewidencja i organizacja usunięcia usterek',
    ],
  },
];

// ————————————————————— C. PEŁNE PORÓWNANIE (skrótowe hasła) —————————————————————
export interface MaterialRow {
  group: string;
  start: string;
  comfort: string;
  premium: string;
}

export const materialTableShort: MaterialRow[] = [
  { group: 'Projekt', start: '—', comfort: 'Panelia Complete', premium: 'Panelia Signature' },
  { group: 'Ściany i malowanie', start: 'Standard', comfort: 'Rozszerzony', premium: 'Indywidualny' },
  { group: 'Podłogi', start: 'Podstawowa kolekcja', comfort: 'Rozszerzony wybór', premium: 'Selekcja premium' },
  { group: 'Łazienka', start: 'Standardowa', comfort: 'Rozbudowana', premium: 'Indywidualna' },
  { group: 'Drzwi i listwy', start: 'Standard', comfort: 'Rozszerzony wybór', premium: 'Selekcja' },
  {
    group: 'Materiały dekoracyjne',
    start: 'Brak w standardzie',
    comfort: 'Wybrane rozwiązania',
    premium: 'Panele węglowe i szeroki wybór',
  },
  { group: 'Materiały importowane', start: 'Brak', comfort: 'Wybrane kolekcje', premium: 'Szeroki dostęp' },
  { group: 'Zmiany instalacyjne', start: 'Podstawowe', comfort: 'Zakres w ofercie', premium: 'Rozszerzone' },
  {
    group: 'Zabudowy i sufity',
    start: 'Proste',
    comfort: 'Rozszerzone; sufity napinane (opcja)',
    premium: 'Indywidualne; sufity napinane',
  },
  { group: 'Koordynacja', start: 'Podstawowa', comfort: 'Pełna', premium: 'Rozszerzona' },
  {
    group: 'Dokumentacja i odbiory',
    start: 'Odbiór końcowy',
    comfort: 'Protokoły i zdjęcia',
    premium: 'Raporty i odbiory etapowe',
  },
  {
    group: 'Obsługa usterek',
    start: 'Zgłoszone usterki',
    comfort: 'Koordynacja usunięcia',
    premium: 'Ewidencja i kontrola',
  },
];

// ————————————————————— Wyróżnik: panele węglowe (PREMIUM) —————————————————————
export interface MaterialHighlight {
  title: string;
  points: string[];
  note: string;
}

export const carbonHighlight: MaterialHighlight = {
  title: 'Panele węglowe — wyróżnik PREMIUM',
  points: [
    'Mocny efekt wizualny i duże powierzchnie dekoracyjne',
    'Imitacje kamienia, marmuru, drewna i innych powierzchni',
    'Mniej widocznych podziałów — zależnie od formatu',
    'Większa indywidualizacja wnętrza',
    'Dostęp do kolekcji niedostępnych w typowej sprzedaży marketowej',
    'Spójne łączenie paneli z projektem, oświetleniem i zabudowami',
  ],
  note: 'Dostępność, format, sposób montażu i parametry techniczne konkretnego panelu są potwierdzane w karcie materiałowej oraz indywidualnej ofercie.',
};

export const materialLead =
  'Każdy pakiet obejmuje inny poziom wyboru materiałów, formatów, dekorów i rozwiązań. Ostateczna selekcja jest zawsze potwierdzana w indywidualnej ofercie i karcie materiałowej.';

export const materialDisclaimer =
  'Szczegółowy zakres, dostępne kolekcje i limity potwierdzane są w indywidualnej ofercie, karcie materiałowej i umowie. Dostępność materiałów importowanych zależy od bieżącej kolekcji. Projekt zabudowy nie oznacza produkcji, dostawy ani montażu mebli.';
