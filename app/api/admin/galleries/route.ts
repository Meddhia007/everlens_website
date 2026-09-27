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

    const body = await request.json();
    const {
      coupleNames,
      weddingDate,
      clientEmail,
      status = 'draft',
      expirationDate,
      password,
      guestPin,
      guestLinkToken,
    } = body;

    // Validation
    if (!coupleNames?.trim()) {
      return NextResponse.json({ error: 'Couple names are required' }, { status: 400 });
    }
    if (!weddingDate) {
      return NextResponse.json({ error: 'Wedding date is required' }, { status: 400 });
    }
    if (!clientEmail?.trim()) {
      return NextResponse.json({ error: 'Client email is required' }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedEmail = clientEmail.toLowerCase().trim();
    const existing = await Gallery.findOne({ clientEmail: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { error: 'A gallery with this client email already exists.' },
        { status: 409 }
      );
    }

    // Auto-generate password if not provided
    const plainPassword = password?.trim() || generateSecurePassword();
    const passwordHash = await hashPassword(plainPassword);

    // Auto-generate guest credentials if omitted
    const assignedGuestPin = guestPin?.trim() || generateGuestPin();
    const assignedGuestToken = guestLinkToken?.trim() || generateGuestToken(coupleNames);

    // Default expiration: 1 year from wedding date if not specified
    const calculatedExpiry = expirationDate
      ? new Date(expirationDate)
      : new Date(new Date(weddingDate).getTime() + 365 * 24 * 60 * 60 * 1000);

    const gallery = await Gallery.create({
      coupleNames: coupleNames.trim(),
      weddingDate: new Date(weddingDate),
      clientEmail: normalizedEmail,
      passwordHash,
      status,
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
