'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export const MarqueeStrip: React.FC = () => {
  const { t } = useLanguage();

  return (
    <aside aria-label="Featured Commissions Marquee" className="bg-teal overflow-hidden py-4 relative z-2 select-none">
      <div
        className="flex w-[200%]"
        style={{ animation: 'marquee 22s linear infinite' }}
      >
        <div className="flex shrink-0 font-serif italic text-[18px] sm:text-[20px] text-ink whitespace-nowrap pr-11">
          {t.marquee.items}
        </div>
        <div className="flex shrink-0 font-serif italic text-[18px] sm:text-[20px] text-ink whitespace-nowrap pr-11">
          {t.marquee.items}
        </div>
        <div className="flex shrink-0 font-serif italic text-[18px] sm:text-[20px] text-ink whitespace-nowrap pr-11">
          {t.marquee.items}
        </div>
        <div className="flex shrink-0 font-serif italic text-[18px] sm:text-[20px] text-ink whitespace-nowrap pr-11">
          {t.marquee.items}
        </div>
      </div>
    </aside>
  );
};

export default MarqueeStrip;
