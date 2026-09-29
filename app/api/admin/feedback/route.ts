import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PhotoComment } from '@/models/PhotoComment';
import { Gallery } from '@/models/Gallery';
import { MediaItem } from '@/models/MediaItem';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { getPresignedDownloadUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    await connectToDatabase();

    // Query all photo comments, sorted with open first, then by submittedAt descending
    const rawComments = await PhotoComment.find()
      .populate({
        path: 'galleryId',
        model: Gallery,
        select: 'coupleNames clientEmail weddingDate',
      })
      .populate({
        path: 'mediaItemId',
        model: MediaItem,
        select: 'originalFilename r2Key type category',
      })
      .lean();

    // Sort: open first, then by submittedAt descending
    rawComments.sort((a: any, b: any) => {
      if (a.status === 'open' && b.status !== 'open') return -1;
      if (a.status !== 'open' && b.status === 'open') return 1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    // Attach signed thumbnail URLs for each media item
    const feedback = await Promise.all(
      rawComments.map(async (c: any) => {
        const gallery = c.galleryId;
        const media = c.mediaItemId;

        let photoUrl: string | null = null;
        if (media?.r2Key) {
          try {
            photoUrl = await getPresignedDownloadUrl(media.r2Key, 3600);
          } catch {
            photoUrl = null;
          }
        }

        return {
          _id: c._id.toString(),
          galleryId: gallery?._id ? gallery._id.toString() : (c.galleryId?.toString() || ''),
          coupleNames: gallery?.coupleNames || 'Archived Couple',
          clientEmail: gallery?.clientEmail || '',
          weddingDate: gallery?.weddingDate ? new Date(gallery.weddingDate).toISOString() : '',
          mediaItemId: media?._id ? media._id.toString() : (c.mediaItemId?.toString() || ''),
          originalFilename: media?.originalFilename || 'photograph.jpg',
          photoUrl,
          commentText: c.commentText,
          submittedAt: c.submittedAt ? new Date(c.submittedAt).toISOString() : new Date().toISOString(),
          status: c.status || 'open',
        };
      })
    );

    return NextResponse.json({ feedback });
  } catch (error: any) {
    console.error('Failed to list photo feedback:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to list photo feedback' },
      { status: 500 }
    );
  }
}
