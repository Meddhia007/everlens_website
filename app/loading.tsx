import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-8 bg-[#0F1413]">
      <div className="relative w-12 h-12 flex items-center justify-center mb-4">
        <div className="absolute inset-0 rounded-full border border-teal/20 animate-ping" />
        <div className="w-10 h-10 rounded-full border-2 border-teal/30 border-t-teal animate-spin" />
      </div>
      <p className="font-serif italic text-cream/60 text-sm tracking-wider animate-pulse">
        EverLens
      </p>
    </div>
  );
}
