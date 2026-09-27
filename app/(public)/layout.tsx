import React from 'react';
import { LanguageProvider } from '@/context/LanguageContext';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-ink text-cream">{children}</div>
    </LanguageProvider>
  );
}
