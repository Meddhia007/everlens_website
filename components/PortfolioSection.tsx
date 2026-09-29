'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Play, Sparkles, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { PortfolioCarouselModal, PortfolioPostItem } from './PortfolioCarouselModal';
import { useLanguage } from '@/context/LanguageContext';

export interface PortfolioItem {
  id: string;
  title: string;
  location: string;
  year?: string;
  category: 'photography' | 'film' | string;
  image: string;
  aspect?: string;
  tag?: string;
  mediaItemId?: string;
  videoUrl?: string;
  gridClass?: string;
  cardClass?: string;
  media?: Array<{
    url: string;
    type: 'photo' | 'video';
    caption?: string;
    aspectRatio?: string;
  }>;
}

export const portfolioData: PortfolioItem[] = [];

interface PortfolioSectionProps {
  onOpenLightbox?: (item: PortfolioItem) => void;
}

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({ onOpenLightbox }) => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<string>('all');
  const [posts, setPosts] = useState<PortfolioPostItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPost, setSelectedPost] = useState<PortfolioPostItem | null>(null);

  // Track expanded state independently per filter tab
  const [expandedTabs, setExpandedTabs] = useState<Record<string, boolean>>({});

  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([
    { id: 'all', name: 'All', slug: 'all' },
    { id: 'photography', name: 'Photography', slug: 'photography' },
    { id: 'films', name: 'Films', slug: 'films' },
  ]);

  // Fetch live portfolio posts from API
  useEffect(() => {
    let isMounted = true;
    fetch('/api/public/portfolio')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.posts && Array.isArray(data.posts)) {
          setPosts(data.posts);
        }
      })
      .catch((err) => {
        console.warn('Failed to load portfolio posts:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch categories from API
  useEffect(() => {
    fetch('/api/public/work-categories')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories([
            { id: 'all', name: 'All', slug: 'all' },
            ...data.categories.map((c: any) => ({
              id: c.id || c.slug,
              name: c.name,
              slug: c.slug,
            })),
          ]);
        }
      })
      .catch((err) => {
        console.warn('Using preset work categories:', err);
      });
  }, []);

  const getCategoryLabel = (slug: string, fallbackName: string) => {
    const s = slug.toLowerCase();
    if (s === 'all') return t.work.tabs.all;
    if (s === 'photography') return t.work.tabs.photography;
    if (s === 'films' || s === 'film') return t.work.tabs.films;
    if (s.includes('traditional') || s.includes('traditionnel')) return t.work.tabs.traditional;
    if (s.includes('editorial') || s.includes('éditorial')) return t.work.tabs.editorial;
    return fallbackName;
  };

  const filteredPosts = posts.filter((post) => {
    if (filter === 'all' || filter === 'All') return true;
    const itemCat = (post.category || '').toLowerCase().trim().replace(/[\s_]+/g, '-');
    const activeFilter = filter.toLowerCase().trim().replace(/[\s_]+/g, '-');

    if (activeFilter === 'photography' || activeFilter === 'photo') {
      return itemCat === 'photography' || itemCat === 'photo' || itemCat === 'photos';
    }
    if (activeFilter === 'films' || activeFilter === 'film') {
      return (
        itemCat === 'film' ||
        itemCat === 'films' ||
        itemCat === 'video' ||
        itemCat === 'videos' ||
        Boolean(post.videoUrl) ||
        post.media?.some((m) => m.type === 'video')
      );
    }
    if (activeFilter === 'traditional' || activeFilter === 'traditionnel') {
      return itemCat === 'traditional' || itemCat === 'traditionnel';
    }
    if (activeFilter === 'editorial') {
      return itemCat === 'editorial' || itemCat === 'éditorial';
    }

    return itemCat === activeFilter;
  });

  const activeTabKey = filter.toLowerCase();
  const isExpanded = !!expandedTabs[activeTabKey];

  const handleCardClick = (post: PortfolioPostItem) => {
    setSelectedPost(post);
  };

  const handleExpandTab = () => {
    setExpandedTabs((prev) => ({ ...prev, [activeTabKey]: true }));
  };

  return (
    <section id="work" className="section-pad relative">
      {/* Anchor alias for #portfolio */}
      <span id="portfolio" className="absolute -top-24 block pointer-events-none" />
      {/* Section Head with Filter Tabs */}
      <div className="p-head">
        <h2>{t.work.title}</h2>
        <div className="p-tabs" aria-label="Portfolio Category Filters">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilter(cat.slug)}
              className={`p-tab ${filter.toLowerCase() === cat.slug.toLowerCase() ? 'active' : ''}`}
            >
              {getCategoryLabel(cat.slug, cat.name)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Content or Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-[2px] sm:gap-[3px]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] bg-[#131918]/80 animate-pulse rounded-[2px]"
            />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-20 px-6 text-center border border-white/10 rounded-[14px] bg-[#131918]/60 max-w-2xl mx-auto my-8 backdrop-blur-xs">
          <div className="w-12 h-12 rounded-full bg-[#43B19F]/10 border border-[#43B19F]/30 flex items-center justify-center mx-auto mb-4 text-[#43B19F]">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl sm:text-2xl text-cream font-medium tracking-tight">
            {t.work.empty_title}
          </h3>
          <p className="text-xs sm:text-sm text-cream/60 mt-2 font-sans max-w-md mx-auto leading-relaxed">
            {t.work.empty_desc}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Instagram Profile Grid: 3 cols mobile & tablet, 4 cols desktop, 2-3px gaps, 4:5 portrait aspect */}
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-[2px] sm:gap-[3px]">
            {filteredPosts.map((post, index) => {
              const isBlurred = !isExpanded && index >= 8;
              const isVideo =
                post.category?.toLowerCase() === 'film' ||
                post.category?.toLowerCase() === 'films' ||
                post.category?.toLowerCase() === 'video' ||
                !!post.videoUrl ||
                post.coverImage?.includes('.mp4') ||
                post.coverImage?.includes('.mov') ||
                post.coverImage?.includes('.webm') ||
                post.media?.some((m) => m.type === 'video');

              const mediaCount = post.media?.length || 1;
              const isCarousel = !isVideo && mediaCount > 1;

              const mediaUrl = post.coverImage || post.media?.[0]?.url || post.videoUrl || '';
              const isMediaVideo =
                mediaUrl.includes('.mp4') ||
                mediaUrl.includes('.mov') ||
                mediaUrl.includes('.webm') ||
                (isVideo && !post.coverImage);

              return (
                <div
                  key={post._id}
                  onClick={() => {
                    if (isBlurred) {
                      handleExpandTab();
                    } else {
                      handleCardClick(post);
                    }
                  }}
                  className={clsx(
                    'relative aspect-[4/5] overflow-hidden bg-[#131918] group select-none cursor-pointer',
                    isBlurred && 'cursor-pointer'
                  )}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (isBlurred) handleExpandTab();
                      else handleCardClick(post);
                    }
                  }}
                  aria-label={post.title}
                >
                  {/* Portrait Video or Image with object-cover */}
                  {isMediaVideo ? (
                    <video
                      src={mediaUrl}
                      muted
                      autoPlay
                      loop
                      playsInline
                      preload="metadata"
                      className={clsx(
                        'w-full h-full object-cover transition-all duration-500 pointer-events-none',
                        isBlurred
                          ? 'blur-[10px] scale-110 opacity-35 brightness-75'
                          : 'group-hover:scale-105'
                      )}
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 33vw, 25vw"
                      className={clsx(
                        'w-full h-full object-cover transition-all duration-500',
                        isBlurred
                          ? 'blur-[10px] scale-110 opacity-35 brightness-75'
                          : 'group-hover:scale-105'
                      )}
                    />
                  )}

                  {/* Dark subtle hover tint on unblurred items */}
                  {!isBlurred && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 pointer-events-none" />
                  )}

                  {/* Top-Right Instagram Corner Indicator */}
                  {!isBlurred && (
                    <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-10 pointer-events-none">
                      {isVideo ? (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white shadow-md">
                          <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white ml-0.5 text-white" />
                        </div>
                      ) : isCarousel ? (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white shadow-md">
                          <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Centered Expand Affordance on Blurred Section */}
          {!isExpanded && filteredPosts.length > 8 && (
            <div
              onClick={handleExpandTab}
              className="absolute inset-x-0 bottom-0 top-[50%] sm:top-[55%] flex flex-col items-center justify-center bg-gradient-to-t from-[#0B0F0E] via-[#0B0F0E]/80 to-transparent cursor-pointer group z-20"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpandTab();
                }}
                className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-[#131918]/95 hover:bg-[#1A2321] text-cream border border-teal/40 hover:border-teal backdrop-blur-md shadow-2xl text-xs sm:text-sm font-sans font-medium tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>+{filteredPosts.length - 8} {t.work.more_moments}</span>
                <ChevronDown className="w-4 h-4 text-teal transition-transform duration-300 group-hover:translate-y-0.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Commission Inquiry Link */}
      <a href="#contact" className="more-link">
        {t.work.inquire_link} <span className="arrow">→</span>
      </a>

      {/* Instagram-Style Media-Only Lightbox Modal */}
      <PortfolioCarouselModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </section>
  );
};

export default PortfolioSection;
