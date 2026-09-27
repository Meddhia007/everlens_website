import mongoose from 'mongoose';

/**
 * Escapes regex metacharacters for safe usage in MongoDB $regex queries.
 * Prevents ReDoS attacks and regex wildcard injection.
 */
export function escapeRegex(text: string): string {
  if (typeof text !== 'string') return '';
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Ensures the value is a clean primitive string without null bytes or control characters.
 * Non-string values (objects, arrays, functions, undefined) return an empty string.
 */
export function sanitizeString(val: unknown, maxLength = 1000): string {
  if (typeof val !== 'string') return '';
  // Remove null bytes and control chars (except normal newlines/tabs)
  const cleaned = val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

/**
 * Validates and normalizes email addresses.
 * Rejects non-string inputs or dangerous structures.
 */
export function sanitizeEmail(val: unknown): string {
  const str = sanitizeString(val, 320).toLowerCase();
  // Basic structural check
  if (!str.includes('@') || str.startsWith('@') || str.endsWith('@')) {
    return '';
  }
  return str;
}

/**
 * Validates if the input is a valid 24-character hexadecimal MongoDB ObjectId.
 * Returns the hex string if valid, or null if invalid.
 */
export function sanitizeObjectId(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (/^[0-9a-fA-F]{24}$/.test(trimmed) && mongoose.Types.ObjectId.isValid(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Deeply sanitizes an object or array to recursively strip any keys starting with '$'
 * or containing dots ('.'), which could be exploited for MongoDB operator injection.
 */
export function stripMongoOperators<T>(input: T): T {
  if (input === null || typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => stripMongoOperators(item)) as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(input as Record<string, any>)) {
    // Drop keys starting with '$' (e.g. $gt, $ne, $where) or containing '.' (field traversal)
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    result[key] = stripMongoOperators(value);
  }

  return result as T;
}
