'use client';

import React from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface LogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg' | 'display';
  theme?: 'default' | 'on-dark';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  href = '/',
  size = 'md',
  theme = 'on-dark',
  className,
}) => {
  const sizeMap = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-11',
    lg: 'h-14 sm:h-16',
    display: 'h-20 sm:h-24',
  };

  const selectedHeight = sizeMap[size];

  const content = (
    <div
      className={twMerge(
        clsx(
          'inline-flex items-center select-none group',
          className
        )
      )}
    >
      <img
        src="/logo.png"
        alt="EverLens Weddings"
        className={clsx(
          selectedHeight,
          'w-auto object-contain transition-transform duration-300 group-hover:scale-105'
        )}
      />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
        aria-label="EverLens Weddings Home"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
