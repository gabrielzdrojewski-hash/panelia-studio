// Etapy współpracy z Panelia Studio.
// Kolejność odzwierciedla realny przebieg projektu — od pierwszej rozmowy po odbiór.

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'Pierwsza rozmowa',
    description:
      'Poznajemy Twoje oczekiwania, charakter mieszkania i zakres, jaki chcesz powierzyć. Ustalamy, jak możemy pomóc.',
  },
  {
    number: '02',
    title: 'Analiza potrzeb',
    description:
      'Analizujemy przestrzeń, tryb życia i priorytety. Określamy funkcje, których wnętrze naprawdę potrzebuje.',
  },
  {
    number: '03',
    title: 'Koncepcja i układ funkcjonalny',
    description:
      'Proponujemy układ przestrzeni i kierunek estetyczny. Ustalamy fundament, na którym oprze się cały projekt.',
  },
  {
    number: '04',
    title: 'Projekt i wizualizacje',
    description:
      'Przygotowujemy projekt oraz fotorealistyczne wizualizacje. Widzisz wnętrze, zanim zaczną się prace.',
  },
  {
    number: '05',
    title: 'Dobór materiałów',
    description:
      'Dobieramy materiały, okładziny i wykończenia. Dbamy o spójność, jakość i trwałość każdego elementu.',
  },
  {
    number: '06',
    title: 'Dokumentacja',
    description:
      'Tworzymy dokumentację wykonawczą, na podstawie której pracują ekipy. Ograniczamy ryzyko błędów.',
  },
  {
    number: '07',
    title: 'Realizacja lub nadzór',
    description:
      'Realizujemy wnętrze pod klucz albo nadzorujemy prace i koordynujemy ekipy — zależnie od wybranego zakresu.',
  },
  {
    number: '08',
    title: 'Odbiór',
    description:
      'Przekazujemy gotowe wnętrze. Sprawdzamy zgodność z projektem i dopinamy szczegóły przed odbiorem.',
  },
];
