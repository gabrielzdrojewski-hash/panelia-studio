// Rejestr grafik REDAKCYJNYCH / koncepcyjnych (jedno źródło prawdy dla mediów editorial).
// NIE są realizacjami klientów. NIE dodawać do public/media/realizations/, /realizacje
// ani case study Ustronie Morskie. Klasyfikacja: mediaType = "editorial_generated_concept".
// Publiczna etykieta (gdy grozi pomyłka z realizacją): "Wizualizacja koncepcyjna".
//
// ODRZUCONE (NIE rejestrować, NIE generować wariantów, NIE używać na stronie):
//   public/media/editorial/panelia-concepts/panelia-premium/panelia-premium-02-soft-contemporary/
//   (paczka panelia-premium-02-soft-contemporary — jakość odrzucona)

const BASE = '/media/editorial/panelia-concepts';
const VARIANTS = [480, 960, 1600] as const;

export type QualityStatus = 'approved' | 'review' | 'rejected';
export type EditorialMediaType = 'editorial_generated_concept';

export interface EditorialMedia {
  id: string;
  dir: string; // podkatalog względem BASE ('' = katalog główny)
  file: string; // bazowa nazwa pliku (bez rozszerzenia)
  src: string; // wariant domyślny (960 WebP)
  width: number;
  height: number;
  alt: string;
  roomType: string;
  style: string;
  usage: string;
  mediaType: EditorialMediaType;
  source: EditorialMediaType;
  publicLabel: 'Wizualizacja koncepcyjna';
  allowedPlacements: string[];
  focalPoint: string;
  preferredAspectRatio: string; // "16/9" | "4/3"
  darkOverlayRecommended: boolean;
  qualityStatus: QualityStatus;
  category?: string; // kategoria tematyczna (paczka category-visuals): hero, projekt-funkcjonalny, ...
  isSchematic?: boolean; // grafika schematyczna/koncepcyjna (nie fotorealistyczne wnętrze)
  // Powiązania mieszkań (opcjonalne — dla zestawów pomieszczeń):
  package?: string; // np. 'panelia_finish_start'
  apartmentId?: string;
  room?: string;
  featured?: boolean;
  sortOrder?: number;
}

function dims(ratio: string): { width: number; height: number } {
  if (ratio === '4/3') return { width: 1600, height: 1200 };
  return { width: 1600, height: 900 };
}

function make(
  dir: string,
  file: string,
  data: Partial<EditorialMedia> & Pick<EditorialMedia, 'alt' | 'roomType' | 'style' | 'usage'>,
): EditorialMedia {
  const ratio = data.preferredAspectRatio ?? '16/9';
  const d = dims(ratio);
  return {
    id: file,
    dir,
    file,
    src: `${BASE}/${dir ? dir + '/' : ''}${file}-960.webp`,
    width: d.width,
    height: d.height,
    mediaType: 'editorial_generated_concept',
    source: 'editorial_generated_concept',
    publicLabel: 'Wizualizacja koncepcyjna',
    allowedPlacements: data.allowedPlacements ?? ['pakiety', 'wizualizacje'],
    focalPoint: data.focalPoint ?? 'center 45%',
    preferredAspectRatio: ratio,
    darkOverlayRecommended: data.darkOverlayRecommended ?? false,
    qualityStatus: data.qualityStatus ?? 'approved',
    ...data,
  };
}

