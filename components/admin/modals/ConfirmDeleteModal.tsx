'use client';

import React, { useEffect, useCallback } from 'react';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDeleting = false,
  onConfirm,
  onCancel,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    },
    [isOpen, isDeleting, onCancel]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none"
      onClick={() => {
        if (!isDeleting) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div
        className="bg-[#131918] border border-white/10 rounded-[14px] p-6 max-w-md w-full shadow-2xl space-y-5 text-left text-[#F4F3ED] animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>

          <div className="space-y-1 flex-1">
            <h3 id="confirm-delete-title" className="font-serif text-lg text-white font-medium">
              {title}
            </h3>
            <p className="text-xs text-[#9EABA2] font-sans leading-relaxed">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="text-[#9EABA2] hover:text-white p-1 rounded-[8px] hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-sans text-[#9EABA2] hover:text-white hover:bg-white/[0.04] border border-white/10 rounded-[8px] transition-all active:scale-[0.97] cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-sans font-medium rounded-[8px] transition-all shadow-sm active:scale-[0.97] cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
