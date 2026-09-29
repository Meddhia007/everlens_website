import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyClientToken, CLIENT_COOKIE_NAME } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Gallery } from '@/models/Gallery';
import { MediaItem } from '@/models/MediaItem';
import { PrintSelection } from '@/models/PrintSelection';
import { DownloadRequest } from '@/models/DownloadRequest';
import { getPresignedDownloadUrl } from '@/lib/r2';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { PortalSanctuaryView } from '@/components/portal/PortalSanctuaryView';
import { PortalMediaItem } from '@/components/portal/PortalLightbox';

export default async function ClientPortalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CLIENT_COOKIE_NAME)?.value;
  const session = token ? await verifyClientToken(token) : null;

  if (!session || !session.galleryId) {
    redirect('/portal/login');
  }

  let weddingDate: string | undefined = undefined;
  let mediaList: PortalMediaItem[] = [];
  let isPrintLocked = false;
  let printSubmittedAt: string | null = null;
  let selectedPrintIds: string[] = [];

  try {
    await connectToDatabase();

    // Fetch Gallery metadata
    const gallery = await Gallery.findById(session.galleryId)
      .select('coupleNames weddingDate status expirationDate photoLimit productionStage stageHistory')
      .lean();

    // Restrict access if gallery is archived or past expirationDate
    const isExpired =
      !gallery ||
      gallery.status === 'archived' ||
      Boolean(gallery.expirationDate && new Date(gallery.expirationDate) < new Date());

    if (isExpired) {
      return (
        <div className="min-h-screen bg-cream text-ink flex flex-col font-sans">
          <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-cream-deep/40 border border-ink/15 p-8 sm:p-10 rounded-xs space-y-6 text-left">
              <div className="flex flex-col items-center text-center space-y-4">
                <Logo size="md" />
                <div className="space-y-2 pt-2">
                  <h1 className="font-serif text-2xl sm:text-3xl text-ink font-normal tracking-tight">
                    This gallery has expired — contact us
                  </h1>
                  <p className="text-xs font-sans text-ink/70 leading-relaxed max-w-sm mx-auto">
                    The online delivery window for this wedding collection has concluded and the gallery is currently archived. All photographs and films remain safely preserved in our permanent studio vaults.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-cream border border-ink/10 rounded-xs text-xs font-sans text-ink/80 space-y-2">
                <p className="font-medium text-ink">Need to access your collection?</p>
                <p className="text-ink/65 leading-relaxed">
                  To request gallery reactivation, retrieve full-resolution archives, or order heirloom print editions, please reach out directly:
                </p>
                <div className="pt-1 font-mono text-[11px] text-teal space-y-1">
                  <div>studio@everlensweddings.com</div>
                  <div>+216 29 000 000</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-ink/10 text-xs font-sans">
                <Link
                  href="/#contact"
                  className="text-teal hover:underline font-medium cursor-pointer"
                >
                  Contact Studio
                </Link>
                <form action="/api/auth/client/logout" method="POST">
                  <button
                    type="submit"
                    className="text-ink/50 hover:text-ink transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </main>
        </div>
      );
    }

    if (gallery?.weddingDate) {
      weddingDate = new Date(gallery.weddingDate).toISOString();
    }

    // Fetch PrintSelection status
    const printSelection = await PrintSelection.findOne({ galleryId: session.galleryId }).lean();
    if (printSelection) {
      isPrintLocked = !!printSelection.locked;
      printSubmittedAt = printSelection.submittedAt
        ? new Date(printSelection.submittedAt).toISOString()
        : null;
      selectedPrintIds = (printSelection.mediaItemIds || []).map((id) => id.toString());
    }

    // Fetch this gallery's media items only
    const rawItems = await MediaItem.find({ galleryId: session.galleryId })
      .sort({ createdAt: -1 })
      .lean();

    // Attach signed thumbnail/view URLs for the grid
    mediaList = await Promise.all(
      rawItems.map(async (item) => {
        let viewUrl: string | null = null;
        try {
          // Generate signed view URL from R2 (1 hour expiry)
          viewUrl = await getPresignedDownloadUrl(item.r2Key, 3600);
        } catch {
          viewUrl = null;
        }

        const isSelected =
          selectedPrintIds.includes(item._id.toString()) || !!item.isPrintSelected;

        return {
          _id: item._id.toString(),
          galleryId: item.galleryId.toString(),
          originalFilename: item.originalFilename,
          r2Key: item.r2Key,
          type: item.type,
          category: item.category,
          url: viewUrl,
          isPrintSelected: isSelected,
          printNote: item.printNote || '',
        };
      })
    );

    // Fetch recent download requests
    const rawDownloadRequests = await DownloadRequest.find({ galleryId: session.galleryId })
      .sort({ requestedAt: -1 })
      .limit(5)
      .lean();

    const initialDownloadRequests = rawDownloadRequests.map((req) => ({
      _id: req._id.toString(),
      status: req.status,
      downloadUrl: req.status === 'ready'
        ? (req.downloadUrl?.includes('unsplash.com') ? '/api/portal/downloads/zip?type=everything' : req.downloadUrl)
        : undefined,
      expiresAt: req.expiresAt ? new Date(req.expiresAt).toISOString() : undefined,
      itemCount: req.itemCount,
      requestedAt: req.requestedAt ? new Date(req.requestedAt).toISOString() : undefined,
      completedAt: req.completedAt ? new Date(req.completedAt).toISOString() : undefined,
    }));

    return (
      <PortalSanctuaryView
        coupleNames={session.coupleNames}
        weddingDate={weddingDate}
        photoLimit={gallery?.photoLimit || 50}
        productionStage={gallery?.productionStage || 'files_uploaded'}
        stageHistory={(gallery?.stageHistory || []).map((h) => ({
          stage: h.stage,
          reachedAt: h.reachedAt ? new Date(h.reachedAt).toISOString() : new Date().toISOString(),
        }))}
        initialMedia={mediaList}
        initialLocked={isPrintLocked}
        initialSubmittedAt={printSubmittedAt}
        initialSelectedIds={selectedPrintIds}
        initialDownloadRequests={initialDownloadRequests}
      />
    );
  } catch (error) {
    console.error('Failed to load client portal media:', error);
  }

  return (
    <PortalSanctuaryView
      coupleNames={session.coupleNames}
      weddingDate={weddingDate}
      photoLimit={50}
      productionStage="files_uploaded"
      stageHistory={[]}
      initialMedia={mediaList}
      initialLocked={isPrintLocked}
      initialSubmittedAt={printSubmittedAt}
      initialSelectedIds={selectedPrintIds}
      initialDownloadRequests={[]}
    />
  );
}
