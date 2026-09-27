'use client';

import React from 'react';
import { PortalMediaItem } from './PortalLightbox';
import { Lock, Image as ImageIcon, ArrowRight, Check } from 'lucide-react';
import { formatEditorialDate } from '@/lib/date';

interface LockedPrintSummaryProps {
  selectedItems: PortalMediaItem[];
  submittedAt?: string | null;
  onViewAllGallery?: () => void;
}

export const LockedPrintSummary: React.FC<LockedPrintSummaryProps> = ({
  selectedItems,
  submittedAt,
  onViewAllGallery,
}) => {
  return (
    <div id="prints" className="space-y-8 text-left animate-hero-content scroll-mt-24">
      {/* Redesigned Lock Banner matching Page 6 mockup */}
      <div className="p-6 rounded-xs border border-teal/30 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ background: '#162925' }}>
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-full bg-teal/15 border border-teal/40 flex items-center justify-center text-teal shrink-0 mt-0.5">
            <Lock className="w-4 h-4 text-teal" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg sm:text-xl text-cream font-medium">
              Print selection finalized
            </h3>
            <p className="text-xs sm:text-sm font-sans text-cream/75 leading-relaxed">
              Your print selection has been submitted and locked. Contact us if you need to make changes.
            </p>
            {submittedAt && (
              <p className="text-[11px] font-mono text-cream/50 pt-0.5">
                Submitted on {formatEditorialDate(submittedAt)} · {selectedItems.length} photographs selected
              </p>
            )}
          </div>
        </div>

        {onViewAllGallery && (
          <button
            type="button"
            onClick={onViewAllGallery}
            className="inline-flex items-center gap-1.5 text-xs font-sans text-teal hover:text-cream transition-colors cursor-pointer self-start md:self-center shrink-0"
          >
            <span>Browse full wedding sanctuary</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Summary Grid Header */}
      <div className="flex items-center justify-between border-b border-cream/10 pb-4">
        <div>
          <h2 className="font-serif text-2xl text-cream font-normal">
            Archival album selections
          </h2>
          <p className="text-xs font-sans text-cream/55 mt-0.5">
            Master prints queued for color proofing and handcrafted binding.
          </p>
        </div>
        <div className="text-sm font-mono text-teal font-medium">
          {selectedItems.length} / 50 selected
        </div>
      </div>

      {/* Grid of locked photos with notes */}
      {selectedItems.length === 0 ? (
        <div className="p-12 text-center text-cream/40 text-xs font-sans border border-cream/10 rounded-xs bg-ink-2">
          No prints were selected.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {selectedItems.map((item, index) => (
            <div
              key={item._id}
              className="group bg-ink-2 border border-cream/15 rounded-xs overflow-hidden flex flex-col justify-between"
            >
              {/* Photo Display */}
              <div className="relative aspect-[4/5] bg-gradient-to-br from-[#2b332f] to-[#171d1c] overflow-hidden">
                {item.url ? (
                  <img
                    src={item.url}
                    alt={item.originalFilename}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-cream/30 gap-2">
                    <ImageIcon className="w-8 h-8 text-cream/25" />
                    <span className="text-[10px] font-mono text-cream/40">{item.originalFilename}</span>
                  </div>
                )}

                {/* Dark veil gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                {/* Quiet Filename in corner */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-2xs bg-black/60 backdrop-blur-xs text-cream/80 font-mono text-[10px] truncate max-w-[170px]">
                  {item.originalFilename || `DSC_000${index + 1}.jpg`}
                </div>

                {/* Teal Pin Marker Badge Overlay */}
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-teal flex items-center justify-center text-ink shadow-md" title="Selected for Print">
                  <Check className="w-3.5 h-3.5 text-ink stroke-[3]" />
                </div>

                {/* Index tag */}
                <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-2xs bg-black/60 text-cream/70 font-mono text-[10px] backdrop-blur-xs">
                  #{index + 1}
                </div>
              </div>

              {/* Note Details */}
              <div className="p-4 space-y-2 border-t border-cream/10 bg-ink-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-cream/60">
                  <span className="truncate max-w-[200px]">{item.originalFilename}</span>
                  <span className="capitalize text-teal/80">{item.category.replace(/-/g, ' ')}</span>
                </div>

                {item.printNote ? (
                  <div className="p-2.5 bg-ink-3 rounded-xs border border-cream/10 text-xs font-sans text-cream space-y-1">
                    <span className="text-[10px] font-mono text-teal uppercase tracking-wider block">
                      Retouching Note:
                    </span>
                    <p className="text-xs text-cream/90 italic leading-relaxed">
                      &ldquo;{item.printNote}&rdquo;
                    </p>
                  </div>
                ) : (
                  <div className="text-[11px] font-sans text-cream/40 italic">
                    Standard master lab color grading.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LockedPrintSummary;
