'use client';

import React, { useState } from 'react';
import { Calendar, Users, Home, Search, ArrowRight } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';

export default function BookingBar() {
  const { openBooking } = useBooking();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date(Date.now() + 86400000);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(tomorrowStr);
  const [roomsCount, setRoomsCount] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openBooking({
      checkIn,
      checkOut,
      roomsCount,
      adults,
      children,
    });
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1180px',
        margin: '0 auto',
        padding: '0 16px',
        position: 'relative',
        zIndex: 20,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 20px 50px rgba(15, 42, 51, 0.18)',
          border: '1px solid #E2E1DA',
          padding: '24px 28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr)) auto',
          gap: '20px',
          alignItems: 'end',
        }}
        className="booking-bar-form"
      >
        {/* Check-In */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              fontWeight: 600,
              color: '#153D4B',
              marginBottom: '8px',
            }}
          >
            <Calendar size={14} color="#E49951" />
            Check-In
          </label>
          <input
            type="date"
            value={checkIn}
            min={todayStr}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (e.target.value >= checkOut) {
                const nextDay = new Date(new Date(e.target.value).getTime() + 86400000)
                  .toISOString()
                  .split('T')[0];
                setCheckOut(nextDay);
              }
            }}
            required
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '6px',
              border: '1px solid #D5D4CC',
              backgroundColor: '#F9F9F6',
              fontSize: '14px',
              color: '#153D4B',
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Check-Out */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              fontWeight: 600,
              color: '#153D4B',
              marginBottom: '8px',
            }}
          >
            <Calendar size={14} color="#E49951" />
            Check-Out
          </label>
          <input
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={(e) => setCheckOut(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '6px',
              border: '1px solid #D5D4CC',
              backgroundColor: '#F9F9F6',
              fontSize: '14px',
              color: '#153D4B',
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Rooms Count */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              fontWeight: 600,
              color: '#153D4B',
              marginBottom: '8px',
            }}
          >
            <Home size={14} color="#E49951" />
            Rooms
          </label>
          <select
            value={roomsCount}
            onChange={(e) => setRoomsCount(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '6px',
              border: '1px solid #D5D4CC',
              backgroundColor: '#F9F9F6',
              fontSize: '14px',
              color: '#153D4B',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value={1}>1 Room</option>
            <option value={2}>2 Rooms</option>
            <option value={3}>3 Rooms</option>
            <option value={4}>4+ Rooms</option>
          </select>
        </div>

        {/* Adults */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              fontWeight: 600,
              color: '#153D4B',
              marginBottom: '8px',
            }}
          >
            <Users size={14} color="#E49951" />
            Adults
          </label>
          <select
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '6px',
              border: '1px solid #D5D4CC',
              backgroundColor: '#F9F9F6',
              fontSize: '14px',
              color: '#153D4B',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value={1}>1 Adult</option>
            <option value={2}>2 Adults</option>
            <option value={3}>3 Adults</option>
            <option value={4}>4 Adults</option>
            <option value={5}>5+ Adults</option>
          </select>
        </div>

        {/* Children */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              fontWeight: 600,
              color: '#153D4B',
              marginBottom: '8px',
            }}
          >
            <Users size={14} color="#E49951" />
            Children
          </label>
          <select
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '6px',
              border: '1px solid #D5D4CC',
              backgroundColor: '#F9F9F6',
              fontSize: '14px',
              color: '#153D4B',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value={0}>0 Children</option>
            <option value={1}>1 Child</option>
            <option value={2}>2 Children</option>
            <option value={3}>3+ Children</option>
          </select>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              height: '46px',
              whiteSpace: 'nowrap',
              padding: '0 28px',
            }}
          >
            <Search size={16} />
            <span>Check Availability</span>
          </button>
        </div>
      </form>

      <style jsx>{`
        @media (max-width: 900px) {
          .booking-bar-form {
            grid-template-columns: 1fr 1fr !important;
          }
          .booking-bar-form > div:last-child {
            grid-column: span 2;
          }
        }
        @media (max-width: 600px) {
          .booking-bar-form {
            grid-template-columns: 1fr !important;
            padding: 18px !important;
          }
          .booking-bar-form > div:last-child {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}
