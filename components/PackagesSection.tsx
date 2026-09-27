'use client';

import React from 'react';
import { clsx } from 'clsx';
import SectionWrapper from '@/components/SectionWrapper';
import { Button } from '@/components/Button';
import { useBooking } from '@/context/BookingContext';

export interface PackageDetails {
  name: string;
  tagline: string;
  coverage: string;
  photoCount: string;
  videoLength: string;
  album: string;
  price: string;
  isFeatured?: boolean;
}

export const packagesData: PackageDetails[] = [
  {
    name: 'The Intimate Collection',
    tagline: 'Crafted for civil ceremonies, elopements, and smaller gatherings.',
    coverage: '6 hours of continuous coverage',
    photoCount: '350+ individually graded photographs',
    videoLength: '3 to 5 minute cinematic highlight film',
    album: 'Online gallery with print store access (album optional)',
    price: '$3,800',
    isFeatured: false,
  },
  {
    name: 'The Signature Commission',
    tagline: 'Our complete editorial documentation for full wedding celebrations.',
    coverage: '10 hours of full-day coverage with two cinematographers',
    photoCount: '650+ individually graded photographs',
    videoLength: '8 to 10 minute cinematic feature film with aerial captures',
    album: 'Handcrafted 10×10 linen heirloom album included',
    price: '$5,600',
    isFeatured: true,
  },
  {
    name: 'The Weekend Archive',
    tagline: 'Multi-day coverage spanning welcome dinners through the farewell brunch.',
    coverage: 'Full weekend commission (welcome dinner + 12 hours wedding day)',
    photoCount: '950+ individually graded photographs',
    videoLength: '12 to 15 minute extended documentary film with speeches archive',
    album: 'Handcrafted 12×12 leather album with two companion parent books',
    price: '$8,200',
    isFeatured: false,
  },
];

export const PackagesSection: React.FC = () => {
  const { setSelectedPackage } = useBooking();

  const handleSelectPackage = (packageName: string) => {
    setSelectedPackage(packageName);
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <SectionWrapper background="cream-deep" className="py-24 md:py-36">
      {/* Section Header */}
      <div className="max-w-2xl mb-16 md:mb-24 text-left space-y-3">
        <h2 className="font-display text-3xl sm:text-4xl md:text-h2 font-normal text-ink leading-tight">
          Wedding Collections
        </h2>
        <p className="font-body text-body text-ink/75 max-w-prose">
          Each commission is documented on both medium format stills and cinema cameras, tailored to the tempo and setting of your celebration.
        </p>
      </div>

      {/* 
        Asymmetric Package Row:
        Differentiates the middle "Signature" option purely through scale and spacing
        (sits taller, wider padding, elevated alignment), avoiding badge stickers or drop shadows.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 items-stretch">
        {packagesData.map((pkg) => {
          const isFeatured = pkg.isFeatured;

          return (
            <div
              key={pkg.name}
              className={clsx(
                'flex flex-col justify-between text-left transition-all duration-300',
                isFeatured
                  ? 'bg-cream p-8 sm:p-10 lg:p-12 lg:-my-5 lg:border-t-2 lg:border-ink z-10'
                  : 'bg-cream-deep border border-sage/40 p-7 sm:p-8 lg:p-9'
              )}
            >
              {/* Top Meta & Identity */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-display text-2xl sm:text-3xl font-normal text-ink leading-snug">
                    {pkg.name}
                  </h3>
                  <p className="font-body text-small text-ink/70 leading-relaxed min-h-[44px]">
                    {pkg.tagline}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-2 pb-4 border-b border-sage/40">
                  <span className="font-display text-3xl sm:text-4xl text-ink font-normal">
                    {pkg.price}
                  </span>
                  <span className="block font-body text-[13px] text-ink/60 mt-1">
                    Applicable travel included within continental destinations
                  </span>
                </div>

                {/* Inclusions List - Plain, clear editorial lines without generic bullet icons */}
                <dl className="space-y-4 pt-2">
                  <div>
                    <dt className="text-[13px] font-body text-ink/60">Coverage</dt>
                    <dd className="text-small font-body text-ink mt-0.5">{pkg.coverage}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] font-body text-ink/60">Delivered Stills</dt>
                    <dd className="text-small font-body text-ink mt-0.5">{pkg.photoCount}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] font-body text-ink/60">Cinematic Film</dt>
                    <dd className="text-small font-body text-ink mt-0.5">{pkg.videoLength}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] font-body text-ink/60">Heirloom Artifacts</dt>
                    <dd className="text-small font-body text-ink mt-0.5">{pkg.album}</dd>
                  </div>
                </dl>
              </div>

              {/* Bottom Action */}
              <div className="pt-8 sm:pt-10">
                <Button
                  variant={isFeatured ? 'primary' : 'secondary'}
                  size="md"
                  onClick={() => handleSelectPackage(pkg.name)}
                  className="w-full"
                >
                  Inquire for this Collection
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
};

export default PackagesSection;
