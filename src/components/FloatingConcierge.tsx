'use client';

import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, ArrowUp, Calendar, Sparkles, X, ChevronUp } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import { HOTEL_INFO } from '@/data/hotelData';

export default function FloatingConcierge() {
  const { openBooking } = useBooking();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 320);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        pointerEvents: 'none',
      }}
    >
      {/* Expanded Quick Contact Menu */}
      {isExpanded && (
        <div
          style={{
            backgroundColor: '#0F2A33',
            color: '#FFFFFF',
            borderRadius: '16px',
            padding: '18px',
            boxShadow: '0 16px 40px rgba(15, 42, 51, 0.35)',
            border: '1px solid rgba(228, 153, 81, 0.3)',
            marginBottom: '4px',
            width: '260px',
            pointerEvents: 'auto',
            animation: 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Grand Addis Concierge</div>
              <div style={{ fontSize: '10px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                24/7 Front Desk Available
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{ background: 'none', border: 'none', color: '#A2B5BD', cursor: 'pointer', padding: '4px' }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a
              href={`tel:${HOTEL_INFO.phone}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                fontSize: '12px',
                textDecoration: 'none',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(228, 153, 81, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
            >
              <Phone size={14} color="#E49951" />
              <span>Call {HOTEL_INFO.phone}</span>
            </a>

            <a
              href="https://wa.me/251977757575?text=Hello%20Grand%20Addis%20Hotel,%20I%20would%20like%20to%20inquire%20about%20a%20reservation."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(37, 211, 102, 0.15)',
                color: '#25D366',
                fontSize: '12px',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'background-color 0.2s',
              }}
            >
              <MessageCircle size={14} />
              <span>WhatsApp Concierge</span>
            </a>

            <button
              onClick={() => {
                setIsExpanded(false);
                openBooking();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#E49951',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Calendar size={14} />
              <span>Book Room Direct (Save 15%)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Buttons Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
        {/* Scroll To Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            title="Scroll to Top"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              color: '#153D4B',
              border: '1px solid #E2E1DA',
              boxShadow: '0 4px 14px rgba(21, 61, 75, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#153D4B';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.color = '#153D4B';
            }}
          >
            <ChevronUp size={18} />
          </button>
        )}

        {/* Concierge Trigger Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '999px',
            backgroundColor: '#0F2A33',
            color: '#FFFFFF',
            border: '1px solid rgba(228, 153, 81, 0.4)',
            boxShadow: '0 6px 20px rgba(15, 42, 51, 0.3)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#E49951';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(228, 153, 81, 0.4)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 6px #10B981',
            }}
          />
          <Phone size={13} color="#E49951" />
          <span>Concierge</span>
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
