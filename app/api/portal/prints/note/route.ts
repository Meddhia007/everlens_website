import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PrintSelection } from '@/models/PrintSelection';
import { MediaItem } from '@/models/MediaItem';
import { verifyClientToken, CLIENT_COOKIE_NAME } from '@/lib/auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const clientToken = request.cookies.get(CLIENT_COOKIE_NAME)?.value;
    if (!clientToken) {
      return NextResponse.json({ error: 'Unauthorized client access' }, { status: 401 });
    }

    const session = await verifyClientToken(clientToken);
    if (!session || !session.galleryId) {
      return NextResponse.json({ error: 'Invalid or expired client session' }, { status: 401 });
    }

    const body = await request.json();
    const { mediaItemId, note } = body;

    if (!mediaItemId || !mongoose.Types.ObjectId.isValid(mediaItemId)) {
      return NextResponse.json({ error: 'Invalid media item ID' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if album selection is locked
    const selection = await PrintSelection.findOne({ galleryId: session.galleryId });
    if (selection?.locked) {
      return NextResponse.json(
        { error: 'Your print selection has already been submitted and locked.' },
        { status: 403 }
      );
    }

    // Verify media item belongs to this gallery
    const mediaItem = await MediaItem.findById(mediaItemId);
    if (!mediaItem) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 });
    }

    if (mediaItem.galleryId.toString() !== session.galleryId) {
      return NextResponse.json(
        { error: 'Forbidden: Media item does not belong to your gallery' },
        { status: 403 }
      );
    }

    // Update note on media item
    const cleanNote = typeof note === 'string' ? note.slice(0, 500) : '';
    mediaItem.printNote = cleanNote;
    await mediaItem.save();

    return NextResponse.json({
      success: true,
      mediaItemId,
      printNote: cleanNote,
    });
  } catch (error: any) {
    console.error('Failed to update print note:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save print note' },
      { status: 500 }
    );
  }
}
