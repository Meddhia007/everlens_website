import React from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  href,
  className,
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out select-none text-left tracking-normal disabled:opacity-50 disabled:pointer-events-none rounded-[8px] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-xs sm:text-sm px-5 py-2.5',
    lg: 'text-sm sm:text-base px-7 py-3.5',
  };

  const variantStyles = {
    // Primary: subtle vertical teal gradient with ink text
    primary:
      'bg-gradient-to-b from-[#48C9B0] to-[#36998A] text-[#0B0F0E] shadow-sm hover:brightness-105 active:brightness-95',
    // Secondary: 1px border outline, transparent fill
    secondary:
      'border border-white/20 bg-transparent text-[#EAE8DA] hover:bg-white/[0.06] hover:border-teal/50 hover:text-white',
    // Ghost: subtle clean interaction
    ghost: 'bg-transparent text-[#9EABA2] hover:text-[#F4F3ED] hover:bg-white/[0.04]',
  };

  const combinedStyles = twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className));

  if (href) {
    return (
      <Link href={href} className={combinedStyles}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedStyles} {...props}>
      {children}
    </button>
  );
};

export default Button;
