'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  Film,
  Video,
  Gem,
  Crown,
  Sparkles,
  Check,
  Clapperboard,
  ArrowRight,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { initialServices } from '@/lib/initialData';
import { useLanguage } from '@/context/LanguageContext';

const ICON_MAP: Record<string, React.ElementType> = {
  Camera,
  Film,
  Video,
  Gem,
  Crown,
  Sparkles,
};

export interface PackItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  price?: string;
  description?: string;
  features?: string[];
  options?: string[];
  icon: string | React.ElementType;
  order?: number;
}

export type ServiceItem = PackItem;

export const packsData: PackItem[] = initialServices.map((item, idx) => ({
  id: `pack-${idx + 1}`,
  title: item.title,
  subtitle: item.subtitle,
  badge: item.badge,
  price: item.price,
  description: item.description,
  features: item.features,
  options: item.options,
  icon: item.icon,
  order: item.order,
}));

export const servicesData = packsData;

export const ServicesSection: React.FC = () => {
  const { language, t } = useLanguage();
  const [packs, setPacks] = useState<PackItem[]>(packsData);

  useEffect(() => {
    fetch('/api/public/services')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const items = data?.packs || data?.services;
        if (items && Array.isArray(items) && items.length > 0) {
          const validPacks = items.filter(
            (p: any) =>
              !String(p.title).toLowerCase().includes('wedding photography') &&
              !String(p.title).toLowerCase().includes('cinematic wedding films') &&
              !String(p.title).toLowerCase().includes('aerial cinematography')
          );
          if (validPacks.length > 0) {
            setPacks(validPacks);
          }
        }
      })
      .catch((err) => {
        console.warn('Using preset packs data:', err);
      });
  }, []);

  const handleSelectPack = (packTitle: string) => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });

      setTimeout(() => {
        const select = document.querySelector('select[name="packageInterest"]') as HTMLSelectElement | null;
        if (select) {
          for (let i = 0; i < select.options.length; i++) {
            if (
              select.options[i].text.toLowerCase().includes(packTitle.toLowerCase()) ||
              select.options[i].value.toLowerCase().includes(packTitle.toLowerCase())
            ) {
              select.selectedIndex = i;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              break;
            }
          }
        }
      }, 500);
    }
  };

  return (
    <section id="packs" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 relative z-10 bg-[#EAE8DA] text-[#0F1413]">
      {/* Anchor for backward compatibility with #services */}
      <span id="services" className="-top-24 relative block" />

      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#184841]/10 border border-[#184841]/20 text-[#184841] text-[11px] font-mono tracking-widest uppercase mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#246A60] animate-pulse" />
            <span>{t.packs.tag}</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#0F1413] font-medium tracking-tight">
            {t.packs.title}
          </h2>

          <p className="font-script text-2xl sm:text-3xl text-[#246A60] font-normal">
            {t.packs.subtitle}
          </p>

          <p className="text-xs sm:text-sm text-[#0F1413]/70 font-sans leading-relaxed max-w-xl mx-auto">
            {t.packs.desc}
          </p>
        </div>

        {/* 4-Packs Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {packs.map((pack, idx) => {
            const presetPack = t.packs.preset_packs[idx];
            const displayTitle = language === 'en' && presetPack ? presetPack.title : pack.title;
            const displaySubtitle = language === 'en' && presetPack ? presetPack.subtitle : pack.subtitle;
            const displayPrice = language === 'en' ? t.packs.price_on_request : pack.price || t.packs.price_on_request;
            const displayFeatures = language === 'en' && presetPack ? presetPack.features : pack.features || [];
            const displayOptions = language === 'en' && presetPack ? presetPack.options : pack.options || [];

            const IconComponent =
              typeof pack.icon === 'string'
                ? ICON_MAP[pack.icon] || Camera
                : pack.icon || Camera;

            const isBestOffer =
              pack.badge?.toLowerCase().includes('meilleure') ||
              pack.badge?.toLowerCase().includes('best') ||
              idx === 2;

            const isSignature =
              pack.badge?.toLowerCase().includes('signature') ||
              pack.badge?.toLowerCase().includes('premium') ||
              idx === 3;

            const displayBadge = isBestOffer
              ? t.packs.best_value_badge
              : isSignature
              ? t.packs.signature_badge
              : pack.badge;

            return (
              <div
                key={pack.id || `pack-${idx}`}
                className={`relative flex flex-col justify-between rounded-[26px] p-6 sm:p-7 transition-all duration-300 group select-none ${
                  isBestOffer
                    ? 'bg-white border-2 border-[#D4A359] shadow-[0_8px_30px_rgba(212,163,89,0.22)] hover:shadow-[0_12px_40px_rgba(212,163,89,0.3)]'
                    : isSignature
                    ? 'bg-white border-2 border-[#1E524A]/60 shadow-[0_8px_30px_rgba(30,82,74,0.16)] hover:border-[#1E524A]'
                    : 'bg-[#FAF9F5] border-[1.5px] border-[#2A655C]/35 hover:border-[#2A655C] shadow-[0_4px_20px_rgba(20,62,56,0.06)] hover:shadow-[0_10px_30px_rgba(20,62,56,0.12)]'
                }`}
              >
                {/* Floating Badge (e.g. MEILLEURE OFFRE / BEST VALUE) */}
                {displayBadge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                    <span
                      className={`text-[10px] font-sans font-bold tracking-widest uppercase px-4 py-1 rounded-full shadow-md whitespace-nowrap border ${
                        isBestOffer
                          ? 'bg-gradient-to-r from-[#C9974B] via-[#E2B76D] to-[#BA883C] text-white border-[#F3DBA8]'
                          : 'bg-gradient-to-r from-[#173F39] to-[#2B6D62] text-white border-white/20'
                      }`}
                    >
                      {displayBadge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Icon Emblem */}
                  <div className="pt-2 flex justify-center">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-xs ${
                        isBestOffer
                          ? 'bg-[#FBF6ED] text-[#B8873B] border border-[#D4A359]/30'
                          : isSignature
                          ? 'bg-[#E8F1EF] text-[#1E524A] border border-[#1E524A]/30'
                          : 'bg-[#EBF3F1] text-[#246A60] border border-[#246A60]/20'
                      }`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Pack Title & Subtitle */}
                  <div className="text-center mt-5 space-y-1">
                    <h3 className="font-serif text-lg sm:text-xl text-[#143E38] font-bold tracking-tight uppercase">
                      {displayTitle}
                    </h3>
                    {displaySubtitle && (
                      <p className="text-xs font-sans text-[#A07A3E] font-medium tracking-wide">
                        {displaySubtitle}
                      </p>
                    )}
                  </div>

                  {/* Price Tag */}
                  <div className="mt-4 pt-3 border-t border-[#0F1413]/10 text-center">
                    <span className="text-xs font-sans tracking-wider uppercase text-[#0F1413]/55 font-medium">
                      {displayPrice}
                    </span>
                  </div>

                  {/* Included Features List */}
                  <div className="mt-6 space-y-2.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#0F1413]/50 font-semibold block">
                      {t.packs.included_label}
                    </span>
                    <ul className="space-y-2">
                      {displayFeatures.map((feat, fIdx) => {
                        const isVideo =
                          feat.toLowerCase().includes('vidéo') ||
                          feat.toLowerCase().includes('video') ||
                          feat.toLowerCase().includes('film') ||
                          feat.toLowerCase().includes('reel') ||
                          feat.toLowerCase().includes('aftermovie');

                        return (
                          <li
                            key={fIdx}
                            className="flex items-start gap-2.5 text-xs text-[#0F1413]/85 font-sans leading-relaxed"
                          >
                            <span className="mt-0.5 w-4 h-4 rounded-full bg-[#E5F2EF] text-[#246A60] flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                            </span>
                            <span className="flex-1">
                              {feat}
                              {isVideo && (
                                <Clapperboard className="w-3 h-3 text-[#246A60]/75 inline-block ml-1.5 -mt-0.5" />
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Options List */}
                  {displayOptions.length > 0 ? (
                    <div className="mt-5 pt-4 border-t border-dashed border-[#0F1413]/15 space-y-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#9C7536] font-bold block">
                        {t.packs.options_label}
                      </span>
                      <ul className="space-y-1.5">
                        {displayOptions.map((opt, oIdx) => (
                          <li
                            key={oIdx}
                            className="flex items-center gap-2 text-[11px] text-[#0F1413]/75 font-sans"
                          >
                            <span className="text-[#B68943] font-bold text-xs">+</span>
                            <span>{opt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : isSignature ? (
                    <div className="mt-5 pt-4 border-t border-dashed border-[#0F1413]/15 text-center py-1">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#246A60] font-semibold block">
                        {language === 'fr' ? '★ Formule intégrale tout inclus' : '★ Comprehensive all-inclusive collection'}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Bottom Action Button */}
                <div className="mt-7 pt-4 border-t border-[#0F1413]/10">
                  <button
                    type="button"
                    onClick={() => handleSelectPack(displayTitle)}
                    className={`w-full py-2.5 px-4 rounded-full text-xs font-sans font-semibold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                      isBestOffer
                        ? 'bg-[#246A60] text-white hover:bg-[#1A524A] shadow-md'
                        : 'bg-transparent border border-[#246A60]/50 text-[#1A524A] hover:bg-[#246A60] hover:text-white'
                    }`}
                  >
                    <span>{language === 'fr' ? 'Choisir ce pack' : 'Select this collection'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner matching Brochure Notice */}
        <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-[#173F39] via-[#1E524A] to-[#173F39] text-[#FAF8F2] border border-[#2B6D62]/40 text-center space-y-4 shadow-xl">
          <div className="space-y-1">
            <h4 className="font-serif text-xl sm:text-2xl text-white font-medium tracking-tight uppercase">
              {language === 'fr' ? 'Réservez Votre Date 2026 Dès Maintenant' : 'Reserve Your 2026 Celebration Date'}
            </h4>
            <p className="font-script text-xl sm:text-2xl text-[#A7DDD4]">
              {language === 'fr'
                ? 'Tarifs sur demande · Calendrier exclusif & places limitées'
                : 'Pricing upon request · Limited calendar & exclusive dates'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="tel:+21626555785"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-sans hover:bg-white/20 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#A7DDD4]" />
              <span>+216 26 555 785</span>
            </a>
            <a
              href="https://wa.me/21626555785"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 text-[#D2F9E1] text-xs font-sans hover:bg-[#25D366]/30 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>{language === 'fr' ? 'WhatsApp Direct' : 'Direct WhatsApp'}</span>
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FAF8F2] text-[#173F39] font-bold text-xs font-sans uppercase tracking-wider hover:bg-white transition-colors shadow-sm"
            >
              <span>{language === 'fr' ? 'Demander un devis' : 'Request a Quote'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#173F39]" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