// ————————————————————— OGÓLNE KADRY EDITORIAL (katalog główny) —————————————————————
const concepts: EditorialMedia[] = [
  make('', 'panelia-cathedral-living-01', {
    alt: 'Wizualizacja koncepcyjna przestronnego salonu z wysokim, drewnianym sufitem katedralnym.',
    roomType: 'salon', style: 'natural-warm', usage: 'hero / otwarcie strony',
    allowedPlacements: ['pakiety-hero', 'pakiety-open', 'oferta'], focalPoint: 'center 42%',
    darkOverlayRecommended: true, featured: true,
  }),
  make('', 'panelia-open-house-living-01', {
    alt: 'Wizualizacja koncepcyjna jasnego, otwartego salonu połączonego z kuchnią i jadalnią.',
    roomType: 'salon', style: 'light-open', usage: 'START / ogólna ścieżka',
    allowedPlacements: ['pakiety-band', 'pakiety-module', 'oferta'], focalPoint: 'center 45%',
    darkOverlayRecommended: true,
  }),
  make('', 'panelia-warm-living-dining-01', {
    alt: 'Wizualizacja koncepcyjna ciepłego, nowoczesnego salonu premium z marmurową ścianą.',
    roomType: 'salon', style: 'warm-premium', usage: 'COMFORT',
    allowedPlacements: ['pakiety-band'], focalPoint: 'center 45%',
  }),
  make('', 'panelia-dark-premium-living-01', {
    alt: 'Wizualizacja koncepcyjna eleganckiego, ciemnego salonu z marmurem i złotymi akcentami.',
    roomType: 'salon', style: 'dark-premium', usage: 'PREMIUM',
    allowedPlacements: ['pakiety-band'], focalPoint: 'center 50%',
  }),
  make('', 'panelia-loft-living-01', {
    alt: 'Wizualizacja koncepcyjna industrialnego loftu z antresolą i ceglaną ścianą.',
    roomType: 'salon', style: 'loft-industrial', usage: 'pakiety projektowe / różnorodność stylów',
    allowedPlacements: ['pakiety-band'], focalPoint: 'center 45%',
  }),
  make('', 'panelia-luxury-staircase-01', {
    alt: 'Wizualizacja koncepcyjna reprezentacyjnego holu z lekkimi, ażurowymi schodami.',
    roomType: 'hall', style: 'dark-premium', usage: 'SIGNATURE / kompleksowe projektowanie',
    allowedPlacements: ['pakiety-band', 'pakiety-module'], focalPoint: 'center 40%',
  }),
  make('', 'panelia-premium-bathroom-01', {
    alt: 'Wizualizacja koncepcyjna marmurowej łazienki z prysznicem walk-in i wanną wolnostojącą.',
    roomType: 'lazienka', style: 'marble-warm', usage: 'moduł Łazienka',
    allowedPlacements: ['pakiety-module', 'oferta'], focalPoint: 'center 50%',
  }),
  make('', 'panelia-premium-bathroom-02', {
    alt: 'Wizualizacja koncepcyjna nowoczesnej łazienki z marmurowymi powierzchniami.',
    roomType: 'lazienka', style: 'marble', usage: 'moduł Łazienka (alternatywa)',
    allowedPlacements: ['pakiety-module', 'oferta'], focalPoint: 'center 50%',
  }),
  make('', 'panelia-ring-ceiling-dining-01', {
    alt: 'Wizualizacja koncepcyjna jadalni z okrągłym, podświetlanym sufitem i pierścieniową lampą.',
    roomType: 'jadalnia', style: 'ceiling-lighting', usage: 'moduł Sufity i oświetlenie',
    allowedPlacements: ['pakiety-module', 'oferta'], focalPoint: 'center 35%',
  }),
  make('', 'panelia-premium-bedroom-01', {
    alt: 'Wizualizacja koncepcyjna eleganckiej sypialni premium.',
    roomType: 'sypialnia', style: 'premium', usage: 'ilustracja indywidualnego projektu',
    allowedPlacements: ['pakiety-module', 'oferta'], focalPoint: 'center 45%',
  }),
  make('', 'panelia-premium-bedroom-02', {
    alt: 'Wizualizacja koncepcyjna sypialni premium z ciepłym oświetleniem.',
    roomType: 'sypialnia', style: 'premium', usage: 'ilustracja indywidualnego projektu (alternatywa)',
    allowedPlacements: ['oferta'], focalPoint: 'center 45%',
  }),
  make('', 'panelia-premium-bedroom-03', {
    alt: 'Wizualizacja koncepcyjna sypialni premium z dekoracyjną ścianą.',
    roomType: 'sypialnia', style: 'premium', usage: 'ilustracja indywidualnego projektu (alternatywa)',
    allowedPlacements: ['oferta'], focalPoint: 'center 45%',
  }),
];

