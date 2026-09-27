'use client';

import React, { useState } from 'react';
import { PortalMediaItem } from './PortalLightbox';
import { BookOpen, Check, X, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

interface PortalAlbumViewProps {
  selectedItems: PortalMediaItem[];
  locked: boolean;
  maxCap?: number;
  onContinueSelecting: () => void;
  onSubmitSelection: () => Promise<void>;
  isSubmitting?: boolean;
  onToggleSelect: (id: string) => void;
  notes: Record<string, string>;
  onUpdateNote: (id: string, note: string) => void;
  onItemClick: (item: PortalMediaItem) => void;
}

export const PortalAlbumView: React.FC<PortalAlbumViewProps> = ({
  selectedItems,
  locked,
  maxCap = 40,
  onContinueSelecting,
  onSubmitSelection,
  isSubmitting = false,
  onToggleSelect,
  notes,
  onUpdateNote,
  onItemClick,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleConfirmSubmit = async () => {
    try {
      await onSubmitSelection();
      setIsConfirmOpen(false);
    } catch {
      // Error handled in parent
    }
  };

  return (
    <div className="space-y-8 text-left animate-hero-content">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#EAE8DA]/10 pb-6">
        <div className="space-y-1.5">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#EAE8DA] font-medium tracking-tight">
            Your Wedding Album
          </h2>
          <p className="text-sm font-sans text-[#43B19F]">
            {selectedItems.length} / {maxCap} photos selected
          </p>
        </div>

        {/* Action buttons if not locked */}
        {!locked && selectedItems.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onContinueSelecting}
              className="px-4 py-2 border border-[#EAE8DA]/25 hover:border-[#43B19F] hover:text-[#43B19F] rounded-[8px] text-xs font-medium text-[#EAE8DA] transition-all cursor-pointer active:scale-[0.97]"
            >
              Continue Selecting
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-b from-[#48C9B0] to-[#36998A] hover:brightness-105 text-[#0F1413] rounded-[8px] text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.97]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Selection</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsConfirmOpen(false);
          }}
        >
          <div className="bg-[#171D1C] border border-[#EAE8DA]/15 rounded-[14px] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-left text-[#EAE8DA] animate-modal-in">
            <div className="space-y-2">
              <h3 className="font-serif text-2xl text-[#EAE8DA] font-medium">
                Submit {selectedItems.length} {selectedItems.length === 1 ? 'Photograph' : 'Photographs'} for Your Album?
              </h3>
              <p className="text-xs sm:text-sm font-sans text-[#EAE8DA]/70 leading-relaxed">
                Your selected photographs will be sent directly to EverLens so we can begin designing and curating your wedding album.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-[#EAE8DA]/20 text-[#EAE8DA] hover:bg-[#1D2422] rounded-[8px] text-xs font-medium transition-all cursor-pointer active:scale-[0.97]"
              >
                Keep Selecting
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 bg-gradient-to-b from-[#48C9B0] to-[#36998A] hover:brightness-105 text-[#0F1413] rounded-[8px] text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.97]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Selection</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOCKED STATE BANNER */}
      {locked && (
        <div className="p-6 rounded-[14px] border border-[#43B19F]/30 bg-[#162925] flex items-start gap-4 shadow-lg animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="w-10 h-10 rounded-full bg-[#43B19F]/20 border border-[#43B19F]/40 flex items-center justify-center text-[#43B19F] shrink-0 mt-0.5 animate-check-in">
            <Check className="w-5 h-5 text-[#43B19F] stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl text-[#EAE8DA] font-medium">
              Your selection is complete ✓
            </h3>
            <p className="text-sm font-sans text-[#EAE8DA]/90 font-medium">
              {selectedItems.length} photographs selected
            </p>
            <p className="text-xs sm:text-sm font-sans text-[#EAE8DA]/70 leading-relaxed pt-1">
              Your selected photographs have been successfully sent to EverLens. If you ever need to adjust your selection, please feel free to contact us.
            </p>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!locked && selectedItems.length === 0 ? (
        <div className="py-20 text-center space-y-4 border border-[#EAE8DA]/10 rounded-[14px] bg-[#171D1C]/60 p-8">
          <div className="w-12 h-12 rounded-full bg-[#43B19F]/10 border border-[#43B19F]/20 flex items-center justify-center text-[#43B19F] mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl text-[#EAE8DA] font-medium">
              No photos selected yet
            </h3>
            <p className="text-xs sm:text-sm font-sans text-[#EAE8DA]/60 max-w-sm mx-auto leading-relaxed">
              Browse through your wedding gallery and click &ldquo;Select for Album&rdquo; on the moments you wish to include in your album.
            </p>
          </div>
          <button
            type="button"
            onClick={onContinueSelecting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-[#48C9B0] to-[#36998A] hover:brightness-105 text-[#0F1413] font-semibold text-xs tracking-wide rounded-[8px] transition-all cursor-pointer active:scale-[0.97]"
          >
            <span>Browse Photos →</span>
          </button>
        </div>
      ) : (
        /* GRID OF SELECTED PHOTOS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {selectedItems.map((item, index) => (
            <div
              key={item._id}
              className="group bg-[#171D1C] border border-[#EAE8DA]/10 rounded-[14px] overflow-hidden flex flex-col justify-between hover:border-[#43B19F]/30 transition-all card-lift"
            >
              {/* Photo Display */}
              <div
                className="relative aspect-[4/5] bg-[#162925] overflow-hidden cursor-pointer"
                onClick={() => onItemClick(item)}
              >
                {item.url ? (
                  <img
                    src={item.url || '/portfolio/images/bridal-veil.jpg'}
                    alt="Selected wedding photograph"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/portfolio/images/bridal-veil.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#EAE8DA]/30">
                    Photograph
                  </div>
                )}

                {/* Subtle dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Badge: Selected Index */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-[8px] bg-black/60 backdrop-blur-xs text-[#EAE8DA]/80 text-[11px] font-sans">
                  Photo #{index + 1}
                </div>

                {/* Remove button if not locked */}
                {!locked && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(item._id);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-[8px] bg-black/60 hover:bg-red-500/80 text-white/80 hover:text-white transition-all cursor-pointer active:scale-[0.95]"
                    title="Remove from album"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Note Details */}
              <div className="p-4 space-y-2 border-t border-[#EAE8DA]/10 bg-[#171D1C]">
                {!locked ? (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-medium block">
                      Note for album designer (optional):
                    </span>
                    <input
                      type="text"
                      defaultValue={notes[item._id] ?? item.printNote ?? ''}
                      key={notes[item._id] ?? item.printNote ?? ''}
                      onBlur={(e) => onUpdateNote(item._id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      placeholder="e.g. Full spread, Black & White, crop tighter..."
                      className="w-full bg-[#121716] border border-[#EAE8DA]/15 focus:border-amber-400 rounded-[8px] text-xs py-1.5 px-2.5 text-[#EAE8DA] placeholder:text-[#EAE8DA]/30 outline-none transition-colors font-sans"
                    />
                  </div>
                ) : (
                  <div>
                    {item.printNote ? (
                      <p className="text-xs font-sans text-amber-300 italic">
                        &ldquo;{item.printNote}&rdquo;
                      </p>
                    ) : (
                      <p className="text-[11px] font-sans text-[#EAE8DA]/40">
                        Included in album design.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Continue button if not locked */}
      {!locked && selectedItems.length > 0 && (
        <div className="pt-4 flex items-center justify-between border-t border-[#EAE8DA]/10">
          <button
            type="button"
            onClick={onContinueSelecting}
            className="inline-flex items-center gap-2 text-xs font-sans text-[#43B19F] hover:text-[#EAE8DA] transition-colors cursor-pointer active:scale-[0.97]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Selecting Photos</span>
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-b from-[#48C9B0] to-[#36998A] hover:brightness-105 text-[#0F1413] rounded-[8px] text-xs font-semibold tracking-wide transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.97]"
          >
            Submit Selection ({selectedItems.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default PortalAlbumView;
