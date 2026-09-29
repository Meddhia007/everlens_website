'use client';

import React from 'react';
import { MediaCategory } from '@/models/MediaItem';

export interface TabItem {
  id: string;
  label: string;
}

interface CategoryTabsProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  counts: Record<string, number>;
  tabs?: TabItem[];
  theme?: 'light' | 'dark';
}

export const PORTAL_TABS: TabItem[] = [
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
  tabs = PORTAL_TABS,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  return (
    <div
      className={`border-b overflow-x-auto scrollbar-none transition-colors ${
        isLight ? 'border-ink/15' : 'border-cream/10'
      }`}
    >
      <nav
        className="flex items-center gap-6 sm:gap-8 min-w-max pb-px"
        aria-label="Wedding Chapters Navigation"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = counts[tab.id] ?? 0;

          // Light theme (Guest Sanctuary View with warm cream background #EAE8DA)
          // Active: Deep ink #131918 font-semibold, teal underline, teal count
          // Inactive: Muted ink text-ink/65 hover:text-ink font-normal, count text-ink/40
          // Dark theme (Client Portal Sanctuary View with obsidian background #0F1413)
          // Active: Cream #EAE8DA font-semibold, teal underline, teal count
          // Inactive: text-cream/50 hover:text-cream font-normal, count text-cream/35
          const tabTextClass = isLight
            ? isActive
              ? 'text-ink font-semibold'
              : 'text-ink/65 hover:text-ink font-normal'
            : isActive
              ? 'text-cream font-semibold'
              : 'text-cream/50 hover:text-cream font-normal';

          const countTextClass = isLight
            ? isActive
              ? 'text-teal font-medium opacity-100'
              : 'text-ink/40 opacity-80 group-hover:text-ink/75 group-hover:opacity-100'
            : isActive
              ? 'text-teal font-medium opacity-100'
              : 'text-cream/35 opacity-75 group-hover:opacity-100';

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`group relative pb-3.5 pt-1 text-xs sm:text-sm font-sans transition-colors cursor-pointer select-none flex items-center whitespace-nowrap ${tabTextClass}`}
            >
              <span>{tab.label}</span>

              {/* Item Count */}
              <span className={`ml-2 text-[11px] font-mono transition-opacity ${countTextClass}`}>
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
