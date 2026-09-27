'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { MarqueeStrip } from '@/components/MarqueeStrip';
import { PortfolioSection } from '@/components/PortfolioSection';
import { AboutSection } from '@/components/AboutSection';
import { ServicesSection } from '@/components/ServicesSection';
import { EquipmentSection } from '@/components/EquipmentSection';
import { ContactSection } from '@/components/ContactSection';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { BookingProvider } from '@/context/BookingContext';

export default function HomePage() {
  return (
    <BookingProvider>
      <div className="min-h-screen w-full overflow-x-hidden bg-ink text-cream selection:bg-teal selection:text-ink relative">
        {/* Fixed Difference-blend Navigation Bar */}
        <Navbar />

        {/* 1. Fullscreen Cinematic Kinetic Hero */}
        <Hero />

        {/* 2. Vibrant Teal Bodoni Italic Marquee Ribbon */}
        <MarqueeStrip />

        {/* 3. Instagram-Style Carousel Portfolio Grid & Popup */}
        <PortfolioSection />

        {/* 4. Curated Offerings / Services Section */}
        <ServicesSection />

        {/* 5. Production Camera & Optics Arsenal Section */}
        <EquipmentSection />

        {/* 6. Editorial Cream Breather & Stats Section */}
        <AboutSection />

        {/* 7. Availability & Contact Inquiry Section */}
        <ContactSection />

        {/* 8. Dark Minimalist Editorial Footer */}
        <Footer />

        {/* 9. Floating WhatsApp Button with Radar Wave Pulse */}
        <WhatsAppButton />
      </div>
    </BookingProvider>
  );
}
