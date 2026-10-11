export const STANDARD_CATEGORY_NAMES: Record<string, string> = {
  mariage: 'Mariage',
  wteya: 'Wteya',
  outia: 'Outia',
  'henna-arousa': 'Henna Arousa',
  'henna-arous': 'Henna Arous',
  henna: 'Henna',
  hammem: 'Hammem',
  thour: 'Thour',
  teaser: 'Teaser',
  reels: 'Reels',
  films: 'Films',
  ceremony: 'Ceremony',
  'getting-ready': 'Getting Ready',
  photography: 'Mariage',
};

/**
 * Converts a category slug into an elegant editorial label.
 */
export function formatCategoryLabel(
  slug?: string | null,
  customCategories?: Array<{ slug: string; name: string }>
): string {
  if (!slug) return 'Mariage';
  const clean = slug.toLowerCase().trim();

  if (customCategories && Array.isArray(customCategories)) {
    const match = customCategories.find(
      (c) => (c.slug || '').toLowerCase().trim() === clean
    );
    if (match && match.name) return match.name;
  }

  if (STANDARD_CATEGORY_NAMES[clean]) {
    return STANDARD_CATEGORY_NAMES[clean];
  }

  // Format hyphenated/underscored slug to Title Case
  return clean
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export interface GalleryCategoryMeta {
  slug: string;
  label: string;
  totalCount: number;
  photoCount: number;
  videoCount: number;
}

/**
 * Extracts and calculates ONLY the categories present in a specific gallery.
 * If a couple only has Mariage, it returns only Mariage.
 * If a couple has Henna, Wteya, and Mariage, it returns those 3 categories.
 */
export function extractClientGalleryCategories(
  mediaItems: Array<{ category?: string; type?: string }>,
  customCategories?: Array<{ slug: string; name: string }>
): GalleryCategoryMeta[] {
  if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
    return [];
  }

  const map = new Map<string, { totalCount: number; photoCount: number; videoCount: number }>();

  mediaItems.forEach((item) => {
    let cat = (item.category || '').toLowerCase().trim();
    if (!cat || cat === 'photography') {
      cat = 'mariage';
    }

    const current = map.get(cat) || { totalCount: 0, photoCount: 0, videoCount: 0 };
    current.totalCount += 1;
    if (item.type === 'video') {
      current.videoCount += 1;
    } else {
      current.photoCount += 1;
    }
    map.set(cat, current);
  });

  // Sort with custom order preference: Hammem -> Henna -> Wteya -> Mariage -> Others
  const orderPreference: Record<string, number> = {
    hammem: 1,
    'henna-arous': 2,
    'henna-arousa': 3,
    henna: 4,
    wteya: 5,
    outia: 6,
    mariage: 7,
    ceremony: 8,
    reels: 9,
    teaser: 10,
    films: 11,
  };

  return Array.from(map.entries())
    .map(([slug, data]) => ({
      slug,
      label: formatCategoryLabel(slug, customCategories),
      ...data,
    }))
    .sort((a, b) => {
      const orderA = orderPreference[a.slug] ?? 99;
      const orderB = orderPreference[b.slug] ?? 99;
      return orderA - orderB;
    });
}
