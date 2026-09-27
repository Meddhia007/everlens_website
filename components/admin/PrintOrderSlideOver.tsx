'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatEditorialDate } from '@/lib/date';
import {
  X,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Calendar,
  Mail,
  Clock,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export interface SlideOverPhoto {
  _id: string;
  originalFilename: string;
  r2Key: string;
  category: string;
  printNote: string;
  url: string | null;
}

interface PrintOrderSlideOverProps {
  orderId: string | null;
  onClose: () => void;
}

export const PrintOrderSlideOver: React.FC<PrintOrderSlideOverProps> = ({
  orderId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [photos, setPhotos] = useState<SlideOverPhoto[]>([]);
  const [copied, setCopied] = useState(false);

  // Esc key listener
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!orderId) return;
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [orderId, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Fetch order details when orderId changes
  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setPhotos([]);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/prints/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load order');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setOrder(data.order);
          setPhotos(data.photos || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error loading order');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (!orderId) return null;

  const coupleSlug = (order?.coupleNames || 'order')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const handleExportCsv = () => {
    const headers = ['Original Filename', 'Print Note', 'Category'];
    const rows = photos.map((p) => {
      const escape = (val: string) => {
        if (!val) return '""';
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return `"${val}"`;
      };
      return [escape(p.originalFilename), escape(p.printNote), escape(p.category)].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${coupleSlug}_print_selection.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportTxt = () => {
    const txtContent = photos.map((p) => p.originalFilename).join('\n');
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${coupleSlug}_filenames.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyFilenames = () => {
    const text = photos.map((p) => p.originalFilename).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const notesCount = photos.filter((p) => p.printNote && p.printNote.trim().length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Dimmed backdrop - click to close */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <aside
        className="relative z-50 w-full max-w-2xl bg-[#0E1413] border-l border-white/10 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200 text-left text-[#F4F3ED]"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-[#131918] shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-teal">
                  Archival Print Curation
                </span>
              </div>
              <h2 className="font-serif text-2xl text-white font-normal truncate">
                {order ? order.coupleNames : 'Loading Order...'}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#9EABA2] hover:text-white rounded-[8px] hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {order && (
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#9EABA2] mt-3">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#9EABA2]/60" />
                <span>{order.clientEmail}</span>
              </span>
              {order.weddingDate && (
                <>
                  <span className="text-white/20">•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#9EABA2]/60" />
                    <span>{formatEditorialDate(order.weddingDate)}</span>
                  </span>
                </>
              )}
              {order.submittedAt && (
                <>
                  <span className="text-white/20">•</span>
                  <span className="flex items-center gap-1.5 text-teal">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Locked on {formatEditorialDate(order.submittedAt)}</span>
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Drawer Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-24 text-center text-xs font-mono text-[#9EABA2] flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-teal" />
              <span>Loading archival print order...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-[14px] text-xs text-red-300 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Export Toolbar & Metrics */}
              <div className="p-4 bg-[#131918] border border-white/[0.08] rounded-[14px] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-[8px] bg-teal/10 text-teal border border-teal/20 text-xs font-mono font-medium">
                    {photos.length} / 50 Selected
                  </span>
                  {notesCount > 0 && (
                    <span className="px-2.5 py-1 rounded-[8px] bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-medium">
                      {notesCount} {notesCount === 1 ? 'Retouch Note' : 'Retouch Notes'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#182220] hover:bg-[#1E2B28] border border-white/10 text-white text-xs font-mono rounded-[8px] transition-all active:scale-[0.97] cursor-pointer"
                    title="Export CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-teal" />
                    <span>CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportTxt}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#182220] hover:bg-[#1E2B28] border border-white/10 text-white text-xs font-mono rounded-[8px] transition-all active:scale-[0.97] cursor-pointer"
                    title="Export TXT"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>TXT</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyFilenames}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#182220] hover:bg-[#1E2B28] border border-white/10 text-[#9EABA2] hover:text-white text-xs font-mono rounded-[8px] transition-all active:scale-[0.97] cursor-pointer"
                    title="Copy names to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-teal" />
                        <span className="text-teal font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-white/40" />
                        <span>Copy Names</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Working Photo Grid */}
              <div className="space-y-3">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#9EABA2] px-1">
                  Selected Photographs ({photos.length})
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {photos.map((photo, index) => (
                    <div
                      key={photo._id}
                      className="bg-[#131918] border border-white/[0.08] hover:border-teal/30 rounded-[14px] overflow-hidden flex flex-col justify-between transition-colors shadow-md group"
                    >
                      {/* Photo Thumbnail */}
                      <div className="relative aspect-[4/3] bg-[#0A0E0D] overflow-hidden border-b border-white/[0.08]">
                        {photo.url ? (
                          <img
                            src={photo.url}
                            alt={photo.originalFilename}
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white/30 space-y-1">
                            <ImageIcon className="w-6 h-6" />
                            <span className="text-[10px] font-mono text-white/40">Vault Master</span>
                          </div>
                        )}

                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 text-white font-mono text-[10px] rounded-[8px] backdrop-blur-xs border border-white/10">
                          #{index + 1}
                        </div>

                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#131918]/90 text-teal font-mono text-[10px] uppercase rounded-[8px] border border-teal/20 backdrop-blur-xs">
                          {photo.category.replace(/-/g, ' ')}
                        </div>
                      </div>

                      {/* Photo Metadata */}
                      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#9EABA2] block tracking-wider mb-0.5">
                            Camera Original
                          </span>
                          <span className="font-mono text-xs text-[#F4F3ED] font-semibold select-all break-all">
                            {photo.originalFilename}
                          </span>
                        </div>

                        {photo.printNote ? (
                          <div className="p-2.5 bg-amber-500/10 border-l-2 border-amber-400 rounded-[8px] space-y-0.5">
                            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-semibold">
                              Client Retouch Note:
                            </span>
                            <p className="text-xs text-[#F4F3ED] font-sans leading-relaxed">
                              &ldquo;{photo.printNote}&rdquo;
                            </p>
                          </div>
                        ) : (
                          <div className="text-[11px] font-mono text-white/30 italic">
                            No note (standard lab grade)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {order && (
          <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#131918] shrink-0 flex items-center justify-between">
            <Link
              href={`/admin/galleries/${order.galleryId}`}
              className="text-xs font-sans text-teal hover:underline flex items-center gap-1.5"
            >
              <span>Open Gallery Management</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#182220] hover:bg-[#1E2B28] text-xs font-sans text-[#F4F3ED] rounded-[8px] transition-all active:scale-[0.97] cursor-pointer border border-white/10"
            >
              Close
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};

export default PrintOrderSlideOver;
