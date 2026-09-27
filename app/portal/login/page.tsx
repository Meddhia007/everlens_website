'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/Button';

function ClientLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/portal';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide your client email and gallery password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please verify your credentials.');
        setIsLoading(false);
        return;
      }

      // Hard navigation to ensure middleware updates request headers (x-gallery-id) cleanly
      window.location.href = callbackUrl;
    } catch {
      setError('A network error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      {/* Card Container */}
      <div className="bg-cream-deep/40 border border-ink/15 p-8 sm:p-10 rounded-[2px]">
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Logo size="md" />
          <h1 className="font-display text-2xl sm:text-3xl text-ink font-normal mt-6 tracking-tight">
            Client Gallery
          </h1>
          <p className="font-body text-small text-ink/70 mt-2">
            Enter your registered email and gallery password provided in your delivery invitation.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3.5 bg-[#FAF0ED] border-l-2 border-terracotta text-ink font-body text-small text-left">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-2">
            <label
              htmlFor="client-email"
              className="block font-body text-small text-ink font-normal"
            >
              Client Email
            </label>
            <input
              id="client-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah.youssef@example.com"
              className="w-full bg-cream/70 text-ink placeholder:text-ink/35 border-b border-ink/40 focus:border-ink focus:outline-none py-2.5 px-1 text-body transition-colors rounded-none"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="gallery-password"
              className="block font-body text-small text-ink font-normal"
            >
              Gallery Password
            </label>
            <input
              id="gallery-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-cream/70 text-ink placeholder:text-ink/35 border-b border-ink/40 focus:border-ink focus:outline-none py-2.5 px-1 text-body transition-colors rounded-none"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading}
              className="w-full justify-center"
            >
              {isLoading ? 'Unlocking Gallery...' : 'Access Your Gallery'}
            </Button>
          </div>
        </form>
      </div>

      {/* Footer Navigation */}
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="font-body text-small text-ink/60 hover:text-ink transition-colors underline underline-offset-4"
        >
          ← Return to EverLens Home
        </Link>
      </div>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 sm:p-6">
      <Suspense fallback={<div className="w-full max-w-[400px] h-96 bg-cream" />}>
        <ClientLoginForm />
      </Suspense>
    </main>
  );
}
