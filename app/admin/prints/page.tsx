import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';
import { MediaItem } from '@/models/MediaItem';
import { PrintSelection } from '@/models/PrintSelection';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { PrintOrdersTable, PrintOrderItem } from '@/components/admin/PrintOrdersTable';

export const dynamic = 'force-dynamic';

export default async function AdminPrintOrdersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminToken(token) : null;

  if (!session) {
    redirect('/admin/login');
  }

  let orders: PrintOrderItem[] = [];

  try {
    await connectToDatabase();

    // Query all submitted (locked) print selections, most recent first
    const rawSelections = await PrintSelection.find({ locked: true })
      .sort({ submittedAt: -1, updatedAt: -1 })
      .populate({ path: 'galleryId', model: Gallery })
      .lean();

    const allMediaIds = rawSelections.flatMap((s) => s.mediaItemIds || []);

    const mediaWithNotes = await MediaItem.find({
      _id: { $in: allMediaIds },
      printNote: { $exists: true, $ne: '' },
    })
      .select('_id')
      .lean();

    const noteMediaIdSet = new Set(mediaWithNotes.map((m) => m._id.toString()));

    orders = rawSelections.map((sel: any) => {
      const gallery = sel.galleryId;
      const mediaIds = (sel.mediaItemIds || []).map((id: any) => id.toString());
      const notesCount = mediaIds.filter((id: string) => noteMediaIdSet.has(id)).length;

      return {
        _id: sel._id.toString(),
        galleryId: gallery?._id ? gallery._id.toString() : '',
        coupleNames: gallery?.coupleNames || 'Archived Couple',
        weddingDate: gallery?.weddingDate ? new Date(gallery.weddingDate).toISOString() : '',
        clientEmail: gallery?.clientEmail || '',
        submittedAt: sel.submittedAt ? new Date(sel.submittedAt).toISOString() : '',
        mediaCount: mediaIds.length,
        notesCount,
      };
    });
  } catch (error) {
    console.error('Failed to load print orders:', error);
  }

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#F4F3ED] flex flex-col font-sans">
      <AdminNavbar adminEmail={session.email} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page Title & Context */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-white/[0.08] pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#F4F3ED] font-normal tracking-tight">
              Archival Print Orders
            </h1>
            <p className="text-xs text-[#9EABA2] font-sans mt-1">
              Client album curations submitted and locked for lab color proofing and physical typesetting.
            </p>
          </div>
          <span className="text-xs font-mono text-teal bg-teal/10 border border-teal/20 px-3 py-1 rounded-full self-start sm:self-auto">
            Studio Session: {session.email}
          </span>
        </div>

        {/* Orders Table */}
        <PrintOrdersTable orders={orders} />
      </main>
    </div>
  );
}
