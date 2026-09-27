import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaItem } from '@/models/MediaItem';
import { getPresignedDownloadUrl, isMockR2 } from '@/lib/r2';
import {
  verifyClientToken,
  verifyGuestToken,
  CLIENT_COOKIE_NAME,
  GUEST_COOKIE_NAME,
} from '@/lib/tokens';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

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

    // 3. Try Admin Token
    if (!sessionGalleryId) {
      const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
      if (adminToken) {
        const admin = await verifyAdminToken(adminToken);
        if (admin) {
          sessionGalleryId = 'admin_authorized';
        }
      }
    }

    // 4. Try PIN-less Gallery direct token fallback
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
        { error: 'Unauthorized: Valid client session required' },
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

    // Security assertion (unless admin)
    if (sessionGalleryId !== 'admin_authorized' && item.galleryId.toString() !== sessionGalleryId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this media item.' },
        { status: 403 }
      );
    }

    const isVideo = item.type === 'video' || /\.(mp4|mov|webm|m4v)$/i.test(item.originalFilename);
    const contentType = isVideo ? 'video/mp4' : 'image/jpeg';
    const filename = item.originalFilename || (isVideo ? 'wedding_film.mp4' : 'wedding_photo.jpg');

    // 1. Production Mode with Cloudflare R2
    if (!isMockR2) {
      const signedDownloadUrl = await getPresignedDownloadUrl(item.r2Key, 900, {
        downloadFilename: filename,
        contentType,
      });

      return NextResponse.redirect(signedDownloadUrl, 302);
    }

    // 2. Development / Mock Mode with local files
    const cleanKey = item.r2Key.replace(/^\/+/, '');
    const localUploadPath = path.join(process.cwd(), 'public', 'uploads', cleanKey);
    const directPath = path.join(process.cwd(), 'public', cleanKey);

    let targetFilePath: string | null = null;
    if (fs.existsSync(localUploadPath)) {
      targetFilePath = localUploadPath;
    } else if (fs.existsSync(directPath)) {
      targetFilePath = directPath;
    }

    if (targetFilePath) {
      const stat = fs.statSync(targetFilePath);
      const fileStream = fs.createReadStream(targetFilePath);

      return new Response(Readable.toWeb(fileStream) as any, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          'Content-Length': stat.size.toString(),
          'Cache-Control': 'no-store',
        },
      });
    }

    // Fallback: Presigned mock asset redirect
    const fallbackUrl = await getPresignedDownloadUrl(item.r2Key, 900, {
      downloadFilename: filename,
      contentType,
    });

    return NextResponse.redirect(new URL(fallbackUrl, request.url), 302);
  } catch (error: any) {
    console.error('Failed to trigger direct master download:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to trigger direct download' },
      { status: 500 }
    );
  }
}
