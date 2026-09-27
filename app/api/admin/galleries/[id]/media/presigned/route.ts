import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPresignedUploadUrl } from '@/lib/r2';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import mongoose from 'mongoose';

// Helper to authenticate admin
async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const galleryId = params.id;
    if (!mongoose.Types.ObjectId.isValid(galleryId)) {
      return NextResponse.json({ error: 'Invalid gallery ID' }, { status: 400 });
    }

    const body = await request.json();
    const { filename, contentType } = body;

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Auto-detect type from contentType or extension
    const isVideo =
      contentType?.startsWith('video/') ||
      /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(filename);
    const mediaType: 'photo' | 'video' = isVideo ? 'video' : 'photo';

    // Sanitize extension and generate randomized namespaced key
    const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '';
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
