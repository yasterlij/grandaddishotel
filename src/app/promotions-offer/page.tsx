'use client';

import React from 'react';
import Link from 'next/link';
import { Tag, Check, Calendar, ArrowRight, Sparkles, Gift } from 'lucide-react';
import { PROMOTIONS } from '@/data/hotelData';
import { useBooking } from '@/context/BookingContext';

export default function PromotionsPage() {
  const { openBooking } = useBooking();

  return (
    <div style={{ paddingTop: '84px' }}>
      {/* Banner */}
      <section
        style={{
          backgroundColor: '#0F2A33',
          color: '#FFFFFF',
          padding: '80px 0 60px',
          textAlign: 'center',
          backgroundImage: `linear-gradient(rgba(15, 42, 51, 0.85), rgba(15, 42, 51, 0.95)), url('/images/BO5A5992-scaled.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container">
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', color: '#E49951', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
            SPECIAL RETREATS & PACKAGES
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 5vw, 54px)', fontWeight: 500, marginBottom: '16px' }}>
            Promotions & Exclusive Offers
          </h1>
          <p style={{ fontSize: '16px', color: '#A2B5BD', maxWidth: '640px', margin: '0 auto', lineHeight: '1.7' }}>
            Unlock exceptional value with our exclusive packages, member savings, and seasonal hotel offers in Addis Ababa.
          </p>
        </div>
      </section>

      {/* Promotions List */}
      <section className="section-padding bg-light">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>
            {PROMOTIONS.map((promo) => (
              <div
                key={promo.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E1DA',
                  padding: '36px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(228, 153, 81, 0.15)',
                      color: '#E49951',
                      padding: '4px 12px',
                      borderRadius: '4px',
                    }}
                  >
                    {promo.badge}
                  </span>
                  <strong style={{ fontSize: '20px', color: '#153D4B', fontWeight: 700 }}>
                    {promo.discount}
                  </strong>
                </div>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#153D4B', marginBottom: '12px' }}>
                  {promo.title}
                </h3>

                <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#5E6E75', marginBottom: '24px' }}>
                  {promo.description}
                </p>

                {/* Inclusions */}
                <div style={{ marginBottom: '28px', flex: 1 }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#838A8D', fontWeight: 600, marginBottom: '10px' }}>
                    PACKAGE INCLUSIONS:
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {promo.inclusions.map((inc, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#153D4B' }}>
                        <Check size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Promo Code Box */}
                <div
                  style={{
                    backgroundColor: '#F7F7F2',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px dashed #D5D4CC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: '#5E6E75' }}>Promo Code:</span>
                  <strong style={{ color: '#E49951', letterSpacing: '1px' }}>{promo.code}</strong>
                </div>

                <button
                  onClick={() => openBooking()}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  <Tag size={16} />
                  <span>Book Offer Now</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
