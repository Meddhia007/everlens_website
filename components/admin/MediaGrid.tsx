'use client';

import React, { useState } from 'react';
import { MediaCategory, MediaType } from '@/models/MediaItem';
import {
  Image as ImageIcon,
  Film,
  Trash2,
  ExternalLink,
  Check,
  AlertCircle,
  Filter,
} from 'lucide-react';

export interface MediaItemData {
  _id: string;
  galleryId: string;
  originalFilename: string;
  r2Key: string;
  type: MediaType;
  category: MediaCategory;
  isPublicPortfolio: boolean;
  isPrintSelected?: boolean;
  printNote?: string;
  url?: string | null;
  createdAt?: string;
}

interface MediaGridProps {
  items: MediaItemData[];
  onItemUpdated?: (updatedItem: MediaItemData) => void;
  onItemDeleted?: (deletedId: string) => void;
}

export interface MediaCategoryOption {
  value: string;
  label: string;
}

const DEFAULT_PORTFOLIO_CATEGORIES: MediaCategoryOption[] = [
  { value: 'ceremony', label: 'Ceremony' },
  { value: 'getting-ready', label: 'Getting Ready' },
  { value: 'couples-portraits', label: 'Couples & Portraits' },
  { value: 'reception', label: 'Reception & Party' },
  { value: 'films', label: 'Films & Teasers' },
  { value: 'traditional', label: 'Traditional / Wteya' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'photography', label: 'Photography (General)' },
];

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  onItemUpdated,
  onItemDeleted,
}) => {
  const [categoryOptions, setCategoryOptions] = useState<MediaCategoryOption[]>(DEFAULT_PORTFOLIO_CATEGORIES);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | MediaType>('all');
  const [filterPortfolioOnly, setFilterPortfolioOnly] = useState(false);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<{ id: string; msg: string } | null>(null);

  // Dynamically load all portfolio categories
  React.useEffect(() => {
    fetch('/api/public/work-categories')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          const dynamicOptions: MediaCategoryOption[] = data.categories.map((c: any) => ({
            value: (c.slug || c.name).toLowerCase(),
            label: c.name,
          }));
          setCategoryOptions((prev) => {
            const existingValues = new Set(dynamicOptions.map((d) => d.value.toLowerCase()));
            const remaining = prev.filter((p) => !existingValues.has(p.value.toLowerCase()));
            return [...dynamicOptions, ...remaining];
          });
        }
      })
      .catch(() => {});
  }, []);

  // Filtered items
  const filteredItems = items.filter((item) => {
    if (filterCategory !== 'all' && item.category?.toLowerCase() !== filterCategory.toLowerCase()) return false;
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterPortfolioOnly && !item.isPublicPortfolio) return false;
    return true;
  });

  // Handle Category Change
  const handleCategoryChange = async (itemId: string, newCategory: string) => {
    setSavingId(itemId);
    setErrorId(null);

    try {
      const res = await fetch(`/api/admin/media/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update category');
      }

      if (onItemUpdated) {
        onItemUpdated(data.mediaItem);
      }
    } catch (err: any) {
      setErrorId({ id: itemId, msg: err?.message || 'Update failed' });
    } finally {
      setSavingId(null);
    }
  };

  // Handle Public Portfolio Toggle
  const handlePortfolioToggle = async (itemId: string, checked: boolean) => {
    setSavingId(itemId);
    setErrorId(null);

    try {
      const res = await fetch(`/api/admin/media/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublicPortfolio: checked }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update portfolio flag');
      }

      if (onItemUpdated) {
        onItemUpdated(data.mediaItem);
      }
    } catch (err: any) {
      setErrorId({ id: itemId, msg: err?.message || 'Update failed' });
    } finally {
      setSavingId(null);
    }
  };

  // Handle Delete
  const handleDelete = async (itemId: string, filename: string) => {
    if (!window.confirm(`Delete ${filename}? This removes the file from Cloudflare R2.`)) {
      return;
    }

    setDeletingId(itemId);
    setErrorId(null);

    try {
      const res = await fetch(`/api/admin/media/${itemId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete media item');
      }

      if (onItemDeleted) {
        onItemDeleted(itemId);
      }
    } catch (err: any) {
      setErrorId({ id: itemId, msg: err?.message || 'Delete failed' });
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-sans pb-3 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[#9EABA2] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-teal" />
            <span>Filter:</span>
          </span>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#182220] border border-white/10 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal"
          >
            <option value="all">All Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-[#182220] border border-white/10 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal"
          >
            <option value="all">Photos &amp; Films</option>
            <option value="photo">Photos Only</option>
            <option value="video">Films Only</option>
          </select>

          {/* Portfolio Only Checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer ml-1 select-none text-[#F4F3ED] hover:text-teal transition-colors">
            <input
              type="checkbox"
              checked={filterPortfolioOnly}
              onChange={(e) => setFilterPortfolioOnly(e.target.checked)}
              className="accent-teal rounded-2xs cursor-pointer w-3.5 h-3.5"
            />
            <span>Public Portfolio only</span>
          </label>
        </div>

        <div className="text-[11px] font-mono text-[#9EABA2]">
          Showing {filteredItems.length} of {items.length} items
        </div>
      </div>

      {/* Grid of items */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#131918] border border-white/[0.08] rounded-xs p-12 text-center text-xs font-sans text-[#9EABA2] space-y-1.5 shadow-xl">
          <p className="font-serif text-sm text-[#F4F3ED]">No photographs or films cataloged in this collection yet.</p>
          <p className="text-[11px] text-[#9EABA2]/70">Upload files above to begin curating the client archive.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="bg-[#131918] border border-white/[0.08] rounded-xs overflow-hidden flex flex-col justify-between group transition-colors hover:border-teal/30 shadow-lg"
            >
              {/* Media Thumbnail / Preview */}
              <div className="relative aspect-4/3 bg-[#0B0F0E] overflow-hidden flex items-center justify-center border-b border-white/[0.08]">
                {item.type === 'video' ? (
                  <div className="flex flex-col items-center justify-center text-teal space-y-1">
                    <Film className="w-8 h-8" />
                    <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-teal">
                      Film Master
                    </span>
                  </div>
                ) : item.url ? (
                  <img
                    src={item.url}
                    alt={item.originalFilename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-white/30 space-y-1">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[10px] font-mono">Archived in R2</span>
                  </div>
                )}

                {/* Type Badge */}
                <div className="absolute top-2 left-2">
                  <span className="bg-black/75 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-2xs uppercase tracking-wider border border-white/10">
                    {item.type}
                  </span>
                </div>

                {/* Print Selected Badge (if client marked it) */}
                {item.isPrintSelected && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-amber-400 text-[#0B0F0E] text-[9px] font-mono px-1.5 py-0.5 rounded-2xs font-bold">
                      Print Selected
                    </span>
                  </div>
                )}
              </div>

              {/* Item Details & Controls */}
              <div className="p-3 space-y-2.5 text-xs font-sans">
                {/* Filename Row */}
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className="font-mono text-[11px] text-[#F4F3ED] font-medium truncate flex-1"
                    title={item.originalFilename}
                  >
                    {item.originalFilename}
                  </span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/40 hover:text-white shrink-0 transition-colors"
                      title="Open asset direct link"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Category Dropdown */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-[#9EABA2] uppercase font-mono tracking-wider font-medium">
                    Category
                  </label>
                  <select
                    value={item.category}
                    onChange={(e) =>
                      handleCategoryChange(item._id, e.target.value)
                    }
                    disabled={savingId === item._id}
                    className="w-full bg-[#182220] border border-white/10 rounded-xs px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-teal transition-colors capitalize"
                  >
                    {!categoryOptions.some((c) => c.value.toLowerCase() === item.category?.toLowerCase()) && (
                      <option value={item.category}>
                        {item.category}
                      </option>
                    )}
                    {categoryOptions.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Feature on Public Portfolio Checkbox */}
                <div className="pt-1.5 flex items-center justify-between border-t border-white/[0.06]">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#9EABA2] hover:text-white transition-colors select-none">
                    <input
                      type="checkbox"
                      checked={item.isPublicPortfolio}
                      disabled={savingId === item._id}
                      onChange={(e) => handlePortfolioToggle(item._id, e.target.checked)}
                      className="accent-teal rounded-2xs cursor-pointer w-3.5 h-3.5"
                    />
                    <span>Public Portfolio</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleDelete(item._id, item.originalFilename)}
                    disabled={deletingId === item._id}
                    className="p-1 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xs transition-colors cursor-pointer"
                    title="Delete media from gallery and R2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Error Banner if item action failed */}
                {errorId?.id === item._id && (
                  <p className="text-[10px] text-red-400 font-sans leading-tight">
                    {errorId.msg}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaGrid;
