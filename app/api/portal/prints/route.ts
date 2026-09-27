import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PrintSelection } from '@/models/PrintSelection';
import { authorizeGalleryAccess, authorizeMediaAccess } from '@/lib/gallery-auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeGalleryAccess(request);
    if (!auth.success) {
      return auth.response;
    }

    const { session } = auth;
    await connectToDatabase();

    const selection = await PrintSelection.findOne({ galleryId: session.galleryId }).lean();

    return NextResponse.json({
      locked: !!selection?.locked,
      submittedAt: selection?.submittedAt || null,
      mediaItemIds: (selection?.mediaItemIds || []).map((id) => id.toString()),
      count: (selection?.mediaItemIds || []).length,
    });
  } catch (error: any) {
    console.error('Failed to get print selection:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve print selection' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaItemId, selected } = body;

    if (!mediaItemId || !mongoose.Types.ObjectId.isValid(mediaItemId)) {
      return NextResponse.json({ error: 'Invalid media item ID' }, { status: 400 });
    }

    // Server-side authorization: Re-verify that the authenticated session owns this media item
    const auth = await authorizeMediaAccess(request, mediaItemId);
    if (!auth.success) {
      return auth.response;
    }

    const { session, mediaItem } = auth;

    if (mediaItem.type !== 'photo') {
      return NextResponse.json(
        { error: 'Only photographs can be selected for print album' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find or initialize PrintSelection record
    let selection = await PrintSelection.findOne({ galleryId: session.galleryId });
    if (!selection) {
      selection = new PrintSelection({
        galleryId: new mongoose.Types.ObjectId(session.galleryId),
        mediaItemIds: [],
        locked: false,
      });
    }

    // Server-side enforcement: Check if selection is already locked
    if (selection.locked) {
      return NextResponse.json(
        { error: 'Your print selection has already been submitted and locked.' },
        { status: 403 }
      );
    }

    const currentIds = selection.mediaItemIds.map((id) => id.toString());
    const isAlreadySelected = currentIds.includes(mediaItemId);

    const targetSelected = typeof selected === 'boolean' ? selected : !isAlreadySelected;

    if (targetSelected) {
      if (!isAlreadySelected) {
        // Enforce hard cap at 50 server-side
        if (currentIds.length >= 50) {
          return NextResponse.json(
            { error: 'Print limit reached — remove one to add another' },
            { status: 400 }
          );
        }

        selection.mediaItemIds.push(new mongoose.Types.ObjectId(mediaItemId) as any);
        await Promise.all([
          selection.save(),
          // Update MediaItem selection flag
          import('@/models/MediaItem').then(({ MediaItem }) =>
            MediaItem.findByIdAndUpdate(mediaItemId, { isPrintSelected: true })
          ),
        ]);
      }
    } else {
      if (isAlreadySelected) {
        selection.mediaItemIds = selection.mediaItemIds.filter(
          (id) => id.toString() !== mediaItemId
        ) as any;
        await Promise.all([
          selection.save(),
          import('@/models/MediaItem').then(({ MediaItem }) =>
            MediaItem.findByIdAndUpdate(mediaItemId, { isPrintSelected: false })
          ),
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      selected: targetSelected,
      count: selection.mediaItemIds.length,
      mediaItemIds: selection.mediaItemIds.map((id) => id.toString()),
    });
  } catch (error: any) {
    console.error('Failed to toggle print selection:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update print selection' },
      { status: 500 }
    );
  }
}
