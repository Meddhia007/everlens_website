'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  Video,
  Star,
  Sliders,
  Bookmark,
  Sparkles,
  Compass,
  Film,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const ICON_MAP: Record<string, React.ElementType> = {
  Camera,
  Video,
  Star,
  Sliders,
  Bookmark,
  Sparkles,
  Compass,
  Film,
};

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  role: string;
  badge: string;
  icon: string | React.ElementType;
  keyFeatures: string[];
  specs: { label: string; value: string }[];
  featuredIn: string[];
}

const equipmentData: EquipmentItem[] = [
  {
    id: 'sony-fx3',
    name: 'Sony FX3',
    category: 'cameras',
    role: 'Full-Frame Cinema Camera',
    badge: '4K 120p',
    icon: 'Video',
    keyFeatures: [
      'Full-Frame 12.1MP Sensor',
      '15+ Stops Dynamic Range',
      'Dual Base ISO (800 / 12,800)',
      'S-Cinetone Film Color Science',
    ],
    specs: [
      { label: 'Sensor', value: '35mm Full-Frame Exmor R CMOS' },
      { label: 'Recording', value: '4K 120p / FHD 240p 10-bit 4:2:2' },
      { label: 'ISO Range', value: '80–102,400 (Exp: 80–409,600)' },
      { label: 'Stabilization', value: '5-Axis In-Body Active IS' },
    ],
    featuredIn: ['Sarah & Youssef', 'The Sunset Vows', 'Leila & Amine'],
  },
  {
    id: 'sony-a7rv',
    name: 'Sony α7R V',
    category: 'cameras',
    role: 'Full-Frame Master Stills & Hybrid',
    badge: '61MP RAW',
    icon: 'Camera',
    keyFeatures: [
      '61.0MP Back-Illuminated CMOS',
      'AI-Powered Real-Time AF Tracking',
      '16-bit Uncompressed RAW Stills',
      'Dual CFexpress Type A / SD Slots',
    ],
    specs: [
      { label: 'Sensor', value: '35.7 × 23.8mm Exmor R CMOS' },
      { label: 'Resolution', value: '9504 × 6336 px Master Files' },
      { label: 'ISO Range', value: '100–32,000 (Exp: 50–102,400)' },
      { label: 'Stabilization', value: '8-Stop 5-Axis In-Body' },
    ],
    featuredIn: ['Elena — Carthage', 'Heirloom Florals', 'La Marsa Palace'],
  },
  {
    id: 'g-master-primes',
    name: 'Sony G-Master Primes',
    category: 'lenses',
    role: '24mm f/1.4 · 50mm f/1.2 · 85mm f/1.4',
    badge: 'f/1.2 Master Glass',
    icon: 'Sparkles',
    keyFeatures: [
      'XA Extreme Aspherical Elements',
      'Creamy Cinematic Bokeh Falloff',
      'Nano AR Coating II Glare Reduction',
      'Dual XD Linear Motors for Silent AF',
    ],
    specs: [
      { label: 'Aperture Range', value: 'f/1.2 – f/16 Constant Sharpness' },
      { label: 'Optics System', value: '14 Elements in 10 Groups' },
      { label: 'Filter Diameter', value: '67mm / 72mm / 77mm' },
      { label: 'Coating', value: 'Fluorine & Nano AR II' },
    ],
    featuredIn: ['The Sunset Vows', 'Sarah & Youssef', 'Editorial Portraits'],
  },
  {
    id: 'dji-mavic-3-cine',
    name: 'DJI Mavic 3 Cine',
    category: 'aerial',
    role: 'Dual-Camera Cinema Aerial Drone',
    badge: '5.1K ProRes',
    icon: 'Compass',
    keyFeatures: [
      '4/3 CMOS Hasselblad Camera',
      'Apple ProRes 422 HQ Direct Capture',
      'Omnidirectional Obstacle Sensing',
      '46-Minute Extended Flight Time',
    ],
    specs: [
      { label: 'Sensor', value: '4/3 CMOS 20MP Hasselblad' },
      { label: 'Max Video', value: '5.1K at 50fps / 4K at 120fps' },
      { label: 'Internal Storage', value: '1TB High-Speed SSD' },
      { label: 'Transmission', value: 'O3+ 15km 1080p 60fps' },
    ],
    featuredIn: ['Mediterranean Coast', 'Carthage Ruins', 'Sidi Bou Said'],
  },
];

const SPEC_LABEL_MAP_FR: Record<string, string> = {
  Sensor: 'Capteur',
  Recording: 'Enregistrement',
  Resolution: 'Résolution',
  'ISO Range': 'Plage ISO',
  Stabilization: 'Stabilisation',
  'Aperture Range': 'Ouverture',
  'Optics System': 'Optique',
  'Filter Diameter': 'Diamètre',
  Coating: 'Traitement',
  'Max Video': 'Vidéo Max',
  'Internal Storage': 'Stockage',
  Transmission: 'Portée & Flux',
};

