import React from 'react';

export default function PortalLoading() {
  return (
    <div className="min-h-screen w-full bg-[#0F1413] text-[#EAE8DA] flex flex-col items-center justify-center p-8">
      <div className="w-12 h-12 relative flex items-center justify-center mb-5">
        <div className="absolute inset-0 rounded-full border border-teal/20 animate-ping" />
        <div className="w-10 h-10 rounded-full border-2 border-teal/30 border-t-teal animate-spin" />
      </div>
      <h2 className="font-serif text-xl text-cream tracking-wide mb-1">EverLens Archival Portal</h2>
      <p className="font-mono text-xs uppercase tracking-widest text-teal/70 animate-pulse">Loading gallery records...</p>
    </div>
  );
}
