'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Button } from '@/components/Button';
import { StatusDot } from '@/components/admin/StatusDot';
import { BulkUploader } from '@/components/admin/BulkUploader';
import { MediaGrid, MediaItemData } from '@/components/admin/MediaGrid';
import { GalleryStatus, ProductionStage } from '@/models/Gallery';
import { formatEditorialDate } from '@/lib/date';
import {
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Lock,
  Share2,
  AlertCircle,
  Save,
  Layers,
  Heart,
  UploadCloud,
  Camera,
  Film,
  BookOpen,
  Download,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Clock,
  Mail,
  Sparkles,
} from 'lucide-react';

interface GalleryDetail {
  _id: string;
  coupleNames: string;
  weddingDate: string;
  clientEmail: string;
  status: GalleryStatus;
  photoLimit: number;
  productionStage: ProductionStage;
  stageHistory?: Array<{ stage: ProductionStage; reachedAt: string }>;
  expirationDate?: string;
  guestPin?: string;
  guestLinkToken?: string;
  mediaCount: number;
  printCount: number;
  printLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function GalleryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const galleryId = params.id as string;

  const [gallery, setGallery] = useState<GalleryDetail | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [coupleNames, setCoupleNames] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [status, setStatus] = useState<GalleryStatus>('draft');
  const [photoLimit, setPhotoLimit] = useState<number>(50);
  const [productionStage, setProductionStage] = useState<ProductionStage>('files_uploaded');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');
  const [guestPin, setGuestPin] = useState('');
  const [guestLinkToken, setGuestLinkToken] = useState('');

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Copy feedback state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareableGuestLink = guestLinkToken
    ? `${origin}/guest/${guestLinkToken}`
    : '';

