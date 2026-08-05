// Zakres usług Panelia Studio.
// Treść opisowa, oparta o realny profil działalności — bez cen i bez obietnic terminowych.

export interface Service {
  slug: string;
  title: string;
  summary: string;
  // Punkty zakresu — konkretne, bez pustych sloganów.
  points: string[];
}

export const services: Service[] = [
  {
    slug: 'projektowanie-wnetrz',
    title: 'Projektowanie wnętrz',
    summary:
      'Przemyślany projekt, który łączy estetykę z codzienną wygodą. Pracujemy nad charakterem wnętrza, proporcjami i światłem.',
    points: [
      'Koncepcja estetyczna i kierunek materiałowy',
      'Spójny język wizualny w całym mieszkaniu',
      'Projekt dopasowany do trybu życia mieszkańców',
    ],
  },
  {
    slug: 'uklady-funkcjonalne',
    title: 'Układy funkcjonalne',
    summary:
      'Planujemy przestrzeń tak, aby każdy metr pracował. Analizujemy komunikację, przechowywanie i ergonomię.',
    points: [
      'Optymalizacja rozkładu pomieszczeń',
      'Strefowanie dzienne i nocne',
      'Rozwiązania powiększające przestrzeń wizualnie',
    ],
  },
  {
    slug: 'wizualizacje',
    title: 'Wizualizacje',
    summary:
      'Fotorealistyczne widoki 3D, które pokazują wnętrze przed rozpoczęciem prac. Decyzje podejmujesz świadomie, bez niespodzianek.',
    points: [
      'Widoki 3D kluczowych pomieszczeń',
      'Warianty materiałowe i kolorystyczne',
      'Moodboardy i prezentacja kierunku',
    ],
  },
  {
    slug: 'dobor-materialow',
    title: 'Dobór materiałów',
    summary:
      'Dobieramy materiały premium, które dobrze się starzeją. Kierujemy się jakością, trwałością i spójnością całości.',
    points: [
      'Selekcja okładzin, podłóg i wykończeń',
      'Panele ścienne i podłogowe dopasowane do projektu',
      'Kontrola spójności kolorystyki i faktur',
    ],
  },
  {
    slug: 'dokumentacja-wykonawcza',
    title: 'Dokumentacja wykonawcza',
    summary:
      'Precyzyjna dokumentacja, na podstawie której pracują ekipy. Ogranicza ryzyko błędów i przyspiesza realizację.',
    points: [
      'Rysunki techniczne i rozkłady',
      'Zestawienia materiałów i wykończeń',
      'Wytyczne dla wykonawców i podwykonawców',
    ],
  },
  {
    slug: 'nadzor-i-koordynacja',
    title: 'Nadzór i koordynacja',
    summary:
      'Pilnujemy, aby projekt został wykonany zgodnie z założeniami. Koordynujemy ekipy i harmonogram prac.',
    points: [
      'Koordynacja ekip na budowie',
      'Kontrola jakości i zgodności z projektem',
      'Nadzór nad harmonogramem etapów',
    ],
  },
  {
    slug: 'dostawa-materialow',
    title: 'Dostawa materiałów',
    summary:
      'Logistyka materiałów po naszej stronie — z dostawą prosto od producentów. Mniej formalności dla inwestora.',
    points: [
      'Zamówienia i logistyka materiałów',
      'Dostawa bezpośrednio od producentów',
      'Organizacja dostaw pod harmonogram prac',
    ],
  },
  {
    slug: 'wykonczenie-pod-klucz',
    title: 'Kompleksowe wykończenie wnętrz',
    summary:
      'Realizacja pod klucz — od projektu po gotowe, urządzone wnętrze. Jeden zespół odpowiedzialny za całość.',
    points: [
      'Wykończenie wnętrza w całości',
      'Meble na wymiar i zabudowy',
      'Odbiór gotowej przestrzeni',
    ],
  },
  {
    slug: 'oferta-dla-inwestorow',
    title: 'Oferta dla inwestorów',
    summary:
      'Powtarzalny, przewidywalny proces dla mieszkań na wynajem i pod inwestycję. Standard, który skaluje się na wiele lokali.',
    points: [
      'Wykończenia pod wynajem i sprzedaż',
      'Powtarzalny standard dla wielu mieszkań',
      'Rozwiązania trwałe i łatwe w utrzymaniu',
    ],
  },
];
