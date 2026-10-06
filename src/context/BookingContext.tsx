'use client';

import React, { createContext, useContext, useState } from 'react';

interface BookingParams {
  roomId?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  roomsCount?: number;
}

interface BookingContextType {
  isOpen: boolean;
  bookingParams: BookingParams;
  openBooking: (params?: BookingParams) => void;
  closeBooking: () => void;
  isNavDrawerOpen: boolean;
  openNavDrawer: () => void;
  closeNavDrawer: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  
  // Default to today and tomorrow
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [bookingParams, setBookingParams] = useState<BookingParams>({
    roomId: '2', // Deluxe Room default
    checkIn: today,
    checkOut: tomorrow,
    adults: 2,
    children: 0,
    roomsCount: 1
  });

  const openBooking = (params?: BookingParams) => {
    if (params) {
      setBookingParams((prev) => ({ ...prev, ...params }));
    }
    setIsOpen(true);
    setIsNavDrawerOpen(false); // close drawer if open
  };

  const closeBooking = () => {
    setIsOpen(false);
  };

  const openNavDrawer = () => setIsNavDrawerOpen(true);
  const closeNavDrawer = () => setIsNavDrawerOpen(false);

  return (
    <BookingContext.Provider
      value={{
        isOpen,
        bookingParams,
        openBooking,
        closeBooking,
        isNavDrawerOpen,
        openNavDrawer,
        closeNavDrawer,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
