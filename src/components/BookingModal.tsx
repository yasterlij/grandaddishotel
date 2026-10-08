'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Check, Calendar, Users, DollarSign, ShieldCheck, Printer, ArrowLeft, ArrowRight, Sparkles, Coffee, CreditCard, Lock } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ROOMS, HOTEL_INFO, Room } from '@/data/hotelData';
import PaymentModal from '@/components/PaymentModal';
import { PAYMENT_PROVIDERS, PaymentProviderType } from '@/lib/payment-types';
import { getTodayDateStr, addDays, calculateStayNights, formatFriendlyDate } from '@/lib/dates';
import { computeBookingTotals, getPromoDiscountPercent } from '@/lib/booking-pricing';

export default function BookingModal() {
  const { isOpen, closeBooking, bookingParams } = useBooking();
  const { rate, currency, formatPrice } = useCurrency();

  const todayStr = getTodayDateStr();
  const tomorrowStr = addDays(todayStr, 1);

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Room & Dates, 2: Add-ons & Guest Details, 3: Confirmation
  const [selectedRoomId, setSelectedRoomId] = useState<string>('deluxe-room');
  const [checkIn, setCheckIn] = useState<string>(todayStr);
  const [checkOut, setCheckOut] = useState<string>(tomorrowStr);
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  // Nights selected when the modal opened — date changes are measured against
  // this baseline so an ordinary multi-night stay is NOT flagged as an
  // "extension" in the admin portal.
  const [baselineNights, setBaselineNights] = useState<number>(1);

  // Add-ons
  const [addons, setAddons] = useState<{ [key: string]: boolean }>({
    airportShuttle: false,
    breakfast: true,
    spaTreatment: false,
    coffeeCeremony: false,
  });

  // Guest Details
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');

  // Payment State
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<PaymentProviderType>('SKINA');
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'SUCCESS'>('PENDING');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [createdReservationId, setCreatedReservationId] = useState('');
  const [activeTxRef, setActiveTxRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateChangeFlag, setDateChangeFlag] = useState<{ isExtended: boolean; text: string; delta: number; totalNights: number } | null>(null);
  const [bookingError, setBookingError] = useState('');

  // Confirmation state
  const [bookingRef, setBookingRef] = useState('');
  const [rooms, setRooms] = useState<Room[]>(ROOMS);

  useEffect(() => {
    async function loadPostgresRooms() {
      try {
        const res = await fetch('/api/rooms');
        const data = await res.json();
        if (data.success && data.rooms && data.rooms.length > 0) {
          setRooms(data.rooms);
        }
      } catch (err) {
        console.error('Failed to load rooms from PostgreSQL:', err);
      }
    }
    loadPostgresRooms();
  }, []);

  // Sync initial params from context
  useEffect(() => {
    if (bookingParams.roomId) setSelectedRoomId(bookingParams.roomId);
    if (bookingParams.checkIn) setCheckIn(bookingParams.checkIn);
    if (bookingParams.checkOut) setCheckOut(bookingParams.checkOut);
    if (bookingParams.adults) setAdults(bookingParams.adults);
    if (bookingParams.children !== undefined) setChildren(bookingParams.children);
  }, [bookingParams]);

  // Reset the flow every time the modal is (re)opened, so a fresh booking never
  // inherits the previous confirmation voucher, payment state, or error.
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setPaymentStatus('PENDING');
    setBookingRef('');
    setCreatedReservationId('');
    setActiveTxRef('');
    setIsPaymentModalOpen(false);
    setDateChangeFlag(null);
    setBookingError('');
    setBaselineNights(calculateStayNights(checkIn, checkOut));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeBooking();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeBooking]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedRoom =
    rooms.find(
      (r) =>
        r.id === selectedRoomId ||
        r.slug === selectedRoomId ||
        (r.aliases || []).includes(selectedRoomId)
    ) ||
    rooms.find((r) => r.slug === 'deluxe-room' || (r.aliases || []).includes('deluxe-room')) ||
    rooms[0];

  // Calculate nights safely
  const nights = calculateStayNights(checkIn, checkOut);

  /** Update the change flag relative to the baseline (opening) stay length. */
  const refreshDateChangeFlag = (newNights: number, nextIn: string, nextOut: string) => {
    const delta = newNights - baselineNights;
    if (delta === 0) {
      setDateChangeFlag(null); // back to the originally selected length
      return;
    }
    setDateChangeFlag({
      isExtended: delta > 0,
      text:
        delta > 0
          ? `Stay extended by +${delta} ${delta === 1 ? 'night' : 'nights'} (${newNights} nights total, ${formatFriendlyDate(nextIn)} → ${formatFriendlyDate(nextOut)}). Payment scaled automatically.`
          : `Stay shortened by ${Math.abs(delta)} ${Math.abs(delta) === 1 ? 'night' : 'nights'} (${newNights} nights total, ${formatFriendlyDate(nextIn)} → ${formatFriendlyDate(nextOut)}). Payment scaled automatically.`,
      delta,
      totalNights: newNights,
    });
  };

  const handleCheckInChange = (newDate: string) => {
    setCheckIn(newDate);
    let nextOut = checkOut;
    if (!newDate || newDate >= checkOut) {
      nextOut = addDays(newDate, 1);
      setCheckOut(nextOut);
    }
    refreshDateChangeFlag(calculateStayNights(newDate, nextOut), newDate, nextOut);
  };

  const handleCheckOutChange = (newDate: string) => {
    const validOut = (!newDate || newDate <= checkIn) ? addDays(checkIn, 1) : newDate;
    setCheckOut(validOut);
    refreshDateChangeFlag(calculateStayNights(checkIn, validOut), checkIn, validOut);
  };

  const handleExtendNights = (deltaDays: number) => {
    const currentNights = calculateStayNights(checkIn, checkOut);
    const newNights = Math.max(1, currentNights + deltaDays);
    const newOut = addDays(checkIn, newNights);
    setCheckOut(newOut);
    refreshDateChangeFlag(newNights, checkIn, newOut);
  };

  // Shared pricing rules (same module the server uses to compute totals)
  const totals = computeBookingTotals({
    pricePerNight: selectedRoom.pricePerNight,
    nights,
    adults,
    addons: addons as Record<string, boolean>,
    discountPercent,
  });
  const { roomSubtotal, discountAmount, addonsTotal, tax } = totals;
  const grandTotal = totals.grandTotal;
  const grandTotalETB = Math.round(grandTotal * rate); // Dynamic Universal Forex rate (USD -> ETB)

  // Display prices for the add-on UI (per selection, incl. nights/adults where applicable)
  const addonPrices = {
    airportShuttle: 15,
    breakfast: 12 * adults * nights,
    spaTreatment: 65,
    coffeeCeremony: 8 * adults,
  };

  const applyPromo = () => {
    const percent = getPromoDiscountPercent(promoCode);
    if (percent > 0) {
      setDiscountPercent(percent);
      setPromoMessage(
        percent === 20 ? 'Weekend Special: 20% discount applied!' : 'Member discount of 15% applied!'
      );
    } else {
      setDiscountPercent(0);
      setPromoMessage('Invalid coupon code');
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBookingError('');
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          roomSlug: selectedRoom.slug,
          checkIn,
          checkOut,
          adults,
          children,
          guestName,
          guestEmail,
          guestPhone,
          specialRequests,
          addons,
          // The server validates the code and computes the total itself —
          // totalAmount/paymentStatus are intentionally NOT sent.
          promoCode: promoCode.trim(),
          currency: 'USD',
          paymentProvider: selectedPaymentProvider,
          isDateExtended: Boolean(dateChangeFlag),
          dateChangeNote: dateChangeFlag?.text || '',
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data.bookingRef) {
        setBookingRef(data.bookingRef);
        setCreatedReservationId(data.reservationId || '');
        setActiveTxRef(data.txRef || '');

        if (selectedPaymentProvider === 'CASH_ON_ARRIVAL') {
          setPaymentStatus('PENDING');
          setStep(3);
        } else {
          setIsPaymentModalOpen(true);
        }
      } else {
        // Real failure — show the server's message; never fabricate a booking.
        setBookingError(
          data?.error ||
            'We could not complete your reservation. Please try again or contact the hotel.'
        );
      }
    } catch (err) {
      console.error('Reservation error:', err);
      setBookingError('Network error — please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    setPaymentStatus('SUCCESS');
    if (paymentData?.txRef) {
      setActiveTxRef(paymentData.txRef);
    }
    setIsPaymentModalOpen(false);
    setStep(3);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={closeBooking}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(9, 25, 31, 0.8)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal Dialog */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '940px',
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 2,
          animation: 'modalZoomIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#0F2A33',
            color: '#FFFFFF',
            padding: '20px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                padding: '2px',
                overflow: 'hidden',
              }}
            >
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={38}
                height={38}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600 }}>
                {step === 3 ? 'Reservation Confirmed!' : 'Grand Addis Hotel — Room Reservation'}
              </h3>
              <p style={{ fontSize: '12px', color: '#E49951' }}>
                {step === 1 && 'Step 1 of 2: Select Room & Dates'}
                {step === 2 && 'Step 2 of 2: Guest Details & Preferences'}
                {step === 3 && `Confirmation ID: ${bookingRef}`}
              </p>
            </div>
          </div>

          <button
            onClick={closeBooking}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body content */}
        <div style={{ overflowY: 'auto', padding: '28px', flex: 1 }}>
          
          {/* STEP 1: Room & Dates */}
          {step === 1 && (
            <div>
              {/* Date & Guests bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '16px',
                  backgroundColor: '#F7F7F2',
                  padding: '18px',
                  borderRadius: '10px',
                  border: '1px solid #E2E1DA',
                  marginBottom: '28px',
                }}
              >
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                    CHECK-IN DATE
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    min={todayStr}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #D5D4CC',
                      backgroundColor: '#FFFFFF',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#153D4B' }}>
                      CHECK-OUT DATE
                    </label>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#E49951', backgroundColor: '#FDF4E7', padding: '1px 6px', borderRadius: '4px' }}>
                      {nights} {nights === 1 ? 'night' : 'nights'}
                    </span>
                  </div>
                  <input
                    type="date"
                    value={checkOut}
                    min={addDays(checkIn, 1)}
                    onChange={(e) => handleCheckOutChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #D5D4CC',
                      backgroundColor: '#FFFFFF',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                    ADULTS
                  </label>
                  <select
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #D5D4CC',
                      backgroundColor: '#FFFFFF',
                      fontSize: '13px',
                    }}
                  >
                    <option value={1}>1 Adult</option>
                    <option value={2}>2 Adults</option>
                    <option value={3}>3 Adults</option>
                    <option value={4}>4 Adults</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                    CHILDREN
                  </label>
                  <select
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #D5D4CC',
                      backgroundColor: '#FFFFFF',
                      fontSize: '13px',
                    }}
                  >
                    <option value={0}>0 Children</option>
                    <option value={1}>1 Child</option>
                    <option value={2}>2 Children</option>
                  </select>
                </div>
              </div>

              {/* Date Extension / Modification Notification Flag */}
              {dateChangeFlag && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: dateChangeFlag.isExtended ? '#FEF3C7' : '#EFF6FF',
                    border: dateChangeFlag.isExtended ? '1px solid #F59E0B' : '1px solid #93C5FD',
                    color: dateChangeFlag.isExtended ? '#92400E' : '#1E40AF',
                    padding: '12px 18px',
                    borderRadius: '10px',
                    marginBottom: '22px',
                    fontSize: '13px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🚩</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontWeight: 700 }}>
                      {dateChangeFlag.isExtended ? 'Stay Date Extension Notification Flag:' : 'Stay Duration Notification Flag:'}
                    </strong>{' '}
                    <span>{dateChangeFlag.text}</span>
                  </div>
                  <span
                    style={{
                      backgroundColor: dateChangeFlag.isExtended ? '#F59E0B' : '#2563EB',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {nights} {nights === 1 ? 'Night' : 'Nights'}
                  </span>
                </div>
              )}

              {/* Room Cards Selector */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: '#153D4B', marginBottom: '16px' }}>
                  Choose Your Room ({nights} {nights === 1 ? 'Night' : 'Nights'})
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  {rooms.map((room) => {
                    const isSelected = room.id === selectedRoomId;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        style={{
                          border: isSelected ? '2px solid #E49951' : '1px solid #E2E1DA',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          backgroundColor: isSelected ? '#FDF9F4' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? '0 8px 24px rgba(228,153,81,0.2)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div style={{ position: 'relative', height: '150px', width: '100%' }}>
                          <img
                            src={room.images[0]}
                            alt={room.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              backgroundColor: 'rgba(15, 42, 51, 0.85)',
                              color: '#FFFFFF',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            ${room.pricePerNight} <span style={{ fontSize: '10px', color: '#E49951' }}>/ night</span>
                          </div>
                        </div>

                        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, color: '#153D4B' }}>{room.name}</h5>
                            {isSelected && (
                              <span
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  backgroundColor: '#E49951',
                                  color: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Check size={14} />
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '12px', color: '#5E6E75', marginBottom: '10px' }}>
                            {room.size} • {room.bedType} • Up to {room.capacity} guests
                          </div>

                          <p style={{ fontSize: '12px', color: '#838A8D', lineHeight: '1.5', marginBottom: '14px', flex: 1 }}>
                            {room.description.slice(0, 95)}...
                          </p>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: '10px',
                              borderTop: '1px solid #ECEBE5',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#153D4B',
                            }}
                          >
                            <span>Total for {nights} {nights === 1 ? 'night' : 'nights'}:</span>
                            <span style={{ color: '#E49951', fontSize: '15px' }}>${room.pricePerNight * nights}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Addons & Guest Details */}
          {step === 2 && (
            <form onSubmit={handleConfirmBooking}>
              {/* Interactive Stay Duration & Date Modification Bar */}
              <div
                style={{
                  backgroundColor: '#FDF9F4',
                  border: '1px solid #E8D7C3',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#E49951', fontWeight: 700 }}>
                      RESERVATION DATES & DURATION
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#153D4B',
                        color: '#FFFFFF',
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      {nights} {nights === 1 ? 'Night' : 'Nights'}
                    </span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#153D4B', marginTop: '4px' }}>
                    📅 {formatFriendlyDate(checkIn)} → {formatFriendlyDate(checkOut)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#5E6E75', marginTop: '2px' }}>
                    {selectedRoom.name} • ${selectedRoom.pricePerNight}/night • Room stay: <strong>${roomSubtotal} USD</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B' }}>Modify Stay:</span>
                  <button
                    type="button"
                    disabled={nights <= 1}
                    onClick={() => handleExtendNights(-1)}
                    title="Shorten stay by 1 night"
                    style={{
                      padding: '7px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D5D4CC',
                      backgroundColor: '#FFFFFF',
                      color: nights <= 1 ? '#A0AEC0' : '#153D4B',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: nights <= 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    −1 Night
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendNights(1)}
                    title="Extend stay by 1 night (payment will adjust automatically)"
                    style={{
                      padding: '7px 14px',
                      borderRadius: '6px',
                      border: '1px solid #E49951',
                      backgroundColor: '#FEF3C7',
                      color: '#B45309',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    +1 Night
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendNights(2)}
                    title="Extend stay by 2 nights"
                    style={{
                      padding: '7px 14px',
                      borderRadius: '6px',
                      border: '1px solid #E49951',
                      backgroundColor: '#FEF3C7',
                      color: '#B45309',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    +2 Nights
                  </button>
                </div>
              </div>

              {/* Date Extension / Adjustment Alert Flag Banner */}
              {dateChangeFlag && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: dateChangeFlag.isExtended ? '#FEF3C7' : '#EFF6FF',
                    border: dateChangeFlag.isExtended ? '1px solid #F59E0B' : '1px solid #93C5FD',
                    color: dateChangeFlag.isExtended ? '#92400E' : '#1E40AF',
                    padding: '12px 18px',
                    borderRadius: '10px',
                    marginBottom: '24px',
                    fontSize: '13px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🚩</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontWeight: 700 }}>
                      {dateChangeFlag.isExtended ? 'Stay Date Extension Flag Active:' : 'Stay Date Shortened / Decreased Flag:'}
                    </strong>{' '}
                    <span>{dateChangeFlag.text}</span>
                  </div>
                  <span
                    style={{
                      backgroundColor: dateChangeFlag.isExtended ? '#F59E0B' : '#2563EB',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {dateChangeFlag.isExtended ? 'Scaled to' : 'Decreased to'} ${grandTotal} USD
                  </span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
                
                {/* Left: Add-ons & Promo */}
                <div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: '#153D4B', marginBottom: '14px' }}>
                    Enhance Your Stay (Optional Add-ons)
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #E2E1DA',
                        backgroundColor: addons.airportShuttle ? '#FDF9F4' : '#FFFFFF',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={addons.airportShuttle}
                        onChange={(e) => setAddons({ ...addons, airportShuttle: e.target.checked })}
                        style={{ marginTop: '4px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '14px' }}>
                          <span>Airport VIP Pick-up / Drop-off</span>
                          <span style={{ color: '#E49951' }}>+$15</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#5E6E75' }}>Direct private shuttle from/to Addis Ababa Bole Airport.</p>
                      </div>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #E2E1DA',
                        backgroundColor: addons.breakfast ? '#FDF9F4' : '#FFFFFF',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={addons.breakfast}
                        onChange={(e) => setAddons({ ...addons, breakfast: e.target.checked })}
                        style={{ marginTop: '4px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '14px' }}>
                          <span>Daily Breakfast Buffet</span>
                          <span style={{ color: '#E49951' }}>+${addonPrices.breakfast}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#5E6E75' }}>Full international & traditional Ethiopian breakfast buffet.</p>
                      </div>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #E2E1DA',
                        backgroundColor: addons.spaTreatment ? '#FDF9F4' : '#FFFFFF',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={addons.spaTreatment}
                        onChange={(e) => setAddons({ ...addons, spaTreatment: e.target.checked })}
                        style={{ marginTop: '4px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '14px' }}>
                          <span>Aromatherapy Spa Massage</span>
                          <span style={{ color: '#E49951' }}>+$65</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#5E6E75' }}>60-min restorative botanical massage session.</p>
                      </div>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #E2E1DA',
                        backgroundColor: addons.coffeeCeremony ? '#FDF9F4' : '#FFFFFF',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={addons.coffeeCeremony}
                        onChange={(e) => setAddons({ ...addons, coffeeCeremony: e.target.checked })}
                        style={{ marginTop: '4px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '14px' }}>
                          <span>Traditional Coffee Ceremony</span>
                          <span style={{ color: '#E49951' }}>+${addonPrices.coffeeCeremony}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#5E6E75' }}>Authentic cultural coffee tasting & ceremony.</p>
                      </div>
                    </label>
                  </div>

                  {/* Promo Code */}
                  <div style={{ backgroundColor: '#F7F7F2', padding: '16px', borderRadius: '8px', border: '1px solid #E2E1DA' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '8px' }}>
                      PROMO CODE
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="e.g. GRANDMEMBER15"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          borderRadius: '6px',
                          border: '1px solid #E5E7EB',
                          backgroundColor: '#F3F4F6',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={applyPromo}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#153D4B',
                          color: '#FFFFFF',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Apply
                      </button>
                    </div>
                    {promoMessage && (
                      <p
                        style={{
                          fontSize: '11px',
                          marginTop: '6px',
                          color: discountPercent > 0 ? '#10B981' : '#EF4444',
                          fontWeight: 500,
                        }}
                      >
                        {promoMessage}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Guest Info & Summary */}
                <div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: '#153D4B', marginBottom: '14px' }}>
                    Guest Information
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '6px' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Enter your full name"
                        style={{
                          width: '100%',
                          backgroundColor: '#F3F4F6',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '11px 13px',
                          fontSize: '13px',
                          color: '#1F2937',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '6px' }}>
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="name@example.com"
                          style={{
                            width: '100%',
                            backgroundColor: '#F3F4F6',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            padding: '11px 13px',
                            fontSize: '13px',
                            color: '#1F2937',
                            outline: 'none',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '6px' }}>
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="+251..."
                          style={{
                            width: '100%',
                            backgroundColor: '#F3F4F6',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            padding: '11px 13px',
                            fontSize: '13px',
                            color: '#1F2937',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '6px' }}>
                        Special Requests (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Quiet room, late check-in time, dietary preferences..."
                        style={{
                          width: '100%',
                          backgroundColor: '#F3F4F6',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '11px 13px',
                          fontSize: '13px',
                          color: '#1F2937',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Price Breakdown Card */}
                  <div style={{ backgroundColor: '#F9F9F6', padding: '18px', borderRadius: '10px', border: '1px solid #E2E1DA' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#153D4B', marginBottom: '10px' }}>
                      Reservation Summary
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#5E6E75', marginBottom: '6px' }}>
                      <span>{selectedRoom.name} ({nights} nights):</span>
                      <span>${roomSubtotal}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10B981', marginBottom: '6px' }}>
                        <span>Promo Discount ({discountPercent}%):</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    {addonsTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#5E6E75', marginBottom: '6px' }}>
                        <span>Add-on Services:</span>
                        <span>+${addonsTotal}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#5E6E75', marginBottom: '6px' }}>
                      <span>Taxes & Hotel Fees (15% VAT):</span>
                      <span>+${tax}</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        paddingTop: '10px',
                        marginTop: '8px',
                        borderTop: '1px dashed #D5D4CC',
                        fontWeight: 700,
                        fontSize: '18px',
                        color: '#153D4B',
                      }}
                    >
                      <span>Grand Total:</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#E49951' }}>${grandTotal} USD</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Gateway & Method Selector */}
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #ECEBE5' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#153D4B' }}>
                    Select Payment Method *
                  </label>
                  <span style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> 256-bit Encrypted
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                  {PAYMENT_PROVIDERS.map((prov) => {
                    const isSelected = selectedPaymentProvider === prov.id;
                    return (
                      <div
                        key={prov.id}
                        onClick={() => setSelectedPaymentProvider(prov.id)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '8px',
                          border: isSelected ? `2px solid ${prov.color}` : '1px solid #E2E1DA',
                          backgroundColor: isSelected ? prov.bgLight : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          gap: '2px',
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? prov.color : '#153D4B' }}>
                          {prov.name}
                        </div>
                        <span style={{ fontSize: '10px', color: '#838A8D' }}>
                          {prov.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Helper Note */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#F7F7F2',
                    border: '1px solid #E2E1DA',
                    fontSize: '11px',
                    color: '#5E6E75',
                  }}
                >
                  {selectedPaymentProvider === 'SKINA' && (
                    <span><strong>SkinaPay (Default):</strong> Secure instant checkout accepting <strong>Visa, Mastercard, American Express, UnionPay</strong>, and local Ethiopian debit cards.</span>
                  )}
                  {selectedPaymentProvider === 'TELEBIRR' && (
                    <span><strong>Telebirr:</strong> Fast USSD push prompt to phone (*127#) or scan QR via Telebirr SuperApp.</span>
                  )}
                  {selectedPaymentProvider === 'CHAPA' && (
                    <span><strong>Chapa:</strong> Online gateway supporting Telebirr, CBE Birr, Awash Bank, and Visa/Mastercard.</span>
                  )}
                  {selectedPaymentProvider === 'CBE_BIRR' && (
                    <span><strong>Commercial Bank of Ethiopia (CBE / CEB):</strong> Pay via CBE Birr shortcode <strong>882200</strong> or CBE Mobile App.</span>
                  )}
                  {selectedPaymentProvider === 'CASH_ON_ARRIVAL' && (
                    <span><strong>Cash / Pay at Hotel:</strong> Guarantee room now, pay upon arrival at Grand Addis Front Desk in ETB or USD.</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '28px',
                  paddingTop: '20px',
                  borderTop: '1px solid #ECEBE5',
                }}
              >
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#5E6E75',
                  }}
                >
                  <ArrowLeft size={16} /> Back to Rooms
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ padding: '14px 32px' }}
                >
                  <ShieldCheck size={16} />
                  <span>
                    {isSubmitting
                      ? 'Processing...'
                      : selectedPaymentProvider === 'CASH_ON_ARRIVAL'
                      ? 'Confirm Reservation'
                      : `Proceed to Pay (${selectedPaymentProvider === 'CBE_BIRR' ? 'CBE Birr' : selectedPaymentProvider})`}
                  </span>
                </button>
              </div>

              {bookingError && (
                <div
                  role="alert"
                  style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#B91C1C',
                    fontSize: '13.5px',
                    fontWeight: 500,
                    textAlign: 'center',
                  }}
                >
                  {bookingError}
                </div>
              )}
            </form>
          )}

          {/* STEP 3: Instant Confirmation Voucher */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: paymentStatus === 'SUCCESS' ? '#ECFDF5' : '#FFFBEB',
                  color: paymentStatus === 'SUCCESS' ? '#10B981' : '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                }}
              >
                <Check size={36} />
              </div>

              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: '#153D4B', marginBottom: '8px' }}>
                {paymentStatus === 'SUCCESS' ? 'Reservation & Payment Confirmed!' : 'Your Reservation is Confirmed!'}
              </h3>
              <p style={{ fontSize: '15px', color: '#5E6E75', maxWidth: '520px', margin: '0 auto 24px' }}>
                Thank you, <strong>{guestName || 'Guest'}</strong>. We look forward to welcoming you to Grand Addis Hotel. A confirmation email has been dispatched to <strong>{guestEmail || 'your email'}</strong>.
              </p>

              {/* Voucher Box */}
              <div
                style={{
                  maxWidth: '560px',
                  margin: '0 auto 28px',
                  backgroundColor: '#FBF9F4',
                  border: '2px dashed #E49951',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #E2E1DA', paddingBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#838A8D', display: 'block' }}>
                      CONFIRMATION REFERENCE
                    </span>
                    <strong style={{ fontSize: '18px', color: '#E49951' }}>{bookingRef}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#838A8D', display: 'block' }}>
                      PAYMENT STATUS
                    </span>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: paymentStatus === 'SUCCESS' ? '#DEF7EC' : '#FEF3C7',
                        color: paymentStatus === 'SUCCESS' ? '#03543F' : '#92400E',
                      }}
                    >
                      {paymentStatus === 'SUCCESS' ? '✓ PAID & VERIFIED' : '⏳ PAY ON ARRIVAL'}
                    </span>
                  </div>
                </div>

                {(dateChangeFlag || nights > 1) && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      backgroundColor: (dateChangeFlag && !dateChangeFlag.isExtended) ? '#EFF6FF' : '#FEF3C7',
                      border: (dateChangeFlag && !dateChangeFlag.isExtended) ? '1px solid #93C5FD' : '1px solid #F59E0B',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      marginBottom: '16px',
                      fontSize: '12px',
                      color: (dateChangeFlag && !dateChangeFlag.isExtended) ? '#1E40AF' : '#92400E',
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🚩</span>
                    <div style={{ flex: 1 }}>
                      <strong>
                        {dateChangeFlag && !dateChangeFlag.isExtended
                          ? `Stay Shortened / Decreased (${nights} ${nights === 1 ? 'Night' : 'Nights'} Total)`
                          : `Extended Stay Confirmed (${nights} Nights Total)`}
                      </strong>
                      <div style={{ fontSize: '11px', color: (dateChangeFlag && !dateChangeFlag.isExtended) ? '#2563EB' : '#B45309', fontWeight: 500, marginTop: '2px' }}>
                        {dateChangeFlag?.text || `Dates confirmed (${checkIn} to ${checkOut}). Total payment adjusted to $${grandTotal} USD.`}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ color: '#838A8D' }}>Room Reserved:</span>
                    <strong style={{ display: 'block', color: '#153D4B' }}>{selectedRoom.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#838A8D' }}>Length of Stay:</span>
                    <strong style={{ display: 'block', color: '#153D4B' }}>{nights} {nights === 1 ? 'Night' : 'Nights'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#838A8D' }}>Payment Method:</span>
                    <strong style={{ display: 'block', color: '#153D4B' }}>{selectedPaymentProvider}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#838A8D' }}>Transaction Ref:</span>
                    <code style={{ fontSize: '11px', color: '#E49951', fontWeight: 600 }}>
                      {activeTxRef || `TX-${selectedPaymentProvider}-${bookingRef.slice(-4)}`}
                    </code>
                  </div>
                  <div>
                    <span style={{ color: '#838A8D' }}>Check-in:</span>
                    <strong style={{ display: 'block', color: '#153D4B' }}>{checkIn} (from 14:00)</strong>
                  </div>
                  <div>
                    <span style={{ color: '#838A8D' }}>Total Amount:</span>
                    <strong style={{ display: 'block', color: '#E49951' }}>${grandTotal} USD</strong>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#5E6E75', borderTop: '1px solid #E2E1DA', paddingTop: '10px' }}>
                  Need to change or have questions? Call our 24/7 reception desk at <strong>{HOTEL_INFO.phone}</strong>.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                {paymentStatus !== 'SUCCESS' && (
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#00A36C', gap: '8px' }}
                  >
                    <CreditCard size={16} /> Pay Online Now (Chapa / Telebirr / CBE / Skina)
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="btn btn-outline"
                  style={{ gap: '8px' }}
                >
                  <Printer size={16} /> Print Voucher
                </button>
                <button
                  onClick={closeBooking}
                  className="btn btn-primary"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Payment Modal */}
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            bookingRef={bookingRef}
            reservationId={createdReservationId}
            amountUSD={grandTotal}
            amountETB={grandTotalETB}
            guestName={guestName}
            guestEmail={guestEmail}
            guestPhone={guestPhone}
            roomName={selectedRoom.name}
            checkInDate={checkIn}
            checkOutDate={checkOut}
            initialProvider={selectedPaymentProvider}
            onPaymentSuccess={handlePaymentSuccess}
          />

        </div>

        {/* Footer actions for Step 1 */}
        {step === 1 && (
          <div
            style={{
              backgroundColor: '#F7F7F2',
              padding: '16px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #E2E1DA',
            }}
          >
            <div>
              <span style={{ fontSize: '12px', color: '#838A8D', display: 'block' }}>Selected Room:</span>
              <strong style={{ fontSize: '15px', color: '#153D4B' }}>
                {selectedRoom.name} — ${selectedRoom.pricePerNight * nights} ({nights} {nights === 1 ? 'night' : 'nights'})
              </strong>
            </div>

            <button
              onClick={() => setStep(2)}
              className="btn btn-primary"
              style={{ padding: '12px 28px' }}
            >
              <span>Continue to Guest Details</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

      </div>

      <style jsx>{`
        @keyframes modalZoomIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
