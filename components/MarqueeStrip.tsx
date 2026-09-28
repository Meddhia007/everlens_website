'use client';

import React from 'react';

export const MarqueeStrip: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="w-full bg-teal h-8 sm:h-10 relative z-10 select-none pointer-events-none"
    />
  );
};

export default MarqueeStrip;
