'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface PrintSelectionBarProps {
  count: number;
  maxCap?: number;
  locked: boolean;
  onSubmit: () => Promise<void>;
  isSubmitting?: boolean;
  showCapNotice?: boolean;
  onClearCapNotice?: () => void;
}

// Micro-component for smooth number ticking
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (displayValue === value) return;

    const diff = value - displayValue;
    const step = diff > 0 ? 1 : -1;
    const intervalTime = Math.max(20, Math.min(80, Math.floor(300 / Math.abs(diff))));

    const timer = setInterval(() => {
      setDisplayValue((prev) => {
        if (prev + step === value) {
          clearInterval(timer);
          return value;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [value, displayValue]);

  return (
    <span className="font-mono font-semibold inline-block min-w-[1.25rem] text-center transition-all">
      {displayValue}
    </span>
  );
};

export const PrintSelectionBar: React.FC<PrintSelectionBarProps> = ({
  count,
  maxCap = 50,
  locked,
  onSubmit,
  isSubmitting = false,
  showCapNotice = false,
  onClearCapNotice,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const isAtCap = count >= maxCap;

  if (locked) {
    return null; // When locked, the locked summary view renders instead
  }

  const handleOpenConfirm = () => {
    if (count < 1 || isSubmitting) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      await onSubmit();
      setIsConfirmOpen(false);
    } catch {
      // Handled in parent
    }
  };

  return (
    <>
      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-hero-content">
          <div className="bg-ink-2 border border-cream/15 rounded-xs p-6 sm:p-8 max-w-md w-full shadow-modal space-y-5 text-left text-cream">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-teal/10 text-teal rounded-xs text-xs font-medium">
                <Lock className="w-3.5 h-3.5" />
                <span>Finalize Album Curation</span>
              </div>
              <h3 className="font-serif text-2xl text-cream font-normal">
                Submit {count} {count === 1 ? 'Photograph' : 'Photographs'} for Print?
              </h3>
              <p className="text-xs font-sans text-cream/70 leading-relaxed">
                Once submitted, your curation will be locked so our master print lab can begin color grading, page composition, and handcrafted linen binding.
              </p>
            </div>

            <div className="p-3.5 bg-ink-3 rounded-xs border border-cream/10 text-xs font-sans text-cream/75 space-y-1">
              <p className="font-medium text-cream">What happens next:</p>
              <p className="text-cream/60 leading-relaxed">
                • Your selections and notes will be transferred to our lab print technicians.
                <br />
                • You will be able to review your locked summary anytime in this portal.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-cream/20 text-cream hover:bg-ink-3 rounded-xs text-xs font-medium transition-colors cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 bg-teal hover:bg-cream hover:text-ink text-ink rounded-xs text-xs font-semibold tracking-wide transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit & Lock Selection</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Floating Badge at bottom right */}
      <div className="fixed bottom-6 right-6 sm:right-10 z-40 max-w-sm sm:max-w-md animate-hero-content">
        <div className="bg-terracotta text-cream p-3.5 sm:px-5 sm:py-3.5 rounded-xs shadow-modal border border-[#C57358]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 select-none">
          {/* Status count and cap indication */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-sans">
              <Heart className="w-4 h-4 fill-cream text-cream shrink-0" />
              <span className="font-medium tracking-wide">
                Selected for Print:{' '}
                <AnimatedCounter value={count} />
                {' '}/ {maxCap}
              </span>
            </div>

            {/* Inline message in interface voice when cap reached */}
            {(isAtCap || showCapNotice) && (
              <div className="text-[11px] font-sans text-cream/90 flex items-center gap-1.5 pt-0.5">
                <span>Print limit reached — remove one to add another</span>
              </div>
            )}
          </div>

          {/* Submit button: enabled once count >= 1 */}
          <button
            type="button"
            onClick={handleOpenConfirm}
            disabled={count < 1 || isSubmitting}
            className={clsx(
              'px-4 py-2 rounded-xs text-xs font-sans font-medium transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5',
              count >= 1
                ? 'bg-cream text-terracotta hover:bg-cream-50 active:bg-cream-200 cursor-pointer'
                : 'bg-cream/30 text-cream/60 cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Locking...</span>
              </>
            ) : (
              <span>Submit Print Selection</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default PrintSelectionBar;
