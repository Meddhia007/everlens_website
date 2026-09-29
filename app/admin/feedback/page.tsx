import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { PhotoComment } from '@/models/PhotoComment';
import { Gallery } from '@/models/Gallery';
import { MediaItem } from '@/models/MediaItem';
import { getPresignedDownloadUrl } from '@/lib/r2';
import { FeedbackManager, PhotoFeedbackItem } from '@/components/admin/FeedbackManager';

export const dynamic = 'force-dynamic';

export default async function AdminFeedbackPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminToken(token) : null;

  if (!session) {
    redirect('/admin/login');
  }

  let feedbackList: PhotoFeedbackItem[] = [];

  try {
    await connectToDatabase();

    const rawComments = await PhotoComment.find()
      .populate({
        path: 'galleryId',
        model: Gallery,
        select: 'coupleNames clientEmail weddingDate',
      })
      .populate({
        path: 'mediaItemId',
        model: MediaItem,
        select: 'originalFilename r2Key type category',
      })
      .lean();

    // Sort: open items first, then most recent on top
    rawComments.sort((a: any, b: any) => {
      if (a.status === 'open' && b.status !== 'open') return -1;
      if (a.status !== 'open' && b.status === 'open') return 1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    feedbackList = await Promise.all(
      rawComments.map(async (c: any) => {
        const gallery = c.galleryId;
        const media = c.mediaItemId;

        let photoUrl: string | null = null;
        if (media?.r2Key) {
          try {
            photoUrl = await getPresignedDownloadUrl(media.r2Key, 3600);
          } catch {
            photoUrl = null;
          }
        }

        return {
          _id: c._id.toString(),
          galleryId: gallery?._id ? gallery._id.toString() : (c.galleryId?.toString() || ''),
          coupleNames: gallery?.coupleNames || 'Archived Couple',
          clientEmail: gallery?.clientEmail || '',
          weddingDate: gallery?.weddingDate ? new Date(gallery.weddingDate).toISOString() : '',
          mediaItemId: media?._id ? media._id.toString() : (c.mediaItemId?.toString() || ''),
          originalFilename: media?.originalFilename || 'photograph.jpg',
          photoUrl,
          commentText: c.commentText,
          submittedAt: c.submittedAt ? new Date(c.submittedAt).toISOString() : new Date().toISOString(),
          status: (c.status as 'open' | 'resolved') || 'open',
        };
      })
    );
  } catch (error) {
    console.error('Failed to load client feedback in admin:', error);
  }

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-teal">EverLens Backstage</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-white font-normal tracking-tight">
            Client Feedback &amp; Photo Flags
          </h1>
          <p className="text-xs text-[#9EABA2] font-sans mt-1">
            Review reported retouch requests, crop revisions, and notes submitted directly on photos by couples.
          </p>
        </div>
      </div>

      {/* Main Feedback Queue */}
      <FeedbackManager initialFeedback={feedbackList} />
    </main>
  );
}
