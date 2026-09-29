'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Flag,
  CheckCircle2,
  Clock,
  ExternalLink,
  Check,
  RotateCcw,
  Image as ImageIcon,
  MessageSquare,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';
import { formatEditorialDate } from '@/lib/date';

export interface PhotoFeedbackItem {
  _id: string;
  galleryId: string;
  coupleNames: string;
  clientEmail: string;
  weddingDate: string;
  mediaItemId: string;
  originalFilename: string;
  photoUrl: string | null;
  commentText: string;
  submittedAt: string;
  status: 'open' | 'resolved';
}

interface FeedbackManagerProps {
  initialFeedback: PhotoFeedbackItem[];
}

export const FeedbackManager: React.FC<FeedbackManagerProps> = ({ initialFeedback }) => {
  const [feedbackList, setFeedbackList] = useState<PhotoFeedbackItem[]>(initialFeedback);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'open' | 'resolved'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<PhotoFeedbackItem | null>(null);

  const filteredFeedback = useMemo(() => {
    return feedbackList.filter((item) => {
      // Tab filter
      if (filterTab === 'open' && item.status !== 'open') return false;
      if (filterTab === 'resolved' && item.status !== 'resolved') return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.coupleNames.toLowerCase().includes(q) ||
          item.clientEmail.toLowerCase().includes(q) ||
          item.commentText.toLowerCase().includes(q) ||
          item.originalFilename.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [feedbackList, search, filterTab]);

  const openCount = useMemo(() => {
    return feedbackList.filter((f) => f.status === 'open').length;
  }, [feedbackList]);

  const resolvedCount = useMemo(() => {
    return feedbackList.filter((f) => f.status === 'resolved').length;
  }, [feedbackList]);

  const handleToggleStatus = async (item: PhotoFeedbackItem) => {
    const newStatus = item.status === 'open' ? 'resolved' : 'open';
    setUpdatingId(item._id);

    try {
      const res = await fetch(`/api/admin/feedback/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setFeedbackList((prev) =>
          prev.map((f) => (f._id === item._id ? { ...f, status: newStatus } : f))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#131918] p-4 rounded-[14px] border border-white/[0.08] shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by couple, email, or issue note..."
            className="w-full bg-[#182220] text-xs font-sans text-white placeholder:text-white/30 pl-9 pr-3 py-2 border border-white/10 focus:border-teal focus:ring-1 focus:ring-teal focus:outline-none rounded-[8px] transition-all"
          />
        </div>

        {/* Tab Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-[8px] border transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-white/15 border-white/40 text-white font-medium'
                : 'bg-[#182220] border-white/10 text-[#9EABA2] hover:text-white'
            }`}
          >
            All ({feedbackList.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('open')}
            className={`px-3 py-1.5 rounded-[8px] border transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'open'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-medium'
                : 'bg-[#182220] border-white/10 text-amber-400 hover:border-amber-500/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Open ({openCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('resolved')}
            className={`px-3 py-1.5 rounded-[8px] border transition-all cursor-pointer ${
              filterTab === 'resolved'
                ? 'bg-teal/20 border-teal text-teal font-medium'
                : 'bg-[#182220] border-white/10 text-[#9EABA2] hover:text-white'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Feedback Items Table */}
      <div className="bg-[#131918] border border-white/[0.08] rounded-[14px] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-[#0E1413] border-b border-white/[0.08] text-[11px] font-mono uppercase tracking-wider text-[#9EABA2]">
                <th className="py-3.5 px-4 font-medium">Photo Thumbnail</th>
                <th className="py-3.5 px-4 font-medium">Client / Gallery</th>
                <th className="py-3.5 px-4 font-medium">Issue Description</th>
                <th className="py-3.5 px-4 font-medium">Submitted</th>
                <th className="py-3.5 px-4 font-medium text-center">Status</th>
                <th className="py-3.5 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredFeedback.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 px-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-teal/10 border border-teal/20 text-teal flex items-center justify-center mx-auto mb-3">
                      <Flag className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-lg text-[#F4F3ED] font-normal mb-1">
                      {search ? 'No feedback matches your search' : 'No client photo issues reported'}
                    </h3>
                    <p className="text-xs text-[#9EABA2] max-w-sm mx-auto font-sans">
                      When couples flag a photo or report an issue (crop, color grading, retouches), it will appear here immediately.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredFeedback.map((item) => {
                  const isOpen = item.status === 'open';
                  const isBusy = updatingId === item._id;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Thumbnail */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          onClick={() => setPreviewPhoto(item)}
                          className="w-16 h-20 bg-[#182220] rounded-[8px] overflow-hidden border border-white/10 hover:border-teal/50 transition-all cursor-pointer relative group/thumb"
                        >
                          {item.photoUrl ? (
                            <img
                              src={item.photoUrl}
                              alt={item.originalFilename}
                              className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-mono">
                            Zoom
                          </div>
                        </div>
                      </td>

                      {/* Client / Gallery */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <Link
                            href={`/admin/galleries/${item.galleryId}`}
                            className="font-serif text-sm text-[#F4F3ED] hover:text-teal font-medium transition-colors flex items-center gap-1.5"
                          >
                            <span>{item.coupleNames}</span>
                            <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                          </Link>
                          <div className="font-mono text-[11px] text-[#9EABA2]">
                            {item.clientEmail}
                          </div>
                          {item.weddingDate && (
                            <div className="text-[11px] text-[#9EABA2]/70 font-sans">
                              {formatEditorialDate(item.weddingDate)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Issue Description */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="p-3 bg-[#182220] border border-white/[0.08] rounded-[8px] space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#9EABA2]">
                            <MessageSquare className="w-3 h-3 text-teal" />
                            <span className="truncate">{item.originalFilename}</span>
                          </div>
                          <p className="text-xs text-[#EAE8DA] font-sans leading-relaxed whitespace-pre-wrap">
                            {item.commentText}
                          </p>
                        </div>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#9EABA2] font-mono text-[11px]">
                        <div>{new Date(item.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="text-[10px] text-[#9EABA2]/60">
                          {new Date(item.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-mono font-medium ${
                            isOpen
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-teal/10 text-teal border border-teal/25'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOpen ? 'bg-amber-400 animate-pulse' : 'bg-teal'
                            }`}
                          />
                          <span>{isOpen ? 'Open Issue' : 'Resolved'}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleStatus(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-sans font-medium transition-all active:scale-[0.97] cursor-pointer disabled:opacity-50 ${
                            isOpen
                              ? 'bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0B0F0E] hover:brightness-105 shadow-xs'
                              : 'bg-[#182220] border border-white/10 text-[#9EABA2] hover:text-white hover:border-white/20'
                          }`}
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isOpen ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Mark Resolved</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reopen</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Preview Lightbox Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="max-w-3xl w-full bg-[#131918] border border-white/10 rounded-[14px] overflow-hidden shadow-2xl p-6 space-y-4 text-left animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="font-serif text-lg text-white font-normal">
                  {previewPhoto.coupleNames} — {previewPhoto.originalFilename}
                </h3>
                <p className="text-xs text-[#9EABA2] font-sans">
                  Reported on {new Date(previewPhoto.submittedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 text-[#9EABA2] hover:text-white rounded-[8px] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewPhoto.photoUrl && (
              <div className="relative max-h-[60vh] flex items-center justify-center bg-black/40 rounded-[8px] overflow-hidden">
                <img
                  src={previewPhoto.photoUrl}
                  alt={previewPhoto.originalFilename}
                  className="max-h-[60vh] w-auto object-contain rounded-[8px]"
                />
              </div>
            )}

            <div className="p-4 bg-[#182220] rounded-[8px] border border-white/[0.06] space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-teal font-semibold">
                Client Issue Description:
              </span>
              <p className="text-xs text-[#EAE8DA] font-sans whitespace-pre-wrap leading-relaxed">
                {previewPhoto.commentText}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href={`/admin/galleries/${previewPhoto.galleryId}`}
                className="text-xs text-teal hover:underline flex items-center gap-1 font-sans"
              >
                <span>Go to Client Gallery</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  handleToggleStatus(previewPhoto);
                  setPreviewPhoto(null);
                }}
                className="px-4 py-2 bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0B0F0E] font-medium text-xs rounded-[8px] hover:brightness-105 active:scale-[0.97] transition-all cursor-pointer"
              >
                {previewPhoto.status === 'open' ? 'Mark as Resolved' : 'Reopen Issue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManager;
