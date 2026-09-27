'use client';

import React from 'react';
import { PortalMediaItem } from './PortalLightbox';
import { Play, PlayCircle, Download } from 'lucide-react';

interface PortalVideosViewProps {
  videos: PortalMediaItem[];
  onPlayVideo: (video: PortalMediaItem, index: number) => void;
  onDownloadVideo?: (video: PortalMediaItem) => void;
}

export const PortalVideosView: React.FC<PortalVideosViewProps> = ({
  videos,
  onPlayVideo,
  onDownloadVideo,
}) => {
  // Helper to format clean display title from filename
  const formatVideoTitle = (filename: string, index: number) => {
    const clean = filename
      .replace(/\.(mp4|mov|m4v|webm)$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    // If generic or raw camera name, give a clean luxury title
    if (/^(dsc|img|clip|video|[0-9]+)/i.test(clean) || !clean) {
      return index === 0 ? 'Wedding Film' : index === 1 ? 'Wedding Teaser' : `Wedding Video #${index + 1}`;
    }
    return clean;
  };

  return (
    <div className="space-y-8 text-left animate-hero-content">
      {/* Header */}
      <div className="space-y-1.5 border-b border-[#EAE8DA]/10 pb-6">
        <h2 className="font-serif text-3xl sm:text-4xl text-[#EAE8DA] font-medium tracking-tight">
          Videos
        </h2>
        <p className="text-sm font-sans text-[#EAE8DA]/60">
          {videos.length} {videos.length === 1 ? 'video' : 'videos'}
        </p>
      </div>

      {/* Videos List / Empty State */}
      {videos.length === 0 ? (
        <div className="py-20 text-center space-y-3 border border-[#EAE8DA]/10 rounded-xs bg-[#171D1C]/60 p-8">
          <div className="w-12 h-12 rounded-full bg-[#43B19F]/10 border border-[#43B19F]/20 flex items-center justify-center text-[#43B19F] mx-auto">
            <PlayCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl text-[#EAE8DA] font-medium">No videos yet</h3>
            <p className="text-xs sm:text-sm font-sans text-[#EAE8DA]/60 max-w-sm mx-auto leading-relaxed">
              Your wedding videos will appear here when they&apos;re ready.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {videos.map((video, index) => {
            const title = formatVideoTitle(video.originalFilename, index);

            return (
              <div
                key={video._id}
                className="group bg-[#171D1C] border border-[#EAE8DA]/10 rounded-xs overflow-hidden flex flex-col justify-between hover:border-[#43B19F]/30 transition-all duration-300 shadow-lg"
              >
                {/* Large Video Frame with Center Play Button */}
                <div
                  onClick={() => onPlayVideo(video, index)}
                  className="relative aspect-[16/9] bg-[#162925] overflow-hidden cursor-pointer flex items-center justify-center"
                >
                  {video.url ? (
                    <video
                      src={video.url}
                      className="w-full h-full object-cover opacity-85 group-hover:scale-102 transition-transform duration-500 pointer-events-none"
                      preload="metadata"
                    />
                  ) : null}

                  {/* Dark Cinematic Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 group-hover:via-black/20 transition-colors pointer-events-none" />

                  {/* Prominent Play Button */}
                  <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#43B19F] text-[#0F1413] flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-[#EAE8DA]">
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
                  </div>

                  {/* Top Badge: 4K / HD Video */}
                  <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[#EAE8DA]/80 text-[10px] uppercase font-sans tracking-widest">
                    Cinematic Video
                  </div>
                </div>

                {/* Video Info Bar */}
                <div className="p-5 flex items-center justify-between border-t border-[#EAE8DA]/10 bg-[#171D1C]">
                  <div>
                    <h3 className="font-serif text-lg sm:text-xl text-[#EAE8DA] font-medium">
                      {title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {onDownloadVideo && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadVideo(video);
                        }}
                        className="p-2 text-[#EAE8DA]/60 hover:text-[#43B19F] hover:bg-white/5 rounded-xs transition-colors cursor-pointer"
                        title="Download Video"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onPlayVideo(video, index)}
                      className="px-4 py-1.5 bg-[#43B19F]/10 hover:bg-[#43B19F] text-[#43B19F] hover:text-[#0F1413] border border-[#43B19F]/30 rounded-xs text-xs font-medium tracking-wide transition-colors cursor-pointer"
                    >
                      Watch
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PortalVideosView;
