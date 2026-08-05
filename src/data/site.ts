// Centralna konfiguracja witryny Panelia Studio.
// Dane potwierdzone na podstawie istniejących materiałów i publicznej wersji paneliastudio.pl.
// Nie umieszczaj tutaj cen, stawek ani danych niepotwierdzonych.

export const site = {
  name: 'Panelia Studio',
  shortName: 'Panelia',
  url: 'https://paneliastudio.pl',
  locale: 'pl_PL',
  lang: 'pl',
  // Krótki, spójny opis marki wykorzystywany w meta description i danych strukturalnych.
  description:
    'Panelia Studio projektuje i wykańcza wnętrza premium — od koncepcji, przez wizualizacje i dobór materiałów, po realizację pod klucz.',
  tagline: 'Piękne wnętrza — bez kompromisów',
  // Domyślny obraz OG: reprezentacyjna wizualizacja projektowa (spójna z hero).
  ogImage: '/media/visualizations/ustronie-morskie/ustronie-morskie-visualization-06.webp',
} as const;

export const contact = {
  phone: '+48 601 364 956',
  // Wersja telefonu do atrybutu href="tel:" — bez spacji.
  phoneHref: '+48601364956',
  email: 'biuro@paneliastudio.pl',
  address: {
    street: 'ul. Górnośląska 7A',
    postalCode: '00-443',
    city: 'Warszawa',
    country: 'Polska',
    countryCode: 'PL',
  },
} as const;

export interface NavItem {
  label: string;
  href: string;
}

// Główna nawigacja. Kolejność odzwierciedla ścieżkę decyzyjną klienta.
export const primaryNav: NavItem[] = [
  { label: 'Start', href: '/' },
  { label: 'O nas', href: '/o-nas' },
  { label: 'Oferta', href: '/oferta' },
  { label: 'Pakiety', href: '/pakiety' },
  { label: 'Realizacje', href: '/realizacje' },
  { label: 'Wizualizacje', href: '/wizualizacje' },
  { label: 'Proces', href: '/proces' },
  { label: 'Kontakt', href: '/kontakt' },
];

// Linki dodatkowe (stopka).
export const secondaryNav: NavItem[] = [
  { label: 'Polityka prywatności', href: '/polityka-prywatnosci' },
];

export interface SocialLink {
  label: string;
  href: string;
}

// Kanały social media — renderowane w stopce WYŁĄCZNIE po dodaniu zweryfikowanych adresów.
// Nie dodawaj tu pustych ani fikcyjnych URL. Pusta tablica = brak sekcji social (świadomie).
export const social: SocialLink[] = [];
