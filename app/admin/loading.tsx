import React from 'react';

export default function AdminLoading() {
  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
      <div className="flex justify-between items-center border-b border-white/[0.08] pb-5">
        <div className="space-y-2">
          <div className="h-3 w-28 bg-teal/20 rounded-sm" />
          <div className="h-8 w-48 bg-white/10 rounded-sm" />
        </div>
        <div className="h-10 w-32 bg-white/10 rounded-sm" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 bg-white/[0.03] border border-white/[0.06] rounded-sm p-4 space-y-3">
            <div className="h-4 w-3/4 bg-white/10 rounded-sm" />
            <div className="h-3 w-1/2 bg-white/5 rounded-sm" />
            <div className="h-20 w-full bg-white/[0.02] rounded-sm mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
