'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/Button';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Mark session as active in this browser tab
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('everlens_admin_active', '1');
      }

      // Hard navigation to ensure middleware and server components re-evaluate cookies cleanly
      window.location.href = callbackUrl;
    } catch {
      setError('A network error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] relative z-10">
      {/* Card Container */}
      <div className="bg-[#131918] border border-white/10 p-8 sm:p-10 rounded-xs shadow-2xl backdrop-blur-xl">
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Logo size="md" theme="on-dark" />
          <div className="inline-flex items-center gap-2 mt-6 px-2.5 py-1 rounded-full bg-teal/10 border border-teal/20">
            <span className="w-1.5 h-1.5 rounded-full bg-teal shadow-[0_0_6px_rgba(67,177,159,0.8)]" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-teal font-medium">
              Studio Portal
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#F4F3ED] font-normal mt-3 tracking-tight">
            Studio Admin
          </h1>
          <p className="text-xs text-[#9EABA2] font-sans mt-2">
            Sign in to manage client collections, media archives, and print orders.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-950/40 border-l-2 border-red-500 text-red-300 text-xs font-sans text-left rounded-r-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-email"
              className="block text-xs font-sans font-medium text-[#9EABA2]"
            >
              Studio Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@everlensweddings.com"
              className="w-full bg-[#182220] text-white placeholder:text-white/30 border border-white/10 focus:border-teal focus:ring-1 focus:ring-teal focus:outline-none py-2.5 px-3 text-xs rounded-xs transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="admin-password"
                className="block text-xs font-sans font-medium text-[#9EABA2]"
              >
                Password
              </label>
            </div>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#182220] text-white placeholder:text-white/30 border border-white/10 focus:border-teal focus:ring-1 focus:ring-teal focus:outline-none py-2.5 px-3 text-xs rounded-xs transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xs bg-teal hover:bg-[#389a8a] text-[#0B0F0E] font-sans text-xs font-semibold tracking-wide transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Signing In...' : 'Sign In to Studio'}
            </button>
          </div>
        </form>
      </div>

      {/* Footer Navigation */}
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-xs text-[#9EABA2] hover:text-white transition-colors underline underline-offset-4"
        >
          ← Return to EverLens Home
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#0B0F0E] text-[#F4F3ED] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal/10 rounded-full blur-[140px] pointer-events-none" />
      <Suspense fallback={<div className="w-full max-w-[420px] h-96 bg-[#131918] rounded-xs animate-pulse" />}>
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
