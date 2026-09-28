'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Image as ImageIcon,
  PlayCircle,
  BookOpen,
  Download,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { clsx } from 'clsx';
import { PortalProvider, usePortalContext, PortalSection } from '@/components/portal/PortalContext';
import { formatEditorialDate } from '@/lib/date';

function PortalLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [clientInfo, setClientInfo] = useState<{
    coupleNames?: string;
    weddingDate?: string;
    clientEmail?: string;
  } | null>(null);
  const { activeSection, navigateToSection, albumCount } = usePortalContext();

  useEffect(() => {
    if (pathname !== '/portal/login') {
      const active = typeof window !== 'undefined' ? sessionStorage.getItem('everlens_client_active') : '1';
      if (!active) {
        // Tab was closed and reopened: expire cookie and redirect to login
        fetch('/api/auth/client/logout', { method: 'POST' }).finally(() => {
          window.location.href = '/portal/login';
        });
        return;
      }

      fetch('/api/auth/session')
        .then((res) => res.json())
        .then((data) => {
          if (data?.client) {
            setClientInfo(data.client);
          }
        })
        .catch(() => {});
    }
  }, [pathname]);

  // On login page, render clean full-width layout without sidebar/bottom nav
  if (pathname === '/portal/login') {
    return <>{children}</>;
  }

  const handleLogout = async (redirectTarget: string = '/portal/login') => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('everlens_client_active');
      }
      await fetch('/api/auth/client/logout', { method: 'POST' });
      window.location.href = redirectTarget;
    } catch {
      window.location.href = redirectTarget;
    }
  };

  const navItems: {
    id: PortalSection;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'photos', label: 'Photos', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'videos', label: 'Videos', icon: <PlayCircle className="w-4 h-4" /> },
    {
      id: 'album',
      label: 'Album',
      icon: <BookOpen className="w-4 h-4" />,
      badge: albumCount > 0 ? albumCount : undefined,
    },
    { id: 'downloads', label: 'Downloads', icon: <Download className="w-4 h-4" /> },
  ];

  const handleNavClick = (sectionId: PortalSection, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    navigateToSection(sectionId);
  };

  const coupleNamesDisplay = clientInfo?.coupleNames || 'Sarah & Youssef';
  const weddingDateDisplay = clientInfo?.weddingDate
    ? formatEditorialDate(clientInfo.weddingDate)
    : '12 May 2024';

  return (
    <div className="min-h-screen bg-[#0F1413] text-[#EAE8DA] font-sans antialiased">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-[#171D1C] border-r border-[#EAE8DA]/10 fixed inset-y-0 left-0 select-none z-30 overflow-y-auto">
        <div>
          {/* Studio Brand */}
          <div className="p-7 pb-6 border-b border-[#EAE8DA]/10">
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <span className="font-serif text-[22px] tracking-[0.08em] font-medium text-[#EAE8DA] uppercase block group-hover:text-[#43B19F] transition-colors">
                EVERLENS
              </span>
              <span className="font-script text-[14px] text-[#43B19F] block -mt-1 font-normal">
                Weddings
              </span>
            </button>

            {/* Couple Names & Date */}
            <div className="mt-5 space-y-0.5">
              <h2 className="font-serif text-[15px] font-medium text-[#EAE8DA] tracking-tight">
                {coupleNamesDisplay}
              </h2>
              <p className="text-[12px] font-sans text-[#EAE8DA]/50 tracking-wide">
                {weddingDateDisplay}
              </p>
            </div>
          </div>

          {/* Core Navigation (5 sections only) */}
          <nav className="p-4 space-y-1" aria-label="Client Portal Navigation">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={clsx(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xs text-[13px] font-medium tracking-wide transition-all duration-200 cursor-pointer text-left',
                    isActive
                      ? 'bg-[#43B19F] text-[#0F1413] font-semibold shadow-xs'
                      : 'text-[#EAE8DA]/70 hover:text-[#EAE8DA] hover:bg-[#1D2422]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-[#0F1413]' : 'text-[#43B19F]'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={clsx(
                        'text-[10px] font-mono px-2 py-0.5 rounded-full',
                        isActive
                          ? 'bg-[#0F1413]/20 text-[#0F1413]'
                          : 'bg-[#43B19F]/20 text-[#43B19F]'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Exit Links */}
        <div className="p-5 border-t border-[#EAE8DA]/10 space-y-1.5 shrink-0 bg-[#171D1C]">
          <button
            type="button"
            onClick={() => handleLogout('/')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-[#EAE8DA]/60 hover:text-[#43B19F] transition-colors rounded-xs cursor-pointer text-left"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Return to Website</span>
          </button>
          <button
            type="button"
            onClick={() => handleLogout('/portal/login')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-[#EAE8DA]/60 hover:text-[#EAE8DA] hover:bg-[#1D2422] transition-colors rounded-xs cursor-pointer text-left"
          >
            <LogOut className="w-3.5 h-3.5 text-[#43B19F]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div
        id="portal-main-container"
        className="min-h-screen flex flex-col min-w-0 md:pl-64 bg-[#0F1413]"
      >
        {/* Mobile Minimal Top Bar */}
        <header className="md:hidden flex items-center justify-between px-5 py-4 bg-[#171D1C]/90 backdrop-blur-md border-b border-[#EAE8DA]/10 sticky top-0 z-30">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="text-left cursor-pointer"
          >
            <span className="font-serif text-[17px] tracking-[0.06em] font-medium text-[#EAE8DA] uppercase block">
              EVERLENS
            </span>
            <span className="text-[11px] text-[#EAE8DA]/60 block -mt-0.5 font-sans">
              {coupleNamesDisplay}
            </span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleLogout('/')}
              className="text-[11px] font-sans text-[#EAE8DA]/60 hover:text-[#43B19F] transition-colors cursor-pointer"
            >
              Website
            </button>
            <button
              type="button"
              onClick={() => handleLogout('/portal/login')}
              className="text-[11px] font-sans text-[#43B19F] hover:text-[#EAE8DA] transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Content Container (padded, bottom spacing for mobile nav) */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-5 sm:p-8 lg:p-10 pb-28 md:pb-12">
          {children}
        </main>
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#171D1C]/95 backdrop-blur-lg border-t border-[#EAE8DA]/10 flex items-center justify-around py-2 px-1 safe-bottom shadow-2xl"
        aria-label="Mobile Navigation"
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={clsx(
                'flex-1 flex flex-col items-center justify-center py-1.5 px-1 relative transition-colors cursor-pointer select-none',
                isActive ? 'text-[#43B19F]' : 'text-[#EAE8DA]/55 hover:text-[#EAE8DA]'
              )}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#43B19F] text-[#0F1413] text-[9px] font-mono font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={clsx(
                  'text-[10px] tracking-wide mt-1 font-sans',
                  isActive ? 'font-semibold text-[#43B19F]' : 'font-normal'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalProvider>
      <PortalLayoutInner>{children}</PortalLayoutInner>
    </PortalProvider>
  );
}
