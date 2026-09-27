import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaItem } from '@/models/MediaItem';
import { getPresignedDownloadUrl } from '@/lib/r2';
import { verifyClientToken, CLIENT_COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const clientToken = request.cookies.get(CLIENT_COOKIE_NAME)?.value;
    if (!clientToken) {
      return NextResponse.json({ error: 'Unauthorized client access' }, { status: 401 });
    }

    const session = await verifyClientToken(clientToken);
    if (!session || !session.galleryId) {
      return NextResponse.json({ error: 'Invalid or expired client session' }, { status: 401 });
    }

    await connectToDatabase();

    // Query exclusively scoped to this couple's galleryId
    const items = await MediaItem.find({ galleryId: session.galleryId })
      .sort({ createdAt: -1 })
      .lean();

    // Attach signed thumbnail/view URLs for the grid
    const mediaWithUrls = await Promise.all(
      items.map(async (item) => {
        let viewUrl: string | null = null;
        try {
          // Generate 24-hour signed view URL directly from R2
          viewUrl = await getPresignedDownloadUrl(item.r2Key, 86400);
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
      coupleNames: session.coupleNames,
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
