'use client';

import React, { useState, useMemo } from 'react';
import { CategoryTabs, TabItem } from '../portal/CategoryTabs';
import { EditorialMasonryGrid } from '../portal/EditorialMasonryGrid';
import { PortalLightbox, PortalMediaItem } from '../portal/PortalLightbox';
import { extractClientGalleryCategories, formatCategoryLabel } from '@/lib/categories';
import { formatEditorialDate } from '@/lib/date';
import { Logo } from '@/components/Logo';
import { Download, Clock } from 'lucide-react';

interface GuestSanctuaryViewProps {
  coupleNames: string;
  weddingDate?: string;
  initialMedia: PortalMediaItem[];
  token?: string;
}

export const GuestSanctuaryView: React.FC<GuestSanctuaryViewProps> = ({
  coupleNames,
  weddingDate,
  initialMedia,
  token,
}) => {
  // Ensure guest session cookie is verified/stored in background for single-item downloads and streaming
  React.useEffect(() => {
    if (!token) return;
    fetch(`/api/guest/${token}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).catch(() => {});
  }, [token]);

  // Extract ONLY categories present in this client's gallery
  const clientCategories = useMemo(() => {
    return extractClientGalleryCategories(initialMedia);
  }, [initialMedia]);

  const hasMultipleCelebrations = clientCategories.length > 1;

  // Active Category tab (or active type tab if single celebration)
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'photo' | 'video'>('all');

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Batch download alert state
  const [showBatchAlert, setShowBatchAlert] = useState(false);

  const photoCount = initialMedia.filter((m) => m.type === 'photo').length;
  const filmCount = initialMedia.filter((m) => m.type === 'video').length;

  // Dynamic Tabs definition
  const guestTabs: TabItem[] = useMemo(() => {
    if (hasMultipleCelebrations) {
      return [
        { id: 'all', label: 'All Celebrations' },
        ...clientCategories.map((c) => ({
          id: c.slug,
          label: c.label,
        })),
      ];
    }

    // Single category: tab by format
    const tabs: TabItem[] = [{ id: 'all', label: 'Photos & Videos' }];
    if (photoCount > 0) tabs.push({ id: 'photos', label: 'Photos' });
    if (filmCount > 0) tabs.push({ id: 'videos', label: 'Videos' });
    return tabs;
  }, [hasMultipleCelebrations, clientCategories, photoCount, filmCount]);

  // Tab counts
  const tabCounts = useMemo(() => {
    if (hasMultipleCelebrations) {
      const counts: Record<string, number> = { all: initialMedia.length };
      clientCategories.forEach((c) => {
        counts[c.slug] = c.totalCount;
      });
      return counts;
    }

    return {
      all: initialMedia.length,
      photos: photoCount,
      videos: filmCount,
    };
  }, [hasMultipleCelebrations, clientCategories, initialMedia.length, photoCount, filmCount]);

  // Counts for the secondary type filter under the active celebration
  const activeCelebrationTypeCounts = useMemo(() => {
    const subset =
      activeCategoryTab === 'all'
        ? initialMedia
        : initialMedia.filter((item) => {
            let cat = (item.category || '').toLowerCase().trim();
            if (!cat || cat === 'photography') cat = 'mariage';
            return cat === activeCategoryTab;
          });

    return {
      all: subset.length,
      photo: subset.filter((m) => m.type === 'photo').length,
      video: subset.filter((m) => m.type === 'video').length,
    };
  }, [initialMedia, activeCategoryTab]);

  // Filter media for current selection
  const currentTabMedia = useMemo(() => {
    if (hasMultipleCelebrations) {
      let filtered = initialMedia;
      if (activeCategoryTab !== 'all') {
        filtered = filtered.filter((item) => {
          let cat = (item.category || '').toLowerCase().trim();
          if (!cat || cat === 'photography') cat = 'mariage';
          return cat === activeCategoryTab;
        });
      }
      if (mediaTypeFilter !== 'all') {
        filtered = filtered.filter((item) => item.type === mediaTypeFilter);
      }
      return filtered;
    }

    // Single celebration mode
    if (activeCategoryTab === 'photos') {
      return initialMedia.filter((item) => item.type === 'photo');
    }
    if (activeCategoryTab === 'videos') {
      return initialMedia.filter((item) => item.type === 'video');
    }
    return initialMedia;
  }, [initialMedia, hasMultipleCelebrations, activeCategoryTab, mediaTypeFilter]);

  const activeTabLabel = useMemo(() => {
    if (hasMultipleCelebrations) {
      if (activeCategoryTab === 'all') return 'All Celebrations';
      const cat = clientCategories.find((c) => c.slug === activeCategoryTab);
      return cat?.label || formatCategoryLabel(activeCategoryTab);
    }
    return guestTabs.find((t) => t.id === activeCategoryTab)?.label || 'Collection';
  }, [hasMultipleCelebrations, activeCategoryTab, clientCategories, guestTabs]);

  // Lightbox navigation
  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
  };

  const handleNavigateLightbox = (newIndex: number) => {
    setLightboxIndex(newIndex);
  };

  return (
    <div className="min-h-screen bg-cream text-ink font-sans pb-24">
      {/* Top Quiet Guest Navigation */}
      <nav className="border-b border-ink/10 py-4 px-6 sm:px-10 flex items-center justify-between">
        <Logo size="sm" />
        <div className="text-xs font-mono text-ink/50 uppercase tracking-widest">
          Guest Access
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto p-6 sm:p-10 space-y-10 text-left">
        {/* Header Section */}
        <header className="space-y-4 border-b border-ink/10 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-teal font-medium font-sans">
                Wedding Gallery
              </span>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-ink tracking-tight">
                {coupleNames}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs font-sans text-ink/60 pt-0.5">
                {weddingDate && (
                  <>
                    <span>{formatEditorialDate(weddingDate)}</span>
                    <span>•</span>
                  </>
                )}
                <span>{photoCount} Photographs</span>
                {filmCount > 0 && (
                  <>
                    <span>•</span>
                    <span>{filmCount} Cinematic {filmCount === 1 ? 'Film' : 'Films'}</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Notice / Single-Item Download info */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowBatchAlert(true);
                  setTimeout(() => setShowBatchAlert(false), 6000);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-ink/20 rounded-xs text-xs font-medium text-ink hover:border-ink/50 hover:bg-cream-deep/40 transition-colors cursor-pointer select-none"
              >
                <Download className="w-3.5 h-3.5 text-teal" />
                <span>Download Album (ZIP)</span>
              </button>
            </div>
          </div>

          {/* Calm Batch Download Notice */}
          {showBatchAlert && (
            <div className="p-4 bg-cream-deep/80 border border-ink/15 rounded-xs flex items-start gap-3 text-xs font-sans text-ink/80 animate-hero-content">
              <Clock className="w-4 h-4 text-teal shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-ink">
                  Master Archive Generation
                </p>
                <p className="text-ink/65 leading-relaxed">
                  Full-collection archive packaging is being prepared. You can view, stream films, and download individual full-resolution master photographs at any time by opening any photo in the gallery.
                </p>
              </div>
            </div>
          )}
        </header>

        {/* Chapter Navigation Tabs */}
        <section className="space-y-6">
          <CategoryTabs
            activeTab={activeCategoryTab}
            onSelectTab={setActiveCategoryTab}
            counts={tabCounts}
            tabs={guestTabs}
            theme="light"
          />

          {/* Secondary Type / Format Filter Pills (only when multiple celebrations and films exist) */}
          {hasMultipleCelebrations && filmCount > 0 && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[11px] font-sans text-ink/50 uppercase tracking-wider mr-1">
                Format:
              </span>
              {[
                { id: 'all', label: `All (${activeCelebrationTypeCounts.all})` },
                { id: 'photo', label: `Photos (${activeCelebrationTypeCounts.photo})` },
                { id: 'video', label: `Videos (${activeCelebrationTypeCounts.video})` },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setMediaTypeFilter(btn.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-sans transition-colors cursor-pointer ${
                    mediaTypeFilter === btn.id
                      ? 'bg-ink text-cream font-medium shadow-xs'
                      : 'bg-cream-deep/60 hover:bg-cream-deep text-ink/75 border border-ink/10'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          {/* Editorial Masonry Grid (Guest mode: zero hearts, zero notes) */}
          <EditorialMasonryGrid
            items={currentTabMedia}
            onItemClick={handleOpenLightbox}
            chapterLabel={activeTabLabel}
            isGuest={true}
          />
        </section>

        {/* Full-Screen Minimalist Lightbox (Guest mode: video streaming + single downloads, zero print UI) */}
        <PortalLightbox
          items={currentTabMedia}
          currentIndex={lightboxIndex}
          isOpen={isLightboxOpen}
          onClose={handleCloseLightbox}
          onNavigate={handleNavigateLightbox}
          isGuest={true}
        />
      </main>
    </div>
  );
};

export default GuestSanctuaryView;
