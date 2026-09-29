'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { EditorialMasonryGrid } from './EditorialMasonryGrid';
import { PortalLightbox, PortalMediaItem } from './PortalLightbox';
import { DownloadRequestsPanel, ClientDownloadRequest } from './DownloadRequestsPanel';
import { PortalHomeView, ProductionStage } from './PortalHomeView';
import { PortalVideosView } from './PortalVideosView';
import { PortalAlbumView } from './PortalAlbumView';
import { PhotoCommentModal } from './PhotoCommentModal';
import { usePortalContext } from './PortalContext';
import { ArrowRight, BookOpen } from 'lucide-react';

interface PortalSanctuaryViewProps {
  coupleNames: string;
  weddingDate?: string;
  photoLimit?: number;
  productionStage?: ProductionStage;
  stageHistory?: Array<{ stage: string; reachedAt: string }>;
  initialMedia: PortalMediaItem[];
  initialLocked?: boolean;
  initialSubmittedAt?: string | null;
  initialSelectedIds?: string[];
  initialDownloadRequests?: ClientDownloadRequest[];
}

export const PortalSanctuaryView: React.FC<PortalSanctuaryViewProps> = ({
  coupleNames,
  weddingDate,
  photoLimit = 50,
  productionStage = 'files_uploaded',
  stageHistory = [],
  initialMedia,
  initialLocked = false,
  initialSubmittedAt = null,
  initialSelectedIds = [],
  initialDownloadRequests = [],
}) => {
  const { activeSection, navigateToSection, setIsLocked, setAlbumCount } = usePortalContext();

  const maxAlbumCap = photoLimit || 50;

  // Comment / Feedback Modal state
  const [commentingItem, setCommentingItem] = useState<PortalMediaItem | null>(null);

  // Selected Album Items
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const set = new Set<string>(initialSelectedIds);
    initialMedia.forEach((m) => {
      if (m.isPrintSelected) set.add(m._id);
    });
    return set;
  });

  // Notes
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialMedia.forEach((m) => {
      if (m.printNote) map[m._id] = m.printNote;
    });
    return map;
  });

  const [locked, setLocked] = useState<boolean>(initialLocked);
  const [submittedAt, setSubmittedAt] = useState<string | null>(initialSubmittedAt);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Sync state with context
  useEffect(() => {
    setIsLocked(locked);
  }, [locked, setIsLocked]);

  useEffect(() => {
    setAlbumCount(selectedIds.size);
  }, [selectedIds.size, setAlbumCount]);

  // Download Requests
  const [downloadRequests, setDownloadRequests] = useState<ClientDownloadRequest[]>(
    initialDownloadRequests || []
  );
  const [isRequestingDownload, setIsRequestingDownload] = useState<boolean>(false);

  // Lightbox State
  const [lightboxItems, setLightboxItems] = useState<PortalMediaItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Separate photos and videos (pure, continuous streams)
  const photos = useMemo(() => {
    return initialMedia.filter((m) => m.type === 'photo');
  }, [initialMedia]);

  const videos = useMemo(() => {
    return initialMedia.filter((m) => m.type === 'video');
  }, [initialMedia]);

  const selectedPhotos = useMemo(() => {
    return photos.filter((p) => selectedIds.has(p._id));
  }, [photos, selectedIds]);

  const coverPhoto = useMemo(() => {
    return photos[0]?.url || initialMedia[0]?.url || null;
  }, [photos, initialMedia]);

  // Refresh downloads
  const fetchDownloadRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/portal/downloads');
      const data = await res.json();
      if (res.ok && data.requests) {
        setDownloadRequests(data.requests);
      }
    } catch {
      // Quiet fallback
    }
  }, []);

  // Poll while any archive job is actively queued or processing
  useEffect(() => {
    const hasActive = downloadRequests.some(
      (r) => r.status === 'queued' || r.status === 'processing'
    );
    if (!hasActive) return;

    const timer = setInterval(() => {
      fetchDownloadRequests();
    }, 8000);

    return () => clearInterval(timer);
  }, [downloadRequests, fetchDownloadRequests]);

  // Toggle selection
  const handleToggleSelect = useCallback(
    async (id: string) => {
      if (locked) return;

      const isCurrentlySelected = selectedIds.has(id);

      if (!isCurrentlySelected && selectedIds.size >= maxAlbumCap) {
        setApiError(`Album limit reached (${maxAlbumCap} photographs).`);
        setTimeout(() => setApiError(null), 4000);
        return;
      }

      // Optimistic update
      const newSelected = new Set(selectedIds);
      if (isCurrentlySelected) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);

      try {
        const res = await fetch('/api/portal/prints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaItemId: id,
            selected: !isCurrentlySelected,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          // Revert optimistic update
          setSelectedIds(selectedIds);
          if (data.error) {
            setApiError(data.error);
            setTimeout(() => setApiError(null), 4000);
          }
        }
      } catch (err) {
        console.error('Failed to sync album selection:', err);
        setSelectedIds(selectedIds);
      }
    },
    [locked, selectedIds, maxAlbumCap]
  );

  // Update note
  const handleUpdateNote = useCallback(
    async (id: string, note: string) => {
      if (locked) return;

      setNotes((prev) => ({ ...prev, [id]: note }));

      try {
        await fetch('/api/portal/prints/note', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaItemId: id,
            note,
          }),
        });
      } catch (err) {
        console.error('Failed to save album note:', err);
      }
    },
    [locked]
  );

  // Submit album selection
  const handleSubmitSelection = useCallback(async () => {
    if (selectedIds.size < 1 || isSubmitting) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const res = await fetch('/api/portal/prints/submit', {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit album selection');
      }

      setLocked(true);
      setSubmittedAt(data.submittedAt || new Date().toISOString());
      navigateToSection('album');
    } catch (err: any) {
      console.error('Submit error:', err);
      setApiError(err?.message || 'Failed to submit album selection');
      setTimeout(() => setApiError(null), 5000);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedIds.size, isSubmitting, navigateToSection]);

  // Request batch download
  const handleBatchDownloadClick = async () => {
    setIsRequestingDownload(true);
    try {
      const res = await fetch('/api/portal/downloads', {
        method: 'POST',
      });
      if (res.ok) {
        await fetchDownloadRequests();
      }
    } catch {
      // Quiet fallback
    } finally {
      setIsRequestingDownload(false);
    }
  };

  // Lightbox handlers
  const handleOpenPhotoLightbox = (index: number) => {
    setLightboxItems(photos);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const handleOpenSelectedPhotoLightbox = (item: PortalMediaItem) => {
    const idx = photos.findIndex((p) => p._id === item._id);
    if (idx !== -1) {
      setLightboxItems(photos);
      setLightboxIndex(idx);
    } else {
      setLightboxItems(selectedPhotos);
      setLightboxIndex(0);
    }
    setIsLightboxOpen(true);
  };

  const handlePlayVideo = (video: PortalMediaItem, index: number) => {
    setLightboxItems(videos);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
  };

  return (
    <div className="space-y-10 text-left">
      {/* Temporary API error feedback if any */}
      {apiError && (
        <div className="p-3 bg-red-950/60 border border-red-500/30 text-red-200 rounded-xs text-xs font-sans animate-hero-content">
          {apiError}
        </div>
      )}

      {/* ================= 1. HOME VIEW ================= */}
      {activeSection === 'home' && (
        <PortalHomeView
          coupleNames={coupleNames}
          weddingDate={weddingDate}
          heroImageUrl={coverPhoto}
          photoCount={photos.length}
          videoCount={videos.length}
          albumCount={selectedIds.size}
          maxAlbumCap={maxAlbumCap}
          productionStage={productionStage}
          stageHistory={stageHistory}
          onViewPhotos={() => navigateToSection('photos')}
          onWatchVideos={() => navigateToSection('videos')}
          onViewAlbum={() => navigateToSection('album')}
        />
      )}

      {/* ================= 2. PHOTOS VIEW (CONTINUOUS, NO CATEGORIES) ================= */}
      {activeSection === 'photos' && (
        <section className="space-y-8 animate-hero-content">
          {/* Header */}
          <div className="space-y-1.5 border-b border-[#EAE8DA]/10 pb-6">
            <h2 className="font-serif text-3xl sm:text-4xl text-[#EAE8DA] font-medium tracking-tight">
              Photos
            </h2>
            <p className="text-sm font-sans text-[#EAE8DA]/60">
              {photos.length} photographs
            </p>
          </div>

          {/* Continuous Grid */}
          <EditorialMasonryGrid
            items={photos}
            onItemClick={handleOpenPhotoLightbox}
            chapterLabel="Photos"
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            notes={notes}
            onUpdateNote={handleUpdateNote}
            locked={locked}
            isCapReached={selectedIds.size >= maxAlbumCap}
            onCommentPhoto={(item) => setCommentingItem(item)}
          />

          {/* Persistent, discreet Album Bar when browsing photos */}
          {selectedIds.size > 0 && !locked && (
            <div className="fixed bottom-20 md:bottom-8 right-6 md:right-10 z-30 animate-hero-content">
              <button
                type="button"
                onClick={() => navigateToSection('album')}
                className="bg-[#171D1C]/95 hover:bg-[#1D2422] text-[#EAE8DA] border border-[#43B19F]/50 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs font-medium cursor-pointer transition-all hover:scale-102 select-none"
              >
                <div className="w-6 h-6 rounded-full bg-[#43B19F] text-[#0F1413] flex items-center justify-center font-bold text-[10px]">
                  {selectedIds.size}
                </div>
                <span>
                  {selectedIds.size} / {maxAlbumCap} selected for album
                </span>
                <span className="text-[#43B19F] flex items-center gap-1">
                  <span>View Album</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* ================= 3. VIDEOS VIEW ================= */}
      {activeSection === 'videos' && (
        <PortalVideosView
          videos={videos}
          onPlayVideo={handlePlayVideo}
          onDownloadVideo={(v) => {
            const a = document.createElement('a');
            a.href = `/api/portal/media/${v._id}/download`;
            a.setAttribute('download', v.originalFilename);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
        />
      )}

      {/* ================= 4. ALBUM VIEW ================= */}
      {activeSection === 'album' && (
        <PortalAlbumView
          selectedItems={selectedPhotos}
          locked={locked}
          maxCap={maxAlbumCap}
          onContinueSelecting={() => navigateToSection('photos')}
          onSubmitSelection={handleSubmitSelection}
          isSubmitting={isSubmitting}
          onToggleSelect={handleToggleSelect}
          notes={notes}
          onUpdateNote={handleUpdateNote}
          onItemClick={handleOpenSelectedPhotoLightbox}
        />
      )}

      {/* ================= 5. DOWNLOADS VIEW ================= */}
      {activeSection === 'downloads' && (
        <DownloadRequestsPanel
          requests={downloadRequests}
          onRequestDownload={handleBatchDownloadClick}
          isRequestingDownload={isRequestingDownload}
          totalPhotoCount={photos.length}
          totalFilmCount={videos.length}
          photos={photos}
          videos={videos}
          selectedPhotos={selectedPhotos}
        />
      )}

      {/* Minimal Lightbox Modal */}
      <PortalLightbox
        items={lightboxItems}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={handleCloseLightbox}
        onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        notes={notes}
        onUpdateNote={handleUpdateNote}
        locked={locked}
        isCapReached={selectedIds.size >= maxAlbumCap}
        maxCap={maxAlbumCap}
        onCommentPhoto={(item) => setCommentingItem(item)}
      />

      {/* Client Photo Issue Flag / Comment Modal */}
      <PhotoCommentModal
        item={commentingItem}
        isOpen={Boolean(commentingItem)}
        onClose={() => setCommentingItem(null)}
      />
    </div>
  );
};

export default PortalSanctuaryView;
