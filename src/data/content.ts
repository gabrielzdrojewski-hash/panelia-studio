// Treści redakcyjne wyższego poziomu: filary marki, sekcja dla inwestorów, powtarzalne CTA.
// Oddzielone od komponentów, aby ułatwić późniejszą edycję copy.

export interface Pillar {
  title: string;
  description: string;
}

// Filary, które wyróżniają sposób pracy Panelia Studio. Bez pustych sloganów.
export const pillars: Pillar[] = [
  {
    title: 'Jeden proces, jedna odpowiedzialność',
    description:
      'Projekt, dobór materiałów i realizacja w jednym zespole. Nie musisz łączyć wielu wykonawców — prowadzimy całość.',
  },
  {
    title: 'Materiały premium prosto od producentów',
    description:
      'Dobieramy i dostarczamy materiały wysokiej jakości. Logistyka jest po naszej stronie, a Ty widzisz spójny efekt.',
  },
  {
    title: 'Decyzje na podstawie wizualizacji',
    description:
      'Fotorealistyczne widoki 3D pokazują wnętrze przed pracami. Wybory podejmujesz świadomie, bez niespodzianek.',
  },
  {
    title: 'Wykończenie bez kompromisów',
    description:
      'Dbamy o detal, proporcje i jakość wykonania. Wnętrze ma dobrze wyglądać i dobrze się starzeć.',
  },
];

// Sekcja dla inwestorów — powtarzalny standard dla mieszkań na wynajem i pod inwestycję.
export const investor = {
  eyebrow: 'Dla inwestorów',
  title: 'Powtarzalny standard dla mieszkań na wynajem i pod inwestycję',
  description:
    'Dla inwestorów liczy się przewidywalność: jeden zespół, jeden standard i uporządkowany przebieg prac na wielu lokalach. Przygotowujemy wykończenia, które dobrze się prezentują, są trwałe i łatwe w utrzymaniu.',
  points: [
    'Powtarzalny standard wykończenia dla wielu mieszkań',
    'Logistyka materiałów i koordynacja po naszej stronie',
    'Rozwiązania odporne na intensywne użytkowanie',
    'Przewidywalny, uporządkowany przebieg realizacji',
  ],
};

// Slider usług na stronie głównej (01–06). Obrazy: wizualizacje projektowe (efekt premium).
export interface ServiceReelItem {
  number: string;
  title: string;
  summary: string;
  mediaId: string; // id materiału z media.json (wizualizacja).
  href: string;
}

export const serviceReel: ServiceReelItem[] = [
  {
    number: '01',
    title: 'Projekt i układ funkcjonalny',
    summary: 'Przemyślany układ i koncepcja wnętrza dopasowana do trybu życia mieszkańców.',
    mediaId: 'visualization-ustronie-06',
    href: '/oferta',
  },
  {
    number: '02',
    title: 'Wizualizacje wnętrz',
    summary: 'Fotorealistyczne widoki 3D — decyzje podejmujesz świadomie, bez niespodzianek.',
    mediaId: 'visualization-tuscan-04',
    href: '/oferta',
  },
  {
    number: '03',
    title: 'Panele dekoracyjne i powierzchnie ścienne',
    summary:
      'Dekoracyjne powierzchnie ścienne, w tym możliwość zastosowania paneli węglowych z aktualnej kolekcji Panelia Studio — zależnie od projektu i indywidualnej oferty.',
    // Zdjęcie realizacji jako ilustracja dekoracyjnej powierzchni. NIE jest to zdjęcie panelu węglowego.
    // TODO(media): zastąpić rzeczywistym zdjęciem produktu (patrz docs/MEDIA-TODO.md).
    mediaId: 'realization-ustronie-03',
    href: '/pakiety#standard-materialowy',
  },
  {
    number: '04',
    title: 'Sufity i oświetlenie',
    summary:
      'Projektujemy rozwiązania sufitowe i oświetleniowe. W zależności od projektu i indywidualnej oferty mogą obejmować również sufity napinane.',
    // Wizualizacja ilustracyjna — nie nazywamy widocznego sufitu sufitem napinanym.
    // TODO(media): docelowo zdjęcie/wizualizacja sufitu napinanego (patrz docs/MEDIA-TODO.md).
    mediaId: 'visualization-ustronie-04',
    href: '/pakiety#standard-materialowy',
  },
  {
    number: '05',
    title: 'Projekt i dokumentacja wykonawcza',
    summary:
      'Dokumentacja obejmuje rzuty, widoki ścian, plany instalacji oraz informacje potrzebne ekipom wykonawczym. Kadr jest wyłącznie ilustracją efektu wnętrza.',
    // Estetyczny kadr wnętrza (wariant B) — samo zdjęcie nie jest dokumentacją techniczną.
    // TODO(media): estetyczna makieta arkusza dokumentacji wykonawczej (patrz docs/MEDIA-TODO.md).
    mediaId: 'visualization-ustronie-08',
    href: '/oferta',
  },
  {
    number: '06',
    title: 'Dobór i dostawa materiałów',
    summary: 'Materiały premium prosto od producentów — logistyka po naszej stronie.',
    mediaId: 'visualization-tuscan-03',
    href: '/oferta',
  },
  {
    number: '07',
    title: 'Koordynacja realizacji',
    summary: 'Koordynujemy ekipy i harmonogram, dbając o jakość i zgodność z projektem.',
    mediaId: 'realization-ustronie-05',
    href: '/oferta',
  },
  {
    number: '08',
    title: 'Kompleksowe wykończenie wnętrz',
    summary: 'Realizacja pod klucz — od projektu po gotowe, urządzone wnętrze.',
    mediaId: 'realization-ustronie-06',
    href: '/oferta',
  },
];

