'use client';

import React, { useState, useEffect } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/Button';
import { Lock, ShieldAlert, Clock } from 'lucide-react';

interface GuestPinEntryProps {
  token: string;
  coupleNames: string;
  initialLockedOut?: boolean;
  initialRemainingMinutes?: number;
}

export const GuestPinEntry: React.FC<GuestPinEntryProps> = ({
  token,
  coupleNames,
  initialLockedOut = false,
  initialRemainingMinutes = 0,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(initialLockedOut);
  const [remainingMinutes, setRemainingMinutes] = useState(initialRemainingMinutes);

  // Check rate limit status on mount if not already locked out
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch(`/api/guest/${token}/verify`);
        const data = await res.json();
        if (data.lockedOut) {
          setIsLockedOut(true);
          setRemainingMinutes(data.remainingMinutes || 15);
        }
      } catch {
        // Quiet fallback
      }
    }
    checkStatus();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    setError(null);

    const cleanPin = pin.trim();
    if (!cleanPin) {
      setError('Please enter the guest PIN provided by the couple.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/guest/${token}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 || data.lockedOut) {
          setIsLockedOut(true);
          setRemainingMinutes(data.remainingMinutes || 15);
          setError(
            data.error ||
              'Too many failed attempts. Gallery access is locked for 15 minutes.'
          );
        } else {
          setError(data.error || 'Incorrect PIN. Please check with the couple and try again.');
        }
        setIsLoading(false);
        return;
      }

      // Success: Reload page so server component verifies the guest cookie
      window.location.reload();
    } catch {
      setError('A network error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] text-center">
      {/* Centered Card on Cream Canvas */}
      <div className="bg-cream-deep/40 border border-ink/15 p-8 sm:p-10 rounded-[2px]">
        {/* Logo Lockup */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="md" />
          <h1 className="font-display text-2xl sm:text-3xl text-ink font-normal mt-6 tracking-tight">
            {coupleNames}
          </h1>
          <p className="font-body text-xs sm:text-small text-ink/70 mt-2">
            Enter the guest PIN to access the celebration collection.
          </p>
        </div>

        {/* Error / Lockout Feedback */}
        {error && (
          <div className="mb-6 p-3.5 bg-[#FAF0ED] border-l-2 border-terracotta text-ink font-body text-xs sm:text-small text-left flex items-start gap-2.5">
            {isLockedOut ? (
              <Clock className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
            )}
            <div>
              <p className="leading-relaxed">{error}</p>
              {isLockedOut && (
                <p className="text-[11px] text-ink/60 mt-1 font-mono">
                  Rate limit: 5 attempts per 15 minutes.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-2">
            <label
              htmlFor="guest-pin"
              className="block font-body text-xs uppercase tracking-wider text-ink/80 font-medium"
            >
              Guest PIN
            </label>
            <div className="relative">
              <input
                id="guest-pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                autoFocus
                disabled={isLoading || isLockedOut}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-cream/70 text-ink text-center tracking-[0.5em] text-xl font-mono border-b border-ink/40 focus:border-ink focus:outline-none py-2.5 px-1 transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <Lock className="w-3.5 h-3.5 text-ink/40 absolute right-2 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading || isLockedOut}
              className="w-full justify-center"
            >
              {isLoading
                ? 'Unlocking Sanctuary...'
                : isLockedOut
                ? `Locked (${remainingMinutes}m)`
                : 'Enter Wedding Gallery'}
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-6 text-xs text-ink/40 font-mono tracking-wide">
        EverLens Archival Gallery Service
      </div>
    </div>
  );
};

export default GuestPinEntry;
