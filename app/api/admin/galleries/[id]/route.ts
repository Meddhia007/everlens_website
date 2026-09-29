import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';
import { MediaItem } from '@/models/MediaItem';
import { PrintSelection } from '@/models/PrintSelection';
import { verifyAdminToken, hashPassword, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { sanitizeEmail, sanitizeString, sanitizeObjectId } from '@/lib/security-sanitize';
import mongoose from 'mongoose';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// GET: Fetch single gallery details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const cleanId = sanitizeObjectId(id);
    if (!cleanId) {
      return NextResponse.json({ error: 'Invalid gallery ID' }, { status: 400 });
    }

    await connectToDatabase();

    const gallery = await Gallery.findById(cleanId).select('-passwordHash').lean();
    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    // Fetch associated counts
    const [mediaCount, printSelection] = await Promise.all([
      MediaItem.countDocuments({ galleryId: cleanId }),
      PrintSelection.findOne({ galleryId: cleanId }).lean(),
    ]);

    return NextResponse.json({
      gallery: {
        ...gallery,
        _id: gallery._id.toString(),
        photoLimit: gallery.photoLimit ?? 50,
        productionStage: gallery.productionStage || 'files_uploaded',
        stageHistory: gallery.stageHistory || [],
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const cleanId = sanitizeObjectId(id);
    if (!cleanId) {
      return NextResponse.json({ error: 'Invalid gallery ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      coupleNames,
      weddingDate,
      clientEmail,
      status,
      photoLimit,
      productionStage,
      expirationDate,
      guestPin,
      guestLinkToken,
      newPassword,
    } = body;

    await connectToDatabase();

    const gallery = await Gallery.findById(cleanId);
    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    // Check if clientEmail is changing and already taken
    if (clientEmail !== undefined) {
      const cleanEmail = sanitizeEmail(clientEmail);
      if (!cleanEmail) {
        return NextResponse.json({ error: 'Invalid client email address.' }, { status: 400 });
      }
      if (cleanEmail !== gallery.clientEmail) {
        const existing = await Gallery.findOne({
          clientEmail: cleanEmail,
          _id: { $ne: gallery._id },
        });
        if (existing) {
          return NextResponse.json(
            { error: 'Another gallery with this client email already exists.' },
            { status: 409 }
          );
        }
        gallery.clientEmail = cleanEmail;
      }
    }

    if (coupleNames !== undefined) {
      const cleanNames = sanitizeString(coupleNames, 150);
      if (cleanNames) gallery.coupleNames = cleanNames;
    }
    if (weddingDate) gallery.weddingDate = new Date(weddingDate);
    if (status && ['draft', 'active', 'archived'].includes(status)) gallery.status = status;
    if (expirationDate !== undefined) {
      gallery.expirationDate = expirationDate ? new Date(expirationDate) : undefined;
    }
    if (guestPin !== undefined) gallery.guestPin = sanitizeString(guestPin, 10) || undefined;
    if (guestLinkToken !== undefined) gallery.guestLinkToken = sanitizeString(guestLinkToken, 100) || undefined;

    if (photoLimit !== undefined) {
      const parsedLimit = parseInt(photoLimit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        gallery.photoLimit = parsedLimit;
      }
    }

    const validStages = [
      'files_uploaded',
      'editing_photos',
      'photos_ready',
      'editing_film',
      'film_ready',
      'album_production',
      'delivered',
    ];

    if (productionStage && validStages.includes(productionStage)) {
      if (gallery.productionStage !== productionStage) {
        gallery.productionStage = productionStage;

        if (!Array.isArray(gallery.stageHistory)) {
          gallery.stageHistory = [];
        }
        gallery.stageHistory.push({
          stage: productionStage,
          reachedAt: new Date(),
        } as any);

        // Check for email notification milestones (photos_ready, film_ready, delivered)
        const emailMilestones = ['photos_ready', 'film_ready', 'delivered'];
        if (emailMilestones.includes(productionStage) && gallery.clientEmail) {
          const origin = request.nextUrl.origin || 'https://everlensweddings.com';
          const portalUrl = `${origin}/portal`;
          // Import email sender dynamically or use from lib/email
          import('@/lib/email').then(({ sendProductionStageEmail }) => {
            sendProductionStageEmail({
              to: gallery.clientEmail,
              coupleNames: gallery.coupleNames,
              stage: productionStage as any,
              portalUrl,
            }).catch((err) => {
              console.error('Failed to send milestone email:', err);
            });
          });
        }
      }
    }

    // If new password is provided, re-hash it
    if (newPassword && typeof newPassword === 'string' && newPassword.trim()) {
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
        photoLimit: gallery.photoLimit || 50,
        productionStage: gallery.productionStage || 'files_uploaded',
        stageHistory: gallery.stageHistory || [],
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const cleanId = sanitizeObjectId(id);
    if (!cleanId) {
      return NextResponse.json({ error: 'Invalid gallery ID' }, { status: 400 });
    }

    await connectToDatabase();

    const deleted = await Gallery.findByIdAndDelete(cleanId);
    if (!deleted) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    // Cascade delete associated items
    await Promise.all([
      MediaItem.deleteMany({ galleryId: cleanId }),
      PrintSelection.deleteMany({ galleryId: cleanId }),
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
