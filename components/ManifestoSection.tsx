'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '@/context/LanguageContext';

export const ManifestoSection: React.FC = () => {
  const { language } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);

  const quote =
    language === 'fr'
      ? 'Un mariage n’est pas une simple suite d’heures programmées. C’est une histoire vivante — et aucune mariée, aucun couple ne devrait revivre son plus beau jour à travers des souvenirs morcelés. Nous capturons le battement de cœur authentique de votre union.'
      : 'A wedding is not merely a sequence of scheduled hours. It is a living story — and no couple should look back on their most sacred day through fragmented memories. We preserve the authentic heartbeat of your love story in timeless cinema.';

  const words = quote.split(' ');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const rule = ruleRef.current;
    const textEl = textRef.current;
    const subtext = subtextRef.current;
    if (!section || !textEl) return;

    const wordSpans = textEl.querySelectorAll<HTMLSpanElement>('.manifesto-word');

    // Rule expanding animation
    if (rule) {
      gsap.fromTo(
        rule,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            once: true,
          },
        }
      );
    }

    // Word-by-word scroll illumination (Zayanni scrub effect)
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 55%',
        end: 'bottom 85%',
        scrub: 0.6,
      },
    });

    tl.to(wordSpans, {
      opacity: 1,
      color: '#EAE8DA',
      textShadow: '0 0 18px rgba(67, 177, 159, 0.35)',
      stagger: 0.2,
      ease: 'none',
    });

    if (subtext) {
      tl.to(
        subtext,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
        },
        '-=0.2'
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });
    };
  }, [language, quote]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[165svh] bg-gradient-to-b from-ink via-ink-2 to-ink px-6 sm:px-12 flex justify-center text-center selection:bg-teal selection:text-ink"
    >
      <div className="sticky top-0 h-[100svh] max-w-4xl flex flex-col justify-center items-center pointer-events-none">
        {/* Expanding Accent Rule */}
        <div
          ref={ruleRef}
          className="w-28 h-[1px] mb-8 bg-gradient-to-r from-transparent via-teal to-transparent"
        />

        {/* Small Tagline */}
        <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.28em] text-teal/80 mb-6">
          {language === 'fr' ? 'Notre Philosophie' : 'Our Philosophy'}
        </p>

        {/* Word-by-word Illuminated Manifesto Text */}
        <p
          ref={textRef}
          className="font-serif italic font-normal text-[1.65rem] sm:text-3xl md:text-[2.65rem] leading-[1.3] text-cream/30"
        >
          {words.map((word, idx) => (
            <span
              key={`${word}-${idx}`}
              className="manifesto-word inline-block opacity-20 transition-colors duration-150 mr-[0.26em]"
            >
              {word}
            </span>
          ))}
        </p>

        {/* Subtitle Fade In */}
        <p
          ref={subtextRef}
          className="mt-8 text-xs sm:text-sm font-sans tracking-[0.06em] text-cream/60 max-w-lg opacity-0 translate-y-3"
        >
          {language === 'fr'
            ? 'Documenté avec une discrétion absolue. Réalisé comme une œuvre de cinéma.'
            : 'Documented with utter discretion. Crafted as timeless cinematic art.'}
        </p>
      </div>
    </section>
  );
};

export default ManifestoSection;
