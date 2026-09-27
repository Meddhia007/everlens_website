'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, Translations, translations } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  isHydrated: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'everlens_lang';
const COOKIE_KEY = 'everlens_lang';

/**
 * Robust language detection from browser / phone settings.
 * Checks localStorage -> cookie -> navigator.languages -> navigator.language.
 */
function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  // Detect automatically from phone or browser language settings
  try {
    const languages = navigator.languages || [
      navigator.language || (navigator as any).userLanguage || '',
    ];
    for (const lang of languages) {
      if (!lang) continue;
      const lower = lang.toLowerCase().trim();
      if (lower.startsWith('fr') || lower.startsWith('ar')) return 'fr';
      if (lower.startsWith('en')) return 'en';
    }
  } catch (_) {
    // Fallback if navigator is restricted
  }

  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    const detected = detectInitialLanguage();
    setLanguageState(detected);
    setIsHydrated(true);

    if (typeof document !== 'undefined') {
      document.documentElement.lang = detected;
    }
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);

    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.cookie = `${COOKIE_KEY}=${newLang};path=/;max-age=31536000;SameSite=Lax`;
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLang;
      }
    } catch (_) {
      // Ignore storage errors
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  }, [language, setLanguage]);

  const activeTranslations = translations[language] || translations.en;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t: activeTranslations,
        isHydrated,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
