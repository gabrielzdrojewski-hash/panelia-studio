// Pakiety Panelia Studio — zgodne z zatwierdzoną specyfikacją.
//
// ZASADY:
// - Bez cen, stawek za m², wartości limitów, minimalnych kwot i danych finansowych.
// - Dwie kategorie: pakiety projektowe oraz pakiety projektowo-wykończeniowe.
// - Treść odwzorowuje specyfikację; nie dodajemy niepotwierdzonych deklaracji.

export type PackageCategory = 'projektowy' | 'wykonczeniowy';

export interface Revision {
  label: string;
  value: string;
}

export interface Package {
  slug: string;
  formValue: string; // Wartość dla pola package_interest w formularzu.
  name: string;
  short: string;
  category: PackageCategory;
  kind: string; // Rodzaj pakietu.
  audience: string; // Dla kogo.
  intro: string; // Krótki opis (karty, strona główna, meta).
  scopeIntro?: string; // Wstęp do zakresu (np. „Zawiera cały zakres…”).
  scope: string[]; // Zakres / co zawiera.
  revisions?: Revision[]; // Rundy zmian.
  notIncludedLabel?: string; // Nagłówek sekcji wyłączeń (domyślnie „Nie obejmuje”).
  notIncluded?: string[]; // Wyłączenia.
  notes?: string[]; // Zastrzeżenia / ważne informacje.
  cardHighlights: string[]; // 3 punkty na kartę skróconą.
}

