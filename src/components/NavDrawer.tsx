'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Phone, Mail, MapPin, Calendar, ArrowRight, Send } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import { HOTEL_INFO } from '@/data/hotelData';

export default function NavDrawer() {
  const { isNavDrawerOpen, closeNavDrawer, openBooking } = useBooking();

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNavDrawerOpen) {
        closeNavDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNavDrawerOpen, closeNavDrawer]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isNavDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isNavDrawerOpen]);

  if (!isNavDrawerOpen) return null;

  const links = [
    { label: 'Home', href: '/' },
    { label: 'Our Rooms & Suites', href: '/rooms' },
    { label: 'Experiences & Tours', href: '/experiences' },
    { label: 'Photo Gallery', href: '/gallery' },
    { label: 'About Grand Addis', href: '/about-us' },
    { label: 'Guest Testimonials', href: '/testimonials' },
    { label: 'Frequently Asked Questions', href: '/faqs' },
    { label: 'Contact Us', href: '/contact' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={closeNavDrawer}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(9, 25, 31, 0.75)',
          backdropFilter: 'blur(6px)',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Drawer Content */}
      <div
        style={{
          position: 'relative',
          marginLeft: 'auto',
          width: '100%',
          maxWidth: '520px',
          height: '100%',
          backgroundColor: '#0F2A33',
          color: '#FFFFFF',
          padding: '40px 36px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
          animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Top bar with Close button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: '#082026',
                border: '2px solid rgba(228, 153, 81, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={52}
                height={52}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600 }}>
                GRAND ADDIS
              </div>
              <div style={{ fontSize: '10px', color: '#E49951', letterSpacing: '2px' }}>
                HOTEL
              </div>
            </div>
          </div>

          <button
            onClick={closeNavDrawer}
            aria-label="Close menu"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              border: 'none',
              transition: 'background-color 0.2s',
            }}
          >
            <X size={20} />
          </button>
        </div>


        {/* Action Button */}
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={() => {
              closeNavDrawer();
              openBooking();
            }}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '13px' }}
          >
            <Calendar size={16} />
            <span>Book Your Stay</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Navigation list */}
        <div style={{ marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '24px' }}>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#E49951',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            Navigation
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeNavDrawer}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '16px',
                  fontWeight: 400,
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                }}
                className="drawer-link"
              >
                <span>{link.label}</span>
                <ArrowRight size={14} style={{ opacity: 0.4 }} />
              </Link>
            ))}
          </nav>
        </div>

        {/* Contact Info (Matching Amoja theme drawer) */}
        <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#E49951',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            Contact & Reservations
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: '#B5C4CB' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <MapPin size={17} color="#E49951" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#FFFFFF', display: 'block' }}>Address</strong>
                {HOTEL_INFO.address}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Phone size={17} color="#E49951" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#FFFFFF', display: 'block' }}>Reservations</strong>
                <a href={`tel:${HOTEL_INFO.phone}`} style={{ color: 'inherit' }}>
                  {HOTEL_INFO.phone}
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Mail size={17} color="#E49951" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#FFFFFF', display: 'block' }}>Email</strong>
                <a href={`mailto:${HOTEL_INFO.email}`} style={{ color: 'inherit' }}>
                  {HOTEL_INFO.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .drawer-link:hover {
          background-color: rgba(228, 153, 81, 0.15) !important;
          color: #E49951 !important;
          padding-left: 18px !important;
        }
      `}</style>
    </div>
  );
}
