'use client';

import React, { useState, useMemo } from 'react';
import { MediaCategory } from '@/models/MediaItem';
import { CategoryTabs, PORTAL_TABS } from '../portal/CategoryTabs';
import { EditorialMasonryGrid } from '../portal/EditorialMasonryGrid';
import { PortalLightbox, PortalMediaItem } from '../portal/PortalLightbox';
import { formatEditorialDate } from '@/lib/date';
import { Logo } from '@/components/Logo';
import { Download, Clock } from 'lucide-react';

interface GuestSanctuaryViewProps {
  coupleNames: string;
  weddingDate?: string;
  initialMedia: PortalMediaItem[];
}

export const GuestSanctuaryView: React.FC<GuestSanctuaryViewProps> = ({
  coupleNames,
  weddingDate,
  initialMedia,
}) => {
  // Active Tab state
  const [activeTab, setActiveTab] = useState<MediaCategory>('ceremony');

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Batch download alert state
  const [showBatchAlert, setShowBatchAlert] = useState(false);

  // Counts per category
  const counts = useMemo(() => {
    const map: Record<MediaCategory, number> = {
      'getting-ready': 0,
      ceremony: 0,
      'couples-portraits': 0,
      reception: 0,
      films: 0,
    };

    initialMedia.forEach((item) => {
      const cat = item.category as MediaCategory;
      if (map[cat] !== undefined) {
        map[cat] += 1;
      }
    });

    return map;
  }, [initialMedia]);

  // Set default active tab to first category with media
  React.useEffect(() => {
    const firstWithItems = PORTAL_TABS.find((t) => counts[t.id] > 0);
    if (firstWithItems) {
      setActiveTab(firstWithItems.id);
    }
  }, [counts]);

  // Filter media for current tab
  const currentTabMedia = useMemo(() => {
    return initialMedia.filter((item) => item.category === activeTab);
  }, [initialMedia, activeTab]);

  const activeTabLabel =
    PORTAL_TABS.find((t) => t.id === activeTab)?.label || 'Collection';

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

  const photoCount = initialMedia.filter((m) => m.type === 'photo').length;
  const filmCount = initialMedia.filter((m) => m.type === 'video').length;

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
        <section className="space-y-8">
          <CategoryTabs
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            counts={counts}
          />

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
