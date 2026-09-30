import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

function cleanEnv(val?: string): string | undefined {
  if (!val) return undefined;
  let clean = val.trim();
  clean = clean.replace(/^[<"']|[>"']$/g, '').trim();
  clean = clean.replace(/[<>]/g, '').trim();
  if (clean.includes('=')) {
    clean = clean.substring(clean.indexOf('=') + 1).trim();
    clean = clean.replace(/^[<"']|[>"']$/g, '').trim();
    clean = clean.replace(/[<>]/g, '').trim();
  }
  return clean || undefined;
}

const R2_ACCESS_KEY_ID = cleanEnv(process.env.R2_ACCESS_KEY_ID);
const R2_SECRET_ACCESS_KEY = cleanEnv(process.env.R2_SECRET_ACCESS_KEY);
const R2_BUCKET = cleanEnv(process.env.R2_BUCKET) || cleanEnv(process.env.R2_BUCKET_NAME) || 'everlens-media';
const R2_ACCOUNT_ID = cleanEnv(process.env.R2_ACCOUNT_ID);
let R2_ENDPOINT = cleanEnv(process.env.R2_ENDPOINT);

if (!R2_ENDPOINT && R2_ACCOUNT_ID) {
  R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}
if (R2_ENDPOINT) {
  R2_ENDPOINT = R2_ENDPOINT.replace(/[<>]/g, '').replace(/\/+$/, '').trim();
  if (!R2_ENDPOINT.startsWith('http://') && !R2_ENDPOINT.startsWith('https://')) {
    if (!R2_ENDPOINT.includes('.')) {
      R2_ENDPOINT = `https://${R2_ENDPOINT}.r2.cloudflarestorage.com`;
    } else {
      R2_ENDPOINT = `https://${R2_ENDPOINT}`;
    }
  }
}

function sanitizePublicDomain(domain?: string): string | undefined {
  if (!domain) return undefined;
  let clean = cleanEnv(domain);
  if (!clean) return undefined;
  clean = clean.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
  if (
    !clean ||
    clean.includes('vercel.app') ||
    clean.includes('localhost') ||
    clean.includes('r2.cloudflarestorage.com')
  ) {
    return undefined;
  }
  return clean;
}

const R2_PUBLIC_DOMAIN =
  sanitizePublicDomain(process.env.R2_PUBLIC_DOMAIN) ||
  sanitizePublicDomain(process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN);

export const isMockR2 =
  !R2_ACCESS_KEY_ID ||
  R2_ACCESS_KEY_ID === 'development_key_id' ||
  !R2_ENDPOINT ||
  R2_ENDPOINT.includes('example.r2') ||
  R2_ENDPOINT.includes('example.com');

// High-resolution local wedding assets stored in website repository
export const LOCAL_WEDDING_PHOTOS = [
  '/portfolio/images/bridal-veil.jpg',
  '/portfolio/images/rades-portrait.jpg',
  '/portfolio/images/ayoub-dorsaf-golden.jpg',
  '/portfolio/images/traditional-heritage.jpg',
  '/portfolio/images/carthage-elegance.jpg',
  '/portfolio/images/mediterranean-coast.jpg',
  '/portfolio/images/ayoub-dorsaf-sunset.jpg',
  '/portfolio/images/heirloom-portrait.jpg',
  '/portfolio/images/hedi-zaibi-portrait.jpg',
  '/portfolio/images/ayoub-dorsaf-celebration.jpg',
  '/portfolio/images/rades-vows-landscape.jpg',
];

export const LOCAL_WEDDING_VIDEOS = [
  '/portfolio/videos/reel-1.mp4',
  '/portfolio/videos/reel-2.mp4',
];

function getDeterministicMedia(key: string, list: string[]): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % list.length;
  return list[index];
}

/**
 * Cloudflare R2 S3-compatible client instance.
 * R2 provides S3-compatible object storage with zero egress fees.
 */
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT || 'https://example.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || 'development_key_id',
    secretAccessKey: R2_SECRET_ACCESS_KEY || 'development_secret_key',
  },
});

export function getR2BucketName(): string {
  return R2_BUCKET || 'everlens-media';
}

/**
 * Generates a presigned PUT URL for uploading media files directly to Cloudflare R2.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 3600
): Promise<{ uploadUrl: string; key: string }> {
  if (isMockR2) {
    // In local development without Cloudflare R2 credentials, use local direct upload endpoint
    return {
      uploadUrl: `/api/admin/portfolio/upload?key=${encodeURIComponent(key)}`,
      key,
    };
  }

  const bucket = getR2BucketName();
  // Do not lock ContentType into AWS SigV4 signature so browser can send matching or auto-detected mime
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: expiresInSeconds,
  });

  return { uploadUrl, key };
}

let hasAttemptedCorsConfig = false;

/**
 * Attempts to automatically apply open CORS on the Cloudflare R2 bucket.
 */
export async function ensureR2CorsConfigured(): Promise<boolean> {
  if (isMockR2 || hasAttemptedCorsConfig) return true;
  hasAttemptedCorsConfig = true;
  try {
    const bucket = getR2BucketName();
    await r2Client.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'PUT', 'HEAD', 'POST', 'DELETE'],
              AllowedOrigins: ['*'],
              ExposeHeaders: [
                'ETag',
                'Content-Range',
                'Accept-Ranges',
                'Content-Length',
                'Content-Type',
              ],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );
    return true;
  } catch (err: any) {
    console.warn('[R2] Auto-CORS notice (may require Cloudflare dashboard CORS rule):', err?.message);
    return false;
  }
}

/**
 * Uploads a buffer directly to Cloudflare R2 or mock filesystem.
 */
