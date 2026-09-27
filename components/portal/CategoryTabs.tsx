'use client';

import React from 'react';
import { MediaCategory } from '@/models/MediaItem';

export interface TabItem {
  id: MediaCategory;
  label: string;
  count: number;
}

interface CategoryTabsProps {
  activeTab: MediaCategory;
  onSelectTab: (tab: MediaCategory) => void;
  counts: Record<MediaCategory, number>;
}

export const PORTAL_TABS: { id: MediaCategory; label: string }[] = [
  { id: 'getting-ready', label: 'Getting Ready' },
  { id: 'ceremony', label: 'Ceremony' },
  { id: 'couples-portraits', label: 'Couples & Portraits' },
  { id: 'reception', label: 'Reception & Party' },
  { id: 'films', label: 'Films & Teasers' },
];

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeTab,
  onSelectTab,
  counts,
}) => {
  return (
    <div className="border-b border-cream/10 overflow-x-auto scrollbar-none">
      <nav
        className="flex items-center gap-6 sm:gap-8 min-w-max pb-px"
        aria-label="Wedding Chapters Navigation"
      >
        {PORTAL_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = counts[tab.id] || 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`group relative pb-3.5 pt-1 text-xs sm:text-sm font-sans transition-colors cursor-pointer select-none flex items-center whitespace-nowrap ${
                isActive
                  ? 'text-cream font-semibold'
                  : 'text-cream/50 hover:text-cream font-normal'
              }`}
            >
              <span>{tab.label}</span>

              {/* Item Count */}
              <span
                className={`ml-2 text-[11px] font-mono transition-opacity ${
                  isActive ? 'text-teal font-medium opacity-100' : 'text-cream/35 opacity-75 group-hover:opacity-100'
                }`}
              >
                {count}
              </span>

              {/* Underline Active Indicator (Teal underline, no pills) */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal transition-all"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default CategoryTabs;
