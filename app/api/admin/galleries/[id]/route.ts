import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';
import { MediaItem } from '@/models/MediaItem';
import { PrintSelection } from '@/models/PrintSelection';
import { verifyAdminToken, hashPassword, ADMIN_COOKIE_NAME } from '@/lib/auth';
import mongoose from 'mongoose';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// GET: Fetch single gallery details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid gallery ID' }, { status: 400 });
    }

    await connectToDatabase();

    const gallery = await Gallery.findById(id).select('-passwordHash').lean();
    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    // Fetch associated counts
    const [mediaCount, printSelection] = await Promise.all([
      MediaItem.countDocuments({ galleryId: id }),
      PrintSelection.findOne({ galleryId: id }).lean(),
    ]);

    return NextResponse.json({
      gallery: {
        ...gallery,
        _id: gallery._id.toString(),
        mediaCount,
        printCount: printSelection?.mediaItemIds?.length || 0,
        printLocked: printSelection?.locked || false,
      },
    });
  } catch (error: any) {
    console.error('Failed to get gallery:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to get gallery' },
      { status: 500 }
    );
  }
}

// PATCH: Update gallery details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid gallery ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      coupleNames,
      weddingDate,
      clientEmail,
      status,
      expirationDate,
      guestPin,
      guestLinkToken,
      newPassword,
    } = body;

    await connectToDatabase();

    const gallery = await Gallery.findById(id);
    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    // Check if clientEmail is changing and already taken
    if (clientEmail && clientEmail.toLowerCase().trim() !== gallery.clientEmail) {
      const existing = await Gallery.findOne({
        clientEmail: clientEmail.toLowerCase().trim(),
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Another gallery with this client email already exists.' },
          { status: 409 }
        );
      }
      gallery.clientEmail = clientEmail.toLowerCase().trim();
    }

    if (coupleNames?.trim()) gallery.coupleNames = coupleNames.trim();
    if (weddingDate) gallery.weddingDate = new Date(weddingDate);
    if (status && ['draft', 'active', 'archived'].includes(status)) gallery.status = status;
    if (expirationDate !== undefined) {
      gallery.expirationDate = expirationDate ? new Date(expirationDate) : undefined;
    }
    if (guestPin !== undefined) gallery.guestPin = guestPin.trim() || undefined;
    if (guestLinkToken !== undefined) gallery.guestLinkToken = guestLinkToken.trim() || undefined;

    // If new password is provided, re-hash it
    if (newPassword && newPassword.trim()) {
      gallery.passwordHash = await hashPassword(newPassword.trim());
    }

    await gallery.save();

    return NextResponse.json({
      success: true,
      gallery: {
        _id: gallery._id.toString(),
        coupleNames: gallery.coupleNames,
        weddingDate: gallery.weddingDate,
        clientEmail: gallery.clientEmail,
        status: gallery.status,
        expirationDate: gallery.expirationDate,
        guestPin: gallery.guestPin,
        guestLinkToken: gallery.guestLinkToken,
        updatedAt: gallery.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Failed to update gallery:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update gallery' },
      { status: 500 }
    );
  }
}

// DELETE: Remove gallery and associated media & print records
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid gallery ID' }, { status: 400 });
    }

    await connectToDatabase();

    const deleted = await Gallery.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    // Cascade delete associated items
    await Promise.all([
      MediaItem.deleteMany({ galleryId: id }),
      PrintSelection.deleteMany({ galleryId: id }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Gallery and associated records deleted successfully.',
    });
  } catch (error: any) {
    console.error('Failed to delete gallery:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete gallery' },
      { status: 500 }
    );
  }
}