// ————————————————————— ZESTAWY MIESZKAŃ (koncepcyjne, per pakiet) —————————————————————
// Tylko ZATWIERDZONE zestawy. Paczka panelia-premium-02-soft-contemporary jest ODRZUCONA — nie ma jej tu.
const roomLabels: Record<string, string> = {
  'salon-z-aneksem': 'salon z aneksem kuchennym',
  lazienka: 'łazienka',
  'lazienka-master': 'łazienka master',
  'lazienka-dodatkowa': 'łazienka dodatkowa',
  sypialnia: 'sypialnia',
  'sypialnia-master': 'sypialnia master',
  przedpokoj: 'przedpokój',
  'gabinet-pokoj-goscinny': 'gabinet / pokój gościnny',
  'gabinet-home-office': 'gabinet / home office',
  garderoba: 'garderoba',
  'kuchnia-z-jadalnia': 'kuchnia z jadalnią',
};

interface ApartmentSpec {
  package: string;
  apartmentId: string;
  dir: string;
  ratio: string;
  style: string;
  rooms: { file: string; room: string }[];
}

const apartmentSpecs: ApartmentSpec[] = [
  {
    package: 'panelia_finish_start',
    apartmentId: 'panelia-start-01-jasne-mieszkanie',
    dir: 'panelia-start/panelia-start-01-jasne-mieszkanie',
    ratio: '4/3',
    style: 'jasne, funkcjonalne',
    rooms: [
      { file: 'panelia-start-01-salon-z-aneksem', room: 'salon-z-aneksem' },
      { file: 'panelia-start-01-sypialnia', room: 'sypialnia' },
      { file: 'panelia-start-01-lazienka', room: 'lazienka' },
    ],
  },
  {
    package: 'panelia_finish_start',
    apartmentId: 'panelia-start-02-greige-mieszkanie',
    dir: 'panelia-start/panelia-start-02-greige-mieszkanie',
    ratio: '4/3',
    style: 'greige',
    rooms: [
      { file: 'panelia-start-02-salon-z-aneksem', room: 'salon-z-aneksem' },
      { file: 'panelia-start-02-sypialnia', room: 'sypialnia' },
      { file: 'panelia-start-02-lazienka', room: 'lazienka' },
    ],
  },
  {
    package: 'panelia_finish_comfort',
    apartmentId: 'panelia-comfort-01-cieple-greige-mieszkanie',
    dir: 'panelia-comfort/panelia-comfort-01-cieple-greige-mieszkanie',
    ratio: '4/3',
    style: 'ciepły greige',
    rooms: [
      { file: 'panelia-comfort-01-salon-z-aneksem', room: 'salon-z-aneksem' },
      { file: 'panelia-comfort-01-sypialnia', room: 'sypialnia' },
      { file: 'panelia-comfort-01-lazienka', room: 'lazienka' },
      { file: 'panelia-comfort-01-gabinet-pokoj-goscinny', room: 'gabinet-pokoj-goscinny' },
      { file: 'panelia-comfort-01-przedpokoj', room: 'przedpokoj' },
    ],
  },
  {
    package: 'panelia_finish_comfort',
    apartmentId: 'panelia-comfort-02-soft-japandi-mieszkanie',
    dir: 'panelia-comfort/panelia-comfort-02-soft-japandi-mieszkanie',
    ratio: '4/3',
    style: 'soft japandi',
    rooms: [
      { file: 'panelia-comfort-02-salon-z-aneksem', room: 'salon-z-aneksem' },
      { file: 'panelia-comfort-02-sypialnia', room: 'sypialnia' },
      { file: 'panelia-comfort-02-lazienka', room: 'lazienka' },
      { file: 'panelia-comfort-02-gabinet-pokoj-goscinny', room: 'gabinet-pokoj-goscinny' },
      { file: 'panelia-comfort-02-przedpokoj', room: 'przedpokoj' },
    ],
  },
  {
    package: 'panelia_finish_premium', // pakiet projektowy SIGNATURE prezentowany jako koncepcja apartamentu
    apartmentId: 'panelia-signature-01-elegancki-apartament',
    dir: 'panelia-signature/panelia-signature-01-elegancki-apartament',
    ratio: '16/9',
    style: 'elegancki apartament',
    rooms: [
      { file: 'panelia-signature-01-salon-z-aneksem', room: 'salon-z-aneksem' },
      { file: 'panelia-signature-01-kuchnia-z-jadalnia', room: 'kuchnia-z-jadalnia' },
      { file: 'panelia-signature-01-sypialnia-master', room: 'sypialnia-master' },
      { file: 'panelia-signature-01-lazienka-master', room: 'lazienka-master' },
      { file: 'panelia-signature-01-garderoba', room: 'garderoba' },
      { file: 'panelia-signature-01-gabinet-home-office', room: 'gabinet-home-office' },
    ],
  },
];

