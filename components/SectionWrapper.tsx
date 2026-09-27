import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SectionWrapperProps {
  as?: 'section' | 'div' | 'header' | 'footer';
  background?: 'cream' | 'cream-deep';
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
  id?: string;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
  as: Component = 'section',
  background = 'cream',
  className,
  containerClassName,
  children,
  id,
}) => {
  const bgStyles = {
    cream: 'bg-cream text-ink',
    'cream-deep': 'bg-cream-deep text-ink',
  };

  return (
    <Component
      id={id}
      className={twMerge(
        clsx(
          'w-full py-16 md:py-24 transition-colors',
          bgStyles[background],
          className
        )
      )}
    >
      <div
        className={twMerge(
          clsx(
            'max-w-7xl mx-auto px-6 sm:px-8 md:px-12',
            containerClassName
          )
        )}
      >
        {children}
      </div>
    </Component>
  );
};

export default SectionWrapper;
