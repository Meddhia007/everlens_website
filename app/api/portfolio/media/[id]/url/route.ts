import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaItem } from '@/models/MediaItem';
import { getPresignedDownloadUrl } from '@/lib/r2';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mediaId = params.id;
    if (!mongoose.Types.ObjectId.isValid(mediaId)) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }

    await connectToDatabase();

    // Critical Security Assertion: Only media items explicitly featured in public portfolio
    const item = await MediaItem.findOne({
      _id: mediaId,
      isPublicPortfolio: true,
    }).lean();

    if (!item) {
      return NextResponse.json(
        { error: 'Media not found or not in public portfolio' },
        { status: 404 }
      );
    }

    const isDownload = request.nextUrl.searchParams.get('download') === 'true';

    // Generate short-lived signed URL (15 minutes / 900 seconds)
    const shortLivedUrl = await getPresignedDownloadUrl(
      item.r2Key,
      900,
      isDownload ? { downloadFilename: item.originalFilename } : undefined
    );

    return NextResponse.json({
      url: shortLivedUrl,
      filename: item.originalFilename,
      type: item.type,
      category: item.category,
      expiresSeconds: 900,
    });
  } catch (error: any) {
    console.error('Failed to generate public media streaming URL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate video stream' },
      { status: 500 }
    );
  }
}
