'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { StatusDot } from './StatusDot';
import { GalleryStatus } from '@/models/Gallery';
import { formatEditorialDate } from '@/lib/date';
import {
  Search,
  Plus,
  ArrowUpDown,
  ExternalLink,
  Edit2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/Button';

export interface GalleryListItem {
  _id: string;
  coupleNames: string;
  weddingDate: string;
  clientEmail: string;
  status: GalleryStatus;
  expirationDate?: string;
  guestPin?: string;
  guestLinkToken?: string;
  mediaCount?: number;
  printCount?: number;
  createdAt: string;
}

interface GalleriesTableProps {
  initialGalleries: GalleryListItem[];
}

export const GalleriesTable: React.FC<GalleriesTableProps> = ({
  initialGalleries,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | GalleryStatus>('all');
  const [sortBy, setSortBy] = useState<'weddingDate' | 'coupleNames' | 'createdAt'>('weddingDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Metrics
  const counts = useMemo(() => {
    return {
      total: initialGalleries.length,
      active: initialGalleries.filter((g) => g.status === 'active').length,
      draft: initialGalleries.filter((g) => g.status === 'draft').length,
      archived: initialGalleries.filter((g) => g.status === 'archived').length,
    };
  }, [initialGalleries]);

  // Filtering & Sorting
  const filteredGalleries = useMemo(() => {
    return initialGalleries
      .filter((g) => {
        const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
        const q = search.toLowerCase().trim();
        const matchesQuery =
          !q ||
          g.coupleNames.toLowerCase().includes(q) ||
          g.clientEmail.toLowerCase().includes(q) ||
          (g.guestLinkToken && g.guestLinkToken.toLowerCase().includes(q));

        return matchesStatus && matchesQuery;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'weddingDate') {
          cmp = new Date(a.weddingDate).getTime() - new Date(b.weddingDate).getTime();
        } else if (sortBy === 'createdAt') {
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else {
          cmp = a.coupleNames.localeCompare(b.coupleNames);
        }
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [initialGalleries, search, statusFilter, sortBy, sortOrder]);

  const toggleSort = (column: 'weddingDate' | 'coupleNames' | 'createdAt') => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateStr?: string) => formatEditorialDate(dateStr);

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 text-left border rounded-xs transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-[#182220] border-teal/40 shadow-[0_0_15px_rgba(67,177,159,0.15)]'
              : 'bg-[#131918] border-white/[0.08] hover:bg-[#171E1D] hover:border-white/20'
          }`}
        >
          <span className="text-[11px] font-sans text-[#9EABA2] uppercase tracking-wider block">
            Total Galleries
          </span>
          <span className="text-xl font-mono font-medium text-white block mt-0.5">
            {counts.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`p-3.5 text-left border rounded-xs transition-all cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-teal/15 border-teal/40 shadow-[0_0_15px_rgba(67,177,159,0.2)]'
              : 'bg-[#131918] border-white/[0.08] hover:bg-[#171E1D] hover:border-white/20'
          }`}
        >
          <span className="text-[11px] font-sans text-teal uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
            Active
          </span>
          <span className="text-xl font-mono font-medium text-teal block mt-0.5">
            {counts.active}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('draft')}
          className={`p-3.5 text-left border rounded-xs transition-all cursor-pointer ${
            statusFilter === 'draft'
              ? 'bg-amber-500/15 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
              : 'bg-[#131918] border-white/[0.08] hover:bg-[#171E1D] hover:border-white/20'
          }`}
        >
          <span className="text-[11px] font-sans text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Drafts
          </span>
          <span className="text-xl font-mono font-medium text-amber-200 block mt-0.5">
            {counts.draft}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('archived')}
          className={`p-3.5 text-left border rounded-xs transition-all cursor-pointer ${
            statusFilter === 'archived'
              ? 'bg-white/10 border-white/30'
              : 'bg-[#131918] border-white/[0.08] hover:bg-[#171E1D] hover:border-white/20'
          }`}
        >
          <span className="text-[11px] font-sans text-[#9EABA2] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            Archived
          </span>
          <span className="text-xl font-mono font-medium text-[#9EABA2] block mt-0.5">
            {counts.archived}
          </span>
        </button>
      </div>

      {/* Controls Bar: Search & Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#9EABA2] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by couple, email, or token..."
            className="w-full bg-[#141A19] text-white placeholder:text-[#9EABA2]/50 border border-white/[0.08] rounded-xs pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-teal/60 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="text-xs text-[#9EABA2] hover:text-teal underline px-2 py-1 transition-colors"
            >
              Clear filter
            </button>
          )}

          <Link href="/admin/galleries/new">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-teal hover:bg-teal/90 text-[#0B0F0E] font-medium text-xs transition-all shadow-[0_0_15px_rgba(67,177,159,0.25)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Gallery</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Dense Luxury Table */}
      <div className="bg-[#131918] border border-white/[0.08] rounded-xs overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#0F1413] text-[#9EABA2] font-medium">
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => toggleSort('coupleNames')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <span>Couple Names</span>
                    <ArrowUpDown className="w-3 h-3 text-[#9EABA2]/60" />
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => toggleSort('weddingDate')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <span>Wedding Date</span>
                    <ArrowUpDown className="w-3 h-3 text-[#9EABA2]/60" />
                  </button>
                </th>
                <th className="py-3 px-4">Client Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Expiration</th>
                <th className="py-3 px-4 text-center">Media / Prints</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredGalleries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 px-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-teal/10 border border-teal/20 text-teal flex items-center justify-center mx-auto mb-3">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h3 className="font-serif text-lg text-[#F4F3ED] font-normal mb-1">
                      No client galleries found
                    </h3>
                    <p className="text-xs text-[#9EABA2] max-w-sm mx-auto mb-4 font-sans">
                      {search || statusFilter !== 'all'
                        ? 'No client archives match your current search keywords or status filter.'
                        : 'No private wedding sanctuaries have been created yet. Create a client archive to begin uploading photographs.'}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {search || statusFilter !== 'all' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch('');
                            setStatusFilter('all');
                          }}
                          className="px-3 py-1.5 rounded-xs bg-[#182220] hover:bg-[#1E2B28] text-teal border border-teal/30 text-xs font-mono transition-colors cursor-pointer"
                        >
                          Reset filters
                        </button>
                      ) : (
                        <Link
                          href="/admin/galleries/new"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xs bg-teal hover:bg-teal/90 text-[#0B0F0E] font-sans text-xs font-medium transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create First Gallery</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGalleries.map((gallery) => (
                  <tr
                    key={gallery._id}
                    className="hover:bg-[#18201E] transition-colors group"
                  >
                    {/* Couple Names */}
                    <td className="py-3.5 px-4 font-medium text-white">
                      <Link
                        href={`/admin/galleries/${gallery._id}`}
                        className="hover:text-teal transition-colors underline-offset-2 hover:underline"
                      >
                        {gallery.coupleNames}
                      </Link>
                    </td>

                    {/* Wedding Date */}
                    <td className="py-3.5 px-4 text-[#9EABA2] font-sans whitespace-nowrap">
                      {formatDate(gallery.weddingDate)}
                    </td>

                    {/* Client Email */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#9EABA2] max-w-[200px] truncate">
                      {gallery.clientEmail}
                    </td>

                    {/* Status Dot */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusDot status={gallery.status} />
                    </td>

                    {/* Expiration Date */}
                    <td className="py-3.5 px-4 text-[#9EABA2] font-sans whitespace-nowrap text-[11px]">
                      {gallery.expirationDate ? (
                        <span>{formatDate(gallery.expirationDate)}</span>
                      ) : (
                        <span className="text-[#9EABA2]/40">No expiration</span>
                      )}
                    </td>

                    {/* Media / Prints Count */}
                    <td className="py-3.5 px-4 text-center font-mono text-[11px] text-[#9EABA2] whitespace-nowrap">
                      <span>{gallery.mediaCount || 0} media</span>
                      <span className="mx-1.5 text-white/20">•</span>
                      {gallery.printCount && gallery.printCount > 0 ? (
                        <Link
                          href={`/admin/prints/${gallery._id}`}
                          className="text-teal hover:underline font-medium"
                          title="View submitted print order"
                        >
                          {gallery.printCount}/50 prints
                        </Link>
                      ) : (
                        <span className="text-[#9EABA2]/40">0/50 prints</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/galleries/${gallery._id}`}
                          className="p-1.5 text-[#9EABA2] hover:text-white hover:bg-white/[0.08] rounded-xs transition-colors"
                          title="Edit gallery"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>

                        {gallery.guestLinkToken && (
                          <Link
                            href={`/guest/${gallery.guestLinkToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-[#9EABA2] hover:text-teal hover:bg-teal/10 rounded-xs transition-colors"
                            title="Open guest link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="py-2.5 px-4 bg-[#0F1413] border-t border-white/[0.08] flex items-center justify-between text-[11px] font-sans text-[#9EABA2]">
          <span>Showing {filteredGalleries.length} of {initialGalleries.length} total galleries</span>
          <span className="font-mono text-[10px] text-teal/80">Cloudflare R2 Storage Connected</span>
        </div>
      </div>
    </div>
  );
};

export default GalleriesTable;
