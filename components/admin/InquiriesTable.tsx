'use client';

import React, { useState } from 'react';
import { Mail, Phone, Calendar, MapPin, Check, Eye, EyeOff, Search, Inbox } from 'lucide-react';
import { clsx } from 'clsx';

export interface InquiryItem {
  _id: string;
  coupleNames: string;
  email: string;
  phone?: string;
  eventDate?: string;
  venue?: string;
  packageInterest?: string;
  mediaType?: string;
  guestCount?: string;
  notes?: string;
  isRead: boolean;
  submittedAt: string;
}

interface InquiriesTableProps {
  initialInquiries: InquiryItem[];
}

export const InquiriesTable: React.FC<InquiriesTableProps> = ({ initialInquiries }) => {
  const [inquiries, setInquiries] = useState<InquiryItem[]>(initialInquiries);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const toggleReadStatus = async (id: string, currentStatus: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsUpdating(id);

    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !currentStatus }),
      });

      if (res.ok) {
        setInquiries((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, isRead: !currentStatus } : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to update read status:', err);
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    if (filter === 'unread' && inquiry.isRead) return false;
    if (filter === 'read' && !inquiry.isRead) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = inquiry.coupleNames.toLowerCase().includes(query);
      const matchEmail = inquiry.email.toLowerCase().includes(query);
      const matchVenue = inquiry.venue?.toLowerCase().includes(query);
      const matchPackage = inquiry.packageInterest?.toLowerCase().includes(query);
      return matchName || matchEmail || matchVenue || matchPackage;
    }

    return true;
  });

  const unreadCount = inquiries.filter((i) => !i.isRead).length;

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#131918] p-3 sm:p-4 rounded-xs border border-white/[0.08] shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Filter by couple, email, venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#182220] border border-white/10 text-white placeholder:text-white/30 rounded-xs focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['all', 'unread', 'read'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={clsx(
                'px-3 py-1 text-xs font-sans rounded-xs transition-colors capitalize cursor-pointer flex items-center gap-1.5',
                filter === tab
                  ? 'bg-teal text-[#0B0F0E] font-semibold shadow-xs'
                  : 'text-[#9EABA2] hover:text-white hover:bg-white/5'
              )}
            >
              <span>{tab}</span>
              {tab === 'unread' && unreadCount > 0 && (
                <span
                  className={clsx(
                    'px-1.5 py-0.2 rounded-2xs text-[10px] font-mono',
                    filter === tab
                      ? 'bg-[#0B0F0E]/20 text-[#0B0F0E] font-bold'
                      : 'bg-teal/20 text-teal border border-teal/30'
                  )}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries List / Table */}
      <div className="border border-white/[0.08] bg-[#131918] rounded-xs overflow-hidden shadow-xl">
        {filteredInquiries.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-teal/10 border border-teal/20 text-teal flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg text-[#F4F3ED] font-normal mb-1">
              No inquiries found
            </h3>
            <p className="text-xs text-[#9EABA2] max-w-sm mx-auto mb-4 font-sans">
              {searchQuery || filter !== 'all'
                ? 'No client inquiries match your active search query or status filter.'
                : 'Your inquiry inbox is currently empty. Leads submitted through the contact page will appear here automatically.'}
            </p>
            {(searchQuery || filter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#182220] hover:bg-[#1E2B28] text-teal border border-teal/30 text-xs font-mono transition-colors cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filteredInquiries.map((inquiry) => {
              const isExpanded = expandedId === inquiry._id;
              const formattedDate = new Intl.DateTimeFormat('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(inquiry.submittedAt));

              return (
                <div
                  key={inquiry._id}
                  className={clsx(
                    'transition-colors',
                    inquiry.isRead
                      ? 'bg-[#131918] hover:bg-[#18201E]'
                      : 'bg-[#161F1D] border-l-2 border-teal hover:bg-[#1a2522]'
                  )}
                >
                  {/* Summary Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : inquiry._id)}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Unread indicator dot */}
                      <span
                        className={clsx(
                          'w-2 h-2 rounded-full mt-1.5 sm:mt-0 flex-shrink-0',
                          inquiry.isRead ? 'bg-transparent border border-white/20' : 'bg-teal shadow-[0_0_8px_rgba(67,177,159,0.7)]'
                        )}
                        title={inquiry.isRead ? 'Read' : 'Unread Lead'}
                      />

                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-serif text-sm font-medium text-[#F4F3ED]">
                            {inquiry.coupleNames}
                          </h3>
                          {!inquiry.isRead && (
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-teal font-mono bg-teal/10 border border-teal/20 px-2 py-0.2 rounded-2xs">
                              New Lead
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#9EABA2] font-sans mt-0.5">
                          <span>{inquiry.email}</span>
                          {inquiry.eventDate && (
                            <>
                              <span className="text-white/20">•</span>
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                <Calendar className="w-3 h-3 text-teal" />
                                {inquiry.eventDate}
                              </span>
                            </>
                          )}
                          {inquiry.venue && (
                            <>
                              <span className="text-white/20">•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-teal" />
                                {inquiry.venue}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Package & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                      <div className="text-left sm:text-right">
                        <span className="text-[#F4F3ED] font-medium block">
                          {inquiry.packageInterest || 'Standard Commission'}
                        </span>
                        <span className="text-[11px] text-[#9EABA2]/70 font-mono">
                          {formattedDate}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => toggleReadStatus(inquiry._id, inquiry.isRead, e)}
                        disabled={isUpdating === inquiry._id}
                        className={clsx(
                          'px-2.5 py-1 rounded-xs border text-xs font-sans transition-colors flex items-center gap-1.5 cursor-pointer',
                          inquiry.isRead
                            ? 'border-white/10 bg-white/5 text-[#9EABA2] hover:text-white hover:border-white/20'
                            : 'border-teal/30 bg-teal/10 text-teal hover:bg-teal/20'
                        )}
                        title={inquiry.isRead ? 'Mark as unread' : 'Mark as read'}
                      >
                        {inquiry.isRead ? (
                          <>
                            <EyeOff className="w-3 h-3 text-[#9EABA2]" />
                            <span className="hidden md:inline">Mark unread</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 text-teal" />
                            <span className="hidden md:inline font-medium">Mark read</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/[0.08] bg-[#0E1413] text-xs font-sans space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-[#141B1A] border border-white/[0.08] rounded-xs">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#9EABA2] block font-mono mb-0.5">Phone</span>
                          <span className="text-[#F4F3ED] font-medium font-mono">
                            {inquiry.phone ? (
                              <a href={`tel:${inquiry.phone}`} className="hover:text-teal underline">
                                {inquiry.phone}
                              </a>
                            ) : (
                              '—'
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#9EABA2] block font-mono mb-0.5">Coverage</span>
                          <span className="text-[#F4F3ED] font-medium">{inquiry.mediaType || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#9EABA2] block font-mono mb-0.5">Guest Count</span>
                          <span className="text-[#F4F3ED] font-medium">{inquiry.guestCount || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#9EABA2] block font-mono mb-0.5">Direct Email</span>
                          <a
                            href={`mailto:${inquiry.email}?subject=EverLens%20Weddings%20Availability%20for%20${encodeURIComponent(inquiry.coupleNames)}`}
                            className="text-teal hover:underline font-medium inline-flex items-center gap-1.5"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Compose reply</span>
                          </a>
                        </div>
                      </div>

                      {inquiry.notes ? (
                        <div className="p-4 bg-[#141B1A] border border-white/[0.08] border-l-2 border-l-teal rounded-xs space-y-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-teal font-mono font-semibold block">
                            Couple&apos;s Notes &amp; Vision
                          </span>
                          <p className="text-[#F4F3ED]/90 leading-relaxed whitespace-pre-wrap">
                            {inquiry.notes}
                          </p>
                        </div>
                      ) : (
                        <div className="text-[#9EABA2]/50 italic">No additional notes provided.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiriesTable;
