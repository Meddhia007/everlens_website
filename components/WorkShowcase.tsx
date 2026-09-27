'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Play } from 'lucide-react';
import SectionWrapper from '@/components/SectionWrapper';

export interface ShowcaseMediaItem {
  id: string;
  title: string;
  location: string;
  year: string;
  aspectRatio: string;
  imageUrl: string;
  duration?: string;
  category: 'photography' | 'films';
}

/**
 * Editorial Photography Showcase Items
 * Real wedding photography with varied aspect ratios (portrait, landscape, square)
 */
export const photographyItems: ShowcaseMediaItem[] = [
  {
    id: 'photo-1',
    title: 'Sarah & Julian',
    location: 'Lake Como, Italy',
    year: '2025',
    aspectRatio: 'aspect-[3/4]',
    imageUrl:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85',
    category: 'photography',
  },
  {
    id: 'photo-2',
    title: 'Clara & Matthieu',
    location: 'Provence, France',
    year: '2025',
    aspectRatio: 'aspect-[16/10]',
    imageUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=85',
    category: 'photography',
  },
  {
    id: 'photo-3',
    title: 'Elena & Marcus',
    location: 'Ravello, Amalfi Coast',
    year: '2024',
    aspectRatio: 'aspect-[1/1]',
    imageUrl:
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1000&q=85',
    category: 'photography',
  },
  {
    id: 'photo-4',
    title: 'Camille & Antoine',
    location: 'Val d’Orcia, Tuscany',
    year: '2024',
    aspectRatio: 'aspect-[4/5]',
    imageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    category: 'photography',
  },
  {
    id: 'photo-5',
    title: 'Maya & Samuel',
    location: 'Deià, Mallorca',
    year: '2024',
    aspectRatio: 'aspect-[3/2]',
    imageUrl:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1400&q=85',
    category: 'photography',
  },
  {
    id: 'photo-6',
    title: 'Victoria & Alexander',
    location: 'Cotswolds, England',
    year: '2023',
    aspectRatio: 'aspect-[16/9]',
    imageUrl:
      'https://images.unsplash.com/photo-1519228409378-a74d4a148182?auto=format&fit=crop&w=1400&q=85',
    category: 'photography',
  },
  {
    id: 'photo-7',
    title: 'Noor & Tariq',
    location: 'Palmeraie, Marrakech',
    year: '2023',
    aspectRatio: 'aspect-[3/4]',
    imageUrl:
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=85',
    category: 'photography',
  },
];

/**
 * Editorial Wedding Films Showcase Items
 */
export const filmItems: ShowcaseMediaItem[] = [
  {
    id: 'film-1',
    title: 'Inès & Karim',
    location: 'Sidi Bou Said, Tunisia',
    year: '2025',
    aspectRatio: 'aspect-[16/9]',
    imageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
    duration: '04:18',
    category: 'films',
  },
  {
    id: 'film-2',
    title: 'Juliette & Lucas',
    location: 'Biarritz, France',
    year: '2024',
    aspectRatio: 'aspect-[4/3]',
    imageUrl:
      'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1200&q=85',
    duration: '06:45',
    category: 'films',
  },
  {
    id: 'film-3',
    title: 'Olivia & Liam',
    location: 'Isle of Skye, Scotland',
    year: '2024',
    aspectRatio: 'aspect-[16/10]',
    imageUrl:
      'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1400&q=85',
    duration: '08:20',
    category: 'films',
  },
  {
    id: 'film-4',
    title: 'Sofia & Matteo',
    location: 'Florence, Italy',
    year: '2024',
    aspectRatio: 'aspect-[3/4]',
    imageUrl:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=85',
    duration: '05:30',
    category: 'films',
  },
  {
    id: 'film-5',
    title: 'Chloe & Ethan',
    location: 'Santorini, Greece',
    year: '2023',
    aspectRatio: 'aspect-[16/9]',
    imageUrl:
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1600&q=85',
    duration: '07:12',
    category: 'films',
  },
  {
    id: 'film-6',
    title: 'Zara & Daniel',
    location: 'Lake Geneva, Switzerland',
    year: '2023',
    aspectRatio: 'aspect-[3/2]',
    imageUrl:
      'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&w=1400&q=85',
    duration: '09:05',
    category: 'films',
  },
];

