'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Download, ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { PortfolioItem, portfolioData } from './PortfolioSection';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import { clsx } from 'clsx';

interface LightboxModalProps {
  item: PortfolioItem | null;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({ item, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [videoStreamUrl, setVideoStreamUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  // Mobile swipe gesture tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    if (item) {
      const idx = portfolioData.findIndex((p) => p.id === item.id);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [item]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const currentPhoto = portfolioData[currentIndex] || item;

  // Stream signed video URL if current item is a film
  useEffect(() => {
    if (!item || !currentPhoto) return;

    if (currentPhoto.category === 'film') {
      if (currentPhoto.videoUrl) {
        setVideoStreamUrl(currentPhoto.videoUrl);
        setIsVideoLoading(false);
        return;
      }

      if (currentPhoto.mediaItemId) {
        let isMounted = true;
        setIsVideoLoading(true);
        setVideoStreamUrl(null);

        fetch(`/api/portfolio/media/${currentPhoto.mediaItemId}/url`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (isMounted) {
              if (data?.url) {
                setVideoStreamUrl(data.url);
              } else {
                setVideoStreamUrl(null);
              }
              setIsVideoLoading(false);
            }
          })
          .catch(() => {
            if (isMounted) {
              setVideoStreamUrl(null);
              setIsVideoLoading(false);
            }
          });

        return () => {
          isMounted = false;
        };
      }

      // If no video URL and no mediaItemId (e.g. placeholder/mock)
      setVideoStreamUrl(null);
      setIsVideoLoading(false);
    } else {
      setVideoStreamUrl(null);
      setIsVideoLoading(false);
    }
  }, [item, currentPhoto]);

  if (!item) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % portfolioData.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + portfolioData.length) % portfolioData.length);
  };

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const isFilm = currentPhoto.category === 'film';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Controls Bar with Safe Area Top */}
      <header className="px-5 py-4 sm:px-8 flex items-center justify-between text-white/90 border-b border-white/10 z-10 pt-safe">
        <div className="text-left text-xs font-sans truncate max-w-[65%]">
          <span className="font-mono text-teal-300">
            {isFilm ? `${currentPhoto.id}.mp4` : `DSC_${(currentIndex + 1) * 1240}.jpg`}
          </span>
          <span className="mx-2 text-white/40 hidden sm:inline">•</span>
          <span className="text-white/90 hidden sm:inline">
            {currentPhoto.title} — {currentPhoto.location}
          </span>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-5">
          <button
            type="button"
            onClick={() => setIsFavorited(!isFavorited)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Save to favorites"
          >
            <Heart
              className={clsx(
                'w-5 h-5 transition-colors',
                isFavorited ? 'fill-salmon-500 text-salmon-500' : 'text-white/80'
              )}
            />
          </button>

          {(!isFilm || videoStreamUrl) && (
            <a
              href={isFilm ? videoStreamUrl! : currentPhoto.image}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label={isFilm ? 'Download film' : 'Download image'}
            >
              <Download className="w-5 h-5" />
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Center Image / Film Viewport with Touch Gestures */}
      <div
        className="relative flex-1 flex items-center justify-center p-3 sm:p-8 overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left Arrow (Desktop / Tablet) */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-3 sm:left-8 z-10 w-11 h-11 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/70 flex items-center justify-center transition-all cursor-pointer"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Display Media: Video vs Photo */}
        <div className="relative max-w-5xl max-h-[75vh] flex items-center justify-center">
          {isFilm ? (
            <VideoPlayer
              src={videoStreamUrl}
              poster={currentPhoto.image}
              isLoading={isVideoLoading}
              emptyText="Film preview coming soon"
            />
          ) : (
            <img
              src={currentPhoto.image}
              alt={currentPhoto.title}
              className="max-h-[70vh] sm:max-h-[75vh] max-w-full object-contain rounded-xs"
            />
          )}
        </div>

        {/* Right Arrow (Desktop / Tablet) */}
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-3 sm:right-8 z-10 w-11 h-11 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/70 flex items-center justify-center transition-all cursor-pointer"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Thumbnail Strip with Safe Area Bottom */}
      <footer className="px-4 py-3 bg-black/70 border-t border-white/10 flex items-center justify-center space-x-2.5 overflow-x-auto no-scrollbar pb-safe">
        {portfolioData.map((thumb, idx) => (
          <button
            key={thumb.id}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={clsx(
              'relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-xs overflow-hidden border-2 transition-all cursor-pointer',
              currentIndex === idx
                ? 'border-teal-400 scale-105 opacity-100'
                : 'border-transparent opacity-40 hover:opacity-75'
            )}
          >
            <img src={thumb.image} alt={thumb.title} className="w-full h-full object-cover" />
            {thumb.category === 'film' && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Film className="w-3.5 h-3.5 text-white/90" />
              </div>
            )}
          </button>
        ))}
      </footer>
    </div>
  );
};

export default LightboxModal;