export const EquipmentSection: React.FC = () => {
  const { language, t } = useLanguage();
  const [items, setItems] = useState<EquipmentItem[]>(equipmentData);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    fetch('/api/public/equipment')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.equipment && Array.isArray(data.equipment) && data.equipment.length > 0) {
          setItems(data.equipment);
        }
      })
      .catch((err) => {
        console.warn('Using preset equipment data:', err);
      });
  }, []);

  const getCategoryTabLabel = (cat: string) => {
    if (cat === 'all') return t.equipment.tabs.all;
    if (cat === 'cameras') return t.equipment.tabs.cameras;
    if (cat === 'lenses') return t.equipment.tabs.lenses;
    if (cat === 'aerial') return t.equipment.tabs.aerial;
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const uniqueCategories = Array.from(
    new Set(items.map((i) => i.category.toLowerCase()))
  );

  const tabs = [
    { id: 'all', label: t.equipment.tabs.all },
    ...uniqueCategories.map((cat) => ({
      id: cat,
      label: getCategoryTabLabel(cat),
    })),
  ];

  const filteredEquipment = items.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category.toLowerCase() === activeTab;
  });

  return (
    <section id="equipment" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 bg-ink border-t border-cream/10 relative z-10">
      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
        {/* Centered Heading */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[44px] text-cream font-medium tracking-tight">
            {t.equipment.title}
          </h2>
          <p className="text-sm sm:text-base text-cream/60 font-sans leading-relaxed">
            {t.equipment.desc}
          </p>

          {/* Interactive Category Filter Tabs */}
          <div className="pt-2 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-sans font-medium transition-all duration-300 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-teal text-ink shadow-sm font-semibold'
                    : 'bg-ink-2 text-cream/70 hover:text-cream border border-cream/10 hover:border-cream/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {filteredEquipment.map((item) => {
            const IconComponent =
              typeof item.icon === 'string' ? ICON_MAP[item.icon] || Camera : item.icon || Camera;

            return (
              <div
                key={item.id}
                className="group relative p-5 sm:p-8 rounded-2xl bg-ink-2 border border-cream/10 hover:border-teal/50 hover:bg-[#1D2422] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_0_35px_rgba(67,177,159,0.15)] flex flex-col justify-between space-y-7"
              >
                {/* Header Row: Icon + Name + Role + Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-teal group-hover:bg-teal/20 group-hover:text-teal group-hover:border-teal/40 transition-all duration-300 shrink-0">
                      <IconComponent className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif text-lg sm:text-2xl text-cream font-medium group-hover:text-cream transition-colors truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-cream/50 font-mono mt-0.5 truncate">
                        {item.role}
                      </p>
                    </div>
                  </div>

                  {/* Top-Right Badge */}
                  <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono tracking-wider text-teal bg-teal/10 border border-teal/30 shrink-0 whitespace-nowrap">
                    {item.badge}
                  </span>
                </div>

                {/* Section 1: Key Features */}
                <div className="space-y-3 pt-1 border-t border-cream/10">
                  <div className="flex items-center gap-2 text-xs font-sans font-semibold tracking-wider text-amber-300/90 uppercase">
                    <Star className="w-3.5 h-3.5 fill-amber-300/80 text-amber-300" />
                    <span>{t.equipment.capabilities}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-cream/80 font-sans">
                    {item.keyFeatures.map((feat) => (
                      <div key={feat} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Technical Specs Table */}
                <div className="space-y-3 pt-1 border-t border-cream/10">
                  <div className="flex items-center gap-2 text-xs font-sans font-semibold tracking-wider text-teal uppercase">
                    <Sliders className="w-3.5 h-3.5 text-teal" />
                    <span>{t.equipment.specs}</span>
                  </div>
                  <div className="space-y-2 text-xs font-sans">
                    {item.specs.map((spec) => (
                      <div
                        key={spec.label}
                        className="flex items-center justify-between py-1 border-b border-cream/5"
                      >
                        <span className="text-cream/50">
                          {language === 'fr' ? SPEC_LABEL_MAP_FR[spec.label] || spec.label : spec.label}
                        </span>
                        <span className="text-cream/90 font-mono text-right">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Featured In Tags */}
                <div className="space-y-3 pt-1 border-t border-cream/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-sans font-semibold tracking-wider text-teal uppercase">
                      <Bookmark className="w-3.5 h-3.5 text-teal" />
                      <span>{t.equipment.featured_in}</span>
                    </div>
                    {/* Active camera dot */}
                    <span className="w-2 h-2 rounded-full bg-teal/40 group-hover:bg-teal group-hover:shadow-[0_0_10px_var(--teal)] transition-all duration-300" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.featuredIn.map((work) => (
                      <span
                        key={work}
                        className="px-3 py-1 rounded-full text-[11px] font-sans text-cream/70 bg-white/5 border border-cream/10 group-hover:border-cream/20 transition-colors"
                      >
                        {work}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default EquipmentSection;
