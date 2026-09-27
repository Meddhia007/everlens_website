'use client';

import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Instagram,
  Facebook,
  Send,
  Loader2,
} from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import { useLanguage } from '@/context/LanguageContext';

export const ContactSection: React.FC = () => {
  const { language, t } = useLanguage();
  const { eventDate } = useBooking();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    packageInterest: 'PACK STANDARD',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleNames: formData.name,
          email: formData.email,
          eventDate: eventDate || undefined,
          venue: formData.subject,
          packageInterest: formData.packageInterest,
          notes: formData.message,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || (language === 'fr' ? 'Échec de l’envoi de la demande.' : 'Failed to submit inquiry.'));
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Inquiry submission error:', err);
      setSubmitError(
        err?.message ||
          (language === 'fr'
            ? 'Une erreur est survenue. Veuillez réessayer ou nous contacter directement sur WhatsApp.'
            : 'Something went wrong. Please try again or contact us directly.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 bg-ink border-t border-cream/10 relative z-10">
      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
        {/* Main Centered Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[44px] text-cream font-medium tracking-tight">
            {t.contact.title}
          </h2>
          <p className="text-sm sm:text-base text-cream/60 font-sans leading-relaxed">
            {t.contact.subtitle}
          </p>
        </div>

        {/* Two-Column Grid: Get In Touch (Left) & Send Us A Message Card (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-start text-left">
          {/* Left Column: Direct channels and info (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <h3 className="font-serif text-2xl sm:text-3xl text-cream font-medium">
                {t.contact.get_in_touch}
              </h3>
              <p className="text-sm text-cream/65 font-sans leading-relaxed">
                {t.contact.get_in_touch_desc}
              </p>
            </div>

            {/* Circular Contact Channels */}
            <div className="space-y-5 pt-2">
              {/* Email */}
              <div className="flex items-center gap-4 group">
                <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-teal group-hover:bg-teal/20 group-hover:border-teal/40 transition-all duration-300 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-mono text-cream/45 uppercase tracking-wider">
                    Email
                  </div>
                  <a
                    href="mailto:everlensweddings@gmail.com"
                    className="text-sm text-cream font-mono hover:text-teal transition-colors break-all"
                  >
                    everlensweddings@gmail.com
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-4 group">
                <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-teal group-hover:bg-teal/20 group-hover:border-teal/40 transition-all duration-300 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-cream/45 uppercase tracking-wider">
                    {language === 'fr' ? 'Téléphone' : 'Phone'}
                  </div>
                  <a
                    href="tel:+21626555785"
                    className="text-sm text-cream font-mono hover:text-teal transition-colors"
                  >
                    +216 26 555 785
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-4 group">
                <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-teal group-hover:bg-teal/20 group-hover:border-teal/40 transition-all duration-300 shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-cream/45 uppercase tracking-wider">
                    WhatsApp
                  </div>
                  <a
                    href="https://wa.me/21626555785"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cream font-mono hover:text-teal transition-colors"
                  >
                    +216 26 555 785
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-4 group">
                <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-teal group-hover:bg-teal/20 group-hover:border-teal/40 transition-all duration-300 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-cream/45 uppercase tracking-wider">
                    {t.contact.studio_location}
                  </div>
                  <div className="text-sm text-cream font-sans">
                    {t.contact.location_value}
                  </div>
                </div>
              </div>
            </div>

            {/* Follow Our Work Social Links */}
            <div className="pt-6 border-t border-cream/10 space-y-3">
              <div className="text-xs font-sans font-semibold uppercase tracking-wider text-cream/70">
                {t.contact.social_presence}
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/everlens_weddings/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cream/70 hover:text-teal hover:border-teal/40 hover:bg-teal/10 transition-all duration-300"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://www.facebook.com/everlens.weddings.tn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cream/70 hover:text-teal hover:border-teal/40 hover:bg-teal/10 transition-all duration-300"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: "Send us a message" Card (7 cols) */}
          <div className="lg:col-span-7">
            <div className="p-5 sm:p-8 lg:p-9 rounded-2xl bg-ink-2 border border-cream/10 hover:border-teal/30 transition-all duration-300 shadow-xl space-y-6">
              <h3 className="font-serif text-xl sm:text-2xl text-cream font-medium">
                {t.contact.form_title}
              </h3>

              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-teal/15 border border-teal/40 text-teal flex items-center justify-center mx-auto">
                    ✓
                  </div>
                  <h4 className="font-serif text-2xl text-cream">
                    {t.contact.success_title}
                  </h4>
                  <p className="text-sm text-cream/70 font-sans max-w-sm mx-auto leading-relaxed">
                    {t.contact.success_desc}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="text-xs font-sans uppercase tracking-widest text-teal hover:underline pt-2 font-semibold cursor-pointer"
                  >
                    {t.contact.success_btn}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Row 1: Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-sans uppercase tracking-wider text-cream/60">
                        {t.contact.label_couple_names}
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder={t.contact.placeholder_couple_names}
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-[#0F1413] border border-cream/15 rounded-xl px-4 py-3 text-base sm:text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-teal transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-sans uppercase tracking-wider text-cream/60">
                        {t.contact.label_email}
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder={t.contact.placeholder_email}
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-[#0F1413] border border-cream/15 rounded-xl px-4 py-3 text-base sm:text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-teal transition-colors"
                      />
                    </div>
                  </div>

                  {/* Row 2: Subject / Venue & Wedding Date */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-cream/60">
                      {t.contact.label_venue}
                    </label>
                    <input
                      type="text"
                      name="subject"
                      placeholder={t.contact.placeholder_venue}
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full bg-[#0F1413] border border-cream/15 rounded-xl px-4 py-3 text-base sm:text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-teal transition-colors"
                    />
                  </div>

                  {/* Row 3: Package Interest */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-cream/60">
                      {t.contact.label_package_interest}
                    </label>
                    <div className="relative">
                      <select
                        name="packageInterest"
                        value={formData.packageInterest}
                        onChange={handleChange}
                        className="w-full bg-[#0F1413] border border-cream/15 rounded-xl px-4 py-3 text-base sm:text-sm text-cream focus:outline-none focus:border-teal transition-colors appearance-none cursor-pointer pr-10"
                      >
                        {language === 'fr' ? (
                          <>
                            <option value="PACK STANDARD (Meilleure Offre)" className="bg-[#171D1C] text-cream">
                              PACK STANDARD (Meilleure Offre · Drone + Album)
                            </option>
                            <option value="PACK ESSENTIEL" className="bg-[#171D1C] text-cream">
                              PACK ESSENTIEL (Réception 2H · Photos illimitées + Teaser)
                            </option>
                            <option value="PACK BASIC" className="bg-[#171D1C] text-cream">
                              PACK BASIC (Vidéo 4K + Aftermovie + 50 Tirages)
                            </option>
                            <option value="PACK PREMIUM SIGNATURE" className="bg-[#171D1C] text-cream">
                              PACK PREMIUM SIGNATURE (Grue 7M Pro + PhotoBook Luxe 15p)
                            </option>
                            <option value="Formule Sur Mesure" className="bg-[#171D1C] text-cream">
                              Formule Sur Mesure / Événement Personnalisé
                            </option>
                          </>
                        ) : (
                          <>
                            <option value="STANDARD COLLECTION (Best Value)" className="bg-[#171D1C] text-cream">
                              STANDARD COLLECTION (Best Value · Drone + Album)
                            </option>
                            <option value="ESSENTIAL COLLECTION" className="bg-[#171D1C] text-cream">
                              ESSENTIAL COLLECTION (2H Reception · Unlimited Stills + Teaser)
                            </option>
                            <option value="BASIC COLLECTION" className="bg-[#171D1C] text-cream">
                              BASIC COLLECTION (4K Video + Aftermovie + 50 Prints)
                            </option>
                            <option value="PREMIUM SIGNATURE COLLECTION" className="bg-[#171D1C] text-cream">
                              PREMIUM SIGNATURE COLLECTION (7M Crane + Luxe PhotoBook 15p)
                            </option>
                            <option value="Bespoke Commission" className="bg-[#171D1C] text-cream">
                              Bespoke Commission / Destination Celebration
                            </option>
                          </>
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-cream/40 text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Message */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-sans uppercase tracking-wider text-cream/60">
                      {t.contact.label_notes}
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      required
                      placeholder={t.contact.placeholder_notes}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full bg-[#0F1413] border border-cream/15 rounded-xl px-4 py-3 text-base sm:text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-teal transition-colors resize-y"
                    />
                  </div>

                  {/* Error banner */}
                  {submitError && (
                    <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-sans rounded-lg">
                      {submitError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-teal hover:bg-cream text-ink font-semibold text-xs font-sans uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t.contact.submitting_btn}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{t.contact.submit_btn}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