export const packages: Package[] = [
  // ————————————————————————————— PAKIETY PROJEKTOWE —————————————————————————————
  {
    slug: 'concept',
    formValue: 'panelia_concept',
    name: 'Panelia Concept',
    short: 'Concept',
    category: 'projektowy',
    kind: 'Pakiet projektowy · poziom podstawowy',
    audience:
      'Dla klientów potrzebujących spójnej, funkcjonalnej koncepcji wnętrza — bez pełnej dokumentacji technicznej i bez prowadzenia realizacji.',
    intro:
      'Spójna, funkcjonalna koncepcja wnętrza: układ, moodboard, paleta i wizualizacje kluczowych pomieszczeń.',
    scope: [
      'Brief i ankieta potrzeb',
      'Spotkanie rozpoczynające',
      'Analiza funkcjonalna',
      'Dwa warianty układu i wybór jednego',
      'Moodboard',
      'Paleta kolorów i materiałów',
      'Podstawowa koncepcja wnętrza',
      'Wizualizacje salonu z kuchnią',
      'Wizualizacje łazienki',
      'Wizualizacje jednego dodatkowego pomieszczenia',
      'Maksymalnie 8 ujęć',
      'Orientacyjna lista najważniejszych produktów',
      'PDF z zatwierdzoną koncepcją',
    ],
    revisions: [
      { label: 'Układ funkcjonalny', value: '1 runda' },
      { label: 'Moodboard', value: '1 runda' },
      { label: 'Wizualizacje', value: '1 runda' },
    ],
    notIncluded: [
      'Pełna dokumentacja techniczna',
      'Projekt elektryki',
      'Projekt wodno-kanalizacyjny',
      'Rzuty sufitów',
      'Rzuty posadzek',
      'Projekty mebli',
      'Zamawianie produktów',
      'Koordynacja ekip',
      'Nadzór nad realizacją',
    ],
    notes: ['CONCEPT nie jest projektem wykonawczym.'],
    cardHighlights: [
      'Dwa warianty układu i wybór jednego',
      'Moodboard, paleta kolorów i materiałów',
      'Wizualizacje kluczowych pomieszczeń (do 8 ujęć)',
    ],
  },
  {
    slug: 'complete',
    formValue: 'panelia_complete',
    name: 'Panelia Complete',
    short: 'Complete',
    category: 'projektowy',
    kind: 'Kompletny pakiet projektowy',
    audience:
      'Dla klientów, którzy chcą otrzymać pełny projekt wnętrza wraz z dokumentacją potrzebną ekipom wykonawczym oraz szczegółowym doborem materiałów i wyposażenia.',
    intro:
      'Pełny projekt wnętrza z dokumentacją dla ekip wykonawczych oraz szczegółowym doborem materiałów i wyposażenia.',
    scope: [
      'Pełny brief',
      'Dwa układy funkcjonalne',
      'Moodboard',
      'Spójna kolorystyka',
      'Wizualizacje wszystkich pomieszczeń',
      'Dobór materiałów',
      'Dobór oświetlenia',
      'Dobór armatury',
      'Dobór wyposażenia',
      'Projekt zmian ścian',
      'Rzut posadzek',
      'Rzut sufitów',
      'Plan oświetlenia',
      'Rozmieszczenie włączników i gniazd',
      'Rozmieszczenie punktów wodno-kanalizacyjnych',
      'Widoki ścian',
      'Rozrysowanie płytek',
      'Podstawowe rysunki zabudów',
      'Zestawienie materiałów',
      'Lista zakupowa',
      'Dokumentacja dla ekip wykonawczych',
    ],
    revisions: [
      { label: 'Układ funkcjonalny', value: '2 rundy' },
      { label: 'Moodboard i wizualizacje', value: '2 rundy' },
      { label: 'Dokumentacja', value: '1 runda' },
    ],
    notIncluded: [
      'Stały nadzór nad realizacją',
      'Regularne wizyty na inwestycji',
      'Pełna koordynacja zamówień',
      'Nieograniczona liczba zmian',
      'Koszty materiałów',
      'Koszty wykonania',
    ],
    cardHighlights: [
      'Wizualizacje wszystkich pomieszczeń',
      'Pełna dokumentacja dla ekip wykonawczych',
      'Dobór materiałów, oświetlenia i armatury',
    ],
  },
  {
    slug: 'signature',
    formValue: 'panelia_signature',
    name: 'Panelia Signature',
    short: 'Signature',
    category: 'projektowy',
    kind: 'Najbardziej rozbudowany pakiet projektowy',
    audience:
      'Dla klientów oczekujących indywidualnej koncepcji, rozbudowanych projektów zabudów, szczegółowych zestawień oraz wsparcia przy zamówieniach i realizacji.',
    intro:
      'Indywidualna koncepcja, rozbudowane projekty zabudów oraz wsparcie przy zamówieniach i konsultacje na inwestycji.',
    scopeIntro: 'Zawiera cały zakres PANELIA COMPLETE, a ponadto:',
    scope: [
      'Do trzech wariantów układu',
      'Indywidualna koncepcja wnętrza',
      'Rozbudowane projekty zabudów',
      'Kuchnia jako projekt zabudowy',
      'Garderoby jako projekty zabudowy',
      'Indywidualne detale',
      'Rozszerzone zestawienia',
      'Szczegółowa lista zakupowa',
      'Roboczy budżet materiałowy',
      'Kontakt z dostawcami',
      'Zbieranie cen i terminów',
      'Przygotowanie zamówień',
      'Koordynacja zamówień',
      'Weryfikacja zamienników',
      'Odpowiedzi na pytania ekip wykonawczych',
      'Przekazywanie aktualnej dokumentacji',
      'Dwie konsultacje na inwestycji',
      'Prowadzenie wersji i akceptacji w Portalu Klienta',
    ],
    revisions: [
      { label: 'Układ i koncepcja', value: '3 rundy' },
      { label: 'Wizualizacje', value: '3 rundy' },
      { label: 'Dokumentacja', value: '1 runda' },
    ],
    notIncluded: [
      'Codzienne kierowanie budową',
      'Nieograniczona liczba wizyt',
      'Nieograniczona liczba zmian',
      'Koszty produktów',
      'Odpowiedzialność za niezależnych dostawców',
      'Odbiory wykonawcze, jeżeli nie zostały osobno zamówione',
    ],
    notes: [
      'SIGNATURE zawiera projekt kuchni i garderób jako dokumentację projektową zabudów. Nie oznacza produkcji, zakupu, dostawy, montażu ani fizycznego wykonania mebli.',
    ],
    cardHighlights: [
      'Cały zakres COMPLETE i indywidualna koncepcja',
      'Rozbudowane projekty zabudów (kuchnia, garderoby)',
      'Wsparcie przy zamówieniach i konsultacje na inwestycji',
    ],
  },

  // ———————————————————— PAKIETY PROJEKTOWO-WYKOŃCZENIOWE ————————————————————
  {
    slug: 'start',
    formValue: 'panelia_finish_start',
    name: 'Panelia Start',
    short: 'Start',
    category: 'wykonczeniowy',
    kind: 'Podstawowy pakiet wykończeniowy',
    audience:
      'Dla klientów posiadających gotowy projekt albo wybierających prosty, uporządkowany standard wykończenia.',
    intro:
      'Prosty, uporządkowany standard wykończenia dla klientów z gotowym projektem lub jasno określonym zakresem.',
    scope: [
      'Zabezpieczenie lokalu',
      'Drobne naprawy',
      'Gruntowanie',
      'Malowanie',
      'Wykonanie podłóg',
      'Montaż listew przypodłogowych',
      'Montaż drzwi',
      'Standardowe płytki',
      'Jedna standardowa łazienka zgodnie z limitami pakietu',
      'Biały montaż',
      'Osprzęt elektryczny na istniejących punktach',
      'Podstawowe oprawy oświetleniowe',
      'Podstawowa koordynacja',
      'Odbiór',
      'Obsługa usterek',
    ],
    notIncludedLabel: 'Ważne',
    notIncluded: [
      'START nie zawiera żadnego pakietu projektowego.',
      'Projekt należy dostarczyć, przygotować osobno albo zamówić jako oddzielną usługę.',
    ],
    cardHighlights: [
      'Malowanie, podłogi, drzwi, standardowe płytki',
      'Jedna standardowa łazienka i biały montaż',
      'Koordynacja, odbiór i obsługa usterek',
    ],
  },
  {
    slug: 'comfort',
    formValue: 'panelia_finish_comfort',
    name: 'Panelia Comfort',
    short: 'Comfort',
    category: 'wykonczeniowy',
    kind: 'Rozszerzony pakiet projektowo-wykończeniowy',
    audience:
      'Dla klientów oczekujących pełnego projektu wnętrza, szerszego zakresu zmian instalacyjnych, bardziej rozbudowanych łazienek oraz koordynacji ekip i dostaw.',
    intro:
      'Pełny projekt (COMPLETE) połączony z wykończeniem, szerszymi zmianami instalacyjnymi i koordynacją ekip oraz dostaw.',
    scopeIntro: 'Zawiera cały zakres PANELIA START oraz pakiet projektowy PANELIA COMPLETE, a ponadto:',
    scope: [
      'Zmiany elektryczne w ramach limitów',
      'Zmiany wodno-kanalizacyjne w ramach limitów',
      'Proste zabudowy gipsowo-kartonowe',
      'Proste sufity',
      'Większe formaty płytek',
      'Rozbudowane łazienki',
      'Materiały dekoracyjne w ramach limitów',
      'Koordynacja dostaw',
      'Koordynacja ekip',
      'Protokoły',
      'Dokumentacja zdjęciowa',
      'Aktualizacje statusu realizacji',
      'Odbiór',
      'Obsługa usterek',
    ],
    notes: [
      'Materiały wybierane są w ramach limitów określonych szczegółowo w indywidualnej ofercie.',
    ],
    cardHighlights: [
      'Zakres START + projekt COMPLETE',
      'Zmiany instalacyjne i rozbudowane łazienki',
      'Koordynacja ekip, dostaw i raportowanie',
    ],
  },
  {
    slug: 'premium',
    formValue: 'panelia_finish_premium',
    name: 'Panelia Premium',
    short: 'Premium',
    category: 'wykonczeniowy',
    kind: 'Najbardziej rozbudowany pakiet projektowo-wykończeniowy',
    audience:
      'Dla klientów oczekujących indywidualnego projektu, wyższego standardu detali, szerszej koordynacji oraz rozbudowanego wsparcia architekta podczas realizacji.',
    intro:
      'Indywidualny projekt (SIGNATURE) i najwyższy standard wykończenia z rozszerzoną koordynacją i wsparciem architekta.',
    scopeIntro: 'Zawiera cały zakres PANELIA COMFORT oraz pakiet projektowy PANELIA SIGNATURE, a ponadto:',
    scope: [
      'Rozbudowane rozwiązania projektowe',
      'Dekoracyjne ściany',
      'Rozszerzone oświetlenie',
      'Bardziej złożone zabudowy gipsowo-kartonowe',
      'Wyższy standard detali',
      'Rozszerzona koordynacja realizacji',
      'Koordynacja zamówień',
      'Weryfikacja dostaw',
      'Raportowanie',
      'Protokoły etapowe',
      'Odbiory poszczególnych zakresów',
      'Rozszerzone wsparcie architekta',
      'Ewidencja usterek',
      'Organizacja usunięcia usterek',
    ],
    notIncludedLabel: 'Nie obejmuje jako produktu',
    notIncluded: [
      'Kuchnie',
      'Garderoby',
      'Meble na wymiar',
      'Meble wolnostojące',
      'AGD',
      'Dekoracje ruchome',
      'Zasłony',
      'Rolety',
      'Systemy smart home',
      'Klimatyzacja',
      'Schody',
      'Kamień i spieki bez osobnej kalkulacji',
      'Produkty przekraczające limity materiałowe',
    ],
    notes: [
      'PREMIUM zawiera projekt SIGNATURE, w tym projekty zabudów kuchni i garderób. Nie zawiera automatycznie produkcji, dostawy ani montażu tych mebli.',
    ],
    cardHighlights: [
      'Zakres COMFORT + projekt SIGNATURE',
      'Wyższy standard detali i dekoracyjne ściany',
      'Rozszerzone wsparcie architekta i odbiory etapowe',
    ],
  },
];

