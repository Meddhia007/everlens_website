import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';
import { MediaItem } from '@/models/MediaItem';
import { PrintSelection } from '@/models/PrintSelection';
import { getPresignedDownloadUrl } from '@/lib/r2';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const session = token ? await verifyAdminToken(token) : null;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    await connectToDatabase();

    let selection: any = await PrintSelection.findById(id)
      .populate({ path: 'galleryId', model: Gallery })
      .lean();

    if (!selection) {
      selection = await PrintSelection.findOne({ galleryId: id })
        .populate({ path: 'galleryId', model: Gallery })
        .lean();
    }

    if (!selection) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const gallery = selection.galleryId;
    const mediaIds = (selection.mediaItemIds || []).map((mId: any) => mId.toString());

    const rawMedia = await MediaItem.find({ _id: { $in: mediaIds } }).lean();
    const mediaMap = new Map(rawMedia.map((m) => [m._id.toString(), m]));

    const orderedPhotos = await Promise.all(
      mediaIds.map(async (mId: string) => {
        const item = mediaMap.get(mId);
        if (!item) return null;

        let viewUrl: string | null = null;
        try {
          viewUrl = await getPresignedDownloadUrl(item.r2Key, 3600);
        } catch {
          viewUrl = null;
        }

        return {
          _id: item._id.toString(),
          originalFilename: item.originalFilename,
          r2Key: item.r2Key,
          category: item.category,
          printNote: item.printNote || '',
          url: viewUrl,
        };
      })
    );

    const photos = orderedPhotos.filter((p) => p !== null);

    const order = {
      _id: selection._id.toString(),
      galleryId: gallery?._id ? gallery._id.toString() : '',
      coupleNames: gallery?.coupleNames || 'Archived Couple',
      weddingDate: gallery?.weddingDate
        ? new Date(gallery.weddingDate).toISOString()
        : '',
      clientEmail: gallery?.clientEmail || '',
      submittedAt: selection.submittedAt
        ? new Date(selection.submittedAt).toISOString()
        : '',
    };

    return NextResponse.json({ order, photos });
  } catch (error: any) {
    console.error('Error fetching print order:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