const apartments: EditorialMedia[] = apartmentSpecs.flatMap((spec) =>
  spec.rooms.map((r, i) =>
    make(spec.dir, r.file, {
      alt: `Wizualizacja koncepcyjna — ${roomLabels[r.room] ?? r.room}, mieszkanie w stylu ${spec.style}.`,
      roomType: r.room,
      style: spec.style,
      usage: 'wizualizacje / mieszkanie koncepcyjne',
      allowedPlacements: ['wizualizacje'],
      preferredAspectRatio: spec.ratio,
      qualityStatus: 'approved',
      package: spec.package,
      apartmentId: spec.apartmentId,
      room: r.room,
      sortOrder: i,
    }),
  ),
);

// ————————————————————— PACZKA „category-visuals-4k" (kadry tematyczne 4K) —————————————————————
// Audyt paczki panelia-category-visuals-4k: 10 plików 3840×2160 (16:9, prawdziwe 4K).
// ZATWIERDZONE (6): 01 hero, 02 projekt (schemat), 04 wizualizacje 3D, 05 dokumentacja (schemat),
//   06 dobór materiałów (schemat), 08 sufity i oświetlenie.
// ODRZUCONE (1): 07 panele-dekoracyjne-weglowe — ciemny brąz/czerń/złoto/efekt hotelowy (sprzeczne z paletą).
// DO PRZEGLĄDU / NIE UŻYWAĆ (3): 03 koncepcja (kolaż/moodboard), 09 koordynacja (nakładki UI),
//   10 odbiór (nakładka UI). Nie rejestrujemy ich i nie generujemy wariantów.
const CATV = 'panelia-category-visuals-4k';
const categoryVisuals: EditorialMedia[] = [
  make(CATV, '01-panelia-hero-cathedral-living-01', {
    alt: 'Wizualizacja koncepcyjna przestronnego, jasnego salonu z wysokim drewnianym sufitem katedralnym.',
    roomType: 'salon', style: 'natural-warm', usage: 'hero / otwarcie strony (kadr reprezentacyjny)',
    category: 'hero',
    allowedPlacements: ['pakiety-open', 'wizualizacje', 'oferta'],
    focalPoint: 'center 45%', darkOverlayRecommended: true, featured: true, sortOrder: 1,
  }),
  make(CATV, '02-panelia-projekt-funkcjonalny-01', {
    alt: 'Grafika koncepcyjna projektu funkcjonalnego — schemat układu i stref pomieszczenia z próbnikami.',
    roomType: 'schemat', style: 'schematic', usage: 'ilustracja etapu: koncepcja i układ funkcjonalny',
    category: 'projekt-funkcjonalny', isSchematic: true,
    allowedPlacements: ['proces'], focalPoint: 'center 50%', sortOrder: 2,
  }),
  make(CATV, '04-panelia-wizualizacje-3d-01', {
    alt: 'Wizualizacja koncepcyjna 3D otwartego salonu połączonego z kuchnią i jadalnią.',
    roomType: 'salon', style: 'light-open', usage: 'wizualizacje 3D / etap projekt i wizualizacje',
    category: 'wizualizacje-3d',
    allowedPlacements: ['proces', 'wizualizacje', 'oferta'],
    focalPoint: 'center 48%', darkOverlayRecommended: true, sortOrder: 4,
  }),
  make(CATV, '05-panelia-dokumentacja-wykonawcza-01', {
    alt: 'Grafika koncepcyjna dokumentacji wykonawczej — schematyczne arkusze rzutów i planów.',
    roomType: 'schemat', style: 'schematic', usage: 'ilustracja etapu: dokumentacja wykonawcza',
    category: 'dokumentacja', isSchematic: true,
    allowedPlacements: ['proces'], focalPoint: 'center 50%', sortOrder: 6,
  }),
  make(CATV, '06-panelia-dobor-materialow-01', {
    alt: 'Grafika koncepcyjna doboru materiałów — zestaw próbek kolorów i faktur w naturalnej palecie.',
    roomType: 'materiały', style: 'material-palette', usage: 'ilustracja etapu: dobór materiałów',
    category: 'dobor-materialow', isSchematic: true,
    allowedPlacements: ['proces'], focalPoint: 'center 50%', sortOrder: 5,
  }),
  make(CATV, '08-panelia-sufity-i-oswietlenie-01', {
    alt: 'Wizualizacja koncepcyjna jadalni z podświetlanym pierścieniowym sufitem i ciepłym oświetleniem.',
    roomType: 'jadalnia', style: 'ceiling-lighting', usage: 'sufity i oświetlenie / etap realizacja',
    category: 'sufity-oswietlenie',
    allowedPlacements: ['proces', 'wizualizacje', 'oferta'],
    focalPoint: 'center 40%', sortOrder: 7,
  }),
];

