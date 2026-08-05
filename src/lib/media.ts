// Typowany dostęp do manifestu mediów (src/data/media.json — źródło prawdy).
// Utrzymuje rozróżnienie realization / visualization i dostarcza dane potrzebne
// do renderowania obrazów bez layout shift (width/height).

import mediaData from '../data/media.json';

export type MediaType = 'realization' | 'visualization';

export interface MediaItem {
  id: string;
  type: MediaType;
  collection: string;
  project: string | null;
  title: string;
  alt: string;
  path: string;
  sourceFile: string;
  sha256: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  bytes: number;
}

const allMedia = mediaData as MediaItem[];

export function getAllMedia(): MediaItem[] {
  return allMedia;
}

export function getRealizations(): MediaItem[] {
  return allMedia.filter((item) => item.type === 'realization');
}

export function getVisualizations(): MediaItem[] {
  return allMedia.filter((item) => item.type === 'visualization');
}

export function getByCollection(type: MediaType, collection: string): MediaItem[] {
  return allMedia.filter((item) => item.type === type && item.collection === collection);
}

// Unikalne kolekcje danego typu, z zachowaniem kolejności występowania w manifeście.
export function getCollections(type: MediaType): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of allMedia) {
    if (item.type === type && !seen.has(item.collection)) {
      seen.add(item.collection);
      result.push(item.collection);
    }
  }
  return result;
}

// Czytelne nazwy kolekcji do prezentacji.
const collectionLabels: Record<string, string> = {
  'ustronie-morskie': 'Ustronie Morskie',
  'tuscan-style': 'Styl toskański',
};

export function collectionLabel(collection: string): string {
  return collectionLabels[collection] ?? collection;
}

// Wybór N pozycji danego typu do sekcji „wybrane”.
// Parametr `exclude` pozwala nie powtarzać zdjęć użytych już w innej sekcji (np. w hero).
export function pickMedia(
  type: MediaType,
  count: number,
  options: { exclude?: string[] } = {},
): MediaItem[] {
  const exclude = new Set(options.exclude ?? []);
  return allMedia.filter((item) => item.type === type && !exclude.has(item.id)).slice(0, count);
}

export function getMediaById(id: string): MediaItem | undefined {
  return allMedia.find((item) => item.id === id);
}