export async function uploadObjectToR2(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<{ key: string }> {
  const cleanKey = key.replace(/^\/+/, '');
  if (isMockR2) {
    try {
      const localUploadPath = path.join(process.cwd(), 'public', 'uploads', cleanKey);
      const dir = path.dirname(localUploadPath);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(localUploadPath, buffer);
    } catch (fsErr) {
      console.warn('Mock filesystem write failed (e.g. read-only env):', fsErr);
    }
    return { key: cleanKey };
  }

  const bucket = getR2BucketName();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: cleanKey,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client.send(command);
  return { key: cleanKey };
}

/**
 * Generates a presigned GET URL for viewing or downloading media.
 * In production, streams directly from Cloudflare R2.
 * In development/mock mode, resolves to real local wedding photography/video assets.
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresInSeconds: number = 3600,
  options?: { downloadFilename?: string; contentType?: string }
): Promise<string> {
  const bucket = getR2BucketName();

  // If the key is already an HTTP URL, check if it's an R2 URL that should be dynamically re-signed
  if (key.startsWith('http://') || key.startsWith('https://')) {
    if (key.includes('.r2.cloudflarestorage.com/')) {
      try {
        const sanitizedKey = key.replace(/[<>]/g, '');
        const urlObj = new URL(sanitizedKey);
        const parts = urlObj.pathname.split('/').filter(Boolean);

        // Handle both virtual-hosted style (bucket in hostname) and path style (bucket in pathname)
        let extractedKey = '';
        if (parts.length > 0 && parts[0] === bucket) {
          extractedKey = parts.slice(1).join('/');
        } else {
          extractedKey = parts.join('/');
        }

        if (extractedKey) {
          if (R2_PUBLIC_DOMAIN) {
            const cleanDomain = R2_PUBLIC_DOMAIN.replace(/^https?:\/\//, '').replace(/\/+$/, '');
            return `https://${cleanDomain}/${extractedKey}`;
          }

          const isVideo =
            extractedKey.includes('/films/') ||
            extractedKey.includes('/videos/') ||
            /\.(mp4|mov|webm|m4v)$/i.test(extractedKey);

          let resolvedContentType = options?.contentType;
          if (!resolvedContentType && isVideo) {
            if (extractedKey.toLowerCase().endsWith('.webm')) {
              resolvedContentType = 'video/webm';
            } else {
              resolvedContentType = 'video/mp4';
            }
          }

          const command = new GetObjectCommand({
            Bucket: bucket,
            Key: extractedKey,
            ResponseContentDisposition: options?.downloadFilename
              ? `attachment; filename="${options.downloadFilename.replace(/"/g, '')}"`
              : undefined,
            ResponseContentType: resolvedContentType,
          });
          return await getSignedUrl(r2Client, command, {
            expiresIn: expiresInSeconds,
          });
        }
      } catch (err) {
        console.warn('Failed to dynamically re-sign R2 URL:', err);
      }
    }
    return key;
  }

  // If already a local root path (e.g. /portfolio/images/...), return as is
  if (key.startsWith('/')) {
    return key;
  }

  // Development / Mock R2 Mode: Serve real local uploaded assets if available, else sample high-resolution wedding assets
  if (isMockR2) {
    const cleanKey = key.replace(/^\/+/, '');

    // 1. Check if the file was uploaded locally to public/uploads/
    const localUploadPath = path.join(process.cwd(), 'public', 'uploads', cleanKey);
    if (fs.existsSync(localUploadPath)) {
      return `/uploads/${cleanKey}`;
    }

    // 2. Check if it exists directly under public/
    const directPath = path.join(process.cwd(), 'public', cleanKey);
    if (fs.existsSync(directPath)) {
      return `/${cleanKey}`;
    }

    if (key.endsWith('.zip') || key.includes('/archives/')) {
      return '/api/portal/downloads/zip?type=everything';
    }

    const isVideo =
      key.includes('/films/') ||
      key.includes('/videos/') ||
      /\.(mp4|mov|webm|m4v)$/i.test(key);

    if (isVideo) {
      return getDeterministicMedia(key, LOCAL_WEDDING_VIDEOS);
    }

    return getDeterministicMedia(key, LOCAL_WEDDING_PHOTOS);
  }

  const cleanKey = key.replace(/^\/+/, '');
  if (R2_PUBLIC_DOMAIN) {
    const cleanDomain = R2_PUBLIC_DOMAIN.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `https://${cleanDomain}/${cleanKey}`;
  }

  const isVideo =
    cleanKey.includes('/films/') ||
    cleanKey.includes('/videos/') ||
    /\.(mp4|mov|webm|m4v)$/i.test(cleanKey);

  let resolvedContentType = options?.contentType;
  if (!resolvedContentType && isVideo) {
    if (cleanKey.toLowerCase().endsWith('.webm')) {
      resolvedContentType = 'video/webm';
    } else {
      resolvedContentType = 'video/mp4';
    }
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: cleanKey,
    ResponseContentDisposition: options?.downloadFilename
      ? `attachment; filename="${options.downloadFilename.replace(/"/g, '')}"`
      : undefined,
    ResponseContentType: resolvedContentType,
  });

  return getSignedUrl(r2Client, command, {
    expiresIn: expiresInSeconds,
  });
}

/**
 * Deletes an object directly from Cloudflare R2.
 */
export async function deleteObjectFromR2(key: string): Promise<void> {
  if (isMockR2) {
    const cleanKey = key.replace(/^\/+/, '');
    const localUploadPath = path.join(process.cwd(), 'public', 'uploads', cleanKey);
    if (fs.existsSync(localUploadPath)) {
      try {
        fs.unlinkSync(localUploadPath);
      } catch {}
    }
    return;
  }

  const bucket = getR2BucketName();
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await r2Client.send(command);
}