export const editorialMedia: EditorialMedia[] = [...concepts, ...apartments, ...categoryVisuals];

export function getEditorial(id: string): EditorialMedia | undefined {
  return editorialMedia.find((m) => m.id === id);
}

// srcset dla wariantów 480/960/1600 WebP (uwzględnia podkatalog).
export function editorialSrcset(m: EditorialMedia): string {
  const prefix = `${BASE}/${m.dir ? m.dir + '/' : ''}${m.file}`;
  return VARIANTS.map((w) => `${prefix}-${w}.webp ${w}w`).join(', ');
}

// Zestawy mieszkań (zatwierdzone) do prezentacji na /wizualizacje — pogrupowane.
export interface ApartmentGroup {
  package: string;
  apartmentId: string;
  title: string;
  style: string;
  rooms: EditorialMedia[];
}

const apartmentTitles: Record<string, string> = {
  'panelia-start-01-jasne-mieszkanie': 'Jasne mieszkanie',
  'panelia-start-02-greige-mieszkanie': 'Mieszkanie greige',
  'panelia-comfort-01-cieple-greige-mieszkanie': 'Mieszkanie w ciepłym greige',
  'panelia-comfort-02-soft-japandi-mieszkanie': 'Mieszkanie soft japandi',
  'panelia-signature-01-elegancki-apartament': 'Elegancki apartament',
};

export function apartmentGroups(pkg: string): ApartmentGroup[] {
  const ids = [...new Set(apartments.filter((m) => m.package === pkg).map((m) => m.apartmentId!))];
  return ids.map((apartmentId) => {
    const rooms = apartments
      .filter((m) => m.apartmentId === apartmentId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return {
      package: pkg,
      apartmentId,
      title: apartmentTitles[apartmentId] ?? apartmentId,
      style: rooms[0]?.style ?? '',
      rooms,
    };
  });
}
