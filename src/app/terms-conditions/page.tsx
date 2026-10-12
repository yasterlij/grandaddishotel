'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HOTEL_INFO } from '@/data/hotelData';

export default function TermsConditionsPage() {
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/content')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.content) setContent(data.content);
      })
      .catch((e) => console.error('Failed to load terms content:', e));
  }, []);

  const phone = content.page_contact_phone || HOTEL_INFO.phone;
  const email = content.page_contact_email || HOTEL_INFO.email;

  return (
    <div style={{ paddingTop: 'var(--header-height, 96px)' }}>
      <section style={{ backgroundColor: '#0F2A33', color: '#FFFFFF', padding: '60px 0 40px', textAlign: 'center' }}>
        <div className="container">
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', color: '#E49951', fontWeight: 600 }}>
            {content.page_terms_hero_tag || 'LEGAL & POLICIES'}
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: ' clamp(32px, 4vw, 48px)', fontWeight: 500, margin: '10px 0' }}>
            {content.page_terms_hero_title || 'Terms & Conditions'}
          </h1>
          <p style={{ color: '#A2B5BD', fontSize: '15px' }}>
            {content.page_terms_updated || 'Last updated: October 2026 • Grand Addis Hotel'}
          </p>
        </div>
      </section>

      <section className="section-padding bg-light">
        <div className="container container-narrow">
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E1DA',
              padding: '40px',
              boxShadow: 'var(--shadow-sm)',
              fontSize: '15px',
              lineHeight: '1.8',
              color: '#5E6E75',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#153D4B', marginBottom: '14px' }}>
              {content.page_terms_sec1_title || '1. General Hotel Policies'}
            </h2>
            <p style={{ marginBottom: '20px' }}>
              {content.page_terms_sec1 || 'Welcome to Grand Addis Hotel. By accessing this website or booking accommodations and services at our property (located at 22 Around Golagul, Addis Ababa, Ethiopia), you agree to comply with and be bound by these Terms and Conditions.'}
            </p>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#153D4B', marginBottom: '14px' }}>
              {content.page_terms_sec2_title || '2. Reservations & Guarantee'}
            </h2>
            <p style={{ marginBottom: '20px' }}>
              {content.page_terms_sec2 || 'A valid reservation guarantee (via credit card, corporate agreement, or approved direct deposit) is required to secure any room reservation made through this site or directly with our front desk. All rates quoted on our direct reservation engine are in USD ($) and include 15% Value Added Tax (VAT) and municipal tourism fees.'}
            </p>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#153D4B', marginBottom: '14px' }}>
              {content.page_terms_sec3_title || '3. Check-In & Check-Out Times'}
            </h2>
            <p style={{ marginBottom: '20px' }}>
              {content.page_terms_sec3 || 'Standard check-in time commences at 14:00 (2:00 PM) on the arrival date. Standard check-out time is until 12:00 (12:00 PM) on the departure date. Early check-in or late check-out is subject to room availability upon request. Complimentary secure luggage storage is provided for all registered guests.'}
            </p>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#153D4B', marginBottom: '14px' }}>
              {content.page_terms_sec4_title || '4. Cancellation & Modifications'}
            </h2>
            <p style={{ marginBottom: '20px' }}>
              {content.page_terms_sec4 || 'Flexible rate bookings may be cancelled or modified free of charge up to 24 hours prior to standard check-in time. In the event of a late cancellation or no-show, the hotel reserves the right to charge the equivalent of the first night room charge. Non-refundable promotional rates are subject to the specific terms outlined during reservation.'}
            </p>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#153D4B', marginBottom: '14px' }}>
              {content.page_terms_sec5_title || '5. Payment Terms & Card Guarantee'}
            </h2>
            <p style={{ marginBottom: '20px' }}>
              {content.page_terms_sec5 || 'Your credit card details entered during booking are securely processed through PCI DSS-compliant gateways and used strictly to guarantee your reservation. No unauthorized charges are applied prior to your check-in, except where specified under special non-refundable packages or in cases of unnotified no-show. We accept Mastercard, Visa, and domestic Ethiopian payment methods.'}
            </p>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#153D4B', marginBottom: '14px' }}>
              {content.page_terms_sec6_title || '6. Contact & Inquiries'}
            </h2>
            <p>
              {content.page_terms_sec6
                ? content.page_terms_sec6.replace('{phone}', phone).replace('{email}', email)
                : (
                  <>
                    For any questions concerning your stay, payment verification, or these policies, please contact our 24/7 guest relations department at <strong>{phone}</strong> or by email at <strong>{email}</strong>.
                  </>
                )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