export const designPackages = packages.filter((p) => p.category === 'projektowy');
export const finishPackages = packages.filter((p) => p.category === 'wykonczeniowy');

export function getPackage(slug: string): Package | undefined {
  return packages.find((p) => p.slug === slug);
}

// ————————————————————————————— TABELE PORÓWNAWCZE —————————————————————————————
// Wartości opisowe (bez cen i bez wartości limitów). Zakres orientacyjny — szczegóły w ofercie.

export interface CompareRow {
  feature: string;
  values: string[]; // Kolejność zgodna z `columns`.
  // Klucze objaśnień (src/data/comparisonGlossary.ts) dla poszczególnych komórek; null = brak.
  info?: (string | null)[];
}

export interface ComparisonSet {
  columns: string[]; // Krótkie nazwy pakietów.
  rows: CompareRow[];
}

// Pakiety projektowe: Concept · Complete · Signature
export const designComparison: ComparisonSet = {
  columns: ['Concept', 'Complete', 'Signature'],
  rows: [
    { feature: 'Warianty układu', values: ['2', '2', 'do 3'] },
    {
      feature: 'Wizualizacje',
      values: ['Wybrane pomieszczenia (do 8 ujęć)', 'Wszystkie pomieszczenia', 'Wszystkie + indywidualne'],
    },
    { feature: 'Rundy wizualizacji', values: ['1', '2', '3'] },
    { feature: 'Dokumentacja dla ekip', values: ['—', 'Pełna', 'Pełna'] },
    { feature: 'Rzuty: posadzki, sufity, instalacje', values: ['—', '✓', '✓'] },
    {
      feature: 'Projekty zabudów',
      values: ['—', 'Podstawowe rysunki', 'Rozbudowane (kuchnia, garderoby)'],
    },
    {
      feature: 'Dobór materiałów i wyposażenia',
      values: ['Orientacyjna lista', 'Pełny', 'Rozszerzony'],
    },
    { feature: 'Wsparcie przy zamówieniach', values: ['—', '—', '✓'] },
    { feature: 'Konsultacje na inwestycji', values: ['—', '—', '2'] },
    { feature: 'Portal Klienta (wersje i akceptacje)', values: ['—', '—', '✓'] },
  ],
};

