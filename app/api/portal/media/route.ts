import { NextRequest, NextResponse } from 'next/server';
import { MediaItem } from '@/models/MediaItem';
import { getPresignedDownloadUrl } from '@/lib/r2';
import { authorizeGalleryAccess } from '@/lib/gallery-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Cryptographically re-verify session and galleryId on every single request
    const auth = await authorizeGalleryAccess(request);
    if (!auth.success) {
      return auth.response;
    }

    const { session, gallery } = auth;

    // Query exclusively scoped to this authenticated galleryId
    const items = await MediaItem.find({ galleryId: session.galleryId })
      .sort({ createdAt: -1 })
      .lean();

    // Attach signed thumbnail/view URLs with strict 1-hour expiry (3600 seconds)
    const mediaWithUrls = await Promise.all(
      items.map(async (item) => {
        let viewUrl: string | null = null;
        try {
          viewUrl = await getPresignedDownloadUrl(item.r2Key, 3600);
        } catch {
          viewUrl = null;
        }

        return {
          ...item,
          _id: item._id.toString(),
          galleryId: item.galleryId.toString(),
          url: viewUrl,
        };
      })
    );

    return NextResponse.json({
      media: mediaWithUrls,
      coupleNames: session.coupleNames || gallery.coupleNames,
      galleryId: session.galleryId,
    });
  } catch (error: any) {
    console.error('Failed to fetch portal media:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch media' },
      { status: 500 }
    );
  }
}
