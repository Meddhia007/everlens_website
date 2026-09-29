'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Film,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  X,
  FilePlus,
} from 'lucide-react';
import { Button } from '@/components/Button';

export interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'photo' | 'video';
  progress: number;
  status: 'queued' | 'requesting_url' | 'uploading' | 'saving' | 'completed' | 'error';
  errorMessage?: string;
  xhr?: XMLHttpRequest;
}

interface BulkUploaderProps {
  galleryId: string;
  onUploadComplete?: (newMediaItem: any) => void;
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const BulkUploader: React.FC<BulkUploaderProps> = ({
  galleryId,
  onUploadComplete,
}) => {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect type
  const detectMediaType = (file: File): 'photo' | 'video' => {
    if (file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(file.name)) {
      return 'video';
    }
    return 'photo';
  };

  // Perform direct-to-R2 upload using XMLHttpRequest
  const startFileUpload = useCallback(
    async (item: UploadQueueItem) => {
      // 1. Request presigned PUT URL from server
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'requesting_url', progress: 5 } : q))
      );

      let uploadUrl = '';
      let r2Key = '';
      let mediaType: 'photo' | 'video' = item.type;

      try {
        const presignRes = await fetch(`/api/admin/galleries/${galleryId}/media/presigned`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: item.name,
            contentType: item.file.type,
            size: item.size,
          }),
        });

        const presignData = await presignRes.json();

        if (!presignRes.ok) {
          throw new Error(presignData.error || 'Failed to get presigned upload URL from studio server.');
        }

        uploadUrl = presignData.uploadUrl;
        r2Key = presignData.r2Key;
        mediaType = presignData.type;
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'error',
                  progress: 0,
                  errorMessage: err?.message || 'Presign request failed',
                }
              : q
          )
        );
        return;
      }

      // 2. Direct upload to Cloudflare R2 (Next.js server touches 0 bytes)
      const xhr = new XMLHttpRequest();

      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: 'uploading', progress: 10, xhr } : q
        )
      );

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          // Scale progress 10% to 90% during binary transfer
          const percent = 10 + Math.round((event.loaded / event.total) * 80);
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress: percent } : q))
          );
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // 3. Register MediaItem in MongoDB
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: 'saving', progress: 95 } : q))
          );

          try {
            const saveRes = await fetch(`/api/admin/galleries/${galleryId}/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                originalFilename: item.name,
                r2Key,
                type: mediaType,
                category: mediaType === 'video' ? 'films' : 'photography',
                isPublicPortfolio: false,
              }),
            });

            const saveData = await saveRes.json();

            if (!saveRes.ok) {
              throw new Error(saveData.error || 'Failed to register media item in database.');
            }

            setQueue((prev) =>
              prev.map((q) =>
                q.id === item.id
                  ? { ...q, status: 'completed', progress: 100, errorMessage: undefined }
                  : q
              )
            );

            if (onUploadComplete && saveData.mediaItem) {
              onUploadComplete(saveData.mediaItem);
            }
          } catch (dbErr: any) {
            setQueue((prev) =>
              prev.map((q) =>
                q.id === item.id
                  ? {
                      ...q,
                      status: 'error',
                      errorMessage: dbErr?.message || 'Database registration failed',
                    }
                  : q
              )
            );
          }
        } else {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    status: 'error',
                    progress: 0,
                    errorMessage: `R2 upload rejected (HTTP ${xhr.status}). Check R2 CORS / credentials.`,
                  }
                : q
            )
          );
        }
      };

      xhr.onerror = () => {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'error',
                  progress: 0,
                  errorMessage: 'Network error communicating with R2 endpoint. Check bucket CORS.',
                }
              : q
          )
        );
      };

      xhr.onabort = () => {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error', progress: 0, errorMessage: 'Upload cancelled' }
              : q
          )
        );
      };

      xhr.open('PUT', uploadUrl);
      const effectiveContentType =
        item.file.type || (item.type === 'video' ? 'video/mp4' : 'image/jpeg');
      xhr.setRequestHeader('Content-Type', effectiveContentType);
      xhr.send(item.file);
    },
    [galleryId, onUploadComplete]
  );

  // Add files to queue and start uploading
  const handleAddFiles = (files: FileList | File[]) => {
    const newItems: UploadQueueItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      file,
      name: file.name,
      size: file.size,
      type: detectMediaType(file),
      progress: 0,
      status: 'queued',
    }));

    setQueue((prev) => [...newItems, ...prev]);

    // Start uploads concurrently
    newItems.forEach((item) => {
      startFileUpload(item);
    });
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // Individual retry (doesn't block other uploads)
  const handleRetry = (id: string) => {
    const item = queue.find((q) => q.id === id);
    if (!item) return;
    startFileUpload(item);
  };

  // Cancel / remove from queue
  const handleRemove = (id: string) => {
    setQueue((prev) => {
      const target = prev.find((q) => q.id === id);
      if (target?.xhr && target.status === 'uploading') {
        target.xhr.abort();
      }
      return prev.filter((q) => q.id !== id);
    });
  };

  const handleClearCompleted = () => {
    setQueue((prev) => prev.filter((q) => q.status !== 'completed'));
  };

  const activeCount = queue.filter((q) => q.status === 'uploading' || q.status === 'requesting_url').length;
  const completedCount = queue.filter((q) => q.status === 'completed').length;
  const errorCount = queue.filter((q) => q.status === 'error').length;

  return (
    <div className="space-y-4 text-left">
      {/* 1. Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xs p-8 sm:p-10 text-center cursor-pointer transition-all select-none ${
          isDragging
            ? 'border-teal bg-teal/10 shadow-[0_0_20px_rgba(67,177,159,0.15)]'
            : 'border-white/10 hover:border-teal/40 bg-[#131918] hover:bg-[#161E1D]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleAddFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-[#F4F3ED]">
              Drag &amp; drop wedding photos and films here, or <span className="text-teal underline underline-offset-2">browse files</span>
            </p>
            <p className="text-[11px] font-sans text-[#9EABA2]">
              Direct R2 presigned streaming: zero server proxying. Supports RAW photos, high-res JPEGs, and multi-GB 4K videos.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Upload Progress Queue List */}
      {queue.length > 0 && (
        <div className="bg-[#131918] border border-white/[0.08] rounded-xs p-4 sm:p-5 space-y-3 shadow-xl">
          {/* Queue Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 text-xs font-sans">
            <div className="flex items-center gap-3">
              <span className="font-medium text-[#F4F3ED]">
                Upload Queue ({queue.length})
              </span>
              {activeCount > 0 && (
                <span className="text-[11px] text-teal font-mono">
                  {activeCount} uploading...
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-[11px] text-red-400 font-mono">
                  {errorCount} failed
                </span>
              )}
            </div>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleClearCompleted}
                className="text-[11px] text-[#9EABA2] hover:text-white underline cursor-pointer"
              >
                Clear completed ({completedCount})
              </button>
            )}
          </div>

          {/* Queue Items */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {queue.map((item) => (
              <div
                key={item.id}
                className="p-2.5 bg-[#182220] border border-white/10 rounded-xs space-y-1.5 text-xs font-sans"
              >
                {/* File Info Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.type === 'video' ? (
                      <Film className="w-3.5 h-3.5 text-teal shrink-0" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 text-[#9EABA2] shrink-0" />
                    )}
                    <span className="font-mono text-[11px] text-[#F4F3ED] truncate max-w-[240px] sm:max-w-md" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-[10px] text-[#9EABA2]/70 font-mono shrink-0">
                      ({formatBytes(item.size)})
                    </span>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'uploading' && (
                      <span className="text-[11px] font-mono text-teal">
                        {item.progress}%
                      </span>
                    )}

                    {item.status === 'requesting_url' && (
                      <span className="text-[10px] text-[#9EABA2] font-mono">
                        Authorizing...
                      </span>
                    )}

                    {item.status === 'saving' && (
                      <span className="text-[10px] text-teal font-mono">
                        Registering...
                      </span>
                    )}

                    {item.status === 'completed' && (
                      <span className="text-[11px] text-teal flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
                        <span>Ready</span>
                      </span>
                    )}

                    {item.status === 'error' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-red-400 flex items-center gap-1" title={item.errorMessage}>
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                          <span className="hidden sm:inline">Failed</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRetry(item.id)}
                          className="px-1.5 py-0.5 border border-white/10 bg-[#0E1413] text-[10px] rounded-xs hover:border-white/20 flex items-center gap-1 text-[#F4F3ED] cursor-pointer"
                          title="Retry this file"
                        >
                          <RotateCcw className="w-2.5 h-2.5 text-teal" />
                          <span>Retry</span>
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="text-white/40 hover:text-white p-0.5 rounded-xs cursor-pointer"
                      title="Remove from queue"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {item.status !== 'completed' && (
                  <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-1 transition-all duration-150 rounded-full ${
                        item.status === 'error' ? 'bg-red-500' : 'bg-teal'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {/* Error message detail if failed */}
                {item.status === 'error' && item.errorMessage && (
                  <p className="text-[10px] text-red-400 font-sans leading-tight">
                    {item.errorMessage}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUploader;
