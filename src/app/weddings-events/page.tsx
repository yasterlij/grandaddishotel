'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Users,
  Check,
  Send,
  Sparkles,
  Award,
  Video,
  Utensils,
  ArrowRight,
} from 'lucide-react';
import { HOTEL_INFO } from '@/data/hotelData';

export default function WeddingsEventsPage() {
  const [eventType, setEventType] = useState('Wedding');
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState('50-100');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          eventDate,
          guestCount,
          name,
          email,
          phone,
          details,
        }),
      });
    } catch (err) {
      console.error('Event inquiry error:', err);
    }
    setSubmitted(true);
  };

  return (
    <div style={{ paddingTop: '84px' }}>
      {/* Banner */}
      <section
        style={{
          position: 'relative',
          padding: '100px 0 70px',
          backgroundImage: `linear-gradient(rgba(15, 42, 51, 0.85), rgba(15, 42, 51, 0.95)), url('/images/BO5A5977-scaled.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#FFFFFF',
          textAlign: 'center',
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <span
            style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              color: '#E49951',
              fontWeight: 600,
              display: 'block',
              marginBottom: '12px',
            }}
          >
            CELEBRATE IN ELEGANCE
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 500,
              marginBottom: '18px',
            }}
          >
            Weddings & Events
          </h1>
          <p
            style={{
              fontSize: '17px',
              color: '#A2B5BD',
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: '1.7',
            }}
          >
            Create delightfully memorable experiences for you and your guests. From fairytale wedding receptions to high-profile corporate conferences.
          </p>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="section-padding bg-light">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span className="section-subtitle">OUR PROMISE</span>
            <h2 className="section-title">We Make Every Occasion Sparkle</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Exquisite settings, refined catering, warm boutique service, and seamless event management.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '28px',
            }}
          >
            <div style={{ backgroundColor: '#FFFFFF', padding: '36px', borderRadius: '12px', border: '1px solid #E2E1DA', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(228, 153, 81, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E49951', marginBottom: '20px' }}>
                <Sparkles size={24} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#153D4B', marginBottom: '12px' }}>
                Weddings & Honeymoons
              </h3>
              <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#5E6E75' }}>
                Allow us to take care of every detail, from candlelit rehearsal dinners and bridal party spa rituals to lavish wedding receptions and honeymoon suites.
              </p>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '36px', borderRadius: '12px', border: '1px solid #E2E1DA', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(228, 153, 81, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E49951', marginBottom: '20px' }}>
                <Users size={24} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#153D4B', marginBottom: '12px' }}>
                Social Celebrations
              </h3>
              <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#5E6E75' }}>
                Celebrate milestone anniversaries, elegant birthday banquets, family reunions, and private soirées with tailored bespoke catering menus.
              </p>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '36px', borderRadius: '12px', border: '1px solid #E2E1DA', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(228, 153, 81, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E49951', marginBottom: '20px' }}>
                <Video size={24} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#153D4B', marginBottom: '12px' }}>
                Corporate Conferences
              </h3>
              <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#5E6E75' }}>
                High-definition projection, sound engineering, ergonomic executive seating, and break-out coffee lounges for board meetings and symposiums.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RFP / Event Inquiry Form */}
      <section className="section-padding bg-white" style={{ borderTop: '1px solid #E2E1DA' }}>
        <div className="container" style={{ maxWidth: '840px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="section-subtitle">PLAN YOUR EVENT</span>
            <h2 className="section-title">Request an Event Proposal</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Tell us about your upcoming event, and our dedicated event coordinator will prepare a tailored package for you.
            </p>
          </div>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 0', backgroundColor: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check size={32} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#153D4B', marginBottom: '8px' }}>
                Inquiry Received!
              </h3>
              <p style={{ color: '#5E6E75', fontSize: '15px', maxWidth: '480px', margin: '0 auto 24px' }}>
                Thank you, <strong>{name}</strong>. Our events director will contact you via email at <strong>{email}</strong> or phone at <strong>{phone}</strong> within 24 hours.
              </p>
              <button onClick={() => setSubmitted(false)} className="btn btn-primary">
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                backgroundColor: '#F7F7F2',
                borderRadius: '16px',
                border: '1px solid #E2E1DA',
                padding: '36px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                    Event Type *
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  >
                    <option value="Wedding Reception">Wedding Reception</option>
                    <option value="Corporate Conference">Corporate Conference</option>
                    <option value="Banquet Dinner">Banquet Dinner</option>
                    <option value="Birthday Celebration">Birthday Celebration</option>
                    <option value="Board Meeting">Executive Board Meeting</option>
                    <option value="Other Event">Other Event</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                    Target Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                    Estimated Guests *
                  </label>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  >
                    <option value="10-30">10 – 30 Guests</option>
                    <option value="30-70">30 – 70 Guests</option>
                    <option value="70-150">70 – 150 Guests</option>
                    <option value="150-300">150 – 300+ Guests</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251..."
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                  Event Details & Special Requirements
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Tell us about your vision, catering preferences, audio-visual requirements..."
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                <Send size={16} /> Submit Event RFP Request
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
