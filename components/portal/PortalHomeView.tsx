'use client';

import React from 'react';
import { Image as ImageIcon, PlayCircle, BookOpen, ArrowRight } from 'lucide-react';
import { formatEditorialDate } from '@/lib/date';

interface PortalHomeViewProps {
  coupleNames: string;
  weddingDate?: string;
  heroImageUrl?: string | null;
  photoCount: number;
  videoCount: number;
  albumCount: number;
  maxAlbumCap?: number;
  onViewPhotos: () => void;
  onWatchVideos: () => void;
  onViewAlbum: () => void;
}

export const PortalHomeView: React.FC<PortalHomeViewProps> = ({
  coupleNames,
  weddingDate,
  heroImageUrl,
  photoCount,
  videoCount,
  albumCount,
  maxAlbumCap = 40,
  onViewPhotos,
  onWatchVideos,
  onViewAlbum,
}) => {
  const fallbackHero =
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80';
  const displayCover = heroImageUrl || fallbackHero;
  const formattedDate = weddingDate ? formatEditorialDate(weddingDate) : '12 May 2024';

  return (
    <div className="space-y-12 animate-hero-content text-left">
      {/* 1. Cinematic Hero Section */}
      <div className="relative rounded-xs overflow-hidden min-h-[460px] sm:min-h-[520px] lg:min-h-[560px] flex items-end p-6 sm:p-10 lg:p-14 border border-[#EAE8DA]/10 shadow-2xl">
        {/* Background Image */}
        <img
          src={displayCover}
          alt={coupleNames}
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none brightness-90"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/portfolio/images/ayoub-dorsaf-golden.jpg';
          }}
        />

        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1413] via-[#0F1413]/60 to-black/30 pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 space-y-4 max-w-2xl">
          <p className="text-xs sm:text-sm font-sans tracking-[0.2em] uppercase text-[#43B19F] font-medium">
            {formattedDate}
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#EAE8DA] font-medium tracking-tight leading-[1.08]">
            {coupleNames}
          </h1>

          <p className="font-serif italic text-base sm:text-lg text-[#EAE8DA]/85 pt-1">
            &ldquo;Your wedding memories, beautifully preserved.&rdquo;
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onViewPhotos}
              className="px-7 py-3 bg-[#43B19F] hover:bg-[#EAE8DA] text-[#0F1413] font-semibold text-xs sm:text-sm tracking-wide rounded-xs transition-colors cursor-pointer shadow-md select-none"
            >
              View Photos
            </button>

            {videoCount > 0 && (
              <button
                type="button"
                onClick={onWatchVideos}
                className="px-7 py-3 border border-[#EAE8DA]/30 hover:border-[#43B19F] hover:text-[#43B19F] bg-black/30 backdrop-blur-xs text-[#EAE8DA] font-medium text-xs sm:text-sm tracking-wide rounded-xs transition-colors cursor-pointer select-none"
              >
                Watch Videos
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Three Clean Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Photos Card */}
        <div
          onClick={onViewPhotos}
          className="group bg-[#171D1C] border border-[#EAE8DA]/10 hover:border-[#43B19F]/40 rounded-xs p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all duration-300 cursor-pointer shadow-sm"
        >
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-full bg-[#43B19F]/10 border border-[#43B19F]/20 flex items-center justify-center text-[#43B19F] group-hover:scale-105 transition-transform">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-xl sm:text-2xl text-[#EAE8DA] font-medium">Photos</h3>
              <p className="text-sm font-sans text-[#43B19F] font-medium">
                {photoCount} {photoCount === 1 ? 'Photograph' : 'Photographs'}
              </p>
              <p className="text-xs sm:text-sm font-sans text-[#EAE8DA]/60 leading-relaxed pt-1">
                Your complete wedding day captured in timeless editorial photographs.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-1.5 text-xs font-sans text-[#EAE8DA]/70 group-hover:text-[#43B19F] transition-colors">
            <span>Open Gallery</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Videos Card */}
        <div
          onClick={videoCount > 0 ? onWatchVideos : undefined}
          className={`group bg-[#171D1C] border border-[#EAE8DA]/10 rounded-xs p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all duration-300 shadow-sm ${
            videoCount > 0 ? 'hover:border-[#43B19F]/40 cursor-pointer' : 'opacity-85'
          }`}
        >
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-full bg-[#43B19F]/10 border border-[#43B19F]/20 flex items-center justify-center text-[#43B19F] group-hover:scale-105 transition-transform">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-xl sm:text-2xl text-[#EAE8DA] font-medium">Videos</h3>
              <p className="text-sm font-sans text-[#43B19F] font-medium">
                {videoCount} {videoCount === 1 ? 'Video' : 'Videos'}
              </p>
              <p className="text-xs sm:text-sm font-sans text-[#EAE8DA]/60 leading-relaxed pt-1">
                {videoCount > 0
                  ? 'Cinematic moments, wedding film highlights, and vows in motion.'
                  : 'Your wedding videos will appear here when they are ready.'}
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-1.5 text-xs font-sans text-[#EAE8DA]/70 group-hover:text-[#43B19F] transition-colors">
            <span>{videoCount > 0 ? 'Watch Videos' : 'Coming Soon'}</span>
            {videoCount > 0 && (
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            )}
          </div>
        </div>

        {/* Album Card */}
        <div
          onClick={onViewAlbum}
          className="group bg-[#171D1C] border border-[#EAE8DA]/10 hover:border-[#43B19F]/40 rounded-xs p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all duration-300 cursor-pointer shadow-sm"
        >
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-full bg-[#43B19F]/10 border border-[#43B19F]/20 flex items-center justify-center text-[#43B19F] group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-xl sm:text-2xl text-[#EAE8DA] font-medium">Album</h3>
              <p className="text-sm font-sans text-[#43B19F] font-medium">
                {albumCount} / {maxAlbumCap} Selected
              </p>
              <p className="text-xs sm:text-sm font-sans text-[#EAE8DA]/60 leading-relaxed pt-1">
                Curate your favorite photographs for your handcrafted wedding album.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-1.5 text-xs font-sans text-[#EAE8DA]/70 group-hover:text-[#43B19F] transition-colors">
            <span>View Album</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalHomeView;
