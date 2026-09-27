import crypto from 'crypto';

/**
 * Generates an intuitive, high-entropy password for client wedding galleries.
 * Format: EverLens-Word-Number (e.g., EverLens-Solace-842)
 */
export function generateSecurePassword(): string {
  const words = [
    'Radiance',
    'Solace',
    'Amour',
    'Mirage',
    'Velvet',
    'Elysian',
    'Waltz',
    'Lumiere',
    'Aurora',
    'Golden',
    'Serenade',
    'Symphony',
    'Bliss',
    'Haven',
    'Petal',
    'Crest',
  ];

  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomNum = Math.floor(100 + Math.random() * 900); // 3 digits
  const suffix = crypto.randomBytes(2).toString('hex').toLowerCase(); // 4 chars

  return `EverLens-${randomWord}-${randomNum}-${suffix}`;
}

/**
 * Generates a random numeric PIN for guest access (4 digits).
 */
export function generateGuestPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generates a URL-safe, clean guest token based on couple names and random hash.
 * e.g., 'sarah-youssef-c8f2'
 */
export function generateGuestToken(coupleNames?: string): string {
  const base = (coupleNames || 'wedding')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);

  const hash = crypto.randomBytes(3).toString('hex');
  return `${base || 'gallery'}-${hash}`;
}