// Pakiety projektowo-wykończeniowe: Start · Comfort · Premium
export const finishComparison: ComparisonSet = {
  columns: ['Start', 'Comfort', 'Premium'],
  rows: [
    {
      feature: 'Pakiet projektowy w zakresie',
      values: ['—', 'COMPLETE', 'SIGNATURE'],
      info: ['projekt-osobno', null, null],
    },
    { feature: 'Malowanie, podłogi, drzwi', values: ['✓', '✓', '✓'] },
    {
      feature: 'Łazienki',
      values: ['Jedna standardowa', 'Rozbudowane', 'Rozbudowane'],
      info: ['jedna-lazienka', 'rozbudowana-lazienka', 'rozbudowana-lazienka'],
    },
    {
      feature: 'Zmiany elektryczne',
      values: ['Na istniejących punktach', 'Zmiany punktów wg oferty', 'Rozszerzone zmiany elektryczne'],
      info: ['na-punktach', 'zakres-w-ofercie', 'rozszerzone-elektryka'],
    },
    {
      feature: 'Zmiany wodno-kanalizacyjne',
      values: ['—', 'Zmiany punktów wg oferty', 'Rozszerzone zmiany wod-kan'],
      info: [null, 'zakres-w-ofercie', 'rozszerzone-wod-kan'],
    },
    {
      feature: 'Zabudowy G-K i sufity',
      values: ['—', 'Proste zabudowy i maskownice', 'Dekoracyjne i wielopoziomowe'],
      info: [null, 'proste-gk', 'zlozone-gk-sufity'],
    },
    {
      feature: 'Koordynacja ekip i dostaw',
      values: ['Podstawowa', 'Ekipy, dostawy i harmonogram', 'Koordynacja + odbiory etapowe'],
      info: ['podstawowa-koordynacja', 'pelna-koordynacja', 'rozszerzona-koordynacja'],
    },
    {
      feature: 'Protokoły i raportowanie',
      values: ['—', 'Protokoły i dokumentacja zdjęciowa', 'Protokoły etapowe, odbiory zakresów'],
      info: [null, 'protokoly-dokumentacja', 'protokoly-etapowe'],
    },
    {
      feature: 'Wsparcie architekta w realizacji',
      values: ['—', '—', 'Rozszerzone'],
      info: [null, null, 'rozszerzone-wsparcie-architekta'],
    },
    {
      feature: 'Obsługa usterek',
      values: ['✓', '✓', 'Ewidencja i organizacja usunięcia'],
      info: [null, null, 'ewidencja-usterek'],
    },
  ],
};
