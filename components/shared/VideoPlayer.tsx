'use client';

import React from 'react';
import { Film } from 'lucide-react';
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
}) => {
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

  if (src) {
    const isMov = src.toLowerCase().includes('.mov');
    const mimeType = isMov ? 'video/quicktime' : 'video/mp4';
    const cleanPoster = poster && !poster.includes('.mp4') && !poster.includes('.mov') ? poster : undefined;

    return (
      <video
        key={src}
        src={src}
        controls={controls}
        autoPlay={autoPlay}
        playsInline={playsInline}
        poster={cleanPoster}
        className={clsx(
          'max-h-[80vh] max-w-[90vw] rounded-xs border border-white/10 focus:outline-none bg-black',
          className
        )}
      >
        <source src={src} type={mimeType} />
        Your browser does not support HTML5 video playback.
      </video>
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
