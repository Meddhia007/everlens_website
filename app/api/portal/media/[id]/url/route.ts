import { NextRequest, NextResponse } from 'next/server';
import { getPresignedDownloadUrl } from '@/lib/r2';
import { authorizeMediaAccess } from '@/lib/gallery-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Re-verify session identity and ownership of this specific media item on every request
    const auth = await authorizeMediaAccess(request, id);
    if (!auth.success) {
      return auth.response;
    }

    const { mediaItem } = auth;
    const isDownload = request.nextUrl.searchParams.get('download') === 'true';

    // Strict expiry enforcement:
    // - Lightbox full-res viewing: 1 hour (3600 seconds)
    // - Single-item direct download: 15 minutes (900 seconds)
    const expirySeconds = isDownload ? 900 : 3600;

    const shortLivedUrl = await getPresignedDownloadUrl(
      mediaItem.r2Key,
      expirySeconds,
      isDownload ? { downloadFilename: mediaItem.originalFilename } : undefined
    );

    return NextResponse.json({
      url: shortLivedUrl,
      filename: mediaItem.originalFilename,
      type: mediaItem.type,
      category: mediaItem.category,
      expiresSeconds: expirySeconds,
    });
  } catch (error: any) {
    console.error('Failed to generate short-lived media URL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate access URL' },
      { status: 500 }
    );
  }
}
