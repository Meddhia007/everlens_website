'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { MarqueeStrip } from '@/components/MarqueeStrip';
import { PortfolioSection } from '@/components/PortfolioSection';
import { ManifestoSection } from '@/components/ManifestoSection';
import { HangingStoryStage } from '@/components/HangingStoryStage';
import { JourneyStepsSection } from '@/components/JourneyStepsSection';
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

        {/* 1. Fullscreen Cinematic Kinetic Hero (with floating bokeh embers & dripping cue) */}
        <Hero />

        {/* 2. Vibrant Teal Bodoni Italic Marquee Ribbon */}
        <MarqueeStrip />

        {/* 3. Sticky Manifesto Section with Word-by-Word Scroll Lighting (Zayanni style) */}
        <ManifestoSection />

        {/* 4. Interactive Floating Artifacts Stage with Elastic Pop-Up Bounce (Zayanni style) */}
        <HangingStoryStage />

        {/* 5. Instagram-Style Carousel Portfolio Grid & Popup (with 1200ms cubic bezier) */}
        <PortfolioSection />

        {/* 6. The 3-Step Journey with Curved Dashed Golden Thread (Zayanni style) */}
        <JourneyStepsSection />

        {/* 7. Curated Offerings / Services Section */}
        <ServicesSection />

        {/* 8. Production Camera & Optics Arsenal Section */}
        <EquipmentSection />

        {/* 9. Editorial Cream Breather & Stats Section */}
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
