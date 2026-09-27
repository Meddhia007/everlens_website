'use client';

import React, { createContext, useContext, useState } from 'react';

interface BookingContextType {
  eventDate: string;
  setEventDate: (date: string) => void;
  selectedPackage: string;
  setSelectedPackage: (pkg: string) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [eventDate, setEventDate] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<string>('The Signature Commission');

  return (
    <BookingContext.Provider
      value={{
        eventDate,
        setEventDate,
        selectedPackage,
        setSelectedPackage,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
