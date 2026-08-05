// Projekty realizacji — model „katalogowy” (case studies).
// Każdy projekt ma osobną podstronę /realizacje/[slug].
//
// ŹRÓDŁO DANYCH:
// - Docelowo katalog realizacji (showcase) będzie pobierany z Fatica ERP:
//     GET /api/public/organizations/panelia-studio/showcase
//   (szczegóły w docs/FATICA_INTEGRATION.md).
// - Na tym etapie źródłem prawdy jest lokalny plik + manifest mediów (src/data/media.json).
//   Lokalne dane pełnią rolę fallbacku i pozostają aktywne, dopóki integracja nie zostanie wdrożona.
//
// ZASADY:
// - Realizacje = wyłącznie prawdziwe, wykonane wnętrza (media typu `realization`).
// - Wizualizacje projektu prezentujemy osobno i wyraźnie oznaczone (media typu `visualization`).
// - Nie podajemy niepotwierdzonych konkretów (metraż, terminy, dane klienta).

export type ProjectSource = 'local' | 'fatica';

export interface Project {
  slug: string;
  name: string;
  location: string;
  // Krótki opis na kartę katalogu.
  summary: string;
  // Dłuższy wstęp na podstronę projektu.
  intro: string;
  // Klucz kolekcji realizacji w media.json (fallback lokalny).
  realizationCollection: string;
  // Klucz kolekcji wizualizacji tego samego projektu (opcjonalnie).
  visualizationCollection?: string;
  // Id materiału (realizacji) użytego jako okładka.
  coverId: string;
  // Zakres prac — oparty na usługach studia potwierdzonych istnieniem materiałów
  // (są wizualizacje projektowe oraz zdjęcia wykonanego wnętrza).
  scope: string[];
  // Źródło danych projektu (na potrzeby przyszłej synchronizacji z ERP).
  source: ProjectSource;
  // Opcjonalny identyfikator zewnętrzny (np. id projektu w Fatica ERP).
  externalId?: string;
}

// Lokalny katalog (fallback). Po wdrożeniu integracji rekordy z ERP będą łączone/nadpisywane
// po polu `slug` lub `externalId`.
export const projects: Project[] = [
  {
    slug: 'ustronie-morskie',
    name: 'Ustronie Morskie',
    location: 'Ustronie Morskie',
    summary:
      'Nowoczesne wnętrze w nadmorskiej miejscowości — marmurowe powierzchnie, złote detale i wyraziste akcenty.',
    intro:
      'Realizacja wnętrza w Ustroniu Morskim. Projekt łączy jasne, ciepłe neutralne tła z marmurowymi powierzchniami, złotymi detalami i wyrazistymi akcentami. Poniżej prezentujemy zdjęcia z wykonanego wnętrza, a w dalszej części — wizualizacje projektowe, które powstały na etapie koncepcji.',
    realizationCollection: 'ustronie-morskie',
    visualizationCollection: 'ustronie-morskie',
    coverId: 'realization-ustronie-03',
    scope: ['Projekt i wizualizacje', 'Dobór materiałów', 'Wykończenie wnętrza'],
    source: 'local',
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

// Warstwa dostępu do katalogu realizacji.
// Obecnie zwraca dane lokalne (fallback). Docelowo w tym miejscu nastąpi pobranie
// katalogu z Fatica ERP (GET /api/public/organizations/panelia-studio/showcase)
// z zachowaniem lokalnych danych jako fallbacku przy błędzie lub braku odpowiedzi.
export async function getShowcaseProjects(): Promise<Project[]> {
  // MIEJSCE INTEGRACJI (docelowo, po stronie serwera/buildu):
  // try {
  //   const res = await fetch(`${FATICA_API_URL}/api/public/organizations/panelia-studio/showcase`);
  //   if (res.ok) return mapShowcaseToProjects(await res.json());
  // } catch { /* fallback poniżej */ }
  return projects;
}