// Slajdy hero strony głównej — deskryptory (bez src). Źródło rozwiązywane w index.astro:
//   'editorial' → src/data/editorialMedia.ts (koncepcje, warianty WebP + srcset),
//   'media'     → src/data/media.json (wizualizacje projektowe / realizacje).
// Pierwszy slajd jest ładowany priorytetowo (eager + fetchpriority + preload).
export type HeroSlideSource = 'editorial' | 'media';
export interface HeroSlide {
  source: HeroSlideSource;
  id: string;
  publicLabel: 'Wizualizacja koncepcyjna' | 'Wizualizacja projektowa' | 'Realizacja';
  focalPoint: string; // object-position
  overlayStrength: 'soft' | 'medium' | 'strong';
  textPosition: 'left' | 'center';
}

export const heroSlides: HeroSlide[] = [
  {
    source: 'editorial',
    id: '01-panelia-hero-cathedral-living-01',
    publicLabel: 'Wizualizacja koncepcyjna',
    focalPoint: 'center 45%',
    overlayStrength: 'strong',
    textPosition: 'left',
  },
  {
    source: 'editorial',
    id: 'panelia-open-house-living-01',
    publicLabel: 'Wizualizacja koncepcyjna',
    focalPoint: 'center 52%',
    overlayStrength: 'medium',
    textPosition: 'left',
  },
  {
    source: 'media',
    id: 'visualization-ustronie-06',
    publicLabel: 'Wizualizacja projektowa',
    focalPoint: 'center 50%',
    overlayStrength: 'medium',
    textPosition: 'left',
  },
];

// Animowane liczby — wyłącznie fakty wynikające ze struktury oferty (bez danych sprzedażowych).
export interface Stat {
  value: number;
  label: string;
  suffix?: string;
}

export const homeStats: Stat[] = [
  { value: 6, label: 'pakietów w ofercie' },
  { value: 2, label: 'ścieżki współpracy' },
  { value: 8, label: 'etapów procesu' },
  { value: 1, label: 'spójny proces' },
];

// Rozróżnienie realizacje / wizualizacje — używane na stronach galerii, aby unikać nieporozumień.
export const mediaNotes = {
  realizations:
    'Zdjęcia z wykonanych wnętrz. Prezentują rzeczywiste, ukończone realizacje Panelia Studio.',
  visualizations:
    'Wizualizacje projektowe (widoki 3D). Prezentują koncepcje i projekty — nie są zdjęciami wykonanych wnętrz.',
};
