'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusDot } from '@/components/admin/StatusDot';
import { GalleryStatus } from '@/models/Gallery';
import {
  X,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  Plus,
  Loader2,
  Calendar,
  Mail,
  User,
  ExternalLink,
} from 'lucide-react';

interface NewGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGalleryCreated?: (gallery: any) => void;
}

export const NewGalleryModal: React.FC<NewGalleryModalProps> = ({
  isOpen,
  onClose,
  onGalleryCreated,
}) => {
  const router = useRouter();

  // Form State
  const [coupleNames, setCoupleNames] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photoLimit, setPhotoLimit] = useState<number>(50);
  const [status, setStatus] = useState<GalleryStatus>('draft');
  const [expirationDate, setExpirationDate] = useState('');

  // Guest settings
  const [guestPin, setGuestPin] = useState('');
  const [guestLinkToken, setGuestLinkToken] = useState('');

  // UI state
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success Modal State (shown once with the plaintext password)
  const [createdResult, setCreatedResult] = useState<{
    galleryId: string;
    coupleNames: string;
    clientEmail: string;
    plainPassword: string;
    guestPin?: string;
    guestLinkToken?: string;
  } | null>(null);

  // Helper generator functions
  const handleGeneratePassword = () => {
    const words = ['Radiance', 'Solace', 'Amour', 'Velvet', 'Elysian', 'Waltz', 'Lumiere', 'Aurora', 'Serenade'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    const hash = Math.random().toString(36).substring(2, 6);
    const generated = `EverLens-${randomWord}-${randomNum}-${hash}`;
    setPassword(generated);
  };

  const handleGenerateGuestPin = () => {
    setGuestPin(Math.floor(1000 + Math.random() * 9000).toString());
  };

  const handleGenerateGuestToken = (names: string) => {
    const slug = (names || 'wedding')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24);
    const hash = Math.random().toString(36).substring(2, 6);
    setGuestLinkToken(`${slug || 'gallery'}-${hash}`);
  };

  // Pre-generate password and guest pin when opened
  useEffect(() => {
    if (isOpen) {
      handleGeneratePassword();
      handleGenerateGuestPin();
      setError(null);
      setCreatedResult(null);
    }
  }, [isOpen]);

  // Esc key close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    },
    [isOpen, isSubmitting, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const handleCoupleNamesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCoupleNames(val);
    if (!guestLinkToken || guestLinkToken.startsWith('wedding-') || guestLinkToken.startsWith('gallery-')) {
      handleGenerateGuestToken(val);
    }
  };

  const handleWeddingDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    setWeddingDate(dateVal);

    if (dateVal && !expirationDate) {
      const d = new Date(dateVal);
      d.setFullYear(d.getFullYear() + 1);
      setExpirationDate(d.toISOString().split('T')[0]);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!coupleNames.trim() || !weddingDate || !clientEmail.trim()) {
      setError('Please fill out couple names, wedding date, and client email.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleNames,
          weddingDate,
          clientEmail,
          password,
          photoLimit,
          status,
          expirationDate: expirationDate || undefined,
          guestPin: guestPin || undefined,
          guestLinkToken: guestLinkToken || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create gallery.');
        setIsSubmitting(false);
        return;
      }

      setCreatedResult({
        galleryId: data.gallery._id,
        coupleNames: data.gallery.coupleNames,
        clientEmail: data.gallery.clientEmail,
        plainPassword: data.plainPassword,
        guestPin: data.gallery.guestPin,
        guestLinkToken: data.gallery.guestLinkToken,
      });

      if (onGalleryCreated) {
        onGalleryCreated(data.gallery);
      }
      setIsSubmitting(false);
      router.refresh();
    } catch {
      setError('A network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCopyAllCredentials = () => {
    if (!createdResult) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = `EverLens Weddings - Client Gallery Access

Couple: ${createdResult.coupleNames}
Portal URL: ${origin}/portal/login
Client Email: ${createdResult.clientEmail}
Gallery Password: ${createdResult.plainPassword}

Guest Direct Link: ${origin}/guest/${createdResult.guestLinkToken || ''}
Guest PIN: ${createdResult.guestPin || 'N/A'}`;

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs select-none overflow-y-auto"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#131918] border border-white/10 rounded-[14px] max-w-2xl w-full my-auto shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-left text-[#F4F3ED] animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-[#0E1413]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-teal">EverLens Backstage</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl text-white font-normal">
              Create New Client Gallery
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-[#9EABA2] hover:text-white rounded-[8px] hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content / Form */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-[8px]">
              {error}
            </div>
          )}

          {createdResult ? (
            /* One-Time Password Display Screen */
            <div className="space-y-5 animate-modal-in">
              <div className="p-4 bg-teal/10 border border-teal/30 rounded-[14px] space-y-2">
                <div className="flex items-center gap-2 text-teal">
                  <ShieldCheck className="w-5 h-5 text-teal" />
                  <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                    Gallery Created Successfully
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-[#F4F3ED] font-normal">
                  {createdResult.coupleNames}
                </h3>
              </div>

              {/* Password Highlight Box */}
              <div className="p-4 bg-[#182220] border border-white/10 rounded-[14px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-teal font-medium uppercase tracking-wider">
                    Auto-Generated Password (Shown Once)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdResult.plainPassword);
                      setCopiedPassword(true);
                      setTimeout(() => setCopiedPassword(false), 2000);
                    }}
                    className="text-xs text-teal font-medium flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {copiedPassword ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPassword ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="font-mono text-sm bg-[#0E1413] px-3.5 py-2.5 border border-teal/30 rounded-[8px] text-teal font-semibold select-all">
                  {createdResult.plainPassword}
                </div>

                <p className="text-[11px] text-amber-400 font-mono">
                  ⚠️ This password is now securely hashed in the database and <strong>will not be displayed again</strong>. Be sure to copy it now to include in the client delivery invitation.
                </p>
              </div>

              {/* Delivery Details Summary */}
              <div className="space-y-2 text-xs font-sans p-4 bg-[#182220]/60 rounded-[14px] border border-white/[0.06]">
                <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                  <span className="text-[#9EABA2]">Client Email:</span>
                  <span className="font-mono text-[#F4F3ED] font-medium">{createdResult.clientEmail}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                  <span className="text-[#9EABA2]">Guest Link Token:</span>
                  <span className="font-mono text-[#F4F3ED]">{createdResult.guestLinkToken || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                  <span className="text-[#9EABA2]">Guest PIN:</span>
                  <span className="font-mono text-[#F4F3ED]">{createdResult.guestPin || '—'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyAllCredentials}
                  className="w-full sm:w-auto px-4 py-2 border border-white/10 bg-[#182220] hover:bg-[#1f2c2a] text-xs font-medium text-[#F4F3ED] hover:text-white rounded-[8px] transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5 text-teal" />}
                  <span>{copiedAll ? 'All Details Copied!' : 'Copy Delivery Invitation'}</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Link
                    href={`/admin/galleries/${createdResult.galleryId}`}
                    onClick={onClose}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-[8px] bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0B0F0E] font-sans text-xs font-semibold hover:brightness-105 active:scale-[0.97] transition-all shadow-sm cursor-pointer"
                  >
                    <span>Go to Gallery</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form id="new-gallery-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Couple & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#9EABA2]">
                    Couple Names <span className="text-teal">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={coupleNames}
                    onChange={handleCoupleNamesChange}
                    placeholder="e.g. Camille & Antoine"
                    className="w-full bg-[#182220] text-white placeholder:text-white/30 border border-white/10 rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#9EABA2]">
                    Wedding Date <span className="text-teal">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={weddingDate}
                    onChange={handleWeddingDateChange}
                    className="w-full bg-[#182220] text-white border border-white/10 rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#9EABA2]">
                    Client Email <span className="text-teal">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full bg-[#182220] text-white placeholder:text-white/30 border border-white/10 rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#9EABA2]">
                    Archive Expiration Date
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full bg-[#182220] text-white border border-white/10 rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                  />
                  <p className="text-[10px] text-[#9EABA2]/70 font-sans">
                    Defaults to 1 year after wedding date.
                  </p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-medium text-[#9EABA2]">
                    Print Selection Limit <span className="text-teal">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={500}
                      required
                      value={photoLimit}
                      onChange={(e) => setPhotoLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-32 bg-[#182220] text-white font-mono border border-white/10 rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                    />
                    <span className="text-xs text-[#9EABA2] font-sans">
                      Archival prints allowed for client album curation (default 50).
                    </span>
                  </div>
                </div>
              </div>

              {/* Password Generator */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9EABA2]">
                  Auto-Generated Gallery Password
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Lock className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#182220] font-mono text-xs text-white border border-white/10 rounded-[8px] pl-8 pr-3 py-2 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-3 py-2 bg-[#182220] hover:bg-[#1E2B28] border border-white/10 text-xs font-medium text-[#9EABA2] hover:text-white rounded-[8px] transition-all active:scale-[0.97] flex items-center gap-1.5 cursor-pointer"
                    title="Generate another password"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal" />
                    <span className="hidden sm:inline">Regenerate</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="px-3 py-2 bg-[#182220] hover:bg-[#1E2B28] border border-white/10 text-xs font-medium text-[#9EABA2] hover:text-white rounded-[8px] transition-all active:scale-[0.97] flex items-center gap-1.5 cursor-pointer"
                    title="Copy password"
                  >
                    {copiedPassword ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5 text-teal" />}
                    <span>{copiedPassword ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9EABA2]">
                  Initial Status
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-[8px] border text-xs transition-all active:scale-[0.97] cursor-pointer ${
                      status === 'draft'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-medium'
                        : 'bg-[#182220] border-white/10 text-[#9EABA2] hover:border-white/20'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Draft (In Progress)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-[8px] border text-xs transition-all active:scale-[0.97] cursor-pointer ${
                      status === 'active'
                        ? 'bg-teal/15 border-teal text-teal font-medium'
                        : 'bg-[#182220] border-white/10 text-[#9EABA2] hover:border-white/20'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-teal" />
                    <span>Active (Client Can Sign In)</span>
                  </button>
                </div>
              </div>

              {/* Guest Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#9EABA2]">
                    Guest Link Slug (Optional)
                  </label>
                  <input
                    type="text"
                    value={guestLinkToken}
                    onChange={(e) => setGuestLinkToken(e.target.value)}
                    placeholder="e.g. camille-antoine"
                    className="w-full bg-[#182220] font-mono text-xs text-white border border-white/10 rounded-[8px] px-3.5 py-2 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#9EABA2]">
                    Guest 4-Digit PIN
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={guestPin}
                      onChange={(e) => setGuestPin(e.target.value)}
                      placeholder="e.g. 4829"
                      className="w-full bg-[#182220] font-mono text-xs text-white border border-white/10 rounded-[8px] px-3.5 py-2 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateGuestPin}
                      className="p-2 bg-[#182220] hover:bg-[#1E2B28] border border-white/10 text-[#9EABA2] hover:text-white rounded-[8px] transition-all active:scale-[0.97] cursor-pointer"
                      title="Generate new PIN"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-teal" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        {!createdResult && (
          <div className="p-4 sm:p-5 border-t border-white/[0.08] flex items-center justify-end gap-3 bg-[#0E1413] shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-sans text-[#9EABA2] hover:text-white hover:bg-white/[0.04] rounded-[8px] transition-all active:scale-[0.97] cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="new-gallery-form"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0B0F0E] font-sans text-xs font-semibold hover:brightness-105 active:scale-[0.97] transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Gallery...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Create Gallery</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewGalleryModal;
