'use client';

import React, { useState } from 'react';
import SectionWrapper from '@/components/SectionWrapper';
import { Button } from '@/components/Button';
import { useBooking } from '@/context/BookingContext';
import { packagesData } from '@/components/PackagesSection';

interface FormData {
  coupleNames: string;
  eventDate: string;
  location: string;
  packageInterest: string;
  notes: string;
}

interface FormErrors {
  coupleNames?: string;
  eventDate?: string;
  location?: string;
}

export const BookingSection: React.FC = () => {
  const { eventDate, setEventDate, selectedPackage, setSelectedPackage } = useBooking();

  const [formData, setFormData] = useState<FormData>({
    coupleNames: '',
    eventDate: eventDate,
    location: '',
    packageInterest: selectedPackage || 'The Signature Commission',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Synchronize context when selectedPackage prop changes from package cards
  React.useEffect(() => {
    if (selectedPackage) {
      setFormData((prev) => ({ ...prev, packageInterest: selectedPackage }));
    }
  }, [selectedPackage]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'eventDate') {
      setEventDate(value);
    }

    if (name === 'packageInterest') {
      setSelectedPackage(value);
    }

    // Clear error for that field as user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.coupleNames.trim()) {
      newErrors.coupleNames = 'Please share your names so we know how to address you.';
    }

    if (!formData.eventDate.trim()) {
      newErrors.eventDate = 'Please share your confirmed or estimated wedding date.';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Please let us know where your celebration will take place.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Requirement: console.log data
    console.log('EverLens Weddings - New Booking Inquiry:', formData);

    setIsSubmitted(true);
  };

  const handleReset = () => {
    setFormData({
      coupleNames: '',
      eventDate: '',
      location: '',
      packageInterest: 'The Signature Commission',
      notes: '',
    });
    setEventDate('');
    setErrors({});
    setIsSubmitted(false);
  };

  return (
    <SectionWrapper id="contact" background="cream" className="py-24 md:py-36">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="mb-16 md:mb-20 text-left space-y-3">
          <h2 className="font-display text-3xl sm:text-4xl md:text-h2 font-normal text-ink leading-tight">
            Check Availability
          </h2>
          <p className="font-body text-body text-ink/75 max-w-prose">
            We accept a small volume of commissions each season to maintain meticulous craft and presence. Tell us about your plans below.
          </p>
        </div>

        {/* Calm Inline Success Message */}
        {isSubmitted ? (
          <div className="p-8 sm:p-12 bg-cream-deep border border-sage/40 rounded-[2px] text-left space-y-4 animate-hero-content">
            <h3 className="font-display text-2xl sm:text-3xl text-ink font-normal">
              Got it — we’ll be in touch within 24 hours.
            </h3>
            <p className="font-body text-body text-ink/80 leading-relaxed max-w-xl">
              Thank you for considering EverLens for your wedding. We review availability and date logistics personally and will reply directly to your inquiry.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="font-body text-small text-ink/70 hover:text-ink underline focus-visible:outline focus-visible:outline-1"
              >
                Submit another inquiry
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} noValidate className="space-y-10 sm:space-y-12 text-left">
            {/* Couple Names */}
            <div className="space-y-2">
              <label htmlFor="coupleNames" className="block font-body text-small text-ink font-normal">
                Couple Names <span className="text-ink/60">*</span>
              </label>
              <input
                type="text"
                id="coupleNames"
                name="coupleNames"
                value={formData.coupleNames}
                onChange={handleInputChange}
                placeholder="e.g. Camille & Antoine"
                className="w-full bg-cream-deep/60 text-ink placeholder:text-ink/35 border-b border-ink/40 focus:border-ink focus:outline-none py-3 px-1 text-body transition-colors rounded-none"
              />
              {errors.coupleNames && (
                <p className="font-body text-small text-ink/80 pt-1">
                  {errors.coupleNames}
                </p>
              )}
            </div>

            {/* Event Date & Location (Two columns on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-8">
              {/* Event Date */}
              <div className="space-y-2">
                <label htmlFor="eventDate" className="block font-body text-small text-ink font-normal">
                  Event Date <span className="text-ink/60">*</span>
                </label>
                <input
                  type="text"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  placeholder="e.g. September 18, 2026"
                  className="w-full bg-cream-deep/60 text-ink placeholder:text-ink/35 border-b border-ink/40 focus:border-ink focus:outline-none py-3 px-1 text-body transition-colors rounded-none"
                />
                {errors.eventDate && (
                  <p className="font-body text-small text-ink/80 pt-1">
                    {errors.eventDate}
                  </p>
                )}
              </div>

              {/* Venue / Location */}
              <div className="space-y-2">
                <label htmlFor="location" className="block font-body text-small text-ink font-normal">
                  Venue / Location <span className="text-ink/60">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Villa Cetinale, Tuscany"
                  className="w-full bg-cream-deep/60 text-ink placeholder:text-ink/35 border-b border-ink/40 focus:border-ink focus:outline-none py-3 px-1 text-body transition-colors rounded-none"
                />
                {errors.location && (
                  <p className="font-body text-small text-ink/80 pt-1">
                    {errors.location}
                  </p>
                )}
              </div>
            </div>

            {/* Package Interest */}
            <div className="space-y-2">
              <label htmlFor="packageInterest" className="block font-body text-small text-ink font-normal">
                Package Interest
              </label>
              <div className="relative">
                <select
                  id="packageInterest"
                  name="packageInterest"
                  value={formData.packageInterest}
                  onChange={handleInputChange}
                  className="w-full appearance-none bg-cream-deep/60 text-ink border-b border-ink/40 focus:border-ink focus:outline-none py-3 px-1 text-body transition-colors rounded-none cursor-pointer"
                >
                  {packagesData.map((pkg) => (
                    <option key={pkg.name} value={pkg.name} className="bg-cream text-ink">
                      {pkg.name} ({pkg.price})
                    </option>
                  ))}
                  <option value="Custom Commission" className="bg-cream text-ink">
                    Custom Multi-Day or Destination Commission
                  </option>
                  <option value="Undecided" className="bg-cream text-ink">
                    Undecided / Open to Recommendation
                  </option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center text-ink/60 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="block font-body text-small text-ink font-normal">
                Notes &amp; Vision
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Tell us about the atmosphere you are envisioning, guest count, or any questions you have."
                className="w-full bg-cream-deep/60 text-ink placeholder:text-ink/35 border-b border-ink/40 focus:border-ink focus:outline-none py-3 px-1 text-body transition-colors rounded-none resize-y"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-4">
              <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
                Send Availability Inquiry
              </Button>
            </div>
          </form>
        )}
      </div>
    </SectionWrapper>
  );
};

export default BookingSection;
