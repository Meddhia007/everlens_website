import { NextRequest, NextResponse } from 'next/server';
import { getPresignedDownloadUrl, isMockR2 } from '@/lib/r2';
import { authorizeMediaAccess } from '@/lib/gallery-auth';
import { logAuditEvent } from '@/lib/audit';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

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

    const { mediaItem: item, session } = auth;

    const isVideo = item.type === 'video' || /\.(mp4|mov|webm|m4v)$/i.test(item.originalFilename);
    const contentType = isVideo ? 'video/mp4' : 'image/jpeg';
    const filename = item.originalFilename || (isVideo ? 'wedding_film.mp4' : 'wedding_photo.jpg');

    // Immutable security audit log
    await logAuditEvent({
      who: session.clientEmail || session.sub,
      role: session.role,
      action: 'media_download',
      status: 'success',
      galleryId: item.galleryId,
      metadata: {
        mediaId: item._id.toString(),
        filename,
        type: item.type,
      },
      request,
    });

    // 1. Production Mode with Cloudflare R2
    // Strict 15-minute download expiry (900 seconds)
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
