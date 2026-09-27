import React from 'react';
import { clsx } from 'clsx';
import { GalleryStatus } from '@/models/Gallery';

interface StatusDotProps {
  status: GalleryStatus;
  className?: string;
  showLabel?: boolean;
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  className,
  showLabel = true,
}) => {
  const config = {
    draft: {
      dotColor: 'bg-white/40',
      label: 'Draft',
      textColor: 'text-[#9EABA2]',
    },
    active: {
      dotColor: 'bg-teal shadow-[0_0_6px_rgba(67,177,159,0.8)]',
      label: 'Active',
      textColor: 'text-teal font-medium',
    },
    archived: {
      dotColor: 'bg-amber-400/80 shadow-[0_0_6px_rgba(251,191,36,0.5)]',
      label: 'Archived',
      textColor: 'text-amber-300 font-medium',
    },
  }[status] || {
    dotColor: 'bg-white/30',
    label: status,
    textColor: 'text-[#9EABA2]',
  };

  return (
    <span className={clsx('inline-flex items-center gap-2 select-none', className)}>
      <span
        className={clsx('w-2 h-2 rounded-full flex-shrink-0', config.dotColor)}
        aria-hidden="true"
      />
      {showLabel && (
        <span className={clsx('text-xs font-sans font-medium', config.textColor)}>
          {config.label}
        </span>
      )}
    </span>
  );
};

export default StatusDot;
