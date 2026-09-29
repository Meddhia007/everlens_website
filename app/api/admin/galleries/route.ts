import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';
import { MediaItem } from '@/models/MediaItem';
import { PrintSelection } from '@/models/PrintSelection';
import { verifyAdminToken, hashPassword, ADMIN_COOKIE_NAME } from '@/lib/auth';
import {
  generateSecurePassword,
  generateGuestPin,
  generateGuestToken,
} from '@/lib/generators';
import { sanitizeEmail, sanitizeString } from '@/lib/security-sanitize';

// Helper to authenticate admin
async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// GET: List all galleries with media and print selection counts
export async function GET(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    await connectToDatabase();

    const galleries = await Gallery.find()
      .select('-passwordHash')
      .sort({ weddingDate: -1, createdAt: -1 })
      .lean();

    // Attach media and print counts
    const galleryIds = galleries.map((g) => g._id);
    const [mediaCounts, printSelections] = await Promise.all([
      MediaItem.aggregate([
        { $match: { galleryId: { $in: galleryIds } } },
        { $group: { _id: '$galleryId', count: { $sum: 1 } } },
      ]),
      PrintSelection.find({ galleryId: { $in: galleryIds } })
        .select('galleryId mediaItemIds locked')
        .lean(),
    ]);

    const mediaCountMap = new Map(mediaCounts.map((m) => [m._id.toString(), m.count]));
    const printMap = new Map(
      printSelections.map((p) => [
        p.galleryId.toString(),
        { count: p.mediaItemIds?.length || 0, locked: p.locked },
      ])
    );

    const enrichedGalleries = galleries.map((g) => ({
      ...g,
      _id: g._id.toString(),
      photoLimit: g.photoLimit ?? 50,
      productionStage: g.productionStage || 'files_uploaded',
      stageHistory: g.stageHistory || [],
      mediaCount: mediaCountMap.get(g._id.toString()) || 0,
      printCount: printMap.get(g._id.toString())?.count || 0,
      printLocked: printMap.get(g._id.toString())?.locked || false,
    }));

    return NextResponse.json({ galleries: enrichedGalleries });
  } catch (error: any) {
    console.error('Failed to list galleries:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to list galleries' },
      { status: 500 }
    );
  }
}

// POST: Create a new gallery
export async function POST(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      coupleNames,
      weddingDate,
      clientEmail,
      status = 'draft',
      photoLimit,
      productionStage = 'files_uploaded',
      expirationDate,
      password,
      guestPin,
      guestLinkToken,
    } = body;

    const cleanCoupleNames = sanitizeString(coupleNames, 150);
    const cleanClientEmail = sanitizeEmail(clientEmail);
    const cleanStatus = ['draft', 'active', 'archived'].includes(status) ? status : 'draft';
    const cleanGuestPin = sanitizeString(guestPin, 10);
    const cleanGuestLinkToken = sanitizeString(guestLinkToken, 100);
    const cleanPassword = sanitizeString(password, 100);

    const parsedPhotoLimit =
      typeof photoLimit === 'number' && photoLimit > 0
        ? Math.floor(photoLimit)
        : parseInt(photoLimit, 10) > 0
        ? Math.floor(parseInt(photoLimit, 10))
        : 50;

    const validStages = [
      'files_uploaded',
      'editing_photos',
      'photos_ready',
      'editing_film',
      'film_ready',
      'album_production',
      'delivered',
    ];
    const initialStage = validStages.includes(productionStage) ? productionStage : 'files_uploaded';

    // Validation
    if (!cleanCoupleNames) {
      return NextResponse.json({ error: 'Couple names are required' }, { status: 400 });
    }
    if (!weddingDate) {
      return NextResponse.json({ error: 'Wedding date is required' }, { status: 400 });
    }
    if (!cleanClientEmail) {
      return NextResponse.json({ error: 'A valid client email is required' }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await Gallery.findOne({ clientEmail: cleanClientEmail });
    if (existing) {
      return NextResponse.json(
        { error: 'A gallery with this client email already exists.' },
        { status: 409 }
      );
    }

    // Auto-generate password if not provided
    const plainPassword = cleanPassword || generateSecurePassword();
    const passwordHash = await hashPassword(plainPassword);

    // Auto-generate guest credentials if omitted
    const assignedGuestPin = cleanGuestPin || generateGuestPin();
    const assignedGuestToken = cleanGuestLinkToken || generateGuestToken(cleanCoupleNames);

    // Default expiration: 1 year from wedding date if not specified
    const calculatedExpiry = expirationDate
      ? new Date(expirationDate)
      : new Date(new Date(weddingDate).getTime() + 365 * 24 * 60 * 60 * 1000);

    const gallery = await Gallery.create({
      coupleNames: cleanCoupleNames,
      weddingDate: new Date(weddingDate),
      clientEmail: cleanClientEmail,
      passwordHash,
      status: cleanStatus,
      photoLimit: parsedPhotoLimit,
      productionStage: initialStage,
      stageHistory: [{ stage: initialStage, reachedAt: new Date() }],
      expirationDate: calculatedExpiry,
      guestPin: assignedGuestPin,
      guestLinkToken: assignedGuestToken,
    });

    return NextResponse.json(
      {
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
          createdAt: gallery.createdAt,
        },
        plainPassword, // One-time display for admin
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create gallery:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create gallery' },
      { status: 500 }
    );
  }
}
