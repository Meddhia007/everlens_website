'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, AlertCircle, Home } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin route error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-xs border border-white/10 bg-[#131918] shadow-2xl space-y-5">
        <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-2xl text-[#F4F3ED] font-normal">
            Unable to Load Studio Page
          </h2>
          <p className="text-xs text-[#9EABA2] font-sans leading-relaxed">
            {error?.message || 'An unexpected error occurred while loading this section of the admin panel.'}
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-white/30">
              Error Ref: {error.digest}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xs bg-teal hover:bg-[#389a8a] text-[#0B0F0E] text-xs font-sans font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/admin/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xs border border-white/10 bg-[#182220] text-[#9EABA2] hover:text-white text-xs font-sans font-medium hover:border-white/20 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Go to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
