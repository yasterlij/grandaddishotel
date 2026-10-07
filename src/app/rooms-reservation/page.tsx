'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  Smartphone,
  Building2,
  Banknote,
  Lock,
} from 'lucide-react';
import { ROOMS, HOTEL_INFO, Room } from '@/data/hotelData';
import { useCurrency } from '@/context/CurrencyContext';
import PaymentModal from '@/components/PaymentModal';
import { PAYMENT_PROVIDERS, PaymentProviderType } from '@/lib/payment-types';

function ReservationContent() {
  const searchParams = useSearchParams();
  const { rate, currency, formatPrice } = useCurrency();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const queryRoomId = searchParams.get('roomId') || '2';
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

  const [addons, setAddons] = useState({
    airportShuttle: false,
    breakfast: true,
    spaTreatment: false,
    coffeeCeremony: false,
  });

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [activeTxRef, setActiveTxRef] = useState('');
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<PaymentProviderType>('SKINA');
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'SUCCESS'>('PENDING');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    rooms.find((r) => r.id === selectedRoomId || r.slug === selectedRoomId) || rooms[0];

  // Calculation
  const checkInDate = new Date(checkIn || todayStr);
  const checkOutDate = new Date(checkOut || tomorrowStr);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  const rawNights = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const nights = isNaN(rawNights) || rawNights < 1 ? 1 : rawNights;

  const addonPrices = {
    airportShuttle: 15,
    breakfast: 12 * adults * nights,
    spaTreatment: 65,
    coffeeCeremony: 8 * adults,
  };

  let addonsTotal = 0;
  if (addons.airportShuttle) addonsTotal += addonPrices.airportShuttle;
  if (addons.breakfast) addonsTotal += addonPrices.breakfast;
  if (addons.spaTreatment) addonsTotal += addonPrices.spaTreatment;
  if (addons.coffeeCeremony) addonsTotal += addonPrices.coffeeCeremony;

  const roomSubtotal = selectedRoom.pricePerNight * nights;
  const discountAmount = (roomSubtotal * discountPercent) / 100;
  const subtotalAfterDiscount = roomSubtotal - discountAmount + addonsTotal;
  const tax = Math.round(subtotalAfterDiscount * 0.15 * 100) / 100;
  const grandTotal = Math.round((subtotalAfterDiscount + tax) * 100) / 100;
  const grandTotalETB = Math.round(grandTotal * rate); // Dynamic Universal Forex rate (USD -> ETB)

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === 'GRANDMEMBER15' || code === 'SAVE15') {
      setDiscountPercent(15);
      setPromoMessage('Member discount 15% applied!');
    } else if (code === 'WEEKENDREBALANCE') {
      setDiscountPercent(20);
      setPromoMessage('Weekend Special: 20% discount applied!');
    } else {
      setPromoMessage('Invalid promo code');
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
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
          totalAmount: grandTotal,
          currency: 'USD',
          paymentProvider: selectedPaymentProvider,
          paymentStatus: 'PENDING',
        }),
      });
      const data = await res.json();
      if (data.success && data.bookingRef) {
        setBookingRef(data.bookingRef);
        setReservationId(data.reservationId || '');
        setActiveTxRef(data.txRef || '');

        if (selectedPaymentProvider === 'CASH_ON_ARRIVAL') {
          setPaymentStatus('PENDING');
          setStep(3);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // Open interactive payment modal for Chapa, Telebirr, CBE Birr, Skina
          setIsPaymentModalOpen(true);
        }
      } else {
        const ref = 'GAH-' + Math.floor(100000 + Math.random() * 900000);
        setBookingRef(ref);
        if (selectedPaymentProvider === 'CASH_ON_ARRIVAL') {
          setPaymentStatus('PENDING');
          setStep(3);
        } else {
          setIsPaymentModalOpen(true);
        }
      }
    } catch (err) {
      console.error('Reservation error:', err);
      const ref = 'GAH-' + Math.floor(100000 + Math.random() * 900000);
      setBookingRef(ref);
      if (selectedPaymentProvider === 'CASH_ON_ARRIVAL') {
        setPaymentStatus('PENDING');
        setStep(3);
      } else {
        setIsPaymentModalOpen(true);
      }
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
    <div style={{ paddingTop: '84px' }}>
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
                        onChange={(e) => setCheckIn(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                        CHECK-OUT
                      </label>
                      <input
                        type="date"
                        value={checkOut}
                        min={checkIn}
                        onChange={(e) => setCheckOut(e.target.value)}
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
                </div>

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
                        <div style={{ height: '110px', borderRadius: '8px', overflow: 'hidden' }}>
                          <img src={room.images[0]} alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>Estimated Total:</span>
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
            <form onSubmit={handleConfirm} style={{ maxWidth: '820px', margin: '0 auto' }}>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E1DA',
                  padding: '32px',
                  marginBottom: '28px',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#153D4B', marginBottom: '20px' }}>
                  Guest Details & Contact Information
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Jane Doe"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="jane@example.com"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Phone / Mobile *
                    </label>
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+251 9..."
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                    Special Requests (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Estimated check-in time, quiet room, extra pillows..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                {/* Optional Add-ons */}
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#153D4B', marginBottom: '12px' }}>
                  Add-on Experiences & Services
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'flex',
                      gap: '10px',
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
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Airport Shuttle (+$15)</div>
                      <div style={{ fontSize: '11px', color: '#838A8D' }}>Chauffeured pickup from Bole Airport</div>
                    </div>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      gap: '10px',
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
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Daily Breakfast (+${addonPrices.breakfast})</div>
                      <div style={{ fontSize: '11px', color: '#838A8D' }}>Full international & Ethiopian buffet</div>
                    </div>
                  </label>
                </div>

                {/* Promo Code */}
                <div style={{ backgroundColor: '#F7F7F2', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                    PROMO CODE
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="e.g. GRANDMEMBER15"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      onClick={applyPromo}
                      style={{ padding: '8px 16px', backgroundColor: '#153D4B', color: '#FFFFFF', borderRadius: '4px', fontSize: '12px' }}
                    >
                      Apply
                    </button>
                  </div>
                  {promoMessage && (
                    <div style={{ fontSize: '12px', marginTop: '6px', color: discountPercent > 0 ? '#10B981' : '#EF4444' }}>
                      {promoMessage}
                    </div>
                  )}
                </div>

                {/* Payment Gateway & Method Selector */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#153D4B' }}>
                      Select Payment Method *
                    </label>
                    <span style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={12} /> 256-bit Encrypted
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    {PAYMENT_PROVIDERS.map((prov) => {
                      const isSelected = selectedPaymentProvider === prov.id;
                      return (
                        <div
                          key={prov.id}
                          onClick={() => setSelectedPaymentProvider(prov.id)}
                          style={{
                            padding: '12px 10px',
                            borderRadius: '10px',
                            border: isSelected ? `2px solid ${prov.color}` : '1px solid #E2E1DA',
                            backgroundColor: isSelected ? prov.bgLight : '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: '4px',
                          }}
                        >
                          <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? prov.color : '#153D4B' }}>
                            {prov.name}
                          </div>
                          <span style={{ fontSize: '10px', color: '#838A8D' }}>
                            {prov.badge}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment Provider Helper Note */}
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#F7F7F2',
                      border: '1px solid #E2E1DA',
                      fontSize: '12px',
                      color: '#5E6E75',
                    }}
                  >
                    {selectedPaymentProvider === 'SKINA' && (
                      <div>
                        <strong style={{ color: '#153D4B' }}>SkinaPay (Default Provider):</strong> Instant, 256-bit SSL secured card checkout accepting <strong>Visa, Mastercard, American Express, UnionPay</strong>, and Ethiopian local debit cards via SkinaPay Sandbox.
                      </div>
                    )}
                    {selectedPaymentProvider === 'TELEBIRR' && (
                      <div>
                        <strong style={{ color: '#0072CE' }}>Telebirr Mobile Money:</strong> Fast USSD push notification sent directly to your phone (*127#) or scan QR via Telebirr SuperApp.
                      </div>
                    )}
                    {selectedPaymentProvider === 'CHAPA' && (
                      <div>
                        <strong style={{ color: '#00A36C' }}>Chapa Premier Gateway:</strong> Online gateway supporting Telebirr, CBE Birr, Awash Bank, Amole, and cards.
                      </div>
                    )}
                    {selectedPaymentProvider === 'CBE_BIRR' && (
                      <div>
                        <strong style={{ color: '#6E2585' }}>Commercial Bank of Ethiopia (CBE / CEB):</strong> Instant transfer to Hotel CBE Birr Shortcode <strong>882200</strong> or CBE Mobile App account <strong>1000188220011</strong>.
                      </div>
                    )}
                    {selectedPaymentProvider === 'CASH_ON_ARRIVAL' && (
                      <div>
                        <strong style={{ color: '#E49951' }}>Front Desk Reception:</strong> Guarantee your room now with zero upfront payment. Settle at hotel check-in in Ethiopian Birr or USD.
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Total Summary */}
                <div style={{ borderTop: '1px solid #ECEBE5', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontSize: '13px', color: '#5E6E75' }}>Total (includes 15% VAT):</span>
                    <div style={{ fontSize: '11px', color: '#838A8D', fontWeight: 500, marginTop: '2px' }}>
                      ≈ {grandTotalETB.toLocaleString()} Ethiopian Birr
                      <span style={{ fontSize: '10px', color: '#A2B5BD', marginLeft: '5px' }}>
                        (@ {rate} Br/$)
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#E49951' }}>
                    ${grandTotal}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-outline"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ padding: '14px 36px' }}
                >
                  <ShieldCheck size={18} />
                  <span>
                    {isSubmitting
                      ? 'Processing...'
                      : selectedPaymentProvider === 'CASH_ON_ARRIVAL'
                      ? 'Confirm & Pay at Hotel'
                      : `Proceed to Pay with ${selectedPaymentProvider === 'CBE_BIRR' ? 'CBE Birr' : selectedPaymentProvider}`}
                  </span>
                </button>
              </div>
            </form>
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
                    <strong style={{ color: '#E49951' }}>${grandTotal} ({grandTotalETB.toLocaleString()} ETB)</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #ECEBE5', paddingTop: '12px', fontSize: '12px', color: '#5E6E75' }}>
                  Address: 22 Around Golagul, Addis Ababa • Front Desk: {HOTEL_INFO.phone}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {paymentStatus !== 'SUCCESS' && (
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#00A36C' }}
                  >
                    <CreditCard size={16} /> Pay Online Now (Chapa / Telebirr / CBE / Skina)
                  </button>
                )}
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
