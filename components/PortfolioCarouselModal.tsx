'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import { clsx } from 'clsx';

export interface PortfolioPostItem {
  _id: string;
  title: string;
  slug?: string;
  location: string;
  year?: string;
  category: string;
  coverImage: string;
  videoUrl?: string;
  media: Array<{
    url: string;
    type: 'photo' | 'video';
    caption?: string;
    aspectRatio?: string;
  }>;
  featured?: boolean;
  order?: number;
}

interface PortfolioCarouselModalProps {
  post: PortfolioPostItem | null;
  onClose: () => void;
}

export const PortfolioCarouselModal: React.FC<PortfolioCarouselModalProps> = ({
  post,
  onClose,
}) => {
  const [slideIndex, setSlideIndex] = useState(0);

  // Touch gesture tracking (swipe left/right for slides, swipe down to close)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  // Reset slide index when post changes
  useEffect(() => {
    setSlideIndex(0);
  }, [post]);

  const isPostVideo =
    Boolean(post?.videoUrl) ||
    post?.category?.toLowerCase() === 'film' ||
    post?.category?.toLowerCase() === 'films' ||
    post?.coverImage?.includes('.mp4') ||
    post?.coverImage?.includes('.mov');

  const slides = post
    ? post.media && post.media.length > 0
      ? post.media
      : [
          {
            url: post.coverImage || post.videoUrl || '',
            type: (isPostVideo ? 'video' : 'photo') as 'photo' | 'video',
            caption: '',
          },
        ]
    : [];

  const currentSlide = slides[slideIndex] || slides[0];

  const handleNext = useCallback(() => {
    if (slides.length <= 1) return;
    setSlideIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    if (slides.length <= 1) return;
    setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!post) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [post, handleNext, handlePrev, onClose]);

  // Lock background body scroll
  useEffect(() => {
    if (post) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [post]);

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (
      touchStartX.current === null ||
      touchEndX.current === null ||
      touchStartY.current === null ||
      touchEndY.current === null
    ) {
      return;
    }

    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;

    // If swipe down > 70px and more vertical than horizontal: close modal
    if (diffY < -70 && Math.abs(diffY) > Math.abs(diffX)) {
      onClose();
    } else if (Math.abs(diffX) > 40) {
      // Horizontal swipe
      if (diffX > 0) handleNext();
      else handlePrev();
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  if (!post || !currentSlide) return null;

  const isVideo =
    currentSlide.type === 'video' ||
    currentSlide.url?.includes('.mp4') ||
    currentSlide.url?.includes('.mov') ||
    currentSlide.url?.includes('.webm') ||
    ((post.category?.toLowerCase() === 'film' || post.category?.toLowerCase() === 'films') && Boolean(post.videoUrl) && slideIndex === 0);

  const videoSource = isVideo
    ? (currentSlide.type === 'video' ? currentSlide.url : post.videoUrl || currentSlide.url)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none p-0 sm:p-4 md:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Centered Media-Only Container */}
      <div
        className="relative max-w-full max-h-full flex items-center justify-center animate-modal-in"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close Button on top-right of media with notch safe-area handling */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-[max(12px,env(safe-area-inset-top))] right-3 sm:-top-11 sm:-right-2 z-30 w-10 h-10 flex items-center justify-center text-white/90 hover:text-white bg-black/70 hover:bg-black/90 rounded-full backdrop-blur-xs transition-colors cursor-pointer shadow-lg active:scale-95"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Carousel Previous Slide Arrow */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:-left-14 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white flex items-center justify-center border border-white/10 transition-all shadow-xl active:scale-95 cursor-pointer backdrop-blur-xs"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Pure Media Display (NO text, NO captions, NO metadata) */}
        <div className="flex items-center justify-center">
          {isVideo ? (
            <div className="max-h-[82vh] sm:max-h-[88vh] max-w-[94vw] sm:max-w-[92vw] flex items-center justify-center">
              <VideoPlayer
                src={videoSource}
                poster={currentSlide.url}
                autoPlay={true}
                controls={true}
                playsInline={true}
                className="max-h-[82vh] sm:max-h-[88vh] max-w-[94vw] sm:max-w-[92vw] object-contain rounded-none sm:rounded-[6px] shadow-2xl"
              />
            </div>
          ) : (
            <img
              key={currentSlide.url}
              src={currentSlide.url}
              alt=""
              className="max-h-[82vh] sm:max-h-[88vh] max-w-[94vw] sm:max-w-[92vw] object-contain rounded-none sm:rounded-[6px] shadow-2xl transition-opacity duration-200 select-none"
              draggable={false}
            />
          )}
        </div>

        {/* Carousel Next Slide Arrow */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:-right-14 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white flex items-center justify-center border border-white/10 transition-all shadow-xl active:scale-95 cursor-pointer backdrop-blur-xs"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Instagram Slide Dots Indicator (Centered at bottom) */}
        {slides.length > 1 && (
          <div
            className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xs shadow-md border border-white/10"
            aria-label="Slide position"
          >
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSlideIndex(idx);
                }}
                className={clsx(
                  'rounded-full transition-all duration-200 cursor-pointer',
                  idx === slideIndex
                    ? 'w-2 h-2 bg-white scale-125 shadow-sm'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                )}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioCarouselModal;
