'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Check,
  Plane,
  Building,
  ShieldCheck,
} from 'lucide-react';
import { HOTEL_INFO } from '@/data/hotelData';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ paddingTop: '84px' }}>
      {/* Banner */}
      <section
        style={{
          backgroundColor: '#0F2A33',
          color: '#FFFFFF',
          padding: '80px 0 60px',
          textAlign: 'center',
          backgroundImage: `linear-gradient(rgba(15, 42, 51, 0.85), rgba(15, 42, 51, 0.95)), url('/images/BO5A5779-scaled.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container">
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', color: '#E49951', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
            GET IN TOUCH
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 5vw, 54px)', fontWeight: 500, marginBottom: '16px' }}>
            Contact Grand Addis Hotel
          </h1>
          <p style={{ fontSize: '16px', color: '#A2B5BD', maxWidth: '640px', margin: '0 auto', lineHeight: '1.7' }}>
            We’d love to hear from you. Get in touch via our contact form, email, or direct phone.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="section-padding bg-light">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '48px',
              alignItems: 'start',
            }}
          >
            {/* Contact Details Column */}
            <div>
              <span className="section-subtitle">24/7 GUEST SUPPORT</span>
              <h2 className="section-title">We’re Here For You</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#5E6E75', marginBottom: '32px' }}>
                Whether you need assistance with room reservations, airport shuttle transfers, dining inquiries, or private event planning, our team is always at your disposal.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E2E1DA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E49951', flexShrink: 0 }}>
                    <MapPin size={22} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#153D4B' }}>Hotel Address</strong>
                    <p style={{ fontSize: '14px', color: '#5E6E75', marginTop: '2px' }}>{HOTEL_INFO.address}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#E49951', marginTop: '4px' }}>
                      <Plane size={14} /> 5.2 km from Bole International Airport (~10 mins)
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E2E1DA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E49951', flexShrink: 0 }}>
                    <Phone size={22} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#153D4B' }}>Telephone & Reservations</strong>
                    <a href={`tel:${HOTEL_INFO.phone}`} style={{ fontSize: '15px', color: '#5E6E75', display: 'block', marginTop: '2px' }}>
                      {HOTEL_INFO.phone}
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E2E1DA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E49951', flexShrink: 0 }}>
                    <Mail size={22} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#153D4B' }}>Electronic Mail</strong>
                    <a href={`mailto:${HOTEL_INFO.email}`} style={{ fontSize: '14px', color: '#5E6E75', display: 'block', marginTop: '2px' }}>
                      {HOTEL_INFO.email}
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E2E1DA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E49951', flexShrink: 0 }}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#153D4B' }}>Front Desk Hours</strong>
                    <p style={{ fontSize: '14px', color: '#5E6E75', marginTop: '2px' }}>Open 24 Hours • 7 Days a Week</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Form Column */}
            <div>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E1DA',
                  padding: '36px',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#153D4B', marginBottom: '8px' }}>
                  Send Us A Message
                </h3>
                <p style={{ fontSize: '14px', color: '#5E6E75', marginBottom: '24px' }}>
                  Fill in your details below and we will respond within a few hours.
                </p>

                {submitted ? (
                  <div style={{ textAlign: 'center', padding: '36px 0', backgroundColor: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Check size={28} />
                    </div>
                    <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                      Message Received!
                    </h4>
                    <p style={{ fontSize: '14px', color: '#5E6E75', marginBottom: '20px' }}>
                      Thank you, <strong>{name}</strong>. Our guest support team will get in touch at <strong>{email}</strong>.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setName('');
                        setEmail('');
                        setMessage('');
                      }}
                      className="btn btn-primary"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full name"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+251..."
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                          Subject
                        </label>
                        <select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                        >
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Room Reservation">Room Reservation</option>
                          <option value="Dining & Restaurant">Dining & Restaurant</option>
                          <option value="Spa & Wellness">Spa & Wellness</option>
                          <option value="Weddings & Events">Weddings & Events</option>
                          <option value="Airport Shuttle">Airport Shuttle</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '6px' }}>
                          Your Message *
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="How can we assist you today?"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                      <Send size={16} /> Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section style={{ height: '420px', width: '100%', position: 'relative' }}>
        <iframe
          title="Grand Addis Hotel Google Map"
          src="https://maps.google.com/maps?q=Golagul+Tower,+22+Addis+Ababa,+Ethiopia&t=&z=15&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>
    </div>
  );
}
