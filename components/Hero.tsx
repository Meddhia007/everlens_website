'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export const Hero: React.FC = () => {
  const { t } = useLanguage();

  const handleScrollToPortfolio = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById('work') || document.getElementById('portfolio');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', '#work');
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden flex flex-col justify-end text-left select-none pt-28 sm:pt-32 pb-16 sm:pb-20">
      {/* Ambient Animated Ken Burns Radial Gradient & Subtle Reel Texture */}
      <div
        className="absolute -inset-[5%] z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, #26312e 0%, #12181A 55%, #0a0d0c 100%)',
          animation: 'kenburns 22s ease-in-out infinite alternate',
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2400&q=80"
          alt="Atmospheric wedding cinematic background"
          className="w-full h-full object-cover opacity-20 mix-blend-luminosity"
        />
      </div>

      {/* Cinematic Vignette Gradient Overlay */}
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(15,20,19,0.15) 0%, rgba(15,20,19,0.85) 100%)',
        }}
      />

      {/* Hero Content */}
      <div className="relative z-2 px-5 sm:px-14 pb-8 sm:pb-12 w-full max-w-6xl">
        {/* Eyebrow */}
        <div className="text-[11px] sm:text-[12px] tracking-[0.22em] text-teal mb-4 sm:mb-5 flex items-center gap-3 font-sans uppercase">
          <span className="w-7 sm:w-8.5 h-[1px] bg-teal inline-block" />
          <span>{t.hero.eyebrow}</span>
        </div>

        {/* Kinetic Title */}
        <h1 className="kinetic font-serif font-normal">
          <span><i>{t.hero.title_line1}</i></span><br />
          <span><i>{t.hero.title_line2}</i></span><br />
          <span><i>{t.hero.title_line3}</i></span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-[540px] text-xs sm:text-sm md:text-base text-cream/70 mt-5 sm:mt-6 leading-[1.6] opacity-0 [animation:fadeIn_1s_ease_forwards] [animation-delay:1.1s] font-sans">
          {t.hero.subtitle}
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8 opacity-0 [animation:fadeIn_1s_ease_forwards] [animation-delay:1.3s]">
          <a
            href="#work"
            onClick={handleScrollToPortfolio}
            className="btn btn-fill cursor-pointer"
          >
            <span>{t.hero.cta_reel}</span>
          </a>
          <Link href="#contact" className="btn btn-outline">
            {t.hero.cta_availability}
          </Link>
        </div>
      </div>

      {/* Dripping Scroll Cue */}
      <div className="hidden sm:flex absolute bottom-6 left-6 sm:left-14 z-2 text-[10px] tracking-[0.15em] text-cream/50 items-center gap-2.5 font-mono select-none">
        <div className="w-[1px] h-8 sm:h-9 bg-cream/30 relative overflow-hidden">
          <div
            className="absolute top-[-100%] left-0 w-full h-full bg-teal"
            style={{ animation: 'scrollDrip 1.8s ease-in-out infinite' }}
          />
        </div>
        <span>{t.hero.scroll}</span>
      </div>
    </section>
  );
};

export default Hero;
