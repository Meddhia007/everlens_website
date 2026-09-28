import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPresignedUploadUrl, getPresignedDownloadUrl, ensureR2CorsConfigured } from '@/lib/r2';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { validateUploadMetadata } from '@/lib/upload-validator';
import { handleCorsPreflight } from '@/lib/cors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request);
}

export async function POST(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    // Proactively apply CORS to the Cloudflare R2 bucket if not already set
    await ensureR2CorsConfigured().catch(() => {});

    const body = await request.json().catch(() => ({}));
    const { filename, contentType, fileSize } = body;

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const metadataValidation = validateUploadMetadata(
      filename,
      typeof fileSize === 'number' ? fileSize : undefined
    );

    if (!metadataValidation.valid) {
      return NextResponse.json(
        { error: metadataValidation.error || 'Invalid file format or size.' },
        { status: 400 }
      );
    }

    const mediaType = metadataValidation.type || 'photo';
    const isVideo = mediaType === 'video';

    const safeBasename = filename
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_')
      .replace(/_+/g, '_');

    const uniqueId = crypto.randomUUID().slice(0, 8);
    const timestamp = Date.now();
    const folder = isVideo ? 'videos' : 'images';
    const r2Key = `portfolio/${folder}/${timestamp}_${uniqueId}_${safeBasename}`;

    const effectiveContentType = contentType || (isVideo ? 'video/mp4' : 'image/jpeg');

    const { uploadUrl } = await getPresignedUploadUrl(
      r2Key,
      effectiveContentType,
      3600
    );

    let viewUrl = '';
    try {
      viewUrl = await getPresignedDownloadUrl(r2Key, 3600);
    } catch {
      viewUrl = uploadUrl;
    }

    return NextResponse.json({
      uploadUrl,
      r2Key,
      viewUrl,
      type: mediaType,
      originalFilename: filename,
    });
  } catch (error: any) {
    console.error('Failed to generate presigned upload URL for portfolio:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
