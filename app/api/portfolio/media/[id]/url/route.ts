import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaItem } from '@/models/MediaItem';
import { getPresignedDownloadUrl } from '@/lib/r2';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mediaId = id;
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
    const expirySeconds = isDownload ? 900 : 3600;

    // Generate short-lived signed URL (3600s for viewing, 900s for downloads)
    const shortLivedUrl = await getPresignedDownloadUrl(
      item.r2Key,
      expirySeconds,
      isDownload ? { downloadFilename: item.originalFilename } : undefined
    );

    return NextResponse.json({
      url: shortLivedUrl,
      filename: item.originalFilename,
      type: item.type,
      category: item.category,
      expiresSeconds: expirySeconds,
    });
  } catch (error: any) {
    console.error('Failed to generate public media streaming URL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate video stream' },
      { status: 500 }
    );
  }
}
