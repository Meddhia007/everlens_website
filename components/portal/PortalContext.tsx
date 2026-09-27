'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type PortalSection = 'home' | 'photos' | 'videos' | 'album' | 'downloads';

interface PortalContextType {
  activeSection: PortalSection;
  setActiveSection: (section: PortalSection) => void;
  navigateToSection: (section: PortalSection) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  albumCount: number;
  setAlbumCount: (count: number) => void;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export const PortalProvider: React.FC<{
  children: React.ReactNode;
  initialSection?: PortalSection;
  initialLocked?: boolean;
}> = ({ children, initialSection = 'home', initialLocked = false }) => {
  const [activeSection, setActiveSection] = useState<PortalSection>(initialSection);
  const [isLocked, setIsLocked] = useState<boolean>(initialLocked);
  const [albumCount, setAlbumCount] = useState<number>(0);

  // Sync with URL hash or search params on mount and on hash changes
  useEffect(() => {
    const handleUrlSync = () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash.toLowerCase().replace('#', '');
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab') || searchParams.get('view');

      const target = hash || tabParam;

      if (target === 'photos') {
        setActiveSection('photos');
      } else if (target === 'videos' || target === 'films') {
        setActiveSection('videos');
      } else if (
        target === 'album' ||
        target === 'prints' ||
        target === 'print' ||
        target === 'print-selection'
      ) {
        setActiveSection('album');
      } else if (target === 'downloads' || target === 'download') {
        setActiveSection('downloads');
      } else if (target === 'home' || target === 'overview') {
        setActiveSection('home');
      }
    };

    handleUrlSync();
    window.addEventListener('hashchange', handleUrlSync);
    window.addEventListener('popstate', handleUrlSync);

    return () => {
      window.removeEventListener('hashchange', handleUrlSync);
      window.removeEventListener('popstate', handleUrlSync);
    };
  }, []);

  const navigateToSection = useCallback((section: PortalSection) => {
    setActiveSection(section);

    if (typeof window !== 'undefined') {
      const newHash = section === 'home' ? '' : `#${section}`;
      const newUrl = `${window.location.pathname}${newHash}`;
      window.history.pushState(null, '', newUrl);

      // Scroll smoothly to top of portal container
      const container = document.getElementById('portal-main-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <PortalContext.Provider
      value={{
        activeSection,
        setActiveSection,
        navigateToSection,
        isLocked,
        setIsLocked,
        albumCount,
        setAlbumCount,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export function usePortalContext(): PortalContextType {
  const context = useContext(PortalContext);
  if (!context) {
    return {
      activeSection: 'home',
      setActiveSection: () => {},
      navigateToSection: (sec) => {
        if (typeof window !== 'undefined') {
          window.location.hash = sec === 'home' ? '' : `#${sec}`;
        }
      },
      isLocked: false,
      setIsLocked: () => {},
      albumCount: 0,
      setAlbumCount: () => {},
    };
  }
  return context;
}
