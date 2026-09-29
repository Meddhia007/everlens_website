'use client';

import React from 'react';
import { Image as ImageIcon, PlayCircle, BookOpen, ArrowRight, Check } from 'lucide-react';
import { formatEditorialDate } from '@/lib/date';

export type ProductionStage =
  | 'files_uploaded'
  | 'editing_photos'
  | 'photos_ready'
  | 'editing_film'
  | 'film_ready'
  | 'album_production'
  | 'delivered';

interface StageDefinition {
  key: ProductionStage;
  label: string;
  description: string;
}

const PRODUCTION_STAGES: StageDefinition[] = [
  {
    key: 'files_uploaded',
    label: 'Files Uploaded',
    description: 'All raw photos and footage safely backed up in the studio.',
  },
  {
    key: 'editing_photos',
    label: 'Editing your photos',
    description: 'Color grading, editorial curation, and artistic retouches underway.',
  },
  {
    key: 'photos_ready',
    label: 'Photos Ready',
    description: 'Your complete photo collection is polished and ready to view.',
  },
  {
    key: 'editing_film',
    label: 'Editing your film',
    description: 'Cinematic storytelling, sound design, and color grading in progress.',
  },
  {
    key: 'film_ready',
    label: 'Film Ready',
    description: 'Cinematic teaser, highlight film, and feature film completed.',
  },
  {
    key: 'album_production',
    label: 'Album in Production',
    description: 'Layout printing, handcrafted binding, and archival cover embossing.',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'All final media, films, and physical albums fully delivered.',
  },
];

interface PortalHomeViewProps {
  coupleNames: string;
  weddingDate?: string;
  heroImageUrl?: string | null;
  photoCount: number;
  videoCount: number;
  albumCount: number;
  maxAlbumCap?: number;
  productionStage?: ProductionStage;
  stageHistory?: Array<{ stage: string; reachedAt: string }>;
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
  maxAlbumCap = 50,
  productionStage = 'files_uploaded',
  stageHistory = [],
  onViewPhotos,
  onWatchVideos,
  onViewAlbum,
}) => {
  const fallbackHero =
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80';
  const displayCover = heroImageUrl || fallbackHero;
  const formattedDate = weddingDate ? formatEditorialDate(weddingDate) : '12 May 2024';

  const currentStageIndex = Math.max(
    0,
    PRODUCTION_STAGES.findIndex((s) => s.key === productionStage)
  );

  const historyMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    (stageHistory || []).forEach((h) => {
      map[h.stage] = h.reachedAt;
    });
    return map;
  }, [stageHistory]);

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

      {/* 2. Production Status Tracker */}
      <div className="bg-[#171D1C] border border-[#EAE8DA]/10 rounded-xs p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE8DA]/10 pb-5">
          <div className="space-y-1">
            <p className="text-[11px] font-sans tracking-[0.2em] uppercase text-[#43B19F] font-semibold">
              Production Timeline
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#EAE8DA] font-medium tracking-tight">
              {PRODUCTION_STAGES[currentStageIndex]?.label || 'In Production'}
            </h2>
            <p className="text-xs sm:text-sm font-sans text-[#EAE8DA]/65">
              {PRODUCTION_STAGES[currentStageIndex]?.description}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1D2422] border border-[#43B19F]/30 text-xs font-sans text-[#EAE8DA] self-start sm:self-auto shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#43B19F] animate-pulse" />
            <span className="text-[#EAE8DA]/60">Stage:</span>
            <span className="font-medium text-[#43B19F]">
              {currentStageIndex + 1} of {PRODUCTION_STAGES.length}
            </span>
          </div>
        </div>

        {/* Stepper Steps (Responsive, horizontal scroll on mobile) */}
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-start min-w-[700px] justify-between relative pt-1">
            {PRODUCTION_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isDelivered = productionStage === 'delivered';
              const isCompleted = isPast || (isDelivered && isCurrent);
              const reachedDate = historyMap[stage.key];

              return (
                <div
                  key={stage.key}
                  className="flex-1 flex flex-col items-center text-center relative px-2 group"
                >
                  {/* Horizontal Line Connector */}
                  {idx < PRODUCTION_STAGES.length - 1 && (
                    <div
                      className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 transition-colors ${
                        idx < currentStageIndex ? 'bg-[#43B19F]' : 'bg-[#EAE8DA]/10'
                      }`}
                    />
                  )}

                  {/* Step Icon / Circle */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                      isCompleted
                        ? 'bg-[#43B19F] text-[#0F1413] shadow-md'
                        : isCurrent
                        ? 'bg-[#171D1C] text-[#43B19F] border-2 border-[#43B19F] ring-4 ring-[#43B19F]/20'
                        : 'bg-[#1D2422] text-[#EAE8DA]/40 border border-[#EAE8DA]/15'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  {/* Label and Timestamp */}
                  <div className="pt-3 space-y-1">
                    <p
                      className={`text-xs font-sans leading-tight transition-colors ${
                        isCurrent
                          ? 'text-[#43B19F] font-semibold'
                          : isCompleted
                          ? 'text-[#EAE8DA] font-medium'
                          : 'text-[#EAE8DA]/40'
                      }`}
                    >
                      {stage.label}
                    </p>
                    {reachedDate && (
                      <p className="text-[10px] font-sans text-[#EAE8DA]/45">
                        {new Date(reachedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Three Clean Summary Cards */}
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
