'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Users,
  Check,
  ShieldCheck,
  Printer,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Coffee,
  Plane,
  Clock,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Lock,
  Trash2,
  ChevronDown,
  ChevronLeft,
  Info,
} from 'lucide-react';
import { ROOMS, HOTEL_INFO, Room } from '@/data/hotelData';
import { useCurrency } from '@/context/CurrencyContext';
import PaymentModal from '@/components/PaymentModal';
import MastercardCardForm from '@/components/MastercardCardForm';
import { PaymentProviderType } from '@/lib/payment-types';
import { getTodayDateStr, addDays, calculateStayNights, formatFriendlyDate, formatHotelDate } from '@/lib/dates';
import { computeBookingTotals, getPromoDiscountPercent } from '@/lib/booking-pricing';

function ReservationContent() {
  const searchParams = useSearchParams();
  const { rate, currency, formatPrice } = useCurrency();

  const todayStr = getTodayDateStr();
  const tomorrowStr = addDays(todayStr, 1);

  const queryRoomId = searchParams.get('roomId') || 'deluxe-room';
  const queryCheckIn = searchParams.get('checkIn') || todayStr;
  const queryCheckOut = searchParams.get('checkOut') || tomorrowStr;
  const queryAdults = Number(searchParams.get('adults')) || 2;
  const queryChildren = Number(searchParams.get('children')) || 0;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRoomId, setSelectedRoomId] = useState(queryRoomId);
  const [checkIn, setCheckIn] = useState(queryCheckIn);
  const [checkOut, setCheckOut] = useState(queryCheckOut);
  const [adults, setAdults] = useState(queryAdults);
  const [children, setChildren] = useState(queryChildren);
  // Stay length from the initial selection — date changes are measured against
  // this baseline so ordinary multi-night stays are not flagged as changes.
  const [baselineNights, setBaselineNights] = useState(() => calculateStayNights(queryCheckIn, queryCheckOut));

  const [addons, setAddons] = useState({
    airportShuttle: false,
    breakfast: true,
    spaTreatment: false,
    coffeeCeremony: false,
  });

  // Guest Details & Contact fields matching standard hotel form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState('02:00 pm');
  const [isBookingForSomeoneElse, setIsBookingForSomeoneElse] = useState(false);
  const [countryCode, setCountryCode] = useState('+251');
  const [contactNo, setContactNo] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // World Mastercard card form fields
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);

  // Promo code & Price breakdown UI toggles
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [sandboxTestCard, setSandboxTestCard] = useState<{ number: string; expiry: string; cvc: string } | null>(null);

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [activeTxRef, setActiveTxRef] = useState('');
  const selectedPaymentProvider: PaymentProviderType = 'SKINA';
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'SUCCESS'>('PENDING');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateChangeFlag, setDateChangeFlag] = useState<{ isExtended: boolean; text: string; delta: number; totalNights: number } | null>(null);
  const [bookingError, setBookingError] = useState('');

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
        console.error('Failed to fetch rooms from PostgreSQL:', err);
      }
    }
    loadPostgresRooms();
  }, []);

  const selectedRoom =
    rooms.find(
      (r) =>
        r.id === selectedRoomId ||
        r.slug === selectedRoomId ||
        (r.aliases || []).includes(selectedRoomId)
    ) ||
    rooms.find((r) => r.slug === 'deluxe-room' || (r.aliases || []).includes('deluxe-room')) ||
    rooms[0];

  // Calculation - safely handle date arithmetic and stay extension
  const nights = calculateStayNights(checkIn, checkOut);

  /** Update the change flag relative to the baseline (initial) stay length. */
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
        percent === 20 ? 'Weekend Special: 20% discount applied!' : 'Member discount 15% applied!'
      );
    } else {
      setDiscountPercent(0);
      setPromoMessage('Invalid promo code');
    }
  };

  useEffect(() => {
    fetch('/api/payments/config')
      .then((r) => r.json())
      .then((data) => {
        if (data?.skina?.isSandbox && data?.skina?.testCards?.length > 0) {
          const t = data.skina.testCards[0];
          setSandboxTestCard({ number: t.number, expiry: t.expiry, cvc: t.cvc });
        }
      })
      .catch(() => {});
  }, []);

  const handleFirstNameChange = (val: string) => {
    setFirstName(val);
    const combined = `${val} ${lastName}`.trim();
    setGuestName(combined);
    if (!cardHolder || cardHolder === `${firstName} ${lastName}`.trim().toUpperCase()) {
      setCardHolder(combined.toUpperCase());
    }
  };

  const handleLastNameChange = (val: string) => {
    setLastName(val);
    const combined = `${firstName} ${val}`.trim();
    setGuestName(combined);
    if (!cardHolder || cardHolder === `${firstName} ${lastName}`.trim().toUpperCase()) {
      setCardHolder(combined.toUpperCase());
    }
  };

  const validateCardForm = (): string | null => {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) {
      return 'Please enter a valid card number.';
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      return 'Please enter the card expiry as MM/YY.';
    }
    const [mm, yy] = cardExpiry.split('/').map(Number);
    if (mm < 1 || mm > 12) return 'The expiry month must be between 01 and 12.';
    const expiry = new Date(2000 + yy, mm, 0);
    if (expiry.getTime() < Date.now()) return 'This card has expired.';
    if (!/^\d{3,4}$/.test(cardCvc)) {
      return 'Please enter a valid CVV (3 or 4 digits).';
    }
    if (!cardHolder.trim() && !firstName.trim()) {
      return 'Please enter the Name On Card.';
    }
    if (!agreeTerms) {
      return 'Please agree to our Terms and Conditions to proceed.';
    }
    return null;
  };

  const handleConfirm = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setBookingError('');

    const effectiveName = (firstName && lastName)
      ? `${firstName} ${lastName}`.trim()
      : (guestName || firstName || lastName || '').trim();

    if (!effectiveName) {
      setBookingError('Please enter your First Name and Last Name.');
      return;
    }
    if (!guestEmail || !guestEmail.includes('@')) {
      setBookingError('Please enter a valid email address.');
      return;
    }
    const effectivePhone = contactNo
      ? `${countryCode} ${contactNo}`.trim()
      : (guestPhone || '').trim();
    if (!effectivePhone) {
      setBookingError('Please enter your contact phone number.');
      return;
    }

    const cardErr = validateCardForm();
    if (cardErr) {
      setBookingError(cardErr);
      return;
    }

    setIsSubmitting(true);
    try {
      const fullSpecialRequests = [
        specialRequests.trim(),
        estimatedArrivalTime ? `Estimated arrival time: ${estimatedArrivalTime}` : '',
        isBookingForSomeoneElse ? 'Guest is booking for someone else' : '',
      ].filter(Boolean).join(' | ');

      // 1. Create reservation in PostgreSQL database
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
          guestName: effectiveName,
          guestEmail: guestEmail.trim(),
          guestPhone: effectivePhone,
          specialRequests: fullSpecialRequests,
          addons,
          promoCode: promoCode.trim(),
          currency: 'USD',
          paymentProvider: selectedPaymentProvider,
          isDateExtended: Boolean(dateChangeFlag),
          dateChangeNote: dateChangeFlag?.text || '',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || !data.bookingRef) {
        throw new Error(
          data?.error || 'We could not complete your reservation. Please try again or contact the hotel.'
        );
      }

      const newBookingRef = data.bookingRef;
      const newReservationId = data.reservationId || '';
      setBookingRef(newBookingRef);
      setReservationId(newReservationId);

      // 2. Authorize credit card with payment gateway
      const initRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: newReservationId,
          provider: 'SKINA',
          cardDetails: {
            number: cardNumber,
            expiry: cardExpiry,
            cvc: cardCvc,
            cardHolder: cardHolder || effectiveName,
          },
        }),
      });
      const initData = await initRes.json().catch(() => null);
      if (!initData || !initData.success) {
        throw new Error(initData?.error || 'Credit card authorization failed. Please check your card details.');
      }

      const txRef = initData.payment?.txRef || data.txRef;
      setActiveTxRef(txRef);

      // 3. Verify Payment
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txRef,
          status: 'SUCCESS',
          gatewayRef: `GW-MC-${Date.now().toString().slice(-6)}`,
        }),
      });
      const verifyData = await verifyRes.json().catch(() => null);
      if (verifyData && verifyData.success) {
        setPaymentStatus('SUCCESS');
        setStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(verifyData?.error || 'Payment verification could not be confirmed.');
      }
    } catch (err: any) {
      console.error('Reservation error:', err);
      setBookingError(err?.message || 'Network error — please check your connection and try again.');
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ paddingTop: 'var(--header-height, 96px)' }}>
      {/* Banner */}
      <section style={{ backgroundColor: '#0F2A33', color: '#FFFFFF', padding: '60px 0 40px', textAlign: 'center' }}>
        <div className="container">
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', color: '#E49951', fontWeight: 600 }}>
            DIRECT RESERVATION PORTAL
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 500, margin: '10px 0' }}>
            Book Your Stay at Grand Addis
          </h1>
          <p style={{ color: '#A2B5BD', fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>
            Instant reservation confirmation • Best price guaranteed direct • Zero booking fees
          </p>
        </div>
      </section>

      {/* Booking Form Body */}
      <section className="section-padding bg-light">
        <div className="container">
          {/* Step Indicator */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '24px',
              marginBottom: '40px',
            }}
          >
            {[
              { num: 1, label: 'Room & Dates' },
              { num: 2, label: 'Guest Details' },
              { num: 3, label: 'Confirmation' },
            ].map((s) => (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: step >= s.num ? '#E49951' : '#E2E1DA',
                    color: step >= s.num ? '#FFFFFF' : '#838A8D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: step === s.num ? 600 : 400,
                    color: step === s.num ? '#153D4B' : '#838A8D',
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', gap: '36px' }}>
              <div>
                {/* Dates & Guests */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid #E2E1DA',
                    marginBottom: '28px',
                  }}
                >
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: '#153D4B', marginBottom: '16px' }}>
                    Select Dates & Travelers
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                        CHECK-IN
                      </label>
                      <input
                        type="date"
                        value={checkIn}
                        min={todayStr}
                        onChange={(e) => handleCheckInChange(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#153D4B' }}>
                          CHECK-OUT
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
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                        ADULTS
                      </label>
                      <select
                        value={adults}
                        onChange={(e) => setAdults(Number(e.target.value))}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
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
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                      >
                        <option value={0}>0 Children</option>
                        <option value={1}>1 Child</option>
                        <option value={2}>2 Children</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Stay Extension Controls */}
                  <div
                    style={{
                      marginTop: '16px',
                      paddingTop: '12px',
                      borderTop: '1px solid #ECEBE5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#5E6E75' }}>
                      Duration: <strong>{nights} {nights === 1 ? 'Night' : 'Nights'}</strong> ({formatFriendlyDate(checkIn)} → {formatFriendlyDate(checkOut)})
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#153D4B' }}>Quick adjust:</span>
                      <button
                        type="button"
                        disabled={nights <= 1}
                        onClick={() => handleExtendNights(-1)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #D5D4CC',
                          backgroundColor: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: nights <= 1 ? 'not-allowed' : 'pointer',
                          color: nights <= 1 ? '#A0AEC0' : '#153D4B',
                        }}
                      >
                        −1 Night
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExtendNights(1)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #E49951',
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        +1 Night
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExtendNights(2)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #E49951',
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        +2 Nights
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExtendNights(3)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #E49951',
                          backgroundColor: '#FEF3C7',
                          color: '#B45309',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        +3 Nights
                      </button>
                    </div>
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
                      padding: '14px 18px',
                      borderRadius: '10px',
                      marginBottom: '24px',
                      fontSize: '13px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🚩</span>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontWeight: 700 }}>
                        {dateChangeFlag.isExtended ? 'Stay Date Extension Notification Flag:' : 'Stay Date Shortened / Decreased Flag:'}
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

                {/* Rooms selection */}
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: '#153D4B', marginBottom: '18px' }}>
                  Select Accommodations ({nights} {nights === 1 ? 'Night' : 'Nights'})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {rooms.map((room) => {
                    const isSelected = room.id === selectedRoomId;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '180px 1fr auto',
                          gap: '20px',
                          alignItems: 'center',
                          backgroundColor: isSelected ? '#FDF9F4' : '#FFFFFF',
                          border: isSelected ? '2px solid #E49951' : '1px solid #E2E1DA',
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ position: 'relative', height: '110px', borderRadius: '8px', overflow: 'hidden' }}>
                          <Image
                            src={room.images[0] || '/images/BO5A5779-scaled.jpg'}
                            alt={room.name}
                            fill
                            sizes="180px"
                            loading="lazy"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h4 style={{ fontSize: '17px', fontWeight: 600, color: '#153D4B' }}>{room.name}</h4>
                            <span style={{ fontSize: '11px', color: '#E49951', backgroundColor: '#FBF4EC', padding: '2px 8px', borderRadius: '4px' }}>
                              {room.category}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: '#5E6E75', marginBottom: '6px' }}>
                            {room.size} • {room.bedType} • Max {room.capacity} Guests
                          </p>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {room.amenities.slice(0, 3).map((a, i) => (
                              <span key={i} style={{ fontSize: '11px', color: '#838A8D', backgroundColor: '#F7F7F2', padding: '2px 6px', borderRadius: '3px' }}>
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', minWidth: '130px' }}>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: '#E49951' }}>
                            ${room.pricePerNight * nights}
                          </div>
                          <div style={{ fontSize: '11px', color: '#838A8D', marginBottom: '8px' }}>
                            ${room.pricePerNight} / night
                          </div>
                          <button
                            type="button"
                            className={isSelected ? 'btn btn-primary' : 'btn btn-outline'}
                            style={{ padding: '6px 14px', fontSize: '11px' }}
                          >
                            {isSelected ? '✓ Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Summary */}
              <div>
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E1DA',
                    padding: '24px',
                    position: 'sticky',
                    top: '100px',
                  }}
                >
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: '#153D4B', marginBottom: '16px' }}>
                    Reservation Breakdown
                  </h4>

                  <div style={{ fontSize: '13px', color: '#5E6E75', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Room:</span>
                      <strong style={{ color: '#153D4B' }}>{selectedRoom.name}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Check-In:</span>
                      <span>{checkIn}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Check-Out:</span>
                      <span>{checkOut}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Duration:</span>
                      <span>{nights} {nights === 1 ? 'night' : 'nights'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Guests:</span>
                      <span>{adults} Adults, {children} Children</span>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '1px dashed #D5D4CC',
                      paddingTop: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: '20px',
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>
                      Room Subtotal <span style={{ fontSize: '11px', fontWeight: 500, color: '#838A8D' }}>(excl. VAT &amp; extras)</span>:
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '22px', fontWeight: 700, color: '#E49951' }}>
                        ${selectedRoom.pricePerNight * nights}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                  >
                    <span>Proceed to Details</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
              <style>{`
                @media (max-width: 960px) {
                  .reservation-checkout-layout {
                    grid-template-columns: 1fr !important;
                  }
                }
              `}</style>

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
                    padding: '14px 18px',
                    borderRadius: '10px',
                    marginBottom: '20px',
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

              <form onSubmit={handleConfirm} noValidate>
                <div
                  className="reservation-checkout-layout"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.35fr) minmax(360px, 1fr)',
                    gap: '24px',
                    alignItems: 'start',
                  }}
                >
                  {/* LEFT COLUMN: Guest & Contact Details Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Card 1: Room & Stay & Guest Details */}
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB',
                        padding: '24px 28px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      <h2
                        style={{
                          fontSize: '22px',
                          fontWeight: 700,
                          color: '#881337',
                          margin: '0 0 18px',
                          letterSpacing: '-0.3px',
                        }}
                      >
                        {selectedRoom.name}
                      </h2>

                      {/* Check In / Check Out dates */}
                      <div style={{ display: 'flex', gap: '48px', marginBottom: '22px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#881337', fontWeight: 600, marginBottom: '3px' }}>
                            Check In
                          </div>
                          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827' }}>
                            {formatHotelDate(checkIn)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#881337', fontWeight: 600, marginBottom: '3px' }}>
                            Check Out
                          </div>
                          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827' }}>
                            {formatHotelDate(checkOut)}
                          </div>
                        </div>
                      </div>

                      {/* Guest Details * */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                          Guest Details <span style={{ color: '#DC2626' }}>*</span>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.2fr) minmax(80px, 0.7fr)',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <input
                              type="text"
                              placeholder="First Name"
                              value={firstName}
                              onChange={(e) => handleFirstNameChange(e.target.value)}
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
                            <input
                              type="text"
                              placeholder="Last Name"
                              value={lastName}
                              onChange={(e) => handleLastNameChange(e.target.value)}
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

                          <div style={{ position: 'relative' }}>
                            <select
                              value={adults}
                              onChange={(e) => setAdults(Number(e.target.value))}
                              style={{
                                width: '100%',
                                backgroundColor: '#F3F4F6',
                                border: '1px solid #E5E7EB',
                                borderRadius: '6px',
                                padding: '11px 28px 11px 13px',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#1F2937',
                                appearance: 'none',
                                cursor: 'pointer',
                                outline: 'none',
                              }}
                            >
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                              <option value={4}>4</option>
                              <option value={5}>5</option>
                              <option value={6}>6</option>
                            </select>
                            <ChevronDown
                              size={14}
                              color="#6B7280"
                              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Special Request & Estimated Arrival */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#881337', marginBottom: '6px' }}>
                            Special Request
                          </label>
                          <input
                            type="text"
                            placeholder="Special Request"
                            value={specialRequests}
                            onChange={(e) => setSpecialRequests(e.target.value)}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                            <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#881337' }}>
                              Estimated arrival time
                            </label>
                            <span title="Helps us ensure your room is ready">
                              <Info size={13} color="#9CA3AF" style={{ cursor: 'pointer' }} />
                            </span>
                          </div>
                          <div style={{ position: 'relative' }}>
                            <select
                              value={estimatedArrivalTime}
                              onChange={(e) => setEstimatedArrivalTime(e.target.value)}
                              style={{
                                width: '100%',
                                backgroundColor: '#F3F4F6',
                                border: '1px solid #E5E7EB',
                                borderRadius: '6px',
                                padding: '11px 28px 11px 13px',
                                fontSize: '13px',
                                color: '#1F2937',
                                appearance: 'none',
                                cursor: 'pointer',
                                outline: 'none',
                              }}
                            >
                              <option value="10:00 am">10:00 am</option>
                              <option value="11:00 am">11:00 am</option>
                              <option value="12:00 pm">12:00 pm</option>
                              <option value="01:00 pm">01:00 pm</option>
                              <option value="02:00 pm">02:00 pm</option>
                              <option value="03:00 pm">03:00 pm</option>
                              <option value="04:00 pm">04:00 pm</option>
                              <option value="05:00 pm">05:00 pm</option>
                              <option value="06:00 pm">06:00 pm</option>
                              <option value="07:00 pm">07:00 pm</option>
                              <option value="08:00 pm">08:00 pm</option>
                              <option value="09:00 pm">09:00 pm</option>
                              <option value="10:00 pm">10:00 pm</option>
                              <option value="11:00 pm">11:00 pm</option>
                              <option value="Late Arrival">Late Arrival (after midnight)</option>
                            </select>
                            <ChevronDown
                              size={14}
                              color="#6B7280"
                              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stay duration adjustments (+1 / -1 night) */}
                      <div
                        style={{
                          marginTop: '18px',
                          paddingTop: '14px',
                          borderTop: '1px dashed #E5E7EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          Stay: <strong style={{ color: '#111827' }}>{nights} {nights === 1 ? 'Night' : 'Nights'}</strong> (${selectedRoom.pricePerNight}/night)
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            disabled={nights <= 1}
                            onClick={() => handleExtendNights(-1)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid #D1D5DB',
                              backgroundColor: '#FFFFFF',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: nights <= 1 ? '#9CA3AF' : '#374151',
                              cursor: nights <= 1 ? 'not-allowed' : 'pointer',
                            }}
                          >
                            −1 Night
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExtendNights(1)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid #D4A359',
                              backgroundColor: '#FEF3C7',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#92400E',
                              cursor: 'pointer',
                            }}
                          >
                            +1 Night
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExtendNights(2)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid #D4A359',
                              backgroundColor: '#FEF3C7',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#92400E',
                              cursor: 'pointer',
                            }}
                          >
                            +2 Nights
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Contact Details */}
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB',
                        padding: '24px 28px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: '#881337',
                          margin: '0 0 14px',
                        }}
                      >
                        Contact Details
                      </h3>

                      {/* Toggle: I am booking for someone else */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isBookingForSomeoneElse}
                          onClick={() => setIsBookingForSomeoneElse(!isBookingForSomeoneElse)}
                          style={{
                            width: '38px',
                            height: '20px',
                            backgroundColor: isBookingForSomeoneElse ? '#D4A359' : '#9CA3AF',
                            borderRadius: '999px',
                            padding: '2px',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'relative',
                            display: 'inline-flex',
                            alignItems: 'center',
                            transition: 'background-color 0.2s',
                          }}
                        >
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '50%',
                              transform: isBookingForSomeoneElse ? 'translateX(18px)' : 'translateX(0)',
                              transition: 'transform 0.2s',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            }}
                          />
                        </button>
                        <span style={{ fontSize: '13px', color: '#881337', fontWeight: 600 }}>
                          I am booking for someone else
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#881337', marginBottom: '6px' }}>
                            Country code <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <div style={{ position: 'relative' }}>
                              <select
                                value={countryCode}
                                onChange={(e) => {
                                  setCountryCode(e.target.value);
                                  setGuestPhone(`${e.target.value} ${contactNo}`);
                                }}
                                style={{
                                  backgroundColor: '#F3F4F6',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '6px',
                                  padding: '11px 22px 11px 10px',
                                  fontSize: '12.5px',
                                  fontWeight: 600,
                                  color: '#1F2937',
                                  appearance: 'none',
                                  cursor: 'pointer',
                                  outline: 'none',
                                }}
                              >
                                <option value="+251">🇪🇹 +251</option>
                                <option value="+1">🇺🇸 +1</option>
                                <option value="+44">🇬🇧 +44</option>
                                <option value="+971">🇦🇪 +971</option>
                                <option value="+49">🇩🇪 +49</option>
                                <option value="+33">🇫🇷 +33</option>
                                <option value="+86">🇨🇳 +86</option>
                                <option value="+254">🇰🇪 +254</option>
                              </select>
                              <ChevronDown
                                size={12}
                                color="#6B7280"
                                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                              />
                            </div>
                            <input
                              type="tel"
                              placeholder="Contact no"
                              value={contactNo}
                              onChange={(e) => {
                                setContactNo(e.target.value);
                                setGuestPhone(`${countryCode} ${e.target.value}`);
                              }}
                              style={{
                                flex: 1,
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
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#881337', marginBottom: '6px' }}>
                            Email <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <input
                            type="email"
                            placeholder="example@email.com"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
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
                    </div>

                    {/* Card 3: Optional Add-on Experiences & Services */}
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB',
                        padding: '20px 28px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
                        Enhance Your Stay (Optional Add-ons)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            borderRadius: '6px',
                            border: '1px solid #E5E7EB',
                            backgroundColor: addons.airportShuttle ? '#FEF9F0' : '#F9FAFB',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={addons.airportShuttle}
                            onChange={(e) => setAddons({ ...addons, airportShuttle: e.target.checked })}
                            style={{ accentColor: '#D4A359' }}
                          />
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1F2937' }}>Airport Shuttle (+$15)</div>
                            <div style={{ fontSize: '10.5px', color: '#6B7280' }}>Chauffeured Bole Airport pickup</div>
                          </div>
                        </label>

                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            borderRadius: '6px',
                            border: '1px solid #E5E7EB',
                            backgroundColor: addons.breakfast ? '#FEF9F0' : '#F9FAFB',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={addons.breakfast}
                            onChange={(e) => setAddons({ ...addons, breakfast: e.target.checked })}
                            style={{ accentColor: '#D4A359' }}
                          />
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1F2937' }}>Daily Breakfast (+${addonPrices.breakfast})</div>
                            <div style={{ fontSize: '10.5px', color: '#6B7280' }}>Buffet with Ethiopian & continental items</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Booking Details Summary & World Mastercard Card Form Card */}
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      padding: '24px 24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      position: 'sticky',
                      top: '110px',
                    }}
                  >
                    {/* Header row: Booking Details and Book more button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
                        Booking Details
                      </h3>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: '1px solid #D4A359',
                          backgroundColor: '#F6C374',
                          color: '#451A03',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                        }}
                      >
                        <span>‹</span> Book more
                      </button>
                    </div>

                    {/* Room Name & Trash Icon */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                        {selectedRoom.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        title="Change room"
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Inclusions subtitle */}
                    <div style={{ fontSize: '12px', color: '#D4A359', fontWeight: 500, margin: '2px 0 14px' }}>
                      Bed and Breakfast
                    </div>

                    {/* 4-Item Stay Bar */}
                    <div
                      style={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '14px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10px', color: '#881337', fontWeight: 600 }}>Check In</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{formatHotelDate(checkIn)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#881337', fontWeight: 600 }}>Check Out</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{formatHotelDate(checkOut)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 700, color: '#111827' }}>
                        <span>{adults}</span>
                        <span style={{ fontSize: '13px' }}>👤</span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                        USD {roomSubtotal}
                      </div>
                    </div>

                    {/* Total with price breakdown toggle */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: '12px',
                        borderBottom: '1px solid #E5E7EB',
                        marginBottom: '12px',
                      }}
                    >
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#111827' }}>Total</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '11px',
                            color: '#D4A359',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          {showPriceBreakdown ? '( Hide breakdown )' : '( Price breakdown )'}
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                          USD {grandTotal}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible price breakdown */}
                    {showPriceBreakdown && (
                      <div
                        style={{
                          backgroundColor: '#F9FAFB',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          marginBottom: '14px',
                          fontSize: '11.5px',
                          color: '#4B5563',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>Room ({nights} nights)</span>
                          <span>${roomSubtotal} USD</span>
                        </div>
                        {discountAmount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', marginBottom: '4px' }}>
                            <span>Promo Discount ({discountPercent}%)</span>
                            <span>-${discountAmount.toFixed(2)} USD</span>
                          </div>
                        )}
                        {addonsTotal > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>Add-ons</span>
                            <span>+${addonsTotal} USD</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>Taxes & VAT (15%)</span>
                          <span>+${tax} USD</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#111827', borderTop: '1px solid #E5E7EB', paddingTop: '4px', marginTop: '4px' }}>
                          <span>Total Due</span>
                          <span>${grandTotal} USD</span>
                        </div>
                      </div>
                    )}

                    {/* Promo code line */}
                    <div style={{ paddingBottom: '14px', borderBottom: '1px solid #E5E7EB', marginBottom: '14px' }}>
                      <div style={{ fontSize: '12px', color: '#374151' }}>
                        Do you have a promo code?{' '}
                        <button
                          type="button"
                          onClick={() => setShowPromoInput(!showPromoInput)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#D4A359',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                            textDecoration: 'underline',
                          }}
                        >
                          Click here
                        </button>
                      </div>

                      {showPromoInput && (
                        <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="e.g. GRANDMEMBER15"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            style={{
                              flex: 1,
                              backgroundColor: '#F3F4F6',
                              border: '1px solid #E5E7EB',
                              borderRadius: '6px',
                              padding: '8px 10px',
                              fontSize: '12px',
                            }}
                          />
                          <button
                            type="button"
                            onClick={applyPromo}
                            style={{
                              padding: '8px 14px',
                              backgroundColor: '#153D4B',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Apply
                          </button>
                        </div>
                      )}
                      {promoMessage && (
                        <div style={{ fontSize: '11px', marginTop: '6px', color: discountPercent > 0 ? '#10B981' : '#EF4444' }}>
                          {promoMessage}
                        </div>
                      )}
                    </div>

                    {/* Price Summary */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#881337', marginBottom: '8px' }}>
                        Price Summary
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Total</span>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>USD {grandTotal}</span>
                      </div>
                    </div>

                    {/* Sandbox helper link */}
                    {sandboxTestCard && (
                      <button
                        type="button"
                        onClick={() => {
                          setCardNumber(sandboxTestCard.number);
                          setCardExpiry(sandboxTestCard.expiry);
                          setCardCvc(sandboxTestCard.cvc);
                          if (!cardHolder) setCardHolder('GUEST TESTER');
                        }}
                        style={{
                          width: '100%',
                          padding: '7px',
                          marginBottom: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#6B7280',
                          backgroundColor: '#F9FAFB',
                          border: '1px dashed #D1D5DB',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        🧪 Sandbox: Fill Test Mastercard ({sandboxTestCard.number})
                      </button>
                    )}

                    {/* Standard World Mastercard card input form */}
                    <MastercardCardForm
                      cardHolder={cardHolder}
                      setCardHolder={setCardHolder}
                      cardNumber={cardNumber}
                      setCardNumber={setCardNumber}
                      cardExpiry={cardExpiry}
                      setCardExpiry={setCardExpiry}
                      cardCvc={cardCvc}
                      setCardCvc={setCardCvc}
                      agreeTerms={agreeTerms}
                      setAgreeTerms={setAgreeTerms}
                      subscribeNewsletter={subscribeNewsletter}
                      setSubscribeNewsletter={setSubscribeNewsletter}
                      isProcessing={isSubmitting}
                      onSubmit={handleConfirm}
                      submitButtonText="Confirm Booking"
                      errorMessage={bookingError}
                      showButton={true}
                    />
                  </div>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: paymentStatus === 'SUCCESS' ? '#ECFDF5' : '#FFFBEB',
                  color: paymentStatus === 'SUCCESS' ? '#10B981' : '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Check size={32} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: '#153D4B', marginBottom: '8px' }}>
                {paymentStatus === 'SUCCESS' ? 'Reservation & Payment Confirmed!' : 'Reservation Confirmed!'}
              </h2>
              <p style={{ color: '#5E6E75', fontSize: '15px', marginBottom: '28px' }}>
                Thank you, <strong>{guestName}</strong>. Your stay at Grand Addis Hotel has been registered in our database.
              </p>

              {/* Confirmation voucher */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '2px dashed #E49951',
                  padding: '28px',
                  textAlign: 'left',
                  marginBottom: '28px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ECEBE5', paddingBottom: '14px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#838A8D', display: 'block' }}>
                      BOOKING REFERENCE
                    </span>
                    <strong style={{ fontSize: '18px', color: '#E49951' }}>{bookingRef}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#838A8D', display: 'block' }}>
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
                      padding: '10px 14px',
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: '#153D4B', marginBottom: '16px' }}>
                  <div>
                    <span style={{ color: '#838A8D', display: 'block' }}>Room:</span>
                    <strong>{selectedRoom.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#838A8D', display: 'block' }}>Duration:</span>
                    <strong>{nights} Nights ({checkIn} to {checkOut})</strong>
                  </div>
                  <div>
                    <span style={{ color: '#838A8D', display: 'block' }}>Payment Provider:</span>
                    <strong style={{ color: '#153D4B' }}>{selectedPaymentProvider}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#838A8D', display: 'block' }}>Transaction Reference:</span>
                    <code style={{ fontSize: '11px', color: '#E49951', fontWeight: 600 }}>
                      {activeTxRef || `TX-${selectedPaymentProvider}-${bookingRef.slice(-4)}`}
                    </code>
                  </div>
                  <div>
                    <span style={{ color: '#838A8D', display: 'block' }}>Guests:</span>
                    <strong>{adults} Adults, {children} Children</strong>
                  </div>
                  <div>
                    <span style={{ color: '#838A8D', display: 'block' }}>Total Amount:</span>
                    <strong style={{ color: '#E49951' }}>${grandTotal} USD</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #ECEBE5', paddingTop: '12px', fontSize: '12px', color: '#5E6E75' }}>
                  Address: 22 Around Golagul, Addis Ababa • Front Desk: {HOTEL_INFO.phone}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button onClick={() => window.print()} className="btn btn-outline">
                  <Printer size={16} /> Print Voucher
                </button>
                <Link href="/" className="btn btn-primary">
                  Return to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Payment Processing Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        bookingRef={bookingRef}
        reservationId={reservationId}
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
  );
}

export default function RoomsReservationPage() {
  return (
    <Suspense fallback={<div style={{ padding: '120px 0', textAlign: 'center' }}>Loading reservation portal...</div>}>
      <ReservationContent />
    </Suspense>
  );
}
