'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, ExternalLink } from 'lucide-react';
import { useAdminModal } from './AdminModalContext';

export const DashboardHeaderActions: React.FC = () => {
  const { openNewGallery } = useAdminModal();

  return (
    <div className="flex items-center gap-2.5 self-start sm:self-auto">
      <button
        type="button"
        onClick={openNewGallery}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0B0F0E] font-medium text-xs shadow-sm hover:brightness-105 active:scale-[0.97] transition-all duration-150 ease-out cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>New Gallery</span>
      </button>

      <button
        type="button"
        onClick={async () => {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('everlens_admin_active');
          }
          try {
            await fetch('/api/auth/admin/logout', { method: 'POST' });
          } catch (err) {
            console.error(err);
          }
          window.location.href = '/';
        }}
        className="inline-flex items-center gap-1.5 text-xs text-[#9EABA2] hover:text-[#43B19F] transition-colors px-3 py-2 rounded-[8px] border border-white/[0.08] hover:bg-white/[0.04] cursor-pointer"
      >
        <span>Return to Website</span>
        <ExternalLink className="w-3 h-3 text-[#9EABA2]" />
      </button>
    </div>
  );
};

export default DashboardHeaderActions;
