import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PhotoComment } from '@/models/PhotoComment';
import { Gallery } from '@/models/Gallery';
import { MediaItem } from '@/models/MediaItem';
import { authorizeMediaAccess, authorizeGalleryAccess } from '@/lib/gallery-auth';
import { sendPhotoCommentNotificationEmail } from '@/lib/email';
import { sanitizeString } from '@/lib/security-sanitize';
import { getPresignedDownloadUrl } from '@/lib/r2';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeGalleryAccess(request);
    if (!auth.success) {
      return auth.response;
    }

    const { session } = auth;
    await connectToDatabase();

    const comments = await PhotoComment.find({ galleryId: session.galleryId })
      .sort({ submittedAt: -1 })
      .lean();

    return NextResponse.json({
      comments: comments.map((c) => ({
        _id: c._id.toString(),
        mediaItemId: c.mediaItemId.toString(),
        commentText: c.commentText,
        submittedAt: c.submittedAt,
        status: c.status,
      })),
    });
  } catch (error: any) {
    console.error('Failed to get photo comments:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve photo comments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { mediaItemId, commentText } = body;

    if (!mediaItemId || !mongoose.Types.ObjectId.isValid(mediaItemId)) {
      return NextResponse.json({ error: 'Valid media item ID is required' }, { status: 400 });
    }

    const cleanComment = sanitizeString(commentText, 1000);
    if (!cleanComment) {
      return NextResponse.json(
        { error: 'Please enter a description of the issue or feedback.' },
        { status: 400 }
      );
    }

    // Verify authenticated session owns this media item
    const auth = await authorizeMediaAccess(request, mediaItemId);
    if (!auth.success) {
      return auth.response;
    }

    const { session, mediaItem } = auth;

    await connectToDatabase();

    const comment = await PhotoComment.create({
      mediaItemId: new mongoose.Types.ObjectId(mediaItemId),
      galleryId: new mongoose.Types.ObjectId(session.galleryId),
      commentText: cleanComment,
      submittedAt: new Date(),
      status: 'open',
    });

    // Generate signed thumbnail URL for email notification
    let photoUrl: string | undefined = undefined;
    try {
      if (mediaItem.r2Key) {
        photoUrl = await getPresignedDownloadUrl(mediaItem.r2Key, 86400 * 7); // 7-day link for email
      }
    } catch {
      // Quiet fallback
    }

    // Send studio admin notification email asynchronously
    sendPhotoCommentNotificationEmail({
      coupleNames: session.coupleNames || 'Our Wedding Couple',
      galleryId: session.galleryId,
      mediaItemId: mediaItemId,
      commentText: cleanComment,
      photoUrl,
      submittedAt: comment.submittedAt,
    }).catch((err) => {
      console.error('Failed to send photo feedback notification email:', err);
    });

    return NextResponse.json(
      {
        success: true,
        comment: {
          _id: comment._id.toString(),
          mediaItemId: comment.mediaItemId.toString(),
          commentText: comment.commentText,
          submittedAt: comment.submittedAt,
          status: comment.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to submit photo comment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit photo feedback' },
      { status: 500 }
    );
  }
}
