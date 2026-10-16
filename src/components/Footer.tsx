'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Send, Check, Heart, ArrowRight } from 'lucide-react';
import { HOTEL_INFO } from '@/data/hotelData';
import { useFormSubmit } from '@/hooks/useFormSubmit';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [content, setContent] = useState<Record<string, string>>({});
  const { isSubmitting, error, submit } = useFormSubmit();

  React.useEffect(() => {
    fetch('/api/content')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.content) setContent(data.content);
      })
      .catch((e) => console.error('Failed to load footer content:', e));
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const ok = await submit('/api/contact', {
      name: 'Newsletter Subscriber',
      email: email.trim(),
      subject: 'Newsletter Subscription',
      message: 'Guest requested newsletter subscription for private offers from the website footer.',
    });
    if (ok) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const phone = content.page_contact_phone || content.hotel_phone || HOTEL_INFO.phone;
  const emailAddr = content.page_contact_email || content.hotel_email || HOTEL_INFO.email;
  const address = content.page_contact_address || content.hotel_address || HOTEL_INFO.address;
  const igLink = content.hotel_social_instagram || HOTEL_INFO.socials.instagram;
  const fbLink = content.hotel_social_facebook || HOTEL_INFO.socials.facebook;
  const tgLink = content.hotel_social_telegram || HOTEL_INFO.socials.telegram;

  return (
    <footer
      style={{
        backgroundColor: '#0F2A33',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Decorative Gold Accent Bar */}
      <div
        style={{
          height: '4px',
          background: 'linear-gradient(90deg, #E49951 0%, #CD8948 50%, #E49951 100%)',
          width: '100%',
        }}
      />

      {/* Top Banner Section */}
      <div
        style={{
          padding: '60px 0 40px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="container" style={{ textAlign: 'center' }}>
          <span
            style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              color: '#E49951',
              fontWeight: 600,
              display: 'block',
              marginBottom: '10px',
            }}
          >
            {content.page_footer_tag || 'EXPERIENCE LUXURY IN ETHIOPIA'}
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(28px, 3.5vw, 42px)',
              fontWeight: 500,
              maxWidth: '720px',
              margin: '0 auto 24px',
              lineHeight: '1.25',
            }}
          >
            {content.page_footer_headline || HOTEL_INFO.headline}
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: '#A2B5BD',
              maxWidth: '560px',
              margin: '0 auto 28px',
              lineHeight: '1.6',
            }}
          >
            {content.page_footer_desc || 'A place of heart, your home away in Addis Ababa. Where refined comfort meets authentic Ethiopian hospitality.'}
          </p>

          <form
            onSubmit={handleSubscribe}
            style={{
              display: 'flex',
              maxWidth: '460px',
              margin: '0 auto',
              gap: '8px',
            }}
          >
            {subscribed ? (
              <div
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10B981',
                  borderRadius: '6px',
                  color: '#10B981',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Check size={18} /> Thank you for subscribing to our private offers!
              </div>
            ) : (
              <>
                <input
                  type="email"
                  required
                  placeholder="Enter your email for private offers..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ padding: '0 20px', borderRadius: '4px', opacity: isSubmitting ? 0.6 : 1 }}
                >
                  <Send size={15} />
                </button>
              </>
            )}
          </form>
          {error && (
            <p
              role="alert"
              style={{
                fontSize: '12px',
                color: '#F87171',
                marginTop: '10px',
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Main Grid Section */}
      <div style={{ padding: '64px 0 48px' }}>
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
          }}
        >
          {/* Col 1: Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: '#082026',
                  border: '2px solid rgba(228, 153, 81, 0.7)',
                  boxShadow: '0 3px 12px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={54}
                  height={54}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, display: 'block' }}>
                  GRAND ADDIS
                </span>
                <span style={{ fontSize: '10px', color: '#E49951', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  HOTEL & RESORT
                </span>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#A2B5BD', lineHeight: '1.7', marginBottom: '20px' }}>
              {content.hotel_tagline || 'Distinctly designed rooms, timeless ambiance, and warm boutique service in the heart of Addis Ababa.'}
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <a
                href={igLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  transition: 'background 0.2s',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 600 }}>IG</span>
              </a>
              <a
                href={fbLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  transition: 'background 0.2s',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 600 }}>FB</span>
              </a>
              <a
                href={tgLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  transition: 'background 0.2s',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 600 }}>TG</span>
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: '#E49951',
                fontWeight: 600,
                marginBottom: '18px',
              }}
            >
              Accommodations
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#A2B5BD' }}>
              <li>
                <Link href="/rooms" style={{ color: 'inherit' }}>
                  Our Rooms Overview
                </Link>
              </li>
              <li>
                <Link href="/rooms/deluxe-room" style={{ color: 'inherit' }}>
                  Deluxe Room ($34/night)
                </Link>
              </li>
              <li>
                <Link href="/rooms/deluxe-twin-room" style={{ color: 'inherit' }}>
                  Deluxe Twin Room ($34/night)
                </Link>
              </li>
              <li>
                <Link href="/rooms/standard-room" style={{ color: 'inherit' }}>
                  Standard Room ($27/night)
                </Link>
              </li>
              <li>
                <Link href="/rooms-reservation" style={{ color: '#E49951', fontWeight: 500 }}>
                  Online Room Reservation →
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Experiences & Explore */}
          <div>
            <h4
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: '#E49951',
                fontWeight: 600,
                marginBottom: '18px',
              }}
            >
              Explore & Experiences
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#A2B5BD' }}>
              <li>
                <Link href="/experiences" style={{ color: 'inherit' }}>
                  Ethiopian Coffee Ceremony
                </Link>
              </li>
              <li>
                <Link href="/gallery" style={{ color: 'inherit' }}>
                  Hotel Photo Gallery
                </Link>
              </li>
              <li>
                <Link href="/about-us" style={{ color: 'inherit' }}>
                  About Grand Addis
                </Link>
              </li>
              <li>
                <Link href="/testimonials" style={{ color: 'inherit' }}>
                  Guest Testimonials
                </Link>
              </li>
              <li>
                <Link href="/faqs" style={{ color: 'inherit' }}>
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/contact" style={{ color: 'inherit' }}>
                  Location & Directions
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Info (matching original) */}
          <div>
            <h4
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: '#E49951',
                fontWeight: 600,
                marginBottom: '18px',
              }}
            >
              Contact Info
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: '#A2B5BD' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <MapPin size={18} color="#E49951" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{address}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Phone size={18} color="#E49951" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <a href={`tel:${phone}`} style={{ color: 'inherit', display: 'block' }}>
                    {phone}
                  </a>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Mail size={18} color="#E49951" style={{ flexShrink: 0, marginTop: '2px' }} />
                <a href={`mailto:${emailAddr}`} style={{ color: 'inherit' }}>
                  {emailAddr}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '22px 0',
          fontSize: '13px',
          color: '#83969E',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            Copyright © {new Date().getFullYear()} Grand Addis Hotel. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/terms-conditions" style={{ color: 'inherit' }}>
              Terms & Conditions
            </Link>
            <Link href="/faqs" style={{ color: 'inherit' }}>
              FAQs
            </Link>
            <Link href="/contact" style={{ color: 'inherit' }}>
              Contact
            </Link>
            <Link href="/admin" style={{ color: '#E49951', fontWeight: 500 }}>
              DB & Operations
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
