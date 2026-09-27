import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaItem } from '@/models/MediaItem';
import { Gallery } from '@/models/Gallery';
import {
  verifyClientToken,
  verifyGuestToken,
  verifyAdminToken,
  CLIENT_COOKIE_NAME,
  GUEST_COOKIE_NAME,
  ADMIN_COOKIE_NAME,
} from '@/lib/tokens';

export interface GallerySession {
  role: 'client' | 'guest' | 'admin';
  galleryId: string;
  sub: string;
  clientEmail?: string;
  coupleNames?: string;
  guestLinkToken?: string;
}

export type GalleryAuthResult =
  | { success: true; session: GallerySession; gallery: any }
  | { success: false; response: NextResponse };

export type MediaAuthResult =
  | { success: true; session: GallerySession; mediaItem: any; gallery: any }
  | { success: false; response: NextResponse };

/**
 * Validates that the current request has an authenticated session with rights to the target gallery.
 * Independently re-verifies session authenticity and matches galleryId on every single request.
 * Never trusts URL parameters alone.
 */
export async function authorizeGalleryAccess(
  request: NextRequest,
  requestedGalleryId?: string | null
): Promise<GalleryAuthResult> {
  await connectToDatabase();

  const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const clientToken = request.cookies.get(CLIENT_COOKIE_NAME)?.value;
  const guestToken = request.cookies.get(GUEST_COOKIE_NAME)?.value;

  // 1. Admin Session Verification
  if (adminToken) {
    const admin = await verifyAdminToken(adminToken);
    if (admin) {
      if (requestedGalleryId) {
        if (!mongoose.Types.ObjectId.isValid(requestedGalleryId)) {
          return {
            success: false,
            response: NextResponse.json({ error: 'Invalid gallery ID' }, { status: 400 }),
          };
        }
        const gallery = await Gallery.findById(requestedGalleryId).lean();
        if (!gallery) {
          return {
            success: false,
            response: NextResponse.json({ error: 'Gallery not found' }, { status: 404 }),
          };
        }
        return {
          success: true,
          session: {
            role: 'admin',
            galleryId: requestedGalleryId,
            sub: admin.sub,
          },
          gallery,
        };
      }
      return {
        success: true,
        session: {
          role: 'admin',
          galleryId: 'all',
          sub: admin.sub,
        },
        gallery: null,
      };
    }
  }

  // 2. Client Session Verification
  if (clientToken) {
    const client = await verifyClientToken(clientToken);
    if (client && client.galleryId) {
      // Re-verify that the requestedGalleryId matches the session's galleryId
      if (requestedGalleryId && requestedGalleryId !== client.galleryId) {
        return {
          success: false,
          response: NextResponse.json(
            { error: 'Forbidden: You do not have access to this gallery.' },
            { status: 403 }
          ),
        };
      }

      const gallery = await Gallery.findById(client.galleryId).lean();
      if (!gallery) {
        return {
          success: false,
          response: NextResponse.json({ error: 'Gallery not found' }, { status: 404 }),
        };
      }

      if (gallery.status === 'archived') {
        return {
          success: false,
          response: NextResponse.json(
            { error: 'This gallery has been archived. Please contact the studio.' },
            { status: 403 }
          ),
        };
      }

      if (gallery.expirationDate && new Date(gallery.expirationDate) < new Date()) {
        return {
          success: false,
          response: NextResponse.json(
            { error: 'Gallery access has expired. Please contact the studio.' },
            { status: 403 }
          ),
        };
      }

      return {
        success: true,
        session: {
          role: 'client',
          galleryId: client.galleryId,
          sub: client.sub,
          clientEmail: client.clientEmail,
          coupleNames: client.coupleNames,
        },
        gallery,
      };
    }
  }

  // 3. Guest Session Verification
  if (guestToken) {
    const guest = await verifyGuestToken(guestToken);
    if (guest && guest.galleryId) {
      if (requestedGalleryId && requestedGalleryId !== guest.galleryId) {
        return {
          success: false,
          response: NextResponse.json(
            { error: 'Forbidden: You do not have access to this gallery.' },
            { status: 403 }
          ),
        };
      }

      const gallery = await Gallery.findById(guest.galleryId).lean();
      if (!gallery || gallery.status === 'archived') {
        return {
          success: false,
          response: NextResponse.json(
            { error: 'Gallery not found or inactive.' },
            { status: 404 }
          ),
        };
      }

      if (gallery.expirationDate && new Date(gallery.expirationDate) < new Date()) {
        return {
          success: false,
          response: NextResponse.json(
            { error: 'Gallery access has expired.' },
            { status: 403 }
          ),
        };
      }

      return {
        success: true,
        session: {
          role: 'guest',
          galleryId: guest.galleryId,
          sub: guest.sub,
          guestLinkToken: guest.guestLinkToken,
          coupleNames: gallery.coupleNames,
        },
        gallery,
      };
    }
  }

  return {
    success: false,
    response: NextResponse.json(
      { error: 'Unauthorized: Valid client or studio session required.' },
      { status: 401 }
    ),
  };
}

/**
 * Validates that the current request has an authorized session specifically for the requested media item.
 * Independently retrieves the media item from MongoDB and checks that session.galleryId === mediaItem.galleryId.
 */
export async function authorizeMediaAccess(
  request: NextRequest,
  mediaId: string
): Promise<MediaAuthResult> {
  if (!mediaId || !mongoose.Types.ObjectId.isValid(mediaId)) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Invalid media ID' }, { status: 400 }),
    };
  }

  await connectToDatabase();
  const mediaItem = await MediaItem.findById(mediaId).lean();
  if (!mediaItem) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Media item not found' }, { status: 404 }),
    };
  }

  const auth = await authorizeGalleryAccess(request, mediaItem.galleryId.toString());
  if (!auth.success) {
    return {
      success: false,
      response: auth.response,
    };
  }

  return {
    success: true,
    session: auth.session,
    mediaItem,
    gallery: auth.gallery,
  };
}
