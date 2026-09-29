'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export const AboutSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="about" className="breather">
      <div className="breather-inner">
        <div className="reveal-on-scroll">
          <h2>{t.about.title}</h2>
          <div className="quote">{t.about.quote}</div>
        </div>
        <div className="reveal-stagger">
          <p>{t.about.desc}</p>
          <div className="stats">
            <div className="stat group cursor-default transition-transform duration-300 hover:-translate-y-1">
              <b className="transition-colors duration-300 group-hover:text-[#184841]">{t.about.stat1_num}</b>
              <span>{t.about.stat1_label}</span>
            </div>
            <div className="stat group cursor-default transition-transform duration-300 hover:-translate-y-1">
              <b className="transition-colors duration-300 group-hover:text-[#184841]">{t.about.stat2_num}</b>
              <span>{t.about.stat2_label}</span>
            </div>
            <div className="stat group cursor-default transition-transform duration-300 hover:-translate-y-1">
              <b className="transition-colors duration-300 group-hover:text-[#184841]">{t.about.stat3_num}</b>
              <span>{t.about.stat3_label}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
