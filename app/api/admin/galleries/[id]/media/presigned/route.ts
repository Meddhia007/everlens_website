import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPresignedUploadUrl } from '@/lib/r2';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { validateUploadMetadata } from '@/lib/upload-validator';
import mongoose from 'mongoose';

// Helper to authenticate admin
async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const galleryId = id;
    if (!mongoose.Types.ObjectId.isValid(galleryId)) {
      return NextResponse.json({ error: 'Invalid gallery ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { filename, contentType, fileSize } = body;

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // 1. Server-side validation of file extension and size constraints
    const metadataValidation = validateUploadMetadata(filename, typeof fileSize === 'number' ? fileSize : undefined);
    if (!metadataValidation.valid) {
      return NextResponse.json(
        { error: metadataValidation.error || 'Invalid file format or size.' },
        { status: 400 }
      );
    }

    const mediaType = metadataValidation.type || 'photo';
    const isVideo = mediaType === 'video';

    // Sanitize extension and generate randomized namespaced key
    const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : (isVideo ? '.mp4' : '.jpg');
    const uniqueId = crypto.randomUUID();
    const timestamp = Date.now();

    // R2 Key: galleries/<galleryId>/<type>/<timestamp>-<uniqueId><ext>
    const r2Key = `galleries/${galleryId}/${mediaType}s/${timestamp}-${uniqueId}${ext}`;

    const effectiveContentType = contentType || (isVideo ? 'video/mp4' : 'image/jpeg');

    // Generate presigned PUT URL directly to R2 (expires in 1 hour)
    const { uploadUrl } = await getPresignedUploadUrl(
      r2Key,
      effectiveContentType,
      3600
    );

    return NextResponse.json({
      uploadUrl,
      r2Key,
      type: mediaType,
      originalFilename: filename,
    });
  } catch (error: any) {
    console.error('Failed to generate presigned upload URL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
