import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaItem } from '@/models/MediaItem';
import { PrintSelection } from '@/models/PrintSelection';
import { deleteObjectFromR2 } from '@/lib/r2';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import mongoose from 'mongoose';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// PATCH: Update category, portfolio status, or print note
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }

    const body = await request.json();
    const { category, isPublicPortfolio, printNote } = body;

    await connectToDatabase();

    const media = await MediaItem.findById(id);
    if (!media) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 });
    }

    if (category && typeof category === 'string' && category.trim()) {
      media.category = category.trim().toLowerCase();
    }

    if (typeof isPublicPortfolio === 'boolean') {
      media.isPublicPortfolio = isPublicPortfolio;
    }

    if (printNote !== undefined) {
      media.printNote = printNote ? String(printNote).trim() : undefined;
    }

    await media.save();

    return NextResponse.json({
      success: true,
      mediaItem: {
        ...media.toObject(),
        _id: media._id.toString(),
        galleryId: media.galleryId.toString(),
      },
    });
  } catch (error: any) {
    console.error('Failed to update media item:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update media item' },
      { status: 500 }
    );
  }
}

// DELETE: Delete MediaItem from MongoDB and R2
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }

    await connectToDatabase();

    const media = await MediaItem.findById(id);
    if (!media) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 });
    }

    // Attempt to delete object from R2 (ignore if dummy keys or already removed)
    if (media.r2Key) {
      try {
        await deleteObjectFromR2(media.r2Key);
      } catch (r2Err) {
        console.warn('Could not delete object from R2 (might be dev keys or already deleted):', r2Err);
      }
    }

    // Remove from MongoDB
    await MediaItem.findByIdAndDelete(id);

    // Also remove from any PrintSelection referencing this item
    await PrintSelection.updateMany(
      { galleryId: media.galleryId },
      { $pull: { mediaItemIds: id } }
    );

    return NextResponse.json({
      success: true,
      message: 'Media item deleted successfully.',
    });
  } catch (error: any) {
    console.error('Failed to delete media item:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete media item' },
      { status: 500 }
    );
  }
}
