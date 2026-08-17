// Definicja guided estimate (ścieżka „Wyceń swoje wnętrze").
//
// TO JEST DEFINICJA ZAPASOWA (source: 'panelia_fallback'). Docelowo definicja formularza,
// conditional logic i wersjonowanie pochodzą z Fatica ERP. Frontend renderuje ją data-driven,
// więc liczba i kolejność kroków NIE są zakodowane na sztywno.
//
// WAŻNE: brak cen, stawek i kwot (bez „zł", „/m²", „za m²") — reguła marki i bramka produkcyjna.
// Budżet jest jakościowy (bez kwot). Cena pochodzi wyłącznie z ERP.

import type { EstimateDefinition, PackageInterest } from '../../lib/estimate';
import { inspirationQuestionOptions } from './inspirations';

export const estimateDefinition: EstimateDefinition = {
  version: '2026-08-18', // bump: dodano krok inspiracji + review (zmiana schematu draftu)
  source: 'panelia_fallback',
  steps: [
    {
      id: 'path',
      title: 'Czego potrzebujesz?',
      intro: 'Zacznijmy od kierunku współpracy — dopasujemy do niego kolejne pytania.',
      questions: [
        {
          id: 'path',
          type: 'single',
          label: 'Wybierz zakres',
          required: true,
          options: [
            { value: 'projekt_wnetrza', label: 'Projekt wnętrza', hint: 'Koncepcja, wizualizacje, dokumentacja.' },
            { value: 'wykonczenie', label: 'Wykończenie', hint: 'Realizacja i wykończenie pod klucz.' },
            { value: 'projekt_i_wykonczenie', label: 'Projekt i wykończenie', hint: 'Kompleksowo — od projektu po realizację.' },
            { value: 'nie_wiem', label: 'Nie wiem — pomóżcie mi dobrać rozwiązanie', hint: 'Doradzimy właściwą ścieżkę.' },
          ],
        },
      ],
    },
    {
      id: 'property',
      title: 'Jakiej nieruchomości dotyczy projekt?',
      questions: [
        {
          id: 'property_type',
          type: 'single',
          label: 'Rodzaj nieruchomości',
          required: true,
          options: [
            { value: 'mieszkanie', label: 'Mieszkanie' },
            { value: 'dom', label: 'Dom' },
            { value: 'pomieszczenia', label: 'Wybrane pomieszczenia' },
          ],
        },
        {
          id: 'rooms_selected',
          type: 'multi',
          label: 'Które pomieszczenia?',
          help: 'Zaznacz wszystkie, których dotyczy zakres.',
          required: true,
          visibleWhen: { questionId: 'property_type', in: ['pomieszczenia'] },
          options: [
            { value: 'salon', label: 'Salon' },
            { value: 'kuchnia', label: 'Kuchnia' },
            { value: 'lazienka', label: 'Łazienka' },
            { value: 'sypialnia', label: 'Sypialnia' },
            { value: 'przedpokoj', label: 'Przedpokój' },
            { value: 'gabinet', label: 'Gabinet / inne' },
          ],
        },
      ],
    },
    {
      id: 'metrics',
      title: 'Powiedz nam o przestrzeni',
      questions: [
        {
          id: 'area',
          type: 'number',
          label: 'Przybliżona powierzchnia (m²)',
          help: 'Wystarczy szacunek — doprecyzujemy później.',
          placeholder: 'np. 68',
          unit: 'm²',
          min: 1,
          max: 2000,
          inputmode: 'numeric',
        },
        {
          id: 'city',
          type: 'text',
          label: 'Miejscowość',
          placeholder: 'np. Warszawa',
          maxLength: 80,
          autocomplete: 'address-level2',
        },
        {
          id: 'postal_code',
          type: 'text',
          label: 'Kod pocztowy (opcjonalnie)',
          placeholder: 'np. 00-443',
          maxLength: 12,
          autocomplete: 'postal-code',
        },
      ],
    },
    {
      id: 'state',
      title: 'W jakim stanie jest nieruchomość?',
      questions: [
        {
          id: 'state',
          type: 'single',
          label: 'Stan',
          options: [
            { value: 'deweloperski', label: 'Stan deweloperski' },
            { value: 'w_budowie', label: 'W budowie' },
            { value: 'zamieszkala', label: 'Zamieszkała' },
            { value: 'do_remontu', label: 'Do remontu' },
          ],
        },
      ],
    },
    {
      id: 'scope',
      title: 'Zakres prac',
      intro: 'Kilka pytań o skalę — pomogą wstępnie oszacować projekt.',
      questions: [
        {
          id: 'rooms_count',
          type: 'number',
          label: 'Liczba pomieszczeń',
          placeholder: 'np. 4',
          min: 1,
          max: 40,
          inputmode: 'numeric',
        },
        {
          id: 'kitchen',
          type: 'single',
          label: 'Czy zakres obejmuje kuchnię?',
          options: [
            { value: 'tak', label: 'Tak' },
            { value: 'nie', label: 'Nie' },
          ],
        },
        {
          id: 'bathrooms_count',
          type: 'number',
          label: 'Liczba łazienek',
          placeholder: 'np. 2',
          min: 0,
          max: 15,
          inputmode: 'numeric',
        },
        {
          id: 'builtins',
          type: 'multi',
          label: 'Zabudowy meblowe w zakresie',
          help: 'Zaznacz, jeśli mają być częścią projektu.',
          options: [
            { value: 'kuchnia', label: 'Kuchnia' },
            { value: 'szafy', label: 'Szafy' },
            { value: 'garderoba', label: 'Garderoba' },
            { value: 'lazienkowe', label: 'Zabudowy łazienkowe' },
          ],
        },
      ],
    },
    {
      id: 'standard',
      title: 'Oczekiwany standard',
      questions: [
        {
          id: 'standard',
          type: 'single',
          label: 'Poziom wykończenia',
          options: [
            { value: 'podstawowy', label: 'Uporządkowany, funkcjonalny' },
            { value: 'optymalny', label: 'Podwyższony standard i detale' },
            { value: 'najwyzszy', label: 'Najwyższy standard i indywidualne rozwiązania' },
          ],
        },
        {
          id: 'budget',
          type: 'single',
          label: 'Orientacyjne oczekiwania budżetowe',
          help: 'Bez konkretnych kwot — pomaga dobrać zakres. Wycenę przygotujemy indywidualnie.',
          options: [
            { value: 'ekonomiczny', label: 'Ekonomiczny' },
            { value: 'optymalny', label: 'Optymalny' },
            { value: 'premium', label: 'Premium' },
            { value: 'bez_ograniczen', label: 'Bez sztywnych ograniczeń' },
          ],
        },
      ],
    },
    {
      id: 'inspiration',
      title: 'Co Ci się podoba?',
      intro: 'Wybierz do trzech kierunków, które są Ci najbliższe. To pomaga nam trafić w Twój gust — nie jest wyborem pakietu.',
      questions: [
        {
          id: 'inspiration_ids',
          type: 'inspiration',
          label: 'Jaki klimat wnętrza jest Ci najbliższy?',
          help: 'Możesz zaznaczyć maksymalnie 3.',
          maxSelect: 3,
          options: inspirationQuestionOptions,
        },
      ],
    },
    {
      id: 'timing',
      title: 'Termin i dodatkowe informacje',
      questions: [
        {
          id: 'timing',
          type: 'single',
          label: 'Kiedy chcesz zacząć?',
          options: [
            { value: 'jak_najszybciej', label: 'Jak najszybciej' },
            { value: '1_3_mies', label: 'W ciągu 1–3 miesięcy' },
            { value: '3_6_mies', label: 'W ciągu 3–6 miesięcy' },
            { value: 'elastyczny', label: 'Termin elastyczny' },
          ],
        },
        {
          id: 'notes',
          type: 'textarea',
          label: 'Dodatkowe wymagania (opcjonalnie)',
          placeholder: 'Styl, inspiracje, szczególne potrzeby…',
          maxLength: 2000,
        },
      ],
    },
  ],
};

// Best-effort mapowanie na package_interest — WYŁĄCZNIE jako podpowiedź do leada (hint).
// ERP pozostaje źródłem prawdy dla doboru pakietu i ceny.
export function inferPackageInterest(answers: Record<string, unknown>): PackageInterest | null {
  const path = answers.path;
  const standard = answers.standard;
  const projectMap: Record<string, PackageInterest> = {
    podstawowy: 'panelia_concept',
    optymalny: 'panelia_complete',
    najwyzszy: 'panelia_signature',
  };
  const finishMap: Record<string, PackageInterest> = {
    podstawowy: 'panelia_finish_start',
    optymalny: 'panelia_finish_comfort',
    najwyzszy: 'panelia_finish_premium',
  };
  const std = typeof standard === 'string' ? standard : 'optymalny';
  if (path === 'projekt_wnetrza') return projectMap[std] ?? 'panelia_complete';
  if (path === 'wykonczenie') return finishMap[std] ?? 'panelia_finish_comfort';
  if (path === 'projekt_i_wykonczenie') return finishMap[std] ?? 'panelia_finish_comfort';
  return null; // 'nie_wiem' lub brak — ERP dobierze
}
