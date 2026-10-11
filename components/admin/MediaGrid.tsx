'use client';

import React, { useState, useMemo } from 'react';
import { MediaCategory, MediaType } from '@/models/MediaItem';
import { formatCategoryLabel } from '@/lib/categories';
import {
  Image as ImageIcon,
  Film,
  Trash2,
  ExternalLink,
  Download,
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
  thumbnailUrl?: string | null;
  downloadUrl?: string | null;
  createdAt?: string;
}

interface MediaGridProps {
  items: MediaItemData[];
  onItemUpdated?: (updatedItem: MediaItemData) => void;
  onItemDeleted?: (deletedId: string) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  onItemUpdated,
  onItemDeleted,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'photo' | 'video'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPortfolioOnly, setFilterPortfolioOnly] = useState(false);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<{ id: string; msg: string } | null>(null);

  // Compute celebration category choices
  const categoryOptions = useMemo(() => {
    const list: Array<{ slug: string; label: string }> = [
      { slug: 'mariage', label: 'Mariage' },
      { slug: 'wteya', label: 'Wteya' },
      { slug: 'henna-arousa', label: 'Henna Arousa' },
      { slug: 'henna-arous', label: 'Henna Arous' },
      { slug: 'hammem', label: 'Hammem' },
      { slug: 'thour', label: 'Thour' },
      { slug: 'teaser', label: 'Teaser' },
      { slug: 'reels', label: 'Reels' },
      { slug: 'films', label: 'Films' },
      { slug: 'ceremony', label: 'Ceremony' },
      { slug: 'getting-ready', label: 'Getting Ready' },
    ];

    items.forEach((item) => {
      const catSlug = (item.category || '').toLowerCase().trim();
      if (catSlug && !list.some((c) => c.slug === catSlug)) {
        list.push({ slug: catSlug, label: formatCategoryLabel(catSlug) });
      }
    });

    return list;
  }, [items]);

  // Filtered items
  const filteredItems = items.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterPortfolioOnly && !item.isPublicPortfolio) return false;
    if (filterCategory !== 'all') {
      let cat = (item.category || '').toLowerCase().trim();
      if (!cat || cat === 'photography') cat = 'mariage';
      if (cat !== filterCategory) return false;
    }
    return true;
  });

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

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-[#182220] border border-white/10 rounded-xs px-2.5 py-1 text-xs text-white focus:outline-none focus:border-teal cursor-pointer"
          >
            <option value="all">Photos &amp; Videos</option>
            <option value="photo">Photos</option>
            <option value="video">Videos</option>
          </select>

          {/* Category / Celebration Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#182220] border border-white/10 rounded-xs px-2.5 py-1 text-xs text-teal font-medium focus:outline-none focus:border-teal cursor-pointer"
          >
            <option value="all">All Celebrations</option>
            {categoryOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
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
                  item.thumbnailUrl ? (
                    <div className="relative w-full h-full">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.originalFilename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Film className="w-6 h-6 text-teal" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-teal space-y-1">
                      <Film className="w-8 h-8" />
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-teal">
                        Film Master
                      </span>
                    </div>
                  )
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

                {/* Type & Celebration Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                  <span className="bg-black/75 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-2xs uppercase tracking-wider border border-white/10">
                    {item.type}
                  </span>
                  <span className="bg-teal text-[#0B0F0E] text-[9px] font-mono px-1.5 py-0.5 rounded-2xs uppercase tracking-wider font-bold">
                    {formatCategoryLabel(item.category)}
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
                  {(item.downloadUrl || item.url) && (
                    <a
                      href={item.downloadUrl || item.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/40 hover:text-white shrink-0 transition-colors"
                      title="Download full quality master file"
                    >
                      <Download className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Celebration Category Selector Row */}
                <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-white/[0.06] text-[11px]">
                  <span className="text-[#9EABA2]">Celebration:</span>
                  <select
                    value={(item.category || (item.type === 'video' ? 'films' : 'mariage')).toLowerCase().trim()}
                    disabled={savingId === item._id}
                    onChange={(e) => handleCategoryChange(item._id, e.target.value)}
                    className="bg-[#182220] border border-white/10 rounded-xs px-2 py-0.5 text-[11px] text-teal font-medium hover:border-teal/50 focus:outline-none focus:border-teal cursor-pointer"
                  >
                    {categoryOptions.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
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
