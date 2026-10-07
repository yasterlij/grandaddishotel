'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Users, Search, Minus, Plus, ChevronDown, Check, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';

export default function BookingBar() {
  const { openBooking } = useBooking();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date(Date.now() + 86400000);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(tomorrowStr);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomsCount, setRoomsCount] = useState(1);

  const [isGuestPickerOpen, setIsGuestPickerOpen] = useState(false);
  const guestPickerRef = useRef<HTMLDivElement>(null);
  const checkInInputRef = useRef<HTMLInputElement>(null);
  const checkOutInputRef = useRef<HTMLInputElement>(null);

  // Close guest picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (guestPickerRef.current && !guestPickerRef.current.contains(event.target as Node)) {
        setIsGuestPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate nights
  const calculateNights = () => {
    try {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  };

  const nights = calculateNights();

  const handleCheckInChange = (newDate: string) => {
    setCheckIn(newDate);
    if (newDate >= checkOut) {
      const nextDay = new Date(new Date(newDate).getTime() + 86400000)
        .toISOString()
        .split('T')[0];
      setCheckOut(nextDay);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGuestPickerOpen(false);
    openBooking({
      checkIn,
      checkOut,
      roomsCount,
      adults,
      children,
    });
  };

  const totalGuests = adults + children;

  return (
    <div className="booking-bar-wrapper">
      <form onSubmit={handleSubmit} className="booking-bar-container">
        
        {/* 1. Check-In Tile */}
        <div 
          className="booking-bar-tile date-tile"
          onClick={() => {
            if (checkInInputRef.current) {
              try {
                if ('showPicker' in HTMLInputElement.prototype) {
                  checkInInputRef.current.showPicker();
                } else {
                  checkInInputRef.current.focus();
                }
              } catch {
                checkInInputRef.current.focus();
              }
            }
          }}
        >
          <div className="tile-icon-wrap">
            <Calendar size={18} className="tile-icon" />
          </div>
          <div className="tile-text-wrap">
            <span className="tile-label">Check-In</span>
            <input
              ref={checkInInputRef}
              type="date"
              value={checkIn}
              min={todayStr}
              onChange={(e) => handleCheckInChange(e.target.value)}
              required
              className="tile-input"
            />
          </div>
        </div>

        <div className="tile-divider" />

        {/* 2. Check-Out Tile */}
        <div 
          className="booking-bar-tile date-tile"
          onClick={() => {
            if (checkOutInputRef.current) {
              try {
                if ('showPicker' in HTMLInputElement.prototype) {
                  checkOutInputRef.current.showPicker();
                } else {
                  checkOutInputRef.current.focus();
                }
              } catch {
                checkOutInputRef.current.focus();
              }
            }
          }}
        >
          <div className="tile-icon-wrap">
            <Calendar size={18} className="tile-icon" />
          </div>
          <div className="tile-text-wrap">
            <div className="tile-label-row">
              <span className="tile-label">Check-Out</span>
              <span className="nights-badge">
                {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
            </div>
            <input
              ref={checkOutInputRef}
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              required
              className="tile-input"
            />
          </div>
        </div>

        <div className="tile-divider" />

        {/* 3. Guests & Rooms Tile (Interactive Popover) */}
        <div className="booking-bar-tile guest-tile-wrapper" ref={guestPickerRef}>
          <div 
            className="guest-tile-trigger"
            onClick={() => setIsGuestPickerOpen(!isGuestPickerOpen)}
          >
            <div className="tile-icon-wrap">
              <Users size={18} className="tile-icon" />
            </div>
            <div className="tile-text-wrap">
              <span className="tile-label">Guests & Rooms</span>
              <div className="tile-value-display">
                <span>{totalGuests} {totalGuests === 1 ? 'Guest' : 'Guests'}, {roomsCount} {roomsCount === 1 ? 'Room' : 'Rooms'}</span>
                <ChevronDown size={14} className={`chevron-icon ${isGuestPickerOpen ? 'open' : ''}`} />
              </div>
            </div>
          </div>

          {/* Luxury Dropdown Stepper Popover */}
          {isGuestPickerOpen && (
            <div className="guest-popover animate-scale-in">
              <div className="popover-header">
                <span className="popover-title">Guests & Rooms</span>
                <span className="popover-subtitle">Up to 6 guests per room</span>
              </div>

              {/* Adults Row */}
              <div className="popover-row">
                <div>
                  <div className="row-title">Adults</div>
                  <div className="row-desc">Ages 13 or above</div>
                </div>
                <div className="stepper-controls">
                  <button
                    type="button"
                    className="stepper-btn"
                    disabled={adults <= 1}
                    onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="stepper-count">{adults}</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    disabled={adults >= 8}
                    onClick={() => setAdults((prev) => Math.min(8, prev + 1))}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Children Row */}
              <div className="popover-row">
                <div>
                  <div className="row-title">Children</div>
                  <div className="row-desc">Ages 0 - 12 years</div>
                </div>
                <div className="stepper-controls">
                  <button
                    type="button"
                    className="stepper-btn"
                    disabled={children <= 0}
                    onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="stepper-count">{children}</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    disabled={children >= 6}
                    onClick={() => setChildren((prev) => Math.min(6, prev + 1))}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Rooms Row */}
              <div className="popover-row">
                <div>
                  <div className="row-title">Rooms</div>
                  <div className="row-desc">Total rooms required</div>
                </div>
                <div className="stepper-controls">
                  <button
                    type="button"
                    className="stepper-btn"
                    disabled={roomsCount <= 1}
                    onClick={() => setRoomsCount((prev) => Math.max(1, prev - 1))}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="stepper-count">{roomsCount}</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    disabled={roomsCount >= 5}
                    onClick={() => setRoomsCount((prev) => Math.min(5, prev + 1))}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="popover-footer">
                <button
                  type="button"
                  className="popover-apply-btn"
                  onClick={() => setIsGuestPickerOpen(false)}
                >
                  <Check size={14} />
                  <span>Apply Selection</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Action CTA Button */}
        <div className="booking-bar-cta-wrap">
          <button type="submit" className="booking-bar-submit-btn">
            <Search size={16} />
            <span className="btn-text">Check Availability</span>
          </button>
        </div>

      </form>

      {/* Luxury Trust & Benefits Ticker */}
      <div className="booking-trust-strip">
        <div className="trust-item">
          <Sparkles size={13} className="trust-icon" />
          <span>Best Rate Guarantee (15% Off Direct)</span>
        </div>
        <span className="trust-dot">•</span>
        <div className="trust-item">
          <Shield size={13} className="trust-icon" />
          <span>Free Airport Shuttle Included</span>
        </div>
        <span className="trust-dot">•</span>
        <div className="trust-item">
          <Check size={13} className="trust-icon" />
          <span>Flexible Cancellation & Pay At Hotel</span>
        </div>
      </div>

      <style jsx>{`
        .booking-bar-wrapper {
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 16px;
          position: relative;
          z-index: 30;
        }

        .booking-bar-container {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 16px;
          border: 1px solid rgba(228, 153, 81, 0.35);
          box-shadow: 0 20px 50px rgba(15, 42, 51, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          padding: 6px 8px;
          gap: 4px;
          transition: all 0.3s ease;
        }

        .booking-bar-container:hover {
          box-shadow: 0 24px 60px rgba(15, 42, 51, 0.28), 0 0 0 1px rgba(228, 153, 81, 0.5);
        }

        .booking-bar-tile {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          position: relative;
          min-width: 0;
        }

        .booking-bar-tile:hover {
          background-color: #F8F7F3;
        }

        .tile-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background-color: rgba(228, 153, 81, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        :global(.tile-icon) {
          color: #E49951;
        }

        .tile-text-wrap {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .tile-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          font-weight: 700;
          color: #E49951;
          margin-bottom: 2px;
          display: block;
        }

        .tile-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-bottom: 2px;
        }

        .nights-badge {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background-color: #153D4B;
          color: #FFFFFF;
          padding: 1px 6px;
          border-radius: 10px;
        }

        .tile-input {
          width: 100%;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 600;
          color: #153D4B;
          outline: none;
          cursor: pointer;
          padding: 0;
          margin: 0;
          font-family: inherit;
        }

        .tile-divider {
          width: 1px;
          height: 38px;
          background-color: #E6E4DC;
          flex-shrink: 0;
        }

        .guest-tile-wrapper {
          position: relative;
          padding: 0;
        }

        .guest-tile-trigger {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          width: 100%;
          height: 100%;
          border-radius: 10px;
        }

        .tile-value-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #153D4B;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        :global(.chevron-icon) {
          color: #7D8C93;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        :global(.chevron-icon.open) {
          transform: rotate(180deg);
          color: #E49951;
        }

        /* Popover */
        .guest-popover {
          position: absolute;
          top: calc(100% + 10px);
          left: 0;
          width: 310px;
          background: #FFFFFF;
          border-radius: 14px;
          border: 1px solid #E2E1DA;
          box-shadow: 0 16px 40px rgba(15, 42, 51, 0.22);
          padding: 18px;
          z-index: 50;
        }

        .popover-header {
          border-bottom: 1px solid #F0EFEA;
          padding-bottom: 10px;
          margin-bottom: 14px;
        }

        .popover-title {
          font-size: 14px;
          font-weight: 700;
          color: #153D4B;
          display: block;
        }

        .popover-subtitle {
          font-size: 11px;
          color: #7A8990;
        }

        .popover-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #F7F6F2;
        }

        .row-title {
          font-size: 13px;
          font-weight: 600;
          color: #153D4B;
        }

        .row-desc {
          font-size: 11px;
          color: #8C999F;
        }

        .stepper-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .stepper-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid #D5D3CA;
          background-color: #FFFFFF;
          color: #153D4B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .stepper-btn:hover:not(:disabled) {
          border-color: #E49951;
          color: #E49951;
          background-color: #FBF6EE;
        }

        .stepper-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .stepper-count {
          font-size: 14px;
          font-weight: 700;
          color: #153D4B;
          min-width: 18px;
          text-align: center;
        }

        .popover-footer {
          margin-top: 14px;
          padding-top: 10px;
        }

        .popover-apply-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px;
          background-color: #153D4B;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .popover-apply-btn:hover {
          background-color: #0E2933;
        }

        /* CTA */
        .booking-bar-cta-wrap {
          flex-shrink: 0;
          padding-left: 4px;
        }

        .booking-bar-submit-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #E49951 0%, #D8893F 100%);
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          border: none;
          border-radius: 12px;
          padding: 14px 26px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 16px rgba(228, 153, 81, 0.4);
          white-space: nowrap;
        }

        .booking-bar-submit-btn:hover {
          background: linear-gradient(135deg, #EB9E54 0%, #CE7E34 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(228, 153, 81, 0.55);
        }

        /* Trust Strip */
        .booking-trust-strip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 10px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.88);
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
          flex-wrap: wrap;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        :global(.trust-icon) {
          color: #E49951;
        }

        .trust-dot {
          opacity: 0.5;
        }

        /* Responsive Breakpoints */
        @media (max-width: 960px) {
          .booking-bar-container {
            flex-wrap: wrap;
            padding: 10px;
            gap: 8px;
            border-radius: 14px;
          }

          .tile-divider {
            display: none;
          }

          .booking-bar-tile.date-tile {
            flex: 1 1 calc(50% - 8px);
            background-color: #FAF9F5;
          }

          .booking-bar-tile.guest-tile-wrapper {
            flex: 1 1 100%;
            background-color: #FAF9F5;
            border-radius: 10px;
          }

          .booking-bar-cta-wrap {
            flex: 1 1 100%;
            padding-left: 0;
          }

          .booking-bar-submit-btn {
            width: 100%;
            padding: 13px;
          }

          .guest-popover {
            width: 100%;
          }
        }

        @media (max-width: 600px) {
          .booking-bar-wrapper {
            padding: 0 12px;
          }

          .booking-bar-tile.date-tile {
            flex: 1 1 100%;
          }

          .booking-trust-strip {
            font-size: 11px;
            gap: 8px;
          }

          .trust-dot {
            display: none;
          }

          .trust-item {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
