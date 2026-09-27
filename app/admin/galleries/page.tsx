import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';
import { MediaItem } from '@/models/MediaItem';
import { PrintSelection } from '@/models/PrintSelection';
import { GalleriesTable, GalleryListItem } from '@/components/admin/GalleriesTable';
import { NewGalleryButton } from '@/components/admin/NewGalleryButton';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminGalleriesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminToken(token) : null;

  if (!session) {
    redirect('/admin/login');
  }

  let galleries: GalleryListItem[] = [];

  try {
    await connectToDatabase();

    const rawGalleries = await Gallery.find()
      .select('-passwordHash')
      .sort({ weddingDate: -1, createdAt: -1 })
      .lean();

    const galleryIds = rawGalleries.map((g) => g._id);

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

    galleries = rawGalleries.map((g) => ({
      _id: g._id.toString(),
      coupleNames: g.coupleNames,
      weddingDate: g.weddingDate ? new Date(g.weddingDate).toISOString() : '',
      clientEmail: g.clientEmail,
      status: g.status,
      expirationDate: g.expirationDate ? new Date(g.expirationDate).toISOString() : undefined,
      guestPin: g.guestPin,
      guestLinkToken: g.guestLinkToken,
      mediaCount: mediaCountMap.get(g._id.toString()) || 0,
      printCount: printMap.get(g._id.toString())?.count || 0,
      createdAt: g.createdAt ? new Date(g.createdAt).toISOString() : '',
    }));
  } catch (error) {
    console.warn('MongoDB connection error on galleries page:', error);
  }

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-teal">EverLens Backstage</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-white font-normal tracking-tight">
            Client Galleries
          </h1>
          <p className="text-xs text-[#9EABA2] font-sans mt-1">
            Manage private client wedding sanctuaries, direct guest links, download archives, and print selections.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <NewGalleryButton />
        </div>
      </div>

      {/* Galleries Management Table */}
      <div className="space-y-4">
        <GalleriesTable initialGalleries={galleries} />
      </div>
    </main>
  );
}
