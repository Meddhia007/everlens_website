import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PrintSelection } from '@/models/PrintSelection';
import { MediaItem } from '@/models/MediaItem';
import { authorizeMediaAccess } from '@/lib/gallery-auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaItemId, note } = body;

    if (!mediaItemId || !mongoose.Types.ObjectId.isValid(mediaItemId)) {
      return NextResponse.json({ error: 'Invalid media item ID' }, { status: 400 });
    }

    // Server-side authorization check: Re-verify session identity & ownership of this media item
    const auth = await authorizeMediaAccess(request, mediaItemId);
    if (!auth.success) {
      return auth.response;
    }

    const { session, mediaItem } = auth;

    if (session.role === 'guest') {
      return NextResponse.json(
        { error: 'Forbidden: Guest accounts cannot modify print notes.' },
        { status: 403 }
      );
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

    // Update note on media item
    const cleanNote = typeof note === 'string' ? note.slice(0, 500) : '';
    await MediaItem.findByIdAndUpdate(mediaItemId, { printNote: cleanNote });

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
