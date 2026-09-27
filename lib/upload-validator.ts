import path from 'path';

export const MAX_PHOTO_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_VIDEO_BYTES = 10 * 1024 * 1024 * 1024; // 10GB for 4K master wedding films

export const ALLOWED_PHOTO_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'heic',
  'heif',
  'tiff',
  'tif',
  'raw',
  'cr2',
  'cr3',
  'nef',
  'arw',
  'dng',
]);

export const ALLOWED_VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'webm']);

export interface ValidationResult {
  valid: boolean;
  type?: 'photo' | 'video';
  mimeType?: string;
  error?: string;
}

/**
 * Validates a file's actual binary content using magic byte signatures.
 * Never relies on filename extension or client-reported Content-Type alone.
 */
export function validateMagicBytes(buffer: Buffer): ValidationResult {
  if (!buffer || buffer.length < 12) {
    return {
      valid: false,
      error: 'File payload is too small or corrupt.',
    };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, type: 'photo', mimeType: 'image/jpeg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, type: 'photo', mimeType: 'image/png' };
  }

  // 3. WebP: RIFF (52 49 46 46) .... WEBP (57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, type: 'photo', mimeType: 'image/webp' };
  }

  // 4. TIFF: 49 49 2A 00 (little-endian) or 4D 4D 00 2A (big-endian)
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
    (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a)
  ) {
    return { valid: true, type: 'photo', mimeType: 'image/tiff' };
  }

  // 5. MP4 / MOV / HEIC (ISO Base Media File Format: 'ftyp' box at offset 4)
  if (
    buffer[4] === 0x66 && // 'f'
    buffer[5] === 0x74 && // 't'
    buffer[6] === 0x79 && // 'y'
    buffer[7] === 0x70    // 'p'
  ) {
    const brand = buffer.toString('ascii', 8, 12).toLowerCase();
    if (['heic', 'heix', 'hevc', 'mif1', 'msf1'].includes(brand)) {
      return { valid: true, type: 'photo', mimeType: 'image/heic' };
    }
    return { valid: true, type: 'video', mimeType: 'video/mp4' };
  }

  // 6. QuickTime MOV legacy tags (moov, mdat, wide)
  const tag = buffer.toString('ascii', 4, 8);
  if (tag === 'moov' || tag === 'mdat' || tag === 'wide') {
    return { valid: true, type: 'video', mimeType: 'video/quicktime' };
  }

  // 7. WebM / Matroska: 1A 45 DF A3
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return { valid: true, type: 'video', mimeType: 'video/webm' };
  }

  return {
    valid: false,
    error:
      'Unrecognized file signature. Only verified image (JPEG, PNG, WebP, HEIC, TIFF) and video (MP4, MOV, WebM) files are accepted.',
  };
}

/**
 * Validates a filename extension and file size against studio constraints.
 */
export function validateUploadMetadata(
  filename: string,
  fileSizeBytes?: number
): { valid: boolean; type?: 'photo' | 'video'; error?: string } {
  const ext = path.extname(filename).replace(/^\./, '').toLowerCase();

  const isPhoto = ALLOWED_PHOTO_EXTENSIONS.has(ext);
  const isVideo = ALLOWED_VIDEO_EXTENSIONS.has(ext);

  if (!isPhoto && !isVideo) {
    return {
      valid: false,
      error: `Disallowed file extension .${ext}. Only wedding photographs and films are allowed.`,
    };
  }

  const type = isVideo ? 'video' : 'photo';

  if (typeof fileSizeBytes === 'number' && fileSizeBytes > 0) {
    const maxAllowed = isVideo ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
    if (fileSizeBytes > maxAllowed) {
      const maxMb = maxAllowed / (1024 * 1024);
      return {
        valid: false,
        error: `File size exceeds the ${maxMb >= 1024 ? `${maxMb / 1024}GB` : `${maxMb}MB`} limit for ${type}s.`,
      };
    }
  }

  return { valid: true, type };
}