export const WorkShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'photography' | 'films'>('photography');
  const [activeLightboxItem, setActiveLightboxItem] = useState<ShowcaseMediaItem | null>(null);

  const currentItems = activeTab === 'photography' ? photographyItems : filmItems;

  const handleTileClick = (item: ShowcaseMediaItem) => {
    if (item.category === 'photography') {
      // Sets up click state for the lightbox (to be connected to full modal in later step)
      setActiveLightboxItem(item);
    }
  };

  return (
    <SectionWrapper background="cream" className="py-20 md:py-32">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14 md:mb-20">
        <div className="space-y-3">
          <h2 className="font-display text-3xl sm:text-4xl md:text-h2 font-normal text-ink leading-tight">
            Selected Commissions
          </h2>
          <p className="font-body text-small text-ink/70 max-w-md">
            Stories photographed on medium format film and digital stills, and cinema reels crafted for intimacy.
          </p>
        </div>

        {/* 
          Two-tab filter: Sentence case, underline indicator for active tab.
          Strictly avoids pill/badge styling.
        */}
        <div className="flex items-center gap-8 border-b border-sage/40 pb-2 self-start md:self-end">
          <button
            type="button"
            onClick={() => setActiveTab('photography')}
            className={clsx(
              'font-body text-body transition-colors relative pb-2 -mb-2.5',
              activeTab === 'photography'
                ? 'text-ink border-b-2 border-ink font-medium'
                : 'text-ink/60 hover:text-ink border-b-2 border-transparent'
            )}
          >
            Photography
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('films')}
            className={clsx(
              'font-body text-body transition-colors relative pb-2 -mb-2.5',
              activeTab === 'films'
                ? 'text-ink border-b-2 border-ink font-medium'
                : 'text-ink/60 hover:text-ink border-b-2 border-transparent'
            )}
          >
            Films
          </button>
        </div>
      </div>

      {/* Lightbox Trigger State Notification */}
      {activeLightboxItem && (
        <div className="mb-8 p-4 bg-cream-deep border border-sage/30 rounded-[3px] flex items-center justify-between text-small text-ink">
          <span>
            Lightbox preview ready for <strong className="font-medium">{activeLightboxItem.title}</strong> ({activeLightboxItem.location}).
          </span>
          <button
            onClick={() => setActiveLightboxItem(null)}
            className="text-small text-ink/70 hover:text-ink underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 
        Masonry-style editorial grid with varied aspect ratios.
        Combines 3/4 portrait, 16/10 landscape, 1/1 square, 4/5 portrait, and 3/2 landscape.
        No uniform square crops.
      */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
        {currentItems.map((item) => {
          const isFilm = item.category === 'films';

          return (
            <article
              key={item.id}
              onClick={() => handleTileClick(item)}
              className={clsx(
                'group break-inside-avoid relative overflow-hidden bg-cream-deep cursor-pointer transition-transform duration-300 rounded-[2px]',
                item.category === 'photography' && activeLightboxItem?.id === item.id
                  ? 'ring-2 ring-terracotta'
                  : ''
              )}
            >
              <div className={clsx('relative w-full overflow-hidden', item.aspectRatio)}>
                <img
                  src={item.imageUrl}
                  alt={`${item.title} wedding editorial in ${item.location}`}
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                  loading="lazy"
                />

                {/* Film Minimal Play Affordance */}
                {isFilm && (
                  <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full bg-cream/95 text-ink flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
                      aria-hidden="true"
                    >
                      <Play className="w-3.5 h-3.5 fill-ink ml-0.5" />
                    </div>
                    {item.duration && (
                      <span className="text-[13px] font-body text-cream bg-ink/70 px-2 py-0.5 rounded-[2px] backdrop-blur-xs">
                        {item.duration}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Editorial Caption */}
              <div className="pt-3.5 pb-2 text-left space-y-1">
                <h3 className="font-display text-h4 text-ink font-normal leading-snug">
                  {item.title}
                </h3>
                <p className="font-body text-small text-ink/70 leading-normal">
                  {item.location}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </SectionWrapper>
  );
};

export default WorkShowcase;
