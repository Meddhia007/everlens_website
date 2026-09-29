'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '@/context/LanguageContext';

export const JourneyStepsSection: React.FC = () => {
  const { language } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const threadRef = useRef<SVGPathElement>(null);

  const steps = [
    {
      num: '1',
      titleFr: 'Racontez Votre Histoire',
      titleEn: 'Share Your Story',
      descFr: 'La date, les cérémonies, vos traditions et ce qui vous touche le plus. Un échange intime pour imaginer votre univers visuel.',
      descEn: 'The date, the ceremonies, your traditions, and what touches your soul. An intimate consultation to craft your visual universe.',
    },
    {
      num: '2',
      titleFr: 'Le Grand Jour — Discrétion Absolue',
      titleEn: 'The Wedding Day — Pure Discretion',
      descFr: 'Nous nous fondons parmi vos proches avec des optiques cinéma ultra-légères pour saisir la vérité pure sans jamais interrompre la magie.',
      descEn: 'We move seamlessly among your guests with ultra-light cinema optics to capture raw truth without ever breaking the magic.',
    },
    {
      num: '3',
      titleFr: 'Sanctuaire Privé & Film 4K',
      titleEn: 'Private Sanctuary & 4K Film',
      descFr: 'Accédez à votre galerie secrète haute résolution, commandez vos tirages d’art et revivez votre film de mariage pour l’éternité.',
      descEn: 'Access your private password-protected online sanctuary, order archival prints, and relive your 4K wedding film forever.',
    },
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const thread = threadRef.current;
    const stepsList = stepsRef.current;
    if (!section || !stepsList) return;

    const stepItems = stepsList.querySelectorAll('li');

    // 1. Thread draw-in / pulse
    if (thread) {
      gsap.fromTo(
        thread,
        { strokeDashoffset: 1000, opacity: 0 },
        {
          strokeDashoffset: 0,
          opacity: 0.85,
          duration: 2.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            once: true,
          },
        }
      );
    }

    // 2. Staggered step entrance
    gsap.fromTo(
      stepItems,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.2,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: stepsList,
          start: 'top 80%',
          once: true,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section || st.trigger === stepsList) st.kill();
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-ink-2 px-6 sm:px-12 py-24 sm:py-32 overflow-hidden border-t border-cream/5"
    >
      <div className="max-w-6xl mx-auto">
        <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.28em] text-teal mb-3">
          {language === 'fr' ? 'Le Parcours EverLens' : 'The EverLens Journey'}
        </p>

        <h2 className="font-serif italic font-normal text-3xl sm:text-5xl text-cream max-w-2xl leading-[1.1] mb-16 sm:mb-20">
          {language === 'fr'
            ? 'Trois pas, et vous vivez votre journée en toute sérénité.'
            : 'Three effortless steps, and your legacy is preserved.'}
        </h2>

        {/* Steps with Curved Dashed SVG Thread Line (Zayanni how__thread) */}
        <div className="relative mt-8">
          <svg
            className="pointer-events-none absolute inset-x-0 -top-6 hidden h-28 w-full lg:block"
            viewBox="0 0 1000 120"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              ref={threadRef}
              d="M40 84 C 190 24, 330 24, 500 62 S 800 100, 940 58"
              stroke="#43B19F"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="6 9"
              opacity="0.8"
            />
          </svg>

          <ol ref={stepsRef} className="relative grid gap-10 lg:grid-cols-3 lg:gap-8">
            {steps.map((step, idx) => (
              <li
                key={idx}
                className="group relative p-6 sm:p-7 rounded-[20px] bg-ink-3/60 border border-cream/10 hover:border-teal/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
              >
                {/* Number Badge */}
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink border border-teal/40 font-serif italic text-lg text-teal group-hover:scale-110 group-hover:bg-teal group-hover:text-ink transition-all duration-300 shadow-[0_0_15px_rgba(67,177,159,0.2)]">
                  {step.num}
                </span>

                <h3 className="mt-5 font-serif italic text-xl sm:text-2xl text-cream group-hover:text-teal transition-colors duration-300">
                  {language === 'fr' ? step.titleFr : step.titleEn}
                </h3>

                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-cream/70 font-sans">
                  {language === 'fr' ? step.descFr : step.descEn}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default JourneyStepsSection;
