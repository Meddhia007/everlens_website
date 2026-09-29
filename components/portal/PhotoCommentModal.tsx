'use client';

import React, { useState } from 'react';
import { PortalMediaItem } from './PortalLightbox';
import { X, Flag, Check, Loader2, AlertCircle } from 'lucide-react';

interface PhotoCommentModalProps {
  item: PortalMediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PhotoCommentModal: React.FC<PhotoCommentModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setError('Please provide details about the issue or revision needed.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/portal/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaItemId: item._id,
          commentText: commentText.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit feedback.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);
      setIsSubmitting(false);
      setCommentText('');

      if (onSuccess) onSuccess();

      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 2000);
    } catch {
      setError('Network error submitting feedback. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#171D1C] border border-[#EAE8DA]/15 rounded-[14px] p-6 max-w-md w-full shadow-2xl space-y-4 text-left text-[#EAE8DA] animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#EAE8DA]/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-teal/15 border border-teal/30 text-teal flex items-center justify-center">
              <Flag className="w-3.5 h-3.5 text-teal" />
            </div>
            <h3 className="font-serif text-lg text-[#EAE8DA] font-medium">
              Flag Photo Issue
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-[#EAE8DA]/50 hover:text-white rounded-[6px] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail Preview */}
        {item.url && (
          <div className="flex items-center gap-3 p-2 bg-[#0F1413] rounded-[8px] border border-white/[0.06]">
            <img
              src={item.url}
              alt={item.originalFilename}
              className="w-12 h-14 object-cover rounded-[6px] border border-white/10"
            />
            <div className="min-w-0 flex-1 text-xs">
              <div className="font-mono text-[#EAE8DA] truncate">{item.originalFilename}</div>
              <div className="text-[11px] text-[#EAE8DA]/50">Report an issue on this specific photograph</div>
            </div>
          </div>
        )}

        {isSubmitted ? (
          <div className="p-4 bg-teal/15 border border-teal/40 rounded-[8px] text-center space-y-1 text-teal">
            <Check className="w-6 h-6 mx-auto stroke-[2.5]" />
            <div className="font-medium text-xs font-sans">Thank you! Your feedback was received.</div>
            <p className="text-[11px] text-teal/80">Our studio team will review your notes shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#EAE8DA]/80">
                Let us know if something&apos;s not right with this photo
              </label>
              <textarea
                rows={3}
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="e.g. Wrong crop, lighting adjustment requested, skin retouching, color grading..."
                className="w-full bg-[#0F1413] text-[#EAE8DA] placeholder:text-[#EAE8DA]/35 border border-white/15 rounded-[8px] p-3 text-xs focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal font-sans resize-none transition-all"
              />
              <p className="text-[10px] text-[#EAE8DA]/50">
                Note: This flags a production issue to the studio. For album print selection instructions, use the note under selected photos.
              </p>
            </div>

            {error && (
              <div className="p-2.5 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-[6px] flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EAE8DA]/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-2 text-xs font-sans text-[#EAE8DA]/60 hover:text-white rounded-[6px] hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0B0F0E] text-xs font-semibold rounded-[8px] hover:brightness-105 active:scale-[0.97] transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Feedback</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PhotoCommentModal;
