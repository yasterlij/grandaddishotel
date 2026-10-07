'use client';

import React, { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Users,
  Check,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ROOMS, HOTEL_INFO, Room } from '@/data/hotelData';
import { useBooking } from '@/context/BookingContext';
import { useCurrency } from '@/context/CurrencyContext';
import RoomCard from '@/components/RoomCard';

export default function RoomDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { openBooking } = useBooking();
  const { formatPrice } = useCurrency();

  const initialRoom =
    ROOMS.find((r) => r.slug === slug) ||
    ROOMS.find((r) => r.slug === 'deluxe-room') ||
    ROOMS[0];

  const [room, setRoom] = useState<Room>(initialRoom);
  const [allRooms, setAllRooms] = useState<Room[]>(ROOMS);

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  useEffect(() => {
    async function loadRoomFromPostgres() {
      try {
        const [roomRes, roomsListRes] = await Promise.all([
          fetch(`/api/rooms/${slug}`),
          fetch('/api/rooms'),
        ]);

        const roomData = await roomRes.json();
        if (roomData.success && roomData.room) {
          setRoom(roomData.room);
        }

        const listData = await roomsListRes.json();
        if (listData.success && listData.rooms) {
          setAllRooms(listData.rooms);
        }
      } catch (err) {
        console.error('Failed to fetch room from PostgreSQL:', err);
      }
    }
    if (slug) {
      loadRoomFromPostgres();
    }
  }, [slug]);

  // Calendar Month State
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const months = [
    'October 2026',
    'November 2026',
    'December 2026',
    'January 2027',
    'February 2027',
    'March 2027',
  ];

  const otherRooms = allRooms.filter((r) => r.id !== room.id);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRequest(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: requestName,
          email: requestEmail,
          subject: `Room Inquiry: ${room.name}`,
          message: requestMessage || `Interested in booking ${room.name} (${room.slug})`,
        }),
      });
    } catch (err) {
      console.error('Failed to save inquiry to PostgreSQL:', err);
    } finally {
      setIsSubmittingRequest(false);
      setRequestSubmitted(true);
    }
  };

  return (
    <div style={{ paddingTop: '84px' }}>
      {/* Breadcrumb & Title Bar */}
      <section style={{ backgroundColor: '#0F2A33', color: '#FFFFFF', padding: '40px 0 30px' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#A2B5BD', marginBottom: '14px' }}>
            <Link href="/" style={{ color: 'inherit' }}>
              Home
            </Link>
            <span>/</span>
            <Link href="/rooms" style={{ color: 'inherit' }}>
              Rooms
            </Link>
            <span>/</span>
            <span style={{ color: '#E49951' }}>{room.name}</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '20px',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  color: '#E49951',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                {room.category}
              </span>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 500 }}>
                {room.name}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#A2B5BD', display: 'block' }}>STARTING FROM</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 600, color: '#E49951' }}>
                    {formatPrice(room.pricePerNight).primary}
                  </span>
                  <span style={{ fontSize: '13px', color: '#A2B5BD' }}> / night</span>
                </div>
              </div>

              <button
                onClick={() => openBooking({ roomId: room.id })}
                className="btn btn-primary"
                style={{ padding: '12px 28px' }}
              >
                <Calendar size={16} />
                <span>Book This Room</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="section-padding bg-light">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)',
              gap: '40px',
            }}
            className="room-detail-grid"
          >
            {/* Left Column: Gallery & Details */}
            <div>
              {/* Photo Showcase */}
              <div
                style={{
                  backgroundColor: '#0F2A33',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '16px',
                  position: 'relative',
                  height: '460px',
                }}
              >
                <img
                  src={room.images[activePhotoIndex]}
                  alt={room.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {room.images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActivePhotoIndex(
                          (prev) => (prev - 1 + room.images.length) % room.images.length
                        )
                      }
                      style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      onClick={() =>
                        setActivePhotoIndex((prev) => (prev + 1) % room.images.length)
                      }
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails Row */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '36px', overflowX: 'auto', paddingBottom: '6px' }}>
                {room.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIndex(idx)}
                    style={{
                      width: '90px',
                      height: '65px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: activePhotoIndex === idx ? '2px solid #E49951' : '1px solid #D5D4CC',
                      padding: 0,
                      cursor: 'pointer',
                      flexShrink: 0,
                      opacity: activePhotoIndex === idx ? 1 : 0.65,
                      transition: 'all 0.2s',
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>

              {/* Room Specifications Table */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E1DA',
                  padding: '28px',
                  marginBottom: '36px',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: '#153D4B', marginBottom: '18px' }}>
                  Room Overview & Specifications
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '20px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid #ECEBE5',
                    marginBottom: '20px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#838A8D', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      MAX CAPACITY
                    </span>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#153D4B', marginTop: '4px' }}>
                      {room.capacity} Guests
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#838A8D', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      ROOM SIZE
                    </span>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#153D4B', marginTop: '4px' }}>
                      {room.size}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#838A8D', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      BED TYPE
                    </span>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#153D4B', marginTop: '4px' }}>
                      {room.bedType}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#838A8D', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      VIEW
                    </span>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#153D4B', marginTop: '4px' }}>
                      {room.view}
                    </strong>
                  </div>
                </div>

                <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#5E6E75' }}>
                  {room.description}
                </p>
              </div>

              {/* Amenities */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E1DA',
                  padding: '28px',
                  marginBottom: '36px',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: '#153D4B', marginBottom: '20px' }}>
                  Room Amenities
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '14px',
                  }}
                >
                  {room.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '14px',
                        color: '#153D4B',
                      }}
                    >
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(228, 153, 81, 0.15)',
                          color: '#E49951',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                        }}
                      >
                        ✓
                      </span>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Availability Calendar */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E1DA',
                  padding: '28px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: '#153D4B' }}>
                    Availability Calendar
                  </h3>

                  {/* Month switcher */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setCurrentMonthIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentMonthIndex === 0}
                      style={{
                        padding: '6px',
                        borderRadius: '4px',
                        border: '1px solid #D5D4CC',
                        cursor: currentMonthIndex === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentMonthIndex === 0 ? 0.4 : 1,
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: 600, minWidth: '120px', textAlign: 'center' }}>
                      {months[currentMonthIndex]}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentMonthIndex((prev) => Math.min(months.length - 1, prev + 1))
                      }
                      disabled={currentMonthIndex === months.length - 1}
                      style={{
                        padding: '6px',
                        borderRadius: '4px',
                        border: '1px solid #D5D4CC',
                        cursor: currentMonthIndex === months.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: currentMonthIndex === months.length - 1 ? 0.4 : 1,
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Calendar Days Matrix */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '6px',
                    textAlign: 'center',
                  }}
                >
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                      key={day}
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#838A8D',
                        padding: '6px 0',
                        textTransform: 'uppercase',
                      }}
                    >
                      {day}
                    </div>
                  ))}

                  {/* 31 sample days */}
                  {[...Array(31)].map((_, i) => {
                    const dayNum = i + 1;
                    const isBooked = [5, 6, 18, 19].includes(dayNum);
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (!isBooked) {
                            openBooking({ roomId: room.id });
                          }
                        }}
                        style={{
                          padding: '10px 4px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          backgroundColor: isBooked ? '#FEE2E2' : '#F0FDF4',
                          color: isBooked ? '#DC2626' : '#166534',
                          border: isBooked ? '1px solid #FECACA' : '1px solid #BBF7D0',
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s',
                        }}
                        title={isBooked ? 'Booked' : 'Available - click to reserve'}
                      >
                        <div style={{ fontWeight: 600 }}>{dayNum}</div>
                        <div style={{ fontSize: '9px', textTransform: 'uppercase', marginTop: '2px' }}>
                          {isBooked ? 'Booked' : 'Avail'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '20px', marginTop: '16px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }} />
                    <span style={{ color: '#166534' }}>Available for Booking</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }} />
                    <span style={{ color: '#DC2626' }}>Reserved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Booking / Inquiry Card */}
            <div>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E1DA',
                  padding: '28px',
                  boxShadow: 'var(--shadow-md)',
                  position: 'sticky',
                  top: '100px',
                }}
              >
                <div style={{ borderBottom: '1px solid #ECEBE5', paddingBottom: '18px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '11px', color: '#838A8D', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    STARTING FROM
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '30px', fontWeight: 700, color: '#E49951' }}>
                      {formatPrice(room.pricePerNight).primary}
                    </span>
                    <span style={{ fontSize: '14px', color: '#5E6E75' }}>/ per night</span>
                  </div>
                </div>

                <button
                  onClick={() => openBooking({ roomId: room.id })}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', marginBottom: '14px', fontSize: '14px' }}
                >
                  <Calendar size={18} />
                  <span>Reserve This Room</span>
                </button>

                <button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="btn btn-outline"
                  style={{ width: '100%', padding: '12px', fontSize: '13px', marginBottom: '24px' }}
                >
                  <Info size={16} />
                  <span>Request Information</span>
                </button>

                <div style={{ borderTop: '1px solid #ECEBE5', paddingTop: '18px', fontSize: '13px', color: '#5E6E75' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <ShieldCheck size={18} color="#10B981" />
                    <span>Best Price Guaranteed Direct</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <Check size={18} color="#10B981" />
                    <span>Free cancellation up to 24h</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Phone size={18} color="#E49951" />
                    <span>Direct Desk: {HOTEL_INFO.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Rooms */}
          <div style={{ marginTop: '72px', borderTop: '1px solid #E2E1DA', paddingTop: '56px' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: '#153D4B', marginBottom: '28px' }}>
              Other Rooms You May Like
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '28px' }}>
              {otherRooms.slice(0, 3).map((r) => (
                <RoomCard key={r.id} room={r} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* REQUEST INFORMATION MODAL (Matching original VikBooking vbdialog) */}
      {isRequestModalOpen && (
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
          <div
            onClick={() => setIsRequestModalOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(9, 25, 31, 0.75)',
              backdropFilter: 'blur(4px)',
            }}
          />

          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '540px',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: '#153D4B' }}>
                Request Information for {room.name}
              </h3>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#F7F7F2',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {requestSubmitted ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#ECFDF5',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Check size={28} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#153D4B', marginBottom: '8px' }}>
                  Request Received
                </h4>
                <p style={{ fontSize: '14px', color: '#5E6E75', marginBottom: '24px' }}>
                  Our reservation concierge will reply to <strong>{requestEmail}</strong> promptly.
                </p>
                <button
                  onClick={() => {
                    setIsRequestModalOpen(false);
                    setRequestSubmitted(false);
                  }}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={requestName}
                      onChange={(e) => setRequestName(e.target.value)}
                      placeholder="Your full name"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                      e-Mail *
                    </label>
                    <input
                      type="email"
                      required
                      value={requestEmail}
                      onChange={(e) => setRequestEmail(e.target.value)}
                      placeholder="name@example.com"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                      Message *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Specify your inquiry, dates, or group size..."
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#5E6E75', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      required
                    />
                    <span>I agree to the terms and conditions</span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="btn btn-outline"
                    style={{ padding: '10px 18px', fontSize: '12px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '10px 24px', fontSize: '12px' }}
                  >
                    <Send size={14} /> Send Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 860px) {
          .room-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
