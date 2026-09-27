import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaItem } from '@/models/MediaItem';
import { getPresignedDownloadUrl } from '@/lib/r2';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { validateUploadMetadata } from '@/lib/upload-validator';
import mongoose from 'mongoose';

async function authenticateAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

// GET: List all media items for this gallery with presigned preview URLs
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

    const galleryId = id;
    if (!mongoose.Types.ObjectId.isValid(galleryId)) {
      return NextResponse.json({ error: 'Invalid gallery ID' }, { status: 400 });
    }

    await connectToDatabase();

    const items = await MediaItem.find({ galleryId })
      .sort({ createdAt: -1 })
      .lean();

    // Attach signed view URLs for grid preview
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        let viewUrl: string | null = null;
        try {
          // Generate 1-hour presigned view URL directly from R2
          viewUrl = await getPresignedDownloadUrl(item.r2Key, 3600);
        } catch {
          // If R2 credentials are dummy/offline, viewUrl remains null
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

    return NextResponse.json({ media: enrichedItems });
  } catch (error: any) {
    console.error('Failed to fetch gallery media:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// POST: Create a new MediaItem after successful direct R2 upload
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized studio access' }, { status: 401 });
    }

    const galleryId = id;
    if (!mongoose.Types.ObjectId.isValid(galleryId)) {
      return NextResponse.json({ error: 'Invalid gallery ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      originalFilename,
      r2Key,
      type = 'photo',
      category = type === 'video' ? 'films' : 'photography',
      isPublicPortfolio = false,
      printNote,
    } = body;

    if (!originalFilename || !r2Key) {
      return NextResponse.json(
        { error: 'Original filename and R2 key are required.' },
        { status: 400 }
      );
    }

    const metadataValidation = validateUploadMetadata(originalFilename);
    if (!metadataValidation.valid) {
      return NextResponse.json(
        { error: metadataValidation.error || 'Invalid file format.' },
        { status: 400 }
      );
    }

    if (typeof r2Key !== 'string' || !r2Key.startsWith(`galleries/${galleryId}/`)) {
      return NextResponse.json(
        { error: 'Invalid storage key for this gallery.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const mediaItem = await MediaItem.create({
      galleryId,
      originalFilename: originalFilename.trim(),
      r2Key: r2Key.trim(),
      type,
      category,
      isPublicPortfolio: Boolean(isPublicPortfolio),
      isPrintSelected: false,
      printNote,
    });

    // Generate signed view URL
    let viewUrl: string | null = null;
    try {
      viewUrl = await getPresignedDownloadUrl(mediaItem.r2Key, 3600);
    } catch {
      viewUrl = null;
    }

    return NextResponse.json(
      {
        success: true,
        mediaItem: {
          ...mediaItem.toObject(),
          _id: mediaItem._id.toString(),
          galleryId: mediaItem.galleryId.toString(),
          url: viewUrl,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create media item:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to record media item' },
      { status: 500 }
    );
  }
}
