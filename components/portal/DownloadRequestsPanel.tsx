'use client';

import React, { useState } from 'react';
import { Download, Image as ImageIcon, PlayCircle, Layers, Loader2, Check, Sparkles, Heart } from 'lucide-react';
import { clsx } from 'clsx';
import { PortalMediaItem } from './PortalLightbox';

export interface ClientDownloadRequest {
  _id: string;
  status: 'queued' | 'processing' | 'ready' | 'expired' | 'failed';
  downloadUrl?: string;
  expiresAt?: string;
  itemCount?: number;
  requestedAt?: string;
  completedAt?: string;
}

interface DownloadRequestsPanelProps {
  requests: ClientDownloadRequest[];
  onRefresh?: () => void;
  isLoading?: boolean;
  onRequestDownload?: () => Promise<void>;
  isRequestingDownload?: boolean;
  totalPhotoCount?: number;
  totalFilmCount?: number;
  photos?: PortalMediaItem[];
  videos?: PortalMediaItem[];
  selectedPhotos?: PortalMediaItem[];
  onDownloadVideos?: () => void;
}

export const DownloadRequestsPanel: React.FC<DownloadRequestsPanelProps> = ({
  requests,
  onRequestDownload,
  isRequestingDownload = false,
  totalPhotoCount = 0,
  totalFilmCount = 0,
  photos = [],
  videos = [],
  selectedPhotos = [],
}) => {
  const [downloadingZipType, setDownloadingZipType] = useState<string | null>(null);
  const [directBatchType, setDirectBatchType] = useState<'photos' | 'videos' | 'everything' | 'album' | null>(null);
  const [directProgress, setDirectProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [directSuccessMessage, setDirectSuccessMessage] = useState<string | null>(null);

  // Filter out any stale mock URLs that might have been saved in MongoDB previously
  const latestReadyRequest = requests.find(
    (r) => r.status === 'ready' && r.downloadUrl && !r.downloadUrl.includes('unsplash.com')
  );

  // Sequential Direct File Download Handler (No ZIP, direct master JPGs / MP4s)
  const handleDownloadDirectBatch = async (
    items: PortalMediaItem[],
    batchType: 'photos' | 'videos' | 'everything' | 'album'
  ) => {
    if (!items || items.length === 0 || directBatchType !== null) return;
    setDirectBatchType(batchType);
    setDirectSuccessMessage(null);
    setDirectProgress({ current: 0, total: items.length });

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setDirectProgress({ current: i + 1, total: items.length });

        const a = document.createElement('a');
        a.href = `/api/portal/media/${item._id}/download`;
        a.setAttribute('download', item.originalFilename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 400ms delay between files prevents browsers from blocking multiple downloads
        if (i < items.length - 1) {
          await new Promise((r) => setTimeout(r, 450));
        }
      }

      const label =
        batchType === 'photos'
          ? 'photographs'
          : batchType === 'videos'
          ? 'videos'
          : batchType === 'album'
          ? 'album photographs'
          : 'media files';

      setDirectSuccessMessage(`Successfully saved all ${items.length} ${label} directly to your device.`);
      setTimeout(() => setDirectSuccessMessage(null), 6000);
    } catch (err) {
      console.error('Direct download error:', err);
    } finally {
      setTimeout(() => {
        setDirectBatchType(null);
      }, 1000);
    }
  };

  // ZIP fallback download handler
  const triggerZipDownload = (type: 'photos' | 'videos' | 'everything', defaultFilename: string) => {
    setDownloadingZipType(type);

    const targetUrl =
      type === 'everything' && latestReadyRequest?.downloadUrl
        ? latestReadyRequest.downloadUrl
        : `/api/portal/downloads/zip?type=${type}`;

    const a = document.createElement('a');
    a.href = targetUrl;
    a.setAttribute('download', defaultFilename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (onRequestDownload && type === 'everything' && !latestReadyRequest) {
      onRequestDownload().catch(() => {});
    }

    setTimeout(() => {
      setDownloadingZipType(null);
    }, 2500);
  };

  const actualPhotoCount = photos.length || totalPhotoCount;
  const actualVideoCount = videos.length || totalFilmCount;

  return (
    <section id="downloads" className="space-y-8 pt-4 scroll-mt-24 text-left animate-in fade-in duration-200">
      {/* Header */}
      <div className="space-y-2 border-b border-[#EAE8DA]/10 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#43B19F]/10 border border-[#43B19F]/30 text-[#43B19F] text-xs font-sans">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Direct Original Master Quality</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#EAE8DA] font-medium tracking-tight">
          Direct Downloads
        </h2>
        <p className="text-sm font-sans text-[#EAE8DA]/65 max-w-2xl leading-relaxed">
          Download your complete wedding films and photographs directly to your phone, tablet, or computer in full original quality. No ZIP extraction or special software required.
        </p>

        {/* Success toast notice */}
        {directSuccessMessage && (
          <div className="pt-2 flex items-center gap-2.5 text-xs font-sans text-[#43B19F] bg-[#43B19F]/10 border border-[#43B19F]/30 rounded-xs p-3">
            <Check className="w-4 h-4 shrink-0" />
            <span>{directSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* 3 Minimal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ================= 1. VIDEOS CARD ================= */}
        <div className="bg-[#171D1C] border border-[#EAE8DA]/10 rounded-[14px] p-6 sm:p-7 flex flex-col justify-between space-y-6 hover:border-[#43B19F]/30 transition-all card-lift">
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-[8px] bg-[#43B19F]/10 border border-[#43B19F]/20 flex items-center justify-center text-[#43B19F]">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-xl text-[#EAE8DA] font-medium">Wedding Films</h3>
              <p className="text-xs sm:text-sm font-sans text-[#EAE8DA]/60 leading-relaxed">
                Download your cinematic 4K wedding films directly as standard MP4 video files ready to play anywhere.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-sans text-[#43B19F]">
              <span>Direct MP4 file</span>
              <span>·</span>
              <span>{actualVideoCount > 0 ? `${actualVideoCount} ${actualVideoCount === 1 ? 'video' : 'videos'}` : 'No videos yet'}</span>
            </div>
          </div>

          <div className="space-y-3">
            {videos.length === 1 ? (
              /* Single video: Direct instant download anchor */
              <a
                href={`/api/portal/media/${videos[0]._id}/download`}
                download={videos[0].originalFilename}
                className="w-full py-2.5 px-4 rounded-[8px] text-xs font-semibold tracking-wide bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0F1413] hover:brightness-105 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.97]"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Download Video (MP4)</span>
              </a>
            ) : videos.length > 1 ? (
              /* Multiple videos: Direct per-video buttons + download all button */
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleDownloadDirectBatch(videos, 'videos')}
                  disabled={directBatchType !== null}
                  className="w-full py-2.5 px-4 rounded-[8px] text-xs font-semibold tracking-wide bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0F1413] hover:brightness-105 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.97] disabled:opacity-50"
                >
                  {directBatchType === 'videos' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F1413]" />
                      <span>Downloading {directProgress.current} of {directProgress.total}...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Download All Videos (MP4)</span>
                    </>
                  )}
                </button>

                <div className="pt-2 space-y-1.5 max-h-36 overflow-y-auto scrollbar-none">
                  {videos.map((vid, idx) => (
                    <div
                      key={vid._id}
                      className="p-2 rounded-[6px] bg-[#121716] border border-white/5 flex items-center justify-between gap-2 text-left"
                    >
                      <span className="text-[11px] text-[#EAE8DA]/80 truncate font-sans">
                        {vid.originalFilename.replace(/\.[^/.]+$/, '') || `Video #${idx + 1}`}
                      </span>
                      <a
                        href={`/api/portal/media/${vid._id}/download`}
                        download={vid.originalFilename}
                        className="px-2 py-1 rounded bg-[#43B19F]/20 hover:bg-[#43B19F] text-[#43B19F] hover:text-[#0F1413] text-[10px] font-semibold tracking-wide transition-colors shrink-0"
                      >
                        MP4
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled
                className="w-full py-2.5 px-4 rounded-[8px] text-xs font-medium border border-white/10 text-[#EAE8DA]/30 cursor-not-allowed text-center"
              >
                No videos uploaded
              </button>
            )}
          </div>
        </div>

        {/* ================= 2. PHOTOS CARD ================= */}
        <div className="bg-[#171D1C] border border-[#EAE8DA]/10 rounded-[14px] p-6 sm:p-7 flex flex-col justify-between space-y-6 hover:border-[#43B19F]/30 transition-all card-lift">
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-[8px] bg-[#43B19F]/10 border border-[#43B19F]/20 flex items-center justify-center text-[#43B19F]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-xl text-[#EAE8DA] font-medium">Photographs</h3>
              <p className="text-xs sm:text-sm font-sans text-[#EAE8DA]/60 leading-relaxed">
                Download your full wedding photo collection directly as original high-resolution JPG images.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-sans text-[#43B19F]">
              <span>Direct JPG files</span>
              <span>·</span>
              <span>{actualPhotoCount} master photographs</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Primary Direct Download Button */}
            <button
              type="button"
              onClick={() => handleDownloadDirectBatch(photos, 'photos')}
              disabled={actualPhotoCount === 0 || directBatchType !== null}
              className={clsx(
                'w-full py-2.5 px-4 rounded-[8px] text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.97]',
                'bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0F1413] hover:brightness-105 shadow-xs disabled:opacity-50'
              )}
            >
              {directBatchType === 'photos' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F1413]" />
                  <span>Downloading {directProgress.current} of {directProgress.total} Photos...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Download Photos Directly (JPG)</span>
                </>
              )}
            </button>

            {/* Live Progress Bar during direct batch photo download */}
            {directBatchType === 'photos' && directProgress.total > 0 && (
              <div className="space-y-1">
                <div className="w-full bg-[#121716] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#43B19F] h-full transition-all duration-300"
                    style={{ width: `${(directProgress.current / directProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#43B19F] font-mono text-center">
                  Saving photo {directProgress.current} of {directProgress.total} to device...
                </p>
              </div>
            )}

            {/* Download selected album photos if any */}
            {selectedPhotos.length > 0 && (
              <button
                type="button"
                onClick={() => handleDownloadDirectBatch(selectedPhotos, 'album')}
                disabled={directBatchType !== null}
                className="w-full py-1.5 px-3 rounded-[6px] border border-[#43B19F]/30 hover:border-[#43B19F] text-[#43B19F] text-[11px] font-sans transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Heart className="w-3 h-3 fill-current" />
                <span>Download {selectedPhotos.length} Album Photos Directly</span>
              </button>
            )}

            {/* Optional ZIP Archive Link for users who specifically want ZIP */}
            <button
              type="button"
              onClick={() => triggerZipDownload('photos', 'wedding_photos.zip')}
              disabled={downloadingZipType === 'photos' || actualPhotoCount === 0}
              className="text-[11px] text-[#EAE8DA]/45 hover:text-[#43B19F] transition-colors cursor-pointer block mx-auto pt-0.5 text-center"
            >
              {downloadingZipType === 'photos' ? 'Preparing ZIP archive...' : 'Prefer a single ZIP archive? Download as ZIP'}
            </button>
          </div>
        </div>

        {/* ================= 3. COMPLETE COLLECTION CARD ================= */}
        <div className="bg-[#171D1C] border border-[#43B19F]/30 rounded-[14px] p-6 sm:p-7 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-lg card-lift">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#43B19F]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="w-11 h-11 rounded-[8px] bg-[#43B19F]/15 border border-[#43B19F]/40 flex items-center justify-center text-[#43B19F]">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-xl text-[#EAE8DA] font-medium">Complete Memories</h3>
              <p className="text-xs sm:text-sm font-sans text-[#EAE8DA]/70 leading-relaxed">
                Download your complete EverLens wedding collection (all photos &amp; films) in original master quality.
              </p>
            </div>
            <span className="inline-block text-[11px] font-sans text-[#43B19F] font-medium">
              Full resolution · All Photos + Films
            </span>
          </div>

          <div className="relative z-10 space-y-3">
            {/* Primary Direct Download Button for Everything */}
            <button
              type="button"
              onClick={() => handleDownloadDirectBatch([...videos, ...photos], 'everything')}
              disabled={(actualPhotoCount === 0 && actualVideoCount === 0) || directBatchType !== null}
              className="w-full py-2.5 px-4 rounded-[8px] text-xs font-semibold tracking-wide bg-gradient-to-b from-[#48C9B0] to-[#36998A] hover:brightness-105 text-[#0F1413] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60 active:scale-[0.97]"
            >
              {directBatchType === 'everything' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F1413]" />
                  <span>Downloading {directProgress.current} of {directProgress.total} files...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#0F1413] stroke-[2.5]" />
                  <span>Download Everything Directly</span>
                </>
              )}
            </button>

            {/* Live Progress Bar for Everything */}
            {directBatchType === 'everything' && directProgress.total > 0 && (
              <div className="space-y-1">
                <div className="w-full bg-[#121716] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#43B19F] h-full transition-all duration-300"
                    style={{ width: `${(directProgress.current / directProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#43B19F] font-mono text-center">
                  Saving file {directProgress.current} of {directProgress.total} directly to device...
                </p>
              </div>
            )}

            {/* Secondary ZIP Option */}
            <button
              type="button"
              onClick={() => triggerZipDownload('everything', 'wedding_collection.zip')}
              disabled={downloadingZipType === 'everything' || isRequestingDownload}
              className="text-[11px] text-[#EAE8DA]/45 hover:text-[#43B19F] transition-colors cursor-pointer block mx-auto pt-0.5 text-center"
            >
              {downloadingZipType === 'everything' || isRequestingDownload
                ? 'Packaging ZIP archive...'
                : 'Prefer an archival package? Download as ZIP'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadRequestsPanel;
