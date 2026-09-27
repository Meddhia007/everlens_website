'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatEditorialDate } from '@/lib/date';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Calendar,
  Mail,
  Clock,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/Button';

export interface PrintDetailPhoto {
  _id: string;
  originalFilename: string;
  r2Key: string;
  category: string;
  printNote: string;
  url: string | null;
}

interface PrintOrderDetailViewProps {
  order: {
    _id: string;
    galleryId: string;
    coupleNames: string;
    weddingDate: string;
    clientEmail: string;
    submittedAt: string;
  };
  photos: PrintDetailPhoto[];
}

export const PrintOrderDetailView: React.FC<PrintOrderDetailViewProps> = ({
  order,
  photos,
}) => {
  const [copied, setCopied] = useState(false);

  // Clean slug for file export naming
  const coupleSlug = order.coupleNames
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  // 1. Export CSV with original filename + print note columns
  const handleExportCsv = () => {
    const headers = ['Original Filename', 'Print Note', 'Category'];
    const rows = photos.map((p) => {
      const escape = (val: string) => {
        if (!val) return '""';
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return `"${val}"`;
      };

      return [escape(p.originalFilename), escape(p.printNote), escape(p.category)].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${coupleSlug || 'order'}_print_selection.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Export Plain Text (.txt) with one filename per line
  const handleExportTxt = () => {
    const txtContent = photos.map((p) => p.originalFilename).join('\n');
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${coupleSlug || 'order'}_filenames.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Quick Copy Filenames to Clipboard
  const handleCopyFilenames = () => {
    const text = photos.map((p) => p.originalFilename).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const notesCount = photos.filter((p) => p.printNote && p.printNote.trim().length > 0).length;

  return (
    <div className="space-y-6 text-left">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <Link
            href="/admin/prints"
            className="inline-flex items-center gap-1.5 text-xs text-[#9EABA2] hover:text-white transition-colors font-sans mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Archival Print Orders</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-serif text-[#F4F3ED] font-normal tracking-tight">
                  {order.coupleNames}
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20 font-medium">
                  {photos.length} / 50 Selected
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#9EABA2] mt-2">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#9EABA2]/60" />
                  <span>{order.clientEmail}</span>
                </span>
                {order.weddingDate && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#9EABA2]/60" />
                      <span>{formatEditorialDate(order.weddingDate)}</span>
                    </span>
                  </>
                )}
                {order.submittedAt && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="flex items-center gap-1.5 text-teal">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Locked on {formatEditorialDate(order.submittedAt)}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Export Toolbar */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* CSV Export Button */}
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#182220] hover:bg-[#1f2c2a] border border-white/10 text-[#F4F3ED] text-xs font-mono font-medium rounded-xs transition-colors cursor-pointer"
                title="Download CSV spreadsheet with original camera filenames and retouching notes"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal" />
                <span>Export CSV</span>
              </button>

              {/* TXT Export Button */}
              <button
                type="button"
                onClick={handleExportTxt}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#182220] hover:bg-[#1f2c2a] border border-white/10 text-[#F4F3ED] text-xs font-mono font-medium rounded-xs transition-colors cursor-pointer"
                title="Download plain text file with one camera filename per line for Lightroom/terminal"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Export (.txt)</span>
              </button>

              {/* Copy Filenames Button */}
              <button
                type="button"
                onClick={handleCopyFilenames}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#182220] hover:bg-[#1f2c2a] border border-white/10 text-[#9EABA2] hover:text-white text-xs font-mono rounded-xs transition-colors cursor-pointer"
                title="Copy all original camera filenames to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal" />
                    <span className="text-teal font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-white/40" />
                    <span>Copy Names</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lab Order Summary Notice */}
      <div className="bg-[#131918] border border-white/[0.08] p-4 rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans text-[#9EABA2]">
        <div className="space-y-0.5">
          <p className="font-medium text-[#F4F3ED]">
            Archival Lab Typesetting Queue
          </p>
          <p className="text-[#9EABA2]">
            {photos.length} master photographs curated by client. {notesCount} item{notesCount === 1 ? ' has' : 's have'} custom retouching instructions.
          </p>
        </div>
        <Link
          href={`/admin/galleries/${order.galleryId}`}
          className="text-xs font-sans text-teal hover:text-teal-400 underline flex items-center gap-1 shrink-0"
        >
          <span>Open Gallery Management</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Working Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {photos.map((photo, index) => (
          <div
            key={photo._id}
            className="bg-[#131918] border border-white/[0.08] hover:border-teal/30 rounded-xs overflow-hidden flex flex-col justify-between transition-colors shadow-lg"
          >
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] bg-[#0B0F0E] overflow-hidden border-b border-white/[0.08]">
              {photo.url ? (
                <img
                  src={photo.url}
                  alt={photo.originalFilename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/30 space-y-1">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-[10px] font-mono text-white/40">Vault Master</span>
                </div>
              )}

              {/* Sequential Index Tag */}
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 text-white font-mono text-[10px] rounded-2xs backdrop-blur-xs border border-white/10">
                #{index + 1}
              </div>

              {/* Category Tag */}
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#131918]/90 text-teal font-mono text-[10px] uppercase rounded-2xs border border-teal/20 backdrop-blur-xs">
                {photo.category.replace(/-/g, ' ')}
              </div>
            </div>

            {/* Filename & Note Meta Box */}
            <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
              {/* Camera Original Filename (select-all for quick copy) */}
              <div>
                <span className="text-[10px] font-mono uppercase text-[#9EABA2] block tracking-wider mb-0.5">
                  Original Camera File
                </span>
                <span className="font-mono text-xs text-[#F4F3ED] font-semibold select-all break-all">
                  {photo.originalFilename}
                </span>
              </div>

              {/* Retouching Note Callout */}
              {photo.printNote ? (
                <div className="p-3 bg-[#182220] border-l-2 border-amber-400 rounded-2xs space-y-1">
                  <span className="text-[10px] font-mono text-amber-300 uppercase tracking-wider block font-semibold">
                    Client Retouch Note:
                  </span>
                  <p className="text-xs text-[#F4F3ED] font-sans leading-relaxed">
                    &ldquo;{photo.printNote}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="text-[11px] font-mono text-white/30 italic py-1">
                  No note (standard lab grade)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintOrderDetailView;
