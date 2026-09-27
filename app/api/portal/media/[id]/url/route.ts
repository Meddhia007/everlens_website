import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaItem } from '@/models/MediaItem';
import { getPresignedDownloadUrl } from '@/lib/r2';
import {
  verifyClientToken,
  verifyGuestToken,
  CLIENT_COOKIE_NAME,
  GUEST_COOKIE_NAME,
} from '@/lib/tokens';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let sessionGalleryId: string | null = null;

    // 1. Try Client Token
    const clientToken = request.cookies.get(CLIENT_COOKIE_NAME)?.value;
    if (clientToken) {
      const clientSession = await verifyClientToken(clientToken);
      if (clientSession?.galleryId) {
        sessionGalleryId = clientSession.galleryId;
      }
    }

    // 2. Try Guest Token Cookie
    if (!sessionGalleryId) {
      const guestToken = request.cookies.get(GUEST_COOKIE_NAME)?.value;
      if (guestToken) {
        const guestSession = await verifyGuestToken(guestToken);
        if (guestSession?.galleryId) {
          sessionGalleryId = guestSession.galleryId;
        }
      }
    }

    // 3. Try PIN-less Gallery direct token fallback
    if (!sessionGalleryId) {
      const guestLinkToken = request.nextUrl.searchParams.get('guestToken');
      if (guestLinkToken) {
        const { Gallery } = await import('@/models/Gallery');
        await connectToDatabase();
        const galleryByToken = await Gallery.findOne({ guestLinkToken }).lean();
        if (galleryByToken && !galleryByToken.guestPin && galleryByToken.status !== 'archived') {
          sessionGalleryId = galleryByToken._id.toString();
        }
      }
    }

    if (!sessionGalleryId) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid client or guest session required' },
        { status: 401 }
      );
    }

    const mediaId = params.id;
    if (!mongoose.Types.ObjectId.isValid(mediaId)) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }

    await connectToDatabase();

    const item = await MediaItem.findById(mediaId).lean();
    if (!item) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 });
    }

    // Critical Security Assertion: Verify item belongs to the authenticated gallery session
    if (item.galleryId.toString() !== sessionGalleryId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this media item.' },
        { status: 403 }
      );
    }

    const isDownload = request.nextUrl.searchParams.get('download') === 'true';

    // Generate short-lived signed URL (15 minutes / 900 seconds)
    // Never expose permanent public URLs
    const shortLivedUrl = await getPresignedDownloadUrl(
      item.r2Key,
      900,
      isDownload ? { downloadFilename: item.originalFilename } : undefined
    );

    return NextResponse.json({
      url: shortLivedUrl,
      filename: item.originalFilename,
      type: item.type,
      expiresSeconds: 900,
    });
  } catch (error: any) {
    console.error('Failed to generate short-lived media URL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate access URL' },
      { status: 500 }
    );
  }
}
