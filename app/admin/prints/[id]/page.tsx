import React from 'react';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';
import { MediaItem } from '@/models/MediaItem';
import { PrintSelection } from '@/models/PrintSelection';
import { getPresignedDownloadUrl } from '@/lib/r2';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import {
  PrintOrderDetailView,
  PrintDetailPhoto,
} from '@/components/admin/PrintOrderDetailView';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

interface AdminPrintOrderDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AdminPrintOrderDetailPage({
  params,
}: AdminPrintOrderDetailPageProps) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminToken(token) : null;

  if (!session) {
    redirect('/admin/login');
  }

  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectToDatabase();

  // Find selection by PrintSelection._id or fallback to galleryId
  let selection: any = await PrintSelection.findById(id)
    .populate({ path: 'galleryId', model: Gallery })
    .lean();

  if (!selection) {
    selection = await PrintSelection.findOne({ galleryId: id })
      .populate({ path: 'galleryId', model: Gallery })
      .lean();
  }

  if (!selection) {
    notFound();
  }

  const gallery = selection.galleryId;
  const mediaIds = (selection.mediaItemIds || []).map((mId: any) => mId.toString());

  // Fetch the selected media items
  const rawMedia = await MediaItem.find({ _id: { $in: mediaIds } }).lean();
  const mediaMap = new Map(rawMedia.map((m) => [m._id.toString(), m]));

  // Generate signed view URLs while preserving selection order
  const orderedPhotos = await Promise.all(
    mediaIds.map(async (mId: string) => {
      const item = mediaMap.get(mId);
      if (!item) return null;

      let viewUrl: string | null = null;
      try {
        viewUrl = await getPresignedDownloadUrl(item.r2Key, 86400);
      } catch {
        viewUrl = null;
      }

      return {
        _id: item._id.toString(),
        originalFilename: item.originalFilename,
        r2Key: item.r2Key,
        category: item.category,
        printNote: item.printNote || '',
        url: viewUrl,
      };
    })
  );

  const photos: PrintDetailPhoto[] = orderedPhotos.filter(
    (p): p is PrintDetailPhoto => p !== null
  );

  const orderData = {
    _id: selection._id.toString(),
    galleryId: gallery?._id ? gallery._id.toString() : '',
    coupleNames: gallery?.coupleNames || 'Archived Couple',
    weddingDate: gallery?.weddingDate
      ? new Date(gallery.weddingDate).toISOString()
      : '',
    clientEmail: gallery?.clientEmail || '',
    submittedAt: selection.submittedAt
      ? new Date(selection.submittedAt).toISOString()
      : '',
  };

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#F4F3ED] flex flex-col font-sans">
      <AdminNavbar adminEmail={session.email} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <PrintOrderDetailView order={orderData} photos={photos} />
      </main>
    </div>
  );
}
