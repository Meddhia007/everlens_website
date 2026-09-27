'use client';

import React from 'react';
import { PortalMediaItem } from './PortalLightbox';
import { Play, Film, Image as ImageIcon, Download } from 'lucide-react';
import { HeartToggle } from './HeartToggle';

interface EditorialMasonryGridProps {
  items: PortalMediaItem[];
  onItemClick: (index: number) => void;
  chapterLabel: string;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  notes?: Record<string, string>;
  onUpdateNote?: (id: string, note: string) => void;
  locked?: boolean;
  isCapReached?: boolean;
  onCapReachedNotice?: () => void;
  isGuest?: boolean;
}

export const EditorialMasonryGrid: React.FC<EditorialMasonryGridProps> = ({
  items,
  onItemClick,
  chapterLabel,
  selectedIds = new Set(),
  onToggleSelect,
  notes = {},
  onUpdateNote,
  locked = false,
  isCapReached = false,
  onCapReachedNotice,
  isGuest = false,
}) => {
  if (items.length === 0) {
    return (
      <div className="py-20 text-center space-y-2 border border-[#EAE8DA]/10 rounded-[14px] bg-[#171D1C]/60">
        <p className="font-serif text-lg text-[#EAE8DA]/80">
          No photographs in your gallery yet.
        </p>
        <p className="text-xs font-sans text-[#EAE8DA]/45 max-w-sm mx-auto leading-relaxed">
          Your wedding memories will appear here once ready.
        </p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 sm:gap-8 space-y-6 sm:space-y-8">
      {items.map((item, index) => {
        const isSelected = !isGuest && selectedIds.has(item._id);
        const currentNote = notes[item._id] ?? item.printNote ?? '';

        return (
          <div
            key={item._id}
            onClick={() => onItemClick(index)}
            className="break-inside-avoid group cursor-pointer select-none space-y-2.5 pb-2"
          >
            {/* Image Container with natural proportions and quiet hover lift */}
            <div
              className={`relative rounded-[14px] overflow-hidden bg-[#171D1C] card-lift transition-all duration-300 group-hover:brightness-105 ${
                item.type === 'video' ? 'aspect-[16/9]' : ''
              } ${
                isSelected ? 'ring-2 ring-[#43B19F] ring-offset-2 ring-offset-[#0F1413]' : ''
              }`}
            >
              {/* Quick direct download button on top-left of each photo/video */}
              <div className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <a
                  href={`/api/portal/media/${item._id}/download`}
                  download={item.originalFilename}
                  onClick={(e) => e.stopPropagation()}
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xs text-white hover:text-[#43B19F] flex items-center justify-center transition-colors shadow-md cursor-pointer"
                  title={item.type === 'video' ? 'Download Video (MP4)' : 'Download Photo (JPG)'}
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Heart / Select Toggle Overlay on top-right for Photos */}
              {!isGuest && item.type === 'photo' && onToggleSelect && !locked && (
                <div className="absolute top-3 right-3 z-20">
                  <HeartToggle
                    isSelected={isSelected}
                    onToggle={() => onToggleSelect(item._id)}
                    isCapReached={isCapReached}
                    onCapReachedNotice={onCapReachedNotice}
                    disabled={locked}
                  />
                </div>
              )}

              {item.type === 'video' ? (
                /* Film item */
                <div className="w-full h-full bg-[#162925] flex items-center justify-center relative">
                  {item.url ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover opacity-75 pointer-events-none"
                      preload="metadata"
                    />
                  ) : null}

                  {/* Subtle Dark Film Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Quiet Film Play Affordance */}
                  <div className="relative z-10 w-12 h-12 rounded-full bg-[#43B19F] text-[#0F1413] flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105 active:scale-[0.97]">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>

                  {/* Bottom Film Badge */}
                  <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 text-[#EAE8DA]/90 text-[11px] font-sans">
                    <Film className="w-3.5 h-3.5 text-[#43B19F]" />
                    <span className="font-medium">
                      Wedding Video
                    </span>
                  </div>
                </div>
              ) : item.url ? (
                /* Photo thumbnail - Natural Aspect Ratio */
                <img
                  src={item.url || '/portfolio/images/bridal-veil.jpg'}
                  alt="Wedding photograph"
                  loading="lazy"
                  className="w-full h-auto block object-cover rounded-[14px] transition-opacity duration-300"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/portfolio/images/bridal-veil.jpg';
                  }}
                />
              ) : (
                /* Fallback Placeholder */
                <div className="w-full aspect-[4/5] flex flex-col items-center justify-center text-[#EAE8DA]/30 space-y-2 p-4 text-center">
                  <ImageIcon className="w-6 h-6 text-[#EAE8DA]/25" />
                  <span className="text-[11px] font-sans text-[#EAE8DA]/40">
                    Photograph
                  </span>
                </div>
              )}
            </div>

            {/* Optional Print Note Underline Field: Appears ONLY on selected photos */}
            {!isGuest && item.type === 'photo' && isSelected && !locked && onUpdateNote && (
              <div
                className="pt-1 px-1 text-left animate-in fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 shrink-0 font-medium">
                    Note:
                  </span>
                  <input
                    type="text"
                    defaultValue={currentNote}
                    key={currentNote}
                    onBlur={(e) => onUpdateNote(item._id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    placeholder="e.g. Make B&W, Crop tighter..."
                    className="flex-1 bg-transparent border-b border-cream/20 focus:border-amber-400 text-xs py-1 px-0.5 text-cream placeholder:text-cream/35 outline-none transition-colors font-sans"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EditorialMasonryGrid;
