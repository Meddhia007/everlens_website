'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useAdminModal } from './AdminModalContext';

interface NewGalleryButtonProps {
  className?: string;
  variant?: 'primary' | 'subtle';
}

export const NewGalleryButton: React.FC<NewGalleryButtonProps> = ({
  className,
  variant = 'primary',
}) => {
  const { openNewGallery } = useAdminModal();

  return (
    <button
      type="button"
      onClick={openNewGallery}
      className={
        className ||
        'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0B0F0E] font-medium text-xs shadow-sm hover:brightness-105 active:scale-[0.97] transition-all duration-150 ease-out cursor-pointer'
      }
    >
      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      <span>New Gallery</span>
    </button>
  );
};

export default NewGalleryButton;
