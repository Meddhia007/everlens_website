'use client';

import React from 'react';
import { useBooking } from '@/context/BookingContext';
import { useLanguage } from '@/context/LanguageContext';

export interface WhatsAppButtonProps {
  phoneNumber?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '21626555785',
}) => {
  const { eventDate } = useBooking();
  const { language, t } = useLanguage();

  const hasDate = Boolean(eventDate && eventDate.trim());
  const formattedDate = hasDate ? eventDate!.trim() : '';

  const message = hasDate
    ? (language === 'fr'
        ? `Bonjour EverLens Weddings, j'aimerais vérifier vos disponibilités pour mon mariage le ${formattedDate}.`
        : `Hello EverLens Weddings, I'd like to check availability for my wedding on ${formattedDate}.`)
    : (language === 'fr'
        ? `Bonjour EverLens Weddings, j'aimerais vérifier vos disponibilités et discuter de vos formules de mariage.`
        : `Hello EverLens Weddings, I'd like to check availability and discuss your wedding collections.`);

  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const whatsappHref = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

  return (
    <aside
      aria-label="WhatsApp Studio Contact"
      className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-45 pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)]"
    >
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={
          hasDate
            ? (language === 'fr'
                ? `Discuter avec EverLens Weddings sur WhatsApp : disponibilité pour le ${formattedDate}`
                : `Chat with EverLens Weddings on WhatsApp: availability for ${formattedDate}`)
            : (language === 'fr'
                ? 'Discuter avec EverLens Weddings sur WhatsApp'
                : 'Chat with EverLens Weddings on WhatsApp')
        }
        className="relative flex items-center justify-center w-[50px] h-[50px] sm:w-[58px] sm:h-[58px] rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
      >
        {/* Pulsing radar ring */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ animation: 'pulse2 2.4s infinite' }}
        />

        {/* Crisp WhatsApp SVG */}
        <svg
          className="w-6 h-6 sm:w-7 sm:h-7"
          viewBox="0 0 24 24"
          fill="#fff"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.4.8 3.1 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
        </svg>

        {/* Hover Label */}
        <span className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-ink text-cream text-[12px] font-sans rounded-[2px] opacity-0 hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-md hidden sm:block border border-cream/15">
          {t.whatsapp.tooltip}
        </span>
      </a>
    </aside>
  );
};

export default WhatsAppButton;
