'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { clsx } from 'clsx';

interface HeartToggleProps {
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
  isCapReached?: boolean;
  onCapReachedNotice?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const HeartToggle: React.FC<HeartToggleProps> = ({
  isSelected,
  onToggle,
  disabled = false,
  isCapReached = false,
  onCapReachedNotice,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const [isPulsing, setIsPulsing] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Never trigger parent card/lightbox navigation

    if (disabled) return;

    if (!isSelected && isCapReached) {
      if (onCapReachedNotice) {
        onCapReachedNotice();
      }
      return;
    }

    // Trigger scale-pulse animation
    setIsPulsing(true);
    setTimeout(() => {
      setIsPulsing(false);
    }, 360);

    onToggle();
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const buttonSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const isBlocked = disabled || (!isSelected && isCapReached);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isSelected ? 'Remove from print album' : 'Select for print album'}
      aria-pressed={isSelected}
      disabled={disabled}
      title={
        isBlocked && !isSelected
          ? 'Print limit reached — remove one to add another'
          : isSelected
          ? 'Selected for print album (click to remove)'
          : 'Select for print album'
      }
      className={clsx(
        'group/heart relative rounded-full transition-all duration-200 flex items-center gap-1.5 focus:outline-none select-none',
        buttonSizes[size],
        isSelected
          ? 'bg-cream text-terracotta shadow-md hover:bg-cream-50'
          : isBlocked
          ? 'bg-black/25 text-white/40 cursor-not-allowed opacity-50'
          : 'bg-black/35 backdrop-blur-xs text-white/80 hover:text-white hover:bg-black/55 shadow-xs',
        className
      )}
    >
      <Heart
        className={clsx(
          iconSizes[size],
          'transition-transform duration-200',
          isSelected ? 'fill-terracotta text-terracotta stroke-terracotta' : 'fill-transparent stroke-current',
          isPulsing && 'animate-heart-pulse'
        )}
      />
      {showLabel && (
        <span
          className={clsx(
            'text-xs font-sans font-medium pr-1',
            isSelected ? 'text-terracotta' : 'text-white/80 group-hover/heart:text-white'
          )}
        >
          {isSelected ? 'Selected for Print' : 'Select for Print'}
        </span>
      )}
    </button>
  );
};

export default HeartToggle;
