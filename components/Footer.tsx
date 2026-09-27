import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer>
      <div>
        <Link href="/" className="inline-flex items-center select-none leading-none group">
          <img
            src="/logo.png"
            alt="EverLens Weddings"
            className="h-10 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      </div>
      <div className="foot-contact flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-center text-xs sm:text-sm">
        <a href="mailto:everlensweddings@gmail.com" className="hover:text-teal transition-colors break-all">
          everlensweddings@gmail.com
        </a>
        <span className="hidden sm:inline opacity-40">·</span>
        <a href="tel:+21626555785" className="hover:text-teal transition-colors">
          +216 26 555 785
        </a>
      </div>
    </footer>
  );
};

export default Footer;
