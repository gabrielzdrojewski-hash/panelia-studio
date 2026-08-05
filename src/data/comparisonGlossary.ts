// Słownik OBJAŚNIEŃ UX do tabel porównania pakietów.
// To NIE jest drugie źródło prawdy o zakresie pakietów — wyłącznie pomocnicze wyjaśnienia
// pojęć widocznych w tabeli. Bez liczb, metrów, formatów, terminów i limitów, dopóki nie
// zostaną zatwierdzone w indywidualnej ofercie / Fatica ERP.

export interface GlossaryEntry {
  term: string;
  body: string;
}

export const comparisonGlossary: Record<string, GlossaryEntry> = {
  'projekt-osobno': {
    term: 'Projekt dostępny osobno',
    body: 'Pakiet wykończeniowy nie zawiera projektu wnętrza. Projekt można zamówić jako oddzielny zakres przed rozpoczęciem realizacji.',
  },
  'jedna-lazienka': {
    term: 'Jedna standardowa łazienka',
    body: 'Zakres obejmuje jedną łazienkę w standardzie i ilościach wskazanych w indywidualnej ofercie. Dodatkowe łazienki oraz rozwiązania niestandardowe wymagają osobnej kalkulacji.',
  },
  'rozbudowana-lazienka': {
    term: 'Rozbudowana łazienka',
    body: 'Może obejmować większą liczbę stref, elementów wyposażenia, bardziej rozbudowany układ płytek lub dodatkowe detale. Dokładny zakres określa oferta.',
  },
  'na-punktach': {
    term: 'Na istniejących punktach',
    body: 'Montaż osprzętu odbywa się na istniejących i przygotowanych punktach instalacyjnych, bez automatycznego przenoszenia instalacji.',
  },
  'zakres-w-ofercie': {
    term: 'Zakres w ofercie',
    body: 'Liczba i zakres zmian są określane indywidualnie po analizie projektu, stanu lokalu i instalacji.',
  },
  'rozszerzone-elektryka': {
    term: 'Rozszerzone zmiany elektryczne',
    body: 'Szerszy zakres rozmieszczenia punktów, oświetlenia i osprzętu niż w niższym pakiecie. Dokładne ilości i dopłaty wskazuje oferta.',
  },
  'rozszerzone-wod-kan': {
    term: 'Rozszerzone zmiany wodno-kanalizacyjne',
    body: 'Możliwość większej liczby zmian lub bardziej złożonego rozmieszczenia punktów, zależnie od warunków technicznych. Zakres potwierdzamy w ofercie.',
  },
  'proste-gk': {
    term: 'Proste zabudowy G-K',
    body: 'Proste maskownice, obudowy i jednopoziomowe fragmenty zabudowy. Rozwiązania wielopoziomowe, łukowe i rozbudowane są kalkulowane osobno.',
  },
  'zlozone-gk-sufity': {
    term: 'Bardziej złożone zabudowy i sufity',
    body: 'Rozwiązania wielopoziomowe, dekoracyjne lub zintegrowane z oświetleniem. Wymagają potwierdzenia projektu i indywidualnej kalkulacji.',
  },
  'podstawowa-koordynacja': {
    term: 'Podstawowa koordynacja',
    body: 'Ustalenie podstawowej kolejności prac, komunikacja dotycząca głównych etapów oraz organizacja odbioru końcowego w uzgodnionym zakresie.',
  },
  'pelna-koordynacja': {
    term: 'Pełna koordynacja',
    body: 'Koordynacja ekip, dostaw i kolejności prac w zakresie wskazanym w umowie, wraz z aktualizacjami statusu i dokumentacją realizacji.',
  },
  'rozszerzona-koordynacja': {
    term: 'Rozszerzona koordynacja',
    body: 'Pełna koordynacja uzupełniona o większą kontrolę dostaw, odbiory etapowe, raportowanie i wsparcie architekta.',
  },
  'protokoly-dokumentacja': {
    term: 'Protokoły i dokumentacja zdjęciowa',
    body: 'Dokumentowanie uzgodnionych etapów prac, zdjęcia postępu oraz protokoły zgodne z zakresem umowy.',
  },
  'protokoly-etapowe': {
    term: 'Protokoły etapowe i odbiory zakresów',
    body: 'Formalne potwierdzenie zakończenia wybranych etapów lub zakresów przed rozpoczęciem kolejnych prac.',
  },
  'rozszerzone-wsparcie-architekta': {
    term: 'Rozszerzone wsparcie architekta',
    body: 'Konsultacje i odpowiedzi na pytania pojawiające się podczas realizacji, zgodnie z liczbą i zakresem określonym w umowie. Nie oznacza nieograniczonego nadzoru.',
  },
  'ewidencja-usterek': {
    term: 'Ewidencja i organizacja usunięcia usterek',
    body: 'Rejestr zgłoszonych usterek, przypisanie odpowiedzialności, kontrola statusu i organizacja ich usunięcia w uzgodnionym zakresie.',
  },
};

export function getGlossary(key: string): GlossaryEntry | undefined {
  return comparisonGlossary[key];
}
