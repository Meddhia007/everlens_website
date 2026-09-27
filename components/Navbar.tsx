'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: t.nav.work, href: '#work' },
    { label: t.nav.packs, href: '#packs' },
    { label: t.nav.equipment, href: '#equipment' },
    { label: t.nav.about, href: '#about' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-4 sm:px-8 md:px-12 py-3.5 sm:py-5 bg-ink/90 backdrop-blur-md border-b border-cream/5 transition-all">
        {/* Brand Logo Lockup */}
        <Link href="/" className="select-none leading-none group flex items-center">
          <img
            src="/logo.png"
            alt="EverLens Weddings"
            className="h-10 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Desktop Nav Links & Action Buttons */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          <nav className="flex items-center text-[13px] tracking-[0.04em] text-cream/80 font-sans">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="ml-6 lg:ml-8 relative py-1 text-cream/75 transition-colors hover:text-cream group"
              >
                <span>{link.label}</span>
                <span className="absolute left-0 bottom-0 w-0 h-[1.5px] bg-teal transition-all duration-300 ease-out group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Action Buttons: Contact & Client Portal Pills */}
          <div className="flex items-center gap-3">
            <Link
              href="#contact"
              className="rounded-full bg-white/10 hover:bg-teal hover:text-ink text-cream border border-white/15 hover:border-teal px-5 py-2 text-[13px] tracking-[0.03em] font-sans font-medium transition-all duration-300 shadow-xs cursor-pointer"
            >
              {t.nav.contact}
            </Link>
            <Link
              href="/portal"
              className="rounded-full bg-white/10 hover:bg-teal hover:text-ink text-cream border border-white/15 hover:border-teal px-5 py-2 text-[13px] tracking-[0.03em] font-sans font-medium transition-all duration-300 shadow-xs cursor-pointer"
            >
              {t.nav.portal}
            </Link>
          </div>
        </div>

        {/* Mobile Header Right: Hamburger */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="w-11 h-11 flex items-center justify-center -mr-2 text-cream hover:text-teal transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-between bg-ink text-cream animate-in fade-in duration-200">
          <div className="px-5 py-4 sm:px-6 sm:py-6 pt-[max(1rem,env(safe-area-inset-top))] flex items-center justify-between border-b border-cream/15">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="leading-none group flex items-center">
              <img
                src="/logo.png"
                alt="EverLens Weddings"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="w-11 h-11 flex items-center justify-center -mr-2 text-cream hover:text-teal transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 px-8 py-10 flex flex-col justify-center space-y-5 text-left">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-serif text-2xl sm:text-3xl text-cream hover:text-teal transition-colors pb-2 border-b border-cream/10 flex justify-between items-center"
              >
                <span>{link.label}</span>
                <span className="text-xs font-sans text-teal tracking-widest uppercase">→</span>
              </Link>
            ))}

            <Link
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-6 inline-block text-center rounded-full bg-teal text-ink font-semibold px-6 py-3.5 text-xs font-sans uppercase tracking-widest transition-colors shadow-sm"
            >
              {t.nav.contact}
            </Link>

            <Link
              href="/portal"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-block text-center border border-cream/20 text-cream/80 hover:border-teal hover:text-teal px-6 py-3 text-xs font-sans uppercase tracking-widest transition-colors rounded-full"
            >
              {t.nav.portal}
            </Link>
          </nav>

          <div className="p-6 border-t border-cream/10 text-center text-xs text-cream/40 font-sans pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {t.nav.tagline}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
