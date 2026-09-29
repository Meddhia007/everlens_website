'use client';

import React, { useState } from 'react';
import { Film, Download, AlertTriangle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

export interface VideoPlayerProps {
  src?: string | null;
  poster?: string;
  isLoading?: boolean;
  loadingText?: string;
  emptyText?: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  downloadFilename?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  isLoading = false,
  loadingText = 'Preparing master video stream...',
  emptyText = 'Film preview coming soon',
  className,
  autoPlay = true,
  controls = true,
  playsInline = true,
  downloadFilename,
}) => {
  const [hasError, setHasError] = useState(false);
  const [errorReason, setErrorReason] = useState<{ title: string; hint: string }>({
    title: 'Unable to stream video in browser',
    hint: 'Large master files (e.g. 2GB) or cinema-grade codecs (ProRes, 10-bit color, uncompressed audio) require downloading to play in QuickTime or VLC.',
  });
  const [retryKey, setRetryKey] = useState(0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 p-12 bg-white/5 border border-white/10 rounded-xs animate-pulse">
        <Film className="w-8 h-8 text-teal-300" />
        <span className="text-xs font-mono uppercase tracking-wider text-white/60">
          {loadingText}
        </span>
      </div>
    );
  }

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const mediaError = video.error;

    let title = 'Unable to stream video in browser';
    let hint =
      'Large master files (e.g. 2GB) or cinema-grade codecs (ProRes, 10-bit color, uncompressed audio) cannot be decoded natively by web browsers.';

    if (mediaError) {
      switch (mediaError.code) {
        case 1: // MEDIA_ERR_ABORTED
          title = 'Video playback aborted';
          hint = 'The video stream was interrupted. You can retry or download the master file.';
          break;
        case 2: // MEDIA_ERR_NETWORK
          title = 'Network error streaming large video';
          hint =
            'The video stream timed out while loading the large file. Check your connection or download directly.';
          break;
        case 3: // MEDIA_ERR_DECODE
          title = 'Video codec not supported by browser';
          hint =
            'This video is encoded in a camera-master codec (such as Apple ProRes or 10-bit 4:2:2) that web browsers cannot decode. Please download the file to view in QuickTime Player or VLC.';
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          title = 'Video format or storage not supported';
          hint =
            'Your browser could not open this 2GB video stream. This happens with raw camera exports without web Fast-Start (moov atom), or if Cloudflare R2 CORS rules need configuration.';
          break;
      }
    }

    setHasError(true);
    setErrorReason({ title, hint });
  };

  const handleRetry = () => {
    setHasError(false);
    setRetryKey((prev) => prev + 1);
  };

  if (src) {
    const isMov = src.toLowerCase().includes('.mov');
    const cleanPoster =
      poster && !poster.includes('.mp4') && !poster.includes('.mov') ? poster : undefined;

    if (hasError) {
      return (
        <div className="relative max-w-lg mx-auto p-6 sm:p-8 bg-[#171D1C] border border-[#EAE8DA]/15 rounded-xs text-center space-y-5 shadow-2xl text-[#EAE8DA] animate-hero-content">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6 stroke-[2]" />
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-lg sm:text-xl font-medium text-[#EAE8DA]">
              {errorReason.title}
            </h3>
            <p className="text-xs sm:text-sm font-sans text-[#EAE8DA]/70 leading-relaxed max-w-md mx-auto">
              {errorReason.hint}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={src}
              download={downloadFilename || 'wedding-film.mp4'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#43B19F] hover:bg-[#EAE8DA] text-[#0F1413] rounded-xs text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer select-none"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Download Master Video</span>
            </a>

            <button
              type="button"
              onClick={handleRetry}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[#EAE8DA]/25 hover:border-[#43B19F] hover:text-[#43B19F] rounded-xs text-xs font-medium text-[#EAE8DA] transition-all cursor-pointer select-none"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Playback</span>
            </button>
          </div>

          <p className="text-[11px] font-sans text-[#EAE8DA]/40 pt-1">
            Tip: For smooth web playback, export videos as H.264 MP4 with &ldquo;Web Optimized / Fast Start&rdquo; enabled.
          </p>
        </div>
      );
    }

    return (
      <div className="relative group max-h-[82vh] max-w-[92vw] flex items-center justify-center">
        <video
          key={`${src}-${retryKey}`}
          controls={controls}
          autoPlay={autoPlay}
          muted={autoPlay} // Safari requires muted for autoplay
          playsInline={playsInline}
          preload="metadata"
          poster={cleanPoster}
          onError={handleVideoError}
          className={clsx(
            'max-h-[80vh] max-w-[90vw] rounded-xs border border-white/10 focus:outline-none bg-black shadow-2xl',
            className
          )}
        >
          {/* Provide MP4 and QuickTime sources for broader browser fallback */}
          <source src={src} type={isMov ? 'video/quicktime' : 'video/mp4'} />
          <source src={src} type="video/mp4" />
          Your browser does not support HTML5 video playback.
        </video>

        {/* Floating Quick Download affordance on top-left of video player */}
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <a
            href={src}
            download={downloadFilename || 'wedding-film.mp4'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black text-xs font-sans text-[#EAE8DA] hover:text-[#43B19F] border border-white/20 backdrop-blur-xs shadow-lg transition-all"
            title="Download original master video file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Download Original</span>
          </a>
        </div>
      </div>
    );
  }

  // Quiet empty / placeholder fallback
  return (
    <div className="p-8 sm:p-12 text-center text-white/70 space-y-3 max-w-sm mx-auto">
      <div className="w-12 h-12 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
        <Film className="w-5 h-5 text-teal-300" />
      </div>
      <p className="text-xs font-sans text-white/60 tracking-wide leading-relaxed">
        {emptyText}
      </p>
    </div>
  );
};

export default VideoPlayer;
