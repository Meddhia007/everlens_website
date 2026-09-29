'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Check,
  Film,
  Loader2,
  Flag,
} from 'lucide-react';
import { HeartToggle } from './HeartToggle';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import { clsx } from 'clsx';


export interface PortalMediaItem {
  _id: string;
  galleryId: string;
  originalFilename: string;
  r2Key: string;
  type: 'photo' | 'video';
  category: string;
  url?: string | null;
  aspectRatio?: string;
  isPrintSelected?: boolean;
  printNote?: string;
}

interface PortalLightboxProps {
  items: PortalMediaItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  notes?: Record<string, string>;
  onUpdateNote?: (id: string, note: string) => void;
  locked?: boolean;
  isCapReached?: boolean;
  onCapReachedNotice?: () => void;
  isGuest?: boolean;
  maxCap?: number;
  onCommentPhoto?: (item: PortalMediaItem) => void;
}

export const PortalLightbox: React.FC<PortalLightboxProps> = ({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  selectedIds = new Set(),
  onToggleSelect,
  notes = {},
  onUpdateNote,
  locked = false,
  isCapReached = false,
  onCapReachedNotice,
  isGuest = false,
  maxCap = 50,
  onCommentPhoto,
}) => {
  const currentItem = items[currentIndex];

  // Video streaming signed URL state
  const [videoStreamUrl, setVideoStreamUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  // Single-item high-res download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Touch swipe tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < items.length - 1) onNavigate(currentIndex + 1);
      }
    },
    [isOpen, currentIndex, items.length, onClose, onNavigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // When a video item is selected, fetch a short-lived signed streaming URL on demand
  useEffect(() => {
    if (!isOpen || !currentItem || currentItem.type !== 'video') {
      setVideoStreamUrl(null);
      setIsVideoLoading(false);
      return;
    }

    let isMounted = true;
    setIsVideoLoading(true);
    setVideoStreamUrl(null);

    async function fetchStreamUrl() {
      try {
        const res = await fetch(`/api/portal/media/${currentItem._id}/url`);
        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.url) {
            setVideoStreamUrl(data.url);
          } else {
            setVideoStreamUrl(currentItem.url || null);
          }
          setIsVideoLoading(false);
        }
      } catch {
        if (isMounted) {
          setVideoStreamUrl(currentItem.url || null);
          setIsVideoLoading(false);
        }
      }
    }

    fetchStreamUrl();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentItem]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const deltaX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (deltaX > minSwipeDistance && currentIndex < items.length - 1) {
      // Swiped Left -> next
      onNavigate(currentIndex + 1);
    } else if (deltaX < -minSwipeDistance && currentIndex > 0) {
      // Swiped Right -> previous
      onNavigate(currentIndex - 1);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Single-item high-res download
  const handleDownloadMaster = async () => {
    if (!currentItem || isDownloading) return;
    setIsDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(false);

    try {
      const a = document.createElement('a');
      a.href = `/api/portal/media/${currentItem._id}/download`;
      a.setAttribute('download', currentItem.originalFilename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err: any) {
      console.error('Download error:', err);
      setDownloadError(err?.message || 'Download failed. Please try again.');
      setTimeout(() => setDownloadError(null), 3500);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen || !currentItem) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;
  const isSelected = currentItem ? selectedIds.has(currentItem._id) : false;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0D1513]/98 backdrop-blur-md flex flex-col justify-between select-none animate-hero-content"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Quiet Minimal Bar */}
      <div className="flex items-center justify-between p-4 sm:p-6 text-white/80 z-20">
        {/* Simple Index Counter & Album Status */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-sans text-white/70 tracking-wide">
            {currentItem.type === 'video' ? 'Video' : 'Photograph'} {currentIndex + 1} of {items.length}
          </span>
          {currentItem.type === 'photo' && !isGuest && (
            <span className="text-[11px] font-sans text-[#43B19F] bg-[#43B19F]/15 px-2.5 py-0.5 rounded-[8px] border border-[#43B19F]/30 font-medium">
              {selectedIds.size} / {maxCap} selected
            </span>
          )}
        </div>

        {/* Right Actions: Select for Album, Download & Close */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {!isGuest && currentItem.type === 'photo' && onToggleSelect && !locked && (
            <button
              type="button"
              onClick={() => onToggleSelect(currentItem._id)}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] text-xs font-medium transition-all cursor-pointer active:scale-[0.97]',
                isSelected
                  ? 'bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0F1413] font-semibold shadow-xs'
                  : 'border border-white/30 text-white hover:border-[#43B19F] hover:text-[#43B19F] bg-black/30'
              )}
            >
              {isSelected ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>✓ Selected</span>
                </>
              ) : (
                <span>Select for Album</span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadMaster}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] border border-white/20 text-xs font-sans text-white/80 hover:text-white hover:border-white/40 bg-black/30 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.97]"
            title="Download original file"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#43B19F]" />
                <span className="hidden sm:inline">Downloading...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#43B19F]" />
                <span className="hidden sm:inline">Downloaded</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </>
            )}
          </button>

          {!isGuest && currentItem.type === 'photo' && onCommentPhoto && (
            <button
              type="button"
              onClick={() => onCommentPhoto(currentItem)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-white/20 text-xs font-sans text-white/80 hover:text-white hover:border-[#43B19F] hover:text-[#43B19F] bg-black/30 transition-all cursor-pointer active:scale-[0.97]"
              title="Flag an issue / comment on this photo"
            >
              <Flag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flag Issue</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white transition-colors rounded-[8px] hover:bg-white/10 cursor-pointer active:scale-[0.97]"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Focus Canvas */}
      <div className="flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {/* Previous Arrow Control */}
        {hasPrev && (
          <button
            type="button"
            onClick={() => onNavigate(currentIndex - 1)}
            className="absolute left-2 sm:left-6 z-20 p-3 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none cursor-pointer active:scale-[0.95]"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}

        {/* Content Display: Photo vs Video */}
        <div className="max-h-[82vh] max-w-[92vw] flex items-center justify-center">
          {currentItem.type === 'video' ? (
            <VideoPlayer
              src={videoStreamUrl}
              isLoading={isVideoLoading}
              emptyText="Video stream is preparing."
              downloadFilename={currentItem.originalFilename}
            />
          ) : currentItem.url ? (
            <img
              src={currentItem.url || '/portfolio/images/bridal-veil.jpg'}
              alt="Wedding photograph"
              className="max-h-[82vh] max-w-[92vw] object-contain rounded-[14px] shadow-2xl transition-opacity duration-200"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/portfolio/images/bridal-veil.jpg';
              }}
            />
          ) : (
            <div className="p-12 text-center text-white/50 font-sans text-xs">
              Photograph archived in studio vault.
            </div>
          )}
        </div>

        {/* Next Arrow Control */}
        {hasNext && (
          <button
            type="button"
            onClick={() => onNavigate(currentIndex + 1)}
            className="absolute right-2 sm:right-6 z-20 p-3 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none cursor-pointer active:scale-[0.95]"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}
      </div>

      {/* Bottom Feedback / Note Bar */}
      <div className="p-3 sm:px-6 min-h-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans text-white/70 z-20">
        <div className="flex-1 flex items-center justify-center sm:justify-start w-full sm:w-auto">
          {!isGuest && currentItem.type === 'photo' && isSelected && !locked && onUpdateNote ? (
            <div
              className="flex items-center gap-2 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[11px] font-sans text-amber-400 uppercase tracking-wider shrink-0 font-medium">
                Album Note:
              </span>
              <input
                type="text"
                defaultValue={notes[currentItem._id] ?? currentItem.printNote ?? ''}
                key={notes[currentItem._id] ?? currentItem.printNote ?? ''}
                onBlur={(e) => onUpdateNote(currentItem._id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                placeholder="Optional note for album designer..."
                className="flex-1 bg-transparent border-b border-white/25 focus:border-amber-400 text-xs py-1 px-1 text-white placeholder:text-white/40 outline-none transition-colors"
              />
            </div>
          ) : (
            <span className="hidden sm:inline text-[11px] tracking-wider text-white/35">
              Use arrow keys or swipe to navigate · Esc to close
            </span>
          )}
        </div>

        {downloadError && (
          <div>
            <span className="text-red-300 text-[11px]">{downloadError}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalLightbox;
