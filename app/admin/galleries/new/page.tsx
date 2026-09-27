'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { Button } from '@/components/Button';
import { StatusDot } from '@/components/admin/StatusDot';
import { GalleryStatus } from '@/models/Gallery';
import {
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  Key,
  ShieldCheck,
  Calendar,
  Lock,
  ExternalLink,
} from 'lucide-react';

export default function CreateGalleryPage() {
  const router = useRouter();

  // Form State
  const [coupleNames, setCoupleNames] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [password, setPassword] = useState('');
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

  // Pre-generate password and guest pin on mount
  useEffect(() => {
    handleGeneratePassword();
    handleGenerateGuestPin();
  }, []);

  // Update token and expiration date when couple names or wedding date change
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

    // Default expiration to 1 year after wedding date if not already modified
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

      // Success: capture created credentials for one-time modal display
      setCreatedResult({
        galleryId: data.gallery._id,
        coupleNames: data.gallery.coupleNames,
        clientEmail: data.gallery.clientEmail,
        plainPassword: data.plainPassword,
        guestPin: data.gallery.guestPin,
        guestLinkToken: data.gallery.guestLinkToken,
      });
      setIsSubmitting(false);
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
    <div className="min-h-screen bg-[#0B0F0E] text-[#F4F3ED] flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-[#9EABA2] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Galleries</span>
          </Link>
        </div>

        {/* Title */}
        <div className="border-b border-white/[0.08] pb-5">
          <h1 className="text-2xl sm:text-3xl font-serif text-[#F4F3ED] font-normal tracking-tight">
            Create Client Gallery
          </h1>
          <p className="text-xs text-[#9EABA2] font-sans mt-1">
            Initialize an isolated wedding collection and generate initial authentication credentials.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-950/40 border-l-2 border-red-500 text-red-300 text-xs rounded-r-xs">
            {error}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-[#131918] border border-white/[0.08] rounded-xs p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-8 text-left">
            {/* 1. Couple & Event Metadata */}
            <div className="space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-wider text-teal font-semibold border-b border-white/[0.08] pb-2">
                Client &amp; Wedding Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Couple Names */}
                <div className="space-y-1.5">
                  <label htmlFor="coupleNames" className="block text-xs font-medium text-[#9EABA2]">
                    Couple Names <span className="text-teal">*</span>
                  </label>
                  <input
                    id="coupleNames"
                    type="text"
                    required
                    value={coupleNames}
                    onChange={handleCoupleNamesChange}
                    placeholder="e.g. Camille & Antoine"
                    className="w-full bg-[#182220] text-white placeholder:text-white/30 border border-white/10 rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                  />
                </div>

                {/* Wedding Date */}
                <div className="space-y-1.5">
                  <label htmlFor="weddingDate" className="block text-xs font-medium text-[#9EABA2]">
                    Wedding Date <span className="text-teal">*</span>
                  </label>
                  <input
                    id="weddingDate"
                    type="date"
                    required
                    value={weddingDate}
                    onChange={handleWeddingDateChange}
                    className="w-full bg-[#182220] text-white border border-white/10 rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                  />
                </div>

                {/* Client Email */}
                <div className="space-y-1.5">
                  <label htmlFor="clientEmail" className="block text-xs font-medium text-[#9EABA2]">
                    Client Email <span className="text-teal">*</span>
                  </label>
                  <input
                    id="clientEmail"
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full bg-[#182220] text-white placeholder:text-white/30 border border-white/10 rounded-xs px-3 py-2 text-xs focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                  />
                </div>

                {/* Expiration Date */}
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
                    Defaults to 1 year after wedding date.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Password Generation (Shown Once) */}
            <div className="space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-teal font-semibold border-b border-white/[0.08] pb-2">
                Client Portal Authentication
              </h2>

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
                      className="w-full bg-[#182220] font-mono text-xs text-white border border-white/10 rounded-xs pl-8 pr-3 py-2 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-3 py-2 bg-[#182220] border border-white/10 text-xs font-medium text-[#9EABA2] hover:text-white hover:border-white/20 rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Generate another password"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal" />
                    <span>Regenerate</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="px-3 py-2 bg-[#182220] border border-white/10 text-xs font-medium text-[#9EABA2] hover:text-white hover:border-white/20 rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Copy password"
                  >
                    {copiedPassword ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPassword ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-amber-400/90 font-mono">
                  ⚠️ This password will be securely hashed upon creation and shown once in the confirmation screen.
                </p>
              </div>
            </div>

            {/* 3. Status Toggle Controls */}
            <div className="space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-teal font-semibold border-b border-white/[0.08] pb-2">
                Gallery Status
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xs border text-xs transition-colors cursor-pointer ${
                    status === 'draft'
                      ? 'bg-white/10 border-white/30 font-medium text-white shadow-xs'
                      : 'bg-[#182220] border-white/10 text-[#9EABA2] hover:border-white/20'
                  }`}
                >
                  <StatusDot status="draft" />
                  <span className="text-[11px] text-[#9EABA2]">(Default: Work in progress)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xs border text-xs transition-colors cursor-pointer ${
                    status === 'active'
                      ? 'bg-teal/15 border-teal font-medium text-teal shadow-xs'
                      : 'bg-[#182220] border-white/10 text-[#9EABA2] hover:border-white/20'
                  }`}
                >
                  <StatusDot status="active" />
                  <span className="text-[11px] text-[#9EABA2]">(Client can sign in)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('archived')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xs border text-xs transition-colors cursor-pointer ${
                    status === 'archived'
                      ? 'bg-amber-400/15 border-amber-400 font-medium text-amber-300 shadow-xs'
                      : 'bg-[#182220] border-white/10 text-[#9EABA2] hover:border-white/20'
                  }`}
                >
                  <StatusDot status="archived" />
                  <span className="text-[11px] text-[#9EABA2]">(Read-only archive)</span>
                </button>
              </div>
            </div>

            {/* 4. Guest Access (Optional) */}
            <div className="space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-wider text-teal font-semibold border-b border-white/[0.08] pb-2">
                Guest Sharing Link &amp; PIN (Optional)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="guestLinkToken" className="block text-xs font-medium text-[#9EABA2]">
                    Guest Link Token (Slug)
                  </label>
                  <input
                    id="guestLinkToken"
                    type="text"
                    value={guestLinkToken}
                    onChange={(e) => setGuestLinkToken(e.target.value)}
                    placeholder="e.g. camille-antoine-a812"
                    className="w-full bg-[#182220] font-mono text-xs text-white border border-white/10 rounded-xs px-3 py-2 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all"
                  />
                  <p className="text-[11px] text-[#9EABA2]/70">Used for guest direct URLs.</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="guestPin" className="block text-xs font-medium text-[#9EABA2]">
                    Guest 4-Digit PIN
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="guestPin"
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
                      className="p-2 bg-[#182220] border border-white/10 text-[#9EABA2] hover:text-white hover:border-white/20 rounded-xs transition-colors cursor-pointer"
                      title="Generate new PIN"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-teal" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <Link
                href="/admin"
                className="px-4 py-2 text-xs font-sans text-[#9EABA2] hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xs bg-teal hover:bg-[#389a8a] text-[#0B0F0E] font-sans text-xs font-semibold tracking-wide transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Creating Gallery...' : 'Create Gallery'}
              </button>
            </div>
          </form>
        </div>

        {/* 5. One-Time Password Display Modal */}
        {createdResult && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#131918] border border-white/10 rounded-xs max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left">
              <div className="space-y-1">
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
              <div className="p-4 bg-[#182220] border border-white/10 rounded-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-teal font-medium uppercase tracking-wider">
                    Auto-Generated Password (Shown Once)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdResult.plainPassword);
                      setCopiedPassword(true);
                      setTimeout(() => setCopiedPassword(false), 2000);
                    }}
                    className="text-xs text-teal font-medium flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {copiedPassword ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPassword ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="font-mono text-sm bg-[#0E1413] px-3 py-2 border border-teal/30 rounded-xs text-teal font-semibold select-all">
                  {createdResult.plainPassword}
                </div>

                <p className="text-[11px] text-amber-400/90 leading-relaxed font-mono">
                  ⚠️ This password is now securely hashed in the database and <strong>will not be displayed again</strong>. Be sure to copy it now to include in the client delivery invitation.
                </p>
              </div>

              {/* Delivery Details Summary */}
              <div className="space-y-2 text-xs font-sans">
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

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyAllCredentials}
                  className="w-full sm:w-auto px-4 py-2 border border-white/10 bg-[#182220] text-xs font-medium text-[#F4F3ED] hover:text-white hover:border-white/20 rounded-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? 'All Details Copied!' : 'Copy Delivery Invitation'}</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Link
                    href={`/admin/galleries/${createdResult.galleryId}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-xs bg-teal hover:bg-[#389a8a] text-[#0B0F0E] font-sans text-xs font-semibold transition-colors"
                  >
                    Go to Gallery
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
