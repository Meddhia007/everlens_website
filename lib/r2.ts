import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ENDPOINT = process.env.R2_ENDPOINT;

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
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: expiresInSeconds,
  });

  return { uploadUrl, key };
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
  // If the key is already a valid URL or root path, return it directly
  if (key.startsWith('/') || key.startsWith('http://') || key.startsWith('https://')) {
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

  const bucket = getR2BucketName();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: options?.downloadFilename
      ? `attachment; filename="${options.downloadFilename.replace(/"/g, '')}"`
      : undefined,
    ResponseContentType: options?.contentType,
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