  // Load Gallery & Media Data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [galleryRes, mediaRes] = await Promise.all([
          fetch(`/api/admin/galleries/${galleryId}`),
          fetch(`/api/admin/galleries/${galleryId}/media`),
        ]);

        const galleryData = await galleryRes.json();
        const mediaData = await mediaRes.json();

        if (!galleryRes.ok) {
          setError(galleryData.error || 'Failed to load gallery details.');
          setIsLoading(false);
          return;
        }

        const g = galleryData.gallery as GalleryDetail;
        setGallery(g);
        setCoupleNames(g.coupleNames);
        setWeddingDate(g.weddingDate ? g.weddingDate.split('T')[0] : '');
        setClientEmail(g.clientEmail);
        setStatus(g.status);
        setPhotoLimit(g.photoLimit ?? 50);
        setProductionStage(g.productionStage || 'files_uploaded');
        setExpirationDate(g.expirationDate ? g.expirationDate.split('T')[0] : '');
        setGuestPin(g.guestPin || '');
        setGuestLinkToken(g.guestLinkToken || '');

        if (mediaRes.ok && mediaData.media) {
          setMediaItems(mediaData.media);
        }

        setIsLoading(false);
      } catch {
        setError('Network error loading gallery.');
        setIsLoading(false);
      }
    }

    if (galleryId) {
      loadData();
    }
  }, [galleryId]);

  // Handlers for generating guest PIN and Token
  const handleGenerateGuestPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setGuestPin(pin);
  };

  const handleGenerateGuestToken = () => {
    const slug = (coupleNames || 'wedding')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24);
    const hash = Math.random().toString(36).substring(2, 6);
    setGuestLinkToken(`${slug || 'gallery'}-${hash}`);
  };

  const handleGenerateNewPassword = () => {
    const words = ['Radiance', 'Solace', 'Amour', 'Velvet', 'Elysian', 'Waltz', 'Lumiere', 'Aurora'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    const hash = Math.random().toString(36).substring(2, 6);
    setNewPassword(`EverLens-${randomWord}-${randomNum}-${hash}`);
  };

  const handleCopyLink = () => {
    if (!shareableGuestLink) return;
    navigator.clipboard.writeText(shareableGuestLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPin = () => {
    if (!guestPin) return;
    navigator.clipboard.writeText(guestPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const PRODUCTION_STAGES: {
    id: ProductionStage;
    label: string;
    clientLabel: string;
    description: string;
    isEmailMilestone: boolean;
  }[] = [
    {
      id: 'files_uploaded',
      label: 'Files Uploaded',
      clientLabel: 'Files Uploaded',
      description: 'Raw footage and master files secured in studio storage',
      isEmailMilestone: false,
    },
    {
      id: 'editing_photos',
      label: 'Editing Photos',
      clientLabel: 'Editing your photos',
      description: 'Color grading, exposure calibration & curation',
      isEmailMilestone: false,
    },
    {
      id: 'photos_ready',
      label: 'Photos Ready',
      clientLabel: 'Photos Ready',
      description: 'Full master photo gallery ready to view & share',
      isEmailMilestone: true,
    },
    {
      id: 'editing_film',
      label: 'Editing Film',
      clientLabel: 'Editing your film',
      description: 'Timeline cut, sound design & audio mastering',
      isEmailMilestone: false,
    },
    {
      id: 'film_ready',
      label: 'Film Ready',
      clientLabel: 'Film Ready',
      description: 'Cinematic film finalized and streaming in portal',
      isEmailMilestone: true,
    },
    {
      id: 'album_production',
      label: 'Album Production',
      clientLabel: 'Album in Production',
      description: 'Handcrafted prints typesetting and physical binding',
      isEmailMilestone: false,
    },
    {
      id: 'delivered',
      label: 'Delivered',
      clientLabel: 'Delivered',
      description: 'Complete collection archived and delivered to client',
      isEmailMilestone: true,
    },
  ];

  const handleUpdateStage = async (newStage: ProductionStage) => {
    if (isUpdatingStage || newStage === productionStage) return;
    setIsUpdatingStage(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/galleries/${galleryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionStage: newStage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update stage');
        setIsUpdatingStage(false);
        return;
      }
      setProductionStage(newStage);
      setGallery((prev) => (prev ? { ...prev, ...data.gallery } : null));

      const milestoneLabels: Record<string, string> = {
        photos_ready: 'Photos Ready',
        film_ready: 'Film Ready',
        delivered: 'Delivered',
      };

      if (['photos_ready', 'film_ready', 'delivered'].includes(newStage)) {
        setSuccessMsg(`Stage advanced to "${milestoneLabels[newStage]}" — milestone notification email sent to client!`);
      } else {
        setSuccessMsg(`Production stage updated.`);
      }
      setTimeout(() => setSuccessMsg(null), 4000);
      setIsUpdatingStage(false);
    } catch {
      setError('Network error updating production stage.');
      setIsUpdatingStage(false);
    }
  };

  // Submit Changes
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/galleries/${galleryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleNames,
          weddingDate,
          clientEmail,
          status,
          photoLimit,
          productionStage,
          expirationDate: expirationDate || undefined,
          guestPin: guestPin || undefined,
          guestLinkToken: guestLinkToken || undefined,
          newPassword: newPassword.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save changes.');
        setIsSaving(false);
        return;
      }

      setGallery((prev) => (prev ? { ...prev, ...data.gallery } : null));
      setNewPassword('');
      setShowPasswordReset(false);
      setSuccessMsg('Gallery updated successfully.');
      setIsSaving(false);

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      setError('A network error occurred while saving.');
      setIsSaving(false);
    }
  };

  // Delete Gallery
  const handleDeleteGallery = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/galleries/${galleryId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/admin');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete gallery.');
        setIsDeleting(false);
        setShowDeleteModal(false);
      }
    } catch {
      setError('Network error deleting gallery.');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Media Grid Event Callbacks
  const handleMediaUploaded = (newMediaItem: MediaItemData) => {
    setMediaItems((prev) => [newMediaItem, ...prev]);
    setGallery((prev) =>
      prev ? { ...prev, mediaCount: (prev.mediaCount || 0) + 1 } : null
    );
  };

  const handleMediaUpdated = (updatedItem: MediaItemData) => {
    setMediaItems((prev) =>
      prev.map((item) => (item._id === updatedItem._id ? { ...item, ...updatedItem } : item))
    );
  };

  const handleMediaDeleted = (deletedId: string) => {
    setMediaItems((prev) => prev.filter((item) => item._id !== deletedId));
    setGallery((prev) =>
      prev ? { ...prev, mediaCount: Math.max(0, (prev.mediaCount || 1) - 1) } : null
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F0E] text-[#F4F3ED] flex flex-col font-sans">
        <AdminNavbar />
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Skeleton Header */}
          <div className="space-y-2 border-b border-white/[0.08] pb-4 animate-pulse">
            <div className="h-4 w-32 bg-[#182220] rounded-xs" />
            <div className="h-8 w-72 bg-[#182220] rounded-xs" />
            <div className="h-3 w-48 bg-[#182220]/70 rounded-xs" />
          </div>

          {/* Skeleton Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            <div className="h-56 bg-[#131918] border border-white/[0.08] rounded-xs p-5 space-y-3">
              <div className="h-4 w-40 bg-[#182220] rounded-xs" />
              <div className="h-3 w-full bg-[#182220]/60 rounded-xs" />
              <div className="h-3 w-3/4 bg-[#182220]/60 rounded-xs" />
            </div>
            <div className="h-56 bg-[#131918] border border-white/[0.08] rounded-xs p-5 space-y-3">
              <div className="h-4 w-40 bg-[#182220] rounded-xs" />
              <div className="h-3 w-full bg-[#182220]/60 rounded-xs" />
              <div className="h-3 w-3/4 bg-[#182220]/60 rounded-xs" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-[#0B0F0E] text-[#F4F3ED] flex flex-col font-sans">
        <AdminNavbar />
        <main className="flex-1 max-w-5xl w-full mx-auto p-8 space-y-4">
          <Link href="/admin" className="text-xs text-[#9EABA2] hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Galleries
          </Link>
          <div className="p-6 bg-[#131918] border border-white/[0.08] rounded-xs text-left">
            <h2 className="font-serif text-lg text-[#F4F3ED]">Gallery not found</h2>
            <p className="text-xs text-[#9EABA2] mt-1">This gallery may have been removed or does not exist.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-[#F4F3ED] flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-[#9EABA2] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Galleries</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/portal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal hover:text-teal-400 flex items-center gap-1 hover:underline"
            >
              <span>Preview Client Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Executive Couple Overview Card */}
        <div className="bg-[#131918] border border-white/[0.08] rounded-xs p-6 sm:p-7 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-white/[0.08] pb-6">
            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-serif text-[#F4F3ED] font-normal tracking-tight">
                  {gallery.coupleNames}
                </h1>
                <StatusDot status={gallery.status} />
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#9EABA2] font-sans">
                <span className="font-mono text-white/90">{gallery.clientEmail}</span>
                <span className="text-white/20">•</span>
                <span>Wedding Date: {formatEditorialDate(gallery.weddingDate)}</span>
                <span className="text-white/20">•</span>
                <span className="text-teal font-medium">Bespoke Collection</span>
              </div>
            </div>

            {/* Direct Open Client Portal Button */}
            <div className="flex items-center gap-3">
              <Link
                href="/portal"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xs bg-teal hover:bg-teal/90 text-[#0B0F0E] font-medium text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(67,177,159,0.25)] hover:shadow-[0_0_25px_rgba(67,177,159,0.4)]"
              >
                <span>Open Client Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 text-left">
            {/* Photos */}
            <div className="p-3.5 rounded-xs bg-[#182220] border border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#9EABA2] mb-1 flex items-center gap-1.5">
                <Camera className="w-3 h-3 text-teal" />
                <span>Photos</span>
              </div>
              <div className="text-lg font-serif text-white">
                {mediaItems.filter((m) => m.type === 'photo').length}
                <span className="text-[11px] font-sans text-[#9EABA2] font-normal ml-1">items</span>
              </div>
            </div>

            {/* Videos */}
            <div className="p-3.5 rounded-xs bg-[#182220] border border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#9EABA2] mb-1 flex items-center gap-1.5">
                <Film className="w-3 h-3 text-teal" />
                <span>Videos</span>
              </div>
              <div className="text-lg font-serif text-white">
                {mediaItems.filter((m) => m.type === 'video').length}
                <span className="text-[11px] font-sans text-[#9EABA2] font-normal ml-1">films</span>
              </div>
            </div>

            {/* Album Curation */}
            <div className="p-3.5 rounded-xs bg-[#182220] border border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#9EABA2] mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-teal" />
                <span>Album</span>
              </div>
              <div className="text-lg font-serif text-white">
                {gallery.printCount || mediaItems.filter((m) => m.isPrintSelected).length}
                <span className="text-[11px] font-sans text-[#9EABA2] font-normal ml-1">/ {gallery.photoLimit || 50} selected</span>
              </div>
            </div>

            {/* Downloads */}
            <div className="p-3.5 rounded-xs bg-[#182220] border border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#9EABA2] mb-1 flex items-center gap-1.5">
                <Download className="w-3 h-3 text-teal" />
                <span>Downloads</span>
              </div>
              <div className="text-xs font-sans text-teal font-medium mt-1">
                Edge Ready
              </div>
            </div>

            {/* Portal State */}
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xs bg-[#182220] border border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#9EABA2] mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-teal" />
                <span>Portal Access</span>
              </div>
              <div className="text-xs font-medium capitalize mt-1 text-white flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${gallery.status === 'active' ? 'bg-teal' : 'bg-amber-400'}`} />
                <span>{gallery.status === 'active' ? 'Live Gallery' : gallery.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 bg-red-950/40 border-l-2 border-red-500 text-red-300 text-xs rounded-r-xs text-left">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 bg-teal/10 border-l-2 border-teal text-teal text-xs rounded-r-xs text-left flex items-center gap-2">
            <Check className="w-4 h-4 text-teal" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* PRODUCTION STATUS TRACKER */}
        <div className="bg-[#131918] border border-white/[0.08] rounded-xs p-6 sm:p-7 shadow-xl space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-teal" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-teal font-semibold">
                  Production Status Tracker
                </h2>
              </div>
              <p className="text-xs text-[#9EABA2] font-sans">
                Milestone pipeline tracked directly in client portal. Changes record a timestamp.
              </p>
            </div>

            {/* Stepper Controls: Backward, Forward, or Dropdown */}
            {(() => {
              const currentStageIndex = PRODUCTION_STAGES.findIndex((s) => s.id === productionStage);
              return (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isUpdatingStage || currentStageIndex <= 0}
                    onClick={() => {
                      if (currentStageIndex > 0) {
                        handleUpdateStage(PRODUCTION_STAGES[currentStageIndex - 1].id);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xs border border-white/10 hover:border-white/20 bg-[#182220] text-xs font-sans text-[#9EABA2] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Move backward to previous stage in case of mistake"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUpdatingStage || currentStageIndex >= PRODUCTION_STAGES.length - 1}
                    onClick={() => {
                      if (currentStageIndex < PRODUCTION_STAGES.length - 1) {
                        handleUpdateStage(PRODUCTION_STAGES[currentStageIndex + 1].id);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xs bg-teal hover:bg-teal/90 text-[#0B0F0E] text-xs font-sans font-medium transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Advance Stage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative">
                    <select
                      value={productionStage}
                      disabled={isUpdatingStage}
                      onChange={(e) => handleUpdateStage(e.target.value as ProductionStage)}
                      className="bg-[#182220] border border-white/10 rounded-xs px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal font-sans cursor-pointer disabled:opacity-50"
                    >
                      {PRODUCTION_STAGES.map((s, idx) => (
                        <option key={s.id} value={s.id}>
                          {idx + 1}. {s.label} {s.isEmailMilestone ? '✉️' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Stepper Pipeline */}
          {(() => {
            const currentStageIndex = PRODUCTION_STAGES.findIndex((s) => s.id === productionStage);
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {PRODUCTION_STAGES.map((s, idx) => {
                  const isCurrent = s.id === productionStage;
                  const isPast = idx < currentStageIndex;
                  const historyItem = gallery.stageHistory?.find((h) => h.stage === s.id);

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleUpdateStage(s.id)}
                      className={`p-3 rounded-xs border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-teal/15 border-teal shadow-[0_0_15px_rgba(67,177,159,0.2)]'
                          : isPast
                          ? 'bg-[#182220] border-teal/30 hover:border-teal/50'
                          : 'bg-[#182220]/50 border-white/[0.06] hover:border-white/20 opacity-70'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-mono text-[#9EABA2]">
                            Step {idx + 1}
                          </span>
                          {isPast ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal shrink-0" />
                          ) : isCurrent ? (
                            <span className="w-2 h-2 rounded-full bg-teal animate-pulse shrink-0" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-white/20 shrink-0" />
                          )}
                        </div>
                        <div className="font-serif text-sm text-white font-medium flex items-center gap-1">
                          <span>{s.label}</span>
                          {s.isEmailMilestone && (
                            <span title="Milestone triggers email to client" className="inline-flex">
                              <Mail className="w-3 h-3 text-teal shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#9EABA2] font-sans mt-1 leading-snug line-clamp-2">
                          {s.description}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-white/[0.06] text-[10px] font-mono text-[#9EABA2]">
                        {historyItem?.reachedAt ? (
                          <span className="text-teal font-medium">
                            {new Date(historyItem.reachedAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                        ) : isPast ? (
                          <span className="text-teal/80">Completed</span>
                        ) : isCurrent ? (
                          <span className="text-teal font-semibold uppercase">In Progress</span>
                        ) : (
                          <span className="text-white/30">Upcoming</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <div className="text-[11px] text-[#9EABA2] flex items-center gap-2 pt-1 border-t border-white/[0.06]">
            <Mail className="w-3.5 h-3.5 text-teal shrink-0" />
            <span>
              <strong>Photos Ready</strong>, <strong>Film Ready</strong>, and <strong>Delivered</strong> milestones automatically send an email to <code className="text-teal">{gallery.clientEmail}</code> via Resend. Earlier editing stages update the client portal silently.
            </span>
          </div>
        </div>

        {/* SECTION 1: SETTINGS & METADATA FORM */}
        <form onSubmit={handleSaveChanges} className="space-y-6 text-left">
          {/* Status Change Controls */}
          <div className="bg-[#131918] border border-white/[0.08] rounded-xs p-6 space-y-4 shadow-xl">
            <h2 className="text-xs font-mono uppercase tracking-wider text-teal font-semibold border-b border-white/[0.08] pb-2">
              Status Change Controls
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`p-3.5 rounded-xs border text-left transition-colors cursor-pointer ${
                  status === 'draft'
                    ? 'bg-white/10 border-white/30 font-medium text-white shadow-xs'
                    : 'bg-[#182220] border-white/10 text-[#9EABA2] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <StatusDot status="draft" />
                </div>
                <p className="text-[11px] text-[#9EABA2]">
                  Studio staging only. Client login is blocked.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`p-3.5 rounded-xs border text-left transition-colors cursor-pointer ${
                  status === 'active'
                    ? 'bg-teal/15 border-teal font-medium text-teal shadow-xs'
                    : 'bg-[#182220] border-white/10 text-[#9EABA2] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <StatusDot status="active" />
                </div>
                <p className="text-[11px] text-[#9EABA2]">
                  Live collection. Client and guest access enabled.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStatus('archived')}
                className={`p-3.5 rounded-xs border text-left transition-colors cursor-pointer ${
                  status === 'archived'
                    ? 'bg-amber-400/15 border-amber-400 font-medium text-amber-300 shadow-xs'
                    : 'bg-[#182220] border-white/10 text-[#9EABA2] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <StatusDot status="archived" />
                </div>
                <p className="text-[11px] text-[#9EABA2]">
                  Archived. Gallery is frozen in read-only mode.
                </p>
              </button>
            </div>
          </div>

          {/* Client & Gallery Metadata */}
          <div className="bg-[#131918] border border-white/[0.08] rounded-xs p-6 space-y-4 shadow-xl">
            <h2 className="text-xs font-mono uppercase tracking-wider text-teal font-semibold border-b border-white/[0.08] pb-2">
              Client &amp; Expiration Settings
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="coupleNames" className="block text-xs font-medium text-[#9EABA2]">
                  Couple Names
                </label>
                <input
                  id="coupleNames"
                  type="text"
                  required
                  value={coupleNames}
                  onChange={(e) => setCoupleNames(e.target.value)}
                  className="w-full bg-[#182220] text-white border border-white/10 rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="weddingDate" className="block text-xs font-medium text-[#9EABA2]">
                  Wedding Date
                </label>
                <input
                  id="weddingDate"
                  type="date"
                  required
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="w-full bg-[#182220] text-white border border-white/10 rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="clientEmail" className="block text-xs font-medium text-[#9EABA2]">
                  Client Email
                </label>
                <input
                  id="clientEmail"
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-[#182220] text-white border border-white/10 rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="expirationDate" className="block text-xs font-medium text-[#9EABA2]">
                  Archive Expiration Date
                </label>
                <input
                  id="expirationDate"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full bg-[#182220] text-white border border-white/10 rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                />
                <p className="text-[11px] text-[#9EABA2]/70 font-sans">
                  Leave empty if gallery should have perpetual access.
                </p>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="photoLimit" className="block text-xs font-medium text-[#9EABA2]">
                  Print Selection Limit
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="photoLimit"
                    type="number"
                    min={1}
                    max={500}
                    value={photoLimit}
                    onChange={(e) => setPhotoLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-32 bg-[#182220] text-white font-mono border border-white/10 rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                  />
                  <span className="text-xs text-[#9EABA2] font-sans">
                    Admin-controlled limit for the client&apos;s print selection album (default 50).
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Guest Access & Shareable Link Controls */}
          <div className="bg-[#131918] border border-white/[0.08] rounded-xs p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <h2 className="text-xs font-mono uppercase tracking-wider text-teal font-semibold flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-teal" />
                Guest Access &amp; Shareable Link
              </h2>
            </div>

            {/* Shareable Link Display Box */}
            <div className="p-4 bg-[#182220] border border-white/10 rounded-xs space-y-2">
              <span className="text-[11px] font-mono text-teal font-medium uppercase tracking-wider block">
                Shareable Guest Direct Link
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareableGuestLink || 'Token not generated'}
                  className="w-full bg-[#0E1413] font-mono text-xs text-[#F4F3ED] border border-white/10 rounded-xs px-3 py-2 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  disabled={!shareableGuestLink}
                  className="px-3 py-2 bg-[#182220] border border-white/10 text-xs font-medium text-[#9EABA2] hover:text-white hover:border-white/20 rounded-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* PIN and Token Inputs with Regenerate Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Guest Link Token */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9EABA2]">
                  Guest Link Token
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={guestLinkToken}
                    onChange={(e) => setGuestLinkToken(e.target.value)}
                    placeholder="e.g. camille-antoine-a812"
                    className="w-full bg-[#182220] font-mono text-xs text-white border border-white/10 rounded-xs px-3 py-2 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateGuestToken}
                    className="p-2 bg-[#182220] border border-white/10 text-[#9EABA2] hover:text-white hover:border-white/20 rounded-xs shrink-0 cursor-pointer"
                    title="Regenerate Token"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal" />
                  </button>
                </div>
                <p className="text-[11px] text-[#9EABA2]/70">
                  Changing the token will invalidate previously shared links.
                </p>
              </div>

              {/* Guest PIN */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9EABA2]">
                  Guest PIN (4-Digit Access Code)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={guestPin}
                    onChange={(e) => setGuestPin(e.target.value)}
                    placeholder="e.g. 4829"
                    className="w-full bg-[#182220] font-mono text-xs text-white border border-white/10 rounded-xs px-3 py-2 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateGuestPin}
                    className="p-2 bg-[#182220] border border-white/10 text-[#9EABA2] hover:text-white hover:border-white/20 rounded-xs shrink-0 cursor-pointer"
                    title="Regenerate Random PIN"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPin}
                    disabled={!guestPin}
                    className="p-2 bg-[#182220] border border-white/10 text-[#9EABA2] hover:text-white hover:border-white/20 rounded-xs shrink-0 cursor-pointer"
                    title="Copy PIN"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#9EABA2]/70">
                  Optional PIN required for guests without the direct link.
                </p>
              </div>
            </div>
          </div>

          {/* Reset Client Password (Collapsible / Optional) */}
          <div className="bg-[#131918] border border-white/[0.08] rounded-xs p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <h2 className="text-xs font-mono uppercase tracking-wider text-teal font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal" />
                Reset Client Gallery Password
              </h2>
              <button
                type="button"
                onClick={() => setShowPasswordReset(!showPasswordReset)}
                className="text-xs text-teal hover:underline font-medium cursor-pointer"
              >
                {showPasswordReset ? 'Hide' : 'Change Password'}
              </button>
            </div>

            {showPasswordReset && (
              <div className="p-4 bg-[#182220] border border-white/10 rounded-xs space-y-3">
                <p className="text-xs text-[#9EABA2]">
                  Set a new password for <strong className="text-white">{clientEmail}</strong>. Remember to copy and share the new password with the couple.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password or click generate"
                    className="w-full bg-[#0E1413] font-mono text-xs text-white border border-white/10 rounded-xs px-3 py-2 focus:outline-none focus:border-teal"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateNewPassword}
                    className="px-3 py-2 bg-[#182220] border border-white/10 text-xs font-medium text-[#9EABA2] hover:text-white rounded-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal" />
                    <span>Generate</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 px-3 py-2 rounded-xs hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Gallery</span>
            </button>

            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="px-4 py-2 text-xs font-sans text-[#9EABA2] hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xs bg-teal hover:bg-[#389a8a] text-[#0B0F0E] font-sans text-xs font-semibold tracking-wide transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* SECTION 2: BULK UPLOADER & MEDIA MANAGEMENT */}
        <section className="space-y-6 pt-4 border-t border-white/[0.08] text-left">
          <div className="border-b border-white/[0.08] pb-3">
            <h2 className="text-xl sm:text-2xl font-serif text-[#F4F3ED] font-normal tracking-tight">
              Media Collection &amp; Presigned Bulk Uploader
            </h2>
            <p className="text-xs text-[#9EABA2] font-sans mt-1">
              Upload files directly to Cloudflare R2 edge storage via presigned URLs. Zero server byte proxying.
            </p>
          </div>

          {/* Bulk Uploader Component */}
          <BulkUploader
            galleryId={galleryId}
            onUploadComplete={handleMediaUploaded}
          />

          {/* Media Grid Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-teal font-semibold">
                Uploaded Gallery Items ({mediaItems.length})
              </h3>
              <span className="text-[11px] font-mono text-[#9EABA2]">
                Presigned URLs active for preview
              </span>
            </div>

            <MediaGrid
              items={mediaItems}
              onItemUpdated={handleMediaUpdated}
              onItemDeleted={handleMediaDeleted}
            />
          </div>
        </section>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#131918] border border-white/10 rounded-xs max-w-md w-full p-6 space-y-4 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-serif text-lg text-[#F4F3ED] font-normal">
                  Delete {gallery.coupleNames}?
                </h3>
              </div>

              <p className="text-xs text-[#9EABA2] leading-relaxed">
                This will permanently delete this client gallery, remove all associated media records, and cancel client login access. This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-sans text-[#9EABA2] hover:text-white transition-colors cursor-pointer"
                >
                  Keep Gallery
                </button>
                <button
                  type="button"
                  onClick={handleDeleteGallery}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
