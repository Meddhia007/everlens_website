'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '@/context/LanguageContext';

interface FloatingItem {
  key: string;
  src: string;
  labelFr: string;
  labelEn: string;
  desktopClass: string;
  mobileClass: string;
  travel: number;
  labelPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  flipArrow?: boolean;
  upArrow?: boolean;
}

const DoodleArrow: React.FC<{ flip?: boolean; up?: boolean }> = ({ flip, up }) => (
  <svg
    viewBox="0 0 44 44"
    aria-hidden="true"
    className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 text-teal/90 inline-block pointer-events-none"
    style={{
      transform: `scaleX(${flip ? -1 : 1}) scaleY(${up ? 1 : -1})`,
    }}
  >
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9c9-3 17 1 21 8 1.6 2.8 2.3 6 2.2 9.6" />
      <path d="M21.6 22.4c1.9 1.8 4.1 3.4 5.6 4.6 1.4-2.2 3.1-4.4 4.8-6" />
    </g>
  </svg>
);

export const HangingStoryStage: React.FC = () => {
  const { language } = useLanguage();
  const stageRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const items: FloatingItem[] = [
    {
      key: 'camera',
      src: '/elements/camera.webp',
      labelFr: 'Le Regard Cinéma',
      labelEn: 'The Cinema Eye',
      desktopClass: 'w-[14vw] max-w-[240px] min-w-[130px] top-[14%] right-[8%] rotate-[6deg]',
      mobileClass: 'w-[130px] top-[10%] right-[3%] rotate-[6deg]',
      travel: 38,
      labelPosition: 'top-right',
      flipArrow: true,
      upArrow: false,
    },
    {
      key: 'robe',
      src: '/elements/robe.webp',
      labelFr: 'La Robe & Le Voile',
      labelEn: 'The Veil & Dress',
      desktopClass: 'w-[11vw] max-w-[180px] min-w-[100px] bottom-[10%] left-[12%] rotate-[-4deg]',
      mobileClass: 'w-[100px] bottom-[8%] left-[4%] rotate-[-4deg]',
      travel: 30,
      labelPosition: 'bottom-left',
      flipArrow: false,
      upArrow: true,
    },
    {
      key: 'beaute',
      src: '/elements/beaute.webp',
      labelFr: "L'Éclat & Henné",
      labelEn: 'Radiance & Henna',
      desktopClass: 'w-[14vw] max-w-[230px] min-w-[125px] top-[16%] left-[8%] rotate-[-6deg]',
      mobileClass: 'w-[120px] top-[12%] left-[3%] rotate-[-6deg]',
      travel: 32,
      labelPosition: 'top-left',
      flipArrow: false,
      upArrow: false,
    },
    {
      key: 'hammam',
      src: '/elements/hammam.webp',
      labelFr: 'El Hammam Précieux',
      labelEn: 'Sacred Hammam',
      desktopClass: 'w-[14vw] max-w-[220px] min-w-[120px] bottom-[12%] right-[10%] rotate-[4deg]',
      mobileClass: 'w-[115px] bottom-[10%] right-[4%] rotate-[4deg]',
      travel: 36,
      labelPosition: 'bottom-right',
      flipArrow: true,
      upArrow: true,
    },
    {
      key: 'invitation',
      src: '/elements/invitation.webp',
      labelFr: 'La Da3wa & Les Vœux',
      labelEn: 'Invitations & Vows',
      desktopClass: 'w-[12vw] max-w-[190px] min-w-[110px] bottom-[6%] left-[34%] rotate-[-8deg]',
      mobileClass: 'w-[105px] bottom-[4%] left-[28%] rotate-[-8deg]',
      travel: 34,
      labelPosition: 'bottom-left',
      flipArrow: false,
      upArrow: true,
    },
    {
      key: 'parfum',
      src: '/elements/parfum.webp',
      labelFr: "L'Essence & Bukhoor",
      labelEn: 'Essence & Bukhoor',
      desktopClass: 'w-[7vw] max-w-[110px] min-w-[70px] bottom-[8%] right-[32%] rotate-[7deg]',
      mobileClass: 'w-[68px] bottom-[5%] right-[26%] rotate-[7deg]',
      travel: 28,
      labelPosition: 'top-right',
      flipArrow: true,
      upArrow: false,
    },
    {
      key: 'jasmin',
      src: '/elements/jasmin.webp',
      labelFr: 'Jasmin de Carthage',
      labelEn: 'Carthage Jasmine',
      desktopClass: 'w-[6vw] max-w-[95px] min-w-[65px] top-[10%] right-[29%] rotate-[16deg]',
      mobileClass: 'w-[65px] top-[6%] right-[24%] rotate-[16deg]',
      travel: 46,
      labelPosition: 'top-right',
      flipArrow: true,
      upArrow: false,
    },
    {
      key: 'petales',
      src: '/elements/petales.webp',
      labelFr: '',
      labelEn: '',
      desktopClass: 'w-[6vw] max-w-[95px] min-w-[60px] top-[8%] left-[30%] rotate-[-14deg]',
      mobileClass: 'w-[60px] top-[5%] left-[24%] rotate-[-14deg]',
      travel: 50,
      labelPosition: 'top-left',
    },
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const stage = stageRef.current;
    if (!stage) return;

    const itemEls = stage.querySelectorAll<HTMLElement>('.hang-item');

    itemEls.forEach((item, idx) => {
      const travel = Number(item.dataset.travel || 35);
      const img = item.querySelector('img');
      const label = item.querySelector('.hang-label');

      // 1. Initial State: Invisible at scale 0
      gsap.set(item, { scale: 0, transformOrigin: 'center center' });

      // 2. Elastic Pop-Up Bounce on Scroll Trigger (Zayanni back.out effect!)
      gsap.to(item, {
        scale: 1,
        duration: 1.1,
        delay: (idx % 4) * 0.08,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: stage,
          start: 'top 75%',
          once: true,
        },
      });

      // 3. Label & Doodle Arrow fade-in slightly after the pop
      if (label) {
        gsap.fromTo(
          label,
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: 0.45 + (idx % 4) * 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: stage,
              start: 'top 75%',
              once: true,
            },
          }
        );
      }

      // 4. Continuous organic floating & bobbing
      if (img) {
        gsap.to(img, {
          y: idx % 2 === 0 ? -12 : 12,
          rotate: idx % 2 === 0 ? 1.6 : -1.6,
          duration: 4.8 + (idx % 5) * 0.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      // 5. Parallax Scroll Travel
      gsap.fromTo(
        item,
        { y: -travel },
        {
          y: travel,
          ease: 'none',
          scrollTrigger: {
            trigger: stage,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === stage) st.kill();
      });
    };
  }, []);

  return (
    <section
      ref={stageRef}
      id="experience-stage"
      className="relative min-h-[95vh] sm:min-h-[105vh] bg-[#0c100f] overflow-hidden flex flex-col justify-center items-center px-4 py-20 select-none"
    >
      {/* Radial Atmospheric Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-45"
        style={{
          background: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(67, 177, 159, 0.15) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Pinned / Centered Story Narrative */}
      <div
        ref={wrapRef}
        className="relative z-10 text-center flex flex-col items-center max-w-xl mx-auto px-4"
      >
        <p className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.26em] text-teal mb-4">
          {language === 'fr' ? 'Cinéma & Photographie d’Art' : 'Cinema & Fine-Art Photography'}
        </p>

        <h2 className="font-serif italic font-normal text-3xl sm:text-5xl lg:text-6xl text-cream leading-[1.08] mb-6">
          {language === 'fr'
            ? 'À quoi ressemble l’histoire de votre grand jour ?'
            : 'What does your wedding story feel like?'}
        </h2>

        <p className="text-xs sm:text-sm font-sans text-cream/70 max-w-md leading-relaxed mb-8">
          {language === 'fr'
            ? 'La robe, le regard ému, el hammam, les vœux sacrés et la fête : chaque instant réuni dans une œuvre cinématographique intemporelle.'
            : 'The gown, the stolen glances, sacred traditions, and unrepeatable celebration : reunited into one timeless cinematic legacy.'}
        </p>

        <Link
          href="#work"
          className="btn-shine inline-flex items-center gap-2 px-7 py-3 rounded-full bg-teal text-ink font-semibold text-xs sm:text-sm hover:bg-cream transition-all duration-300 shadow-[0_12px_30px_rgba(67,177,159,0.3)] hover:shadow-[0_16px_36px_rgba(67,177,159,0.45)] hover:-translate-y-0.5 active:scale-95"
        >
          <span>{language === 'fr' ? 'Composer Mon Mariage' : 'Curate My Wedding Story'}</span>
          <span className="text-base">→</span>
        </Link>
      </div>

      {/* Floating Artifacts Stage */}
      <div className="absolute inset-0 pointer-events-none max-w-7xl mx-auto" aria-hidden="true">
        {items.map((item) => {
          const label = language === 'fr' ? item.labelFr : item.labelEn;

          return (
            <div
              key={item.key}
              data-travel={item.travel}
              className={`hang-item absolute z-1 transition-opacity ${item.desktopClass}`}
            >
              {/* Image with Drop Shadow & Sinusoidal Bobbing */}
              <img
                src={item.src}
                alt=""
                className="w-full h-auto block filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.55)] select-none pointer-events-none"
                loading="lazy"
                decoding="async"
              />

              {/* Handwritten Note & Doodle Arrow */}
              {label && (
                <div
                  className={`hang-label absolute whitespace-nowrap font-handwriting text-base sm:text-xl text-teal font-semibold flex items-center gap-1.5 select-none ${
                    item.labelPosition === 'top-right'
                      ? '-top-7 -right-4 sm:-right-8'
                      : item.labelPosition === 'top-left'
                      ? '-top-7 -left-4 sm:-left-8'
                      : item.labelPosition === 'bottom-right'
                      ? '-bottom-7 -right-4 sm:-right-8'
                      : '-bottom-7 -left-4 sm:-left-8'
                  }`}
                >
                  {item.flipArrow ? (
                    <>
                      <span>{label}</span>
                      <DoodleArrow flip={item.flipArrow} up={item.upArrow} />
                    </>
                  ) : (
                    <>
                      <DoodleArrow flip={item.flipArrow} up={item.upArrow} />
                      <span>{label}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HangingStoryStage;
