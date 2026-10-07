'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Phone, ArrowRight, Menu, X, Calendar } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import { useCurrency } from '@/context/CurrencyContext';
import { HOTEL_INFO } from '@/data/hotelData';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { openBooking, openNavDrawer } = useBooking();
  const { currency, setCurrency, rate } = useCurrency();

  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Rooms', href: '/rooms' },
    { label: 'Dining', href: '/dining' },
    { label: 'Wellness', href: '/wellness' },
    { label: 'Experiences', href: '/experiences' },
    { label: 'Events', href: '/weddings-events' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'About', href: '/about-us' },
    { label: 'Contact', href: '/contact' },
  ];

  const headerBgClass = isScrolled
    ? 'bg-white/95 text-[#153D4B] shadow-md backdrop-blur-md border-b border-[#E2E1DA]'
    : isHomePage
    ? 'bg-transparent text-white'
    : 'bg-[#0F2A33] text-white border-b border-white/10';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? 'py-3' : 'py-5'
      } ${headerBgClass}`}
      style={{
        backgroundColor: isScrolled
          ? 'rgba(255, 255, 255, 0.95)'
          : isHomePage
          ? 'rgba(15, 42, 51, 0.4)'
          : '#0F2A33',
        backdropFilter: 'blur(12px)',
        borderBottom: isScrolled
          ? '1px solid #E2E1DA'
          : '1px solid rgba(255, 255, 255, 0.1)',
        color: isScrolled ? '#153D4B' : '#FFFFFF',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        
        {/* Left: Hamburger & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <button
            onClick={openNavDrawer}
            aria-label="Open menu drawer"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '6px',
              border: isScrolled ? '1px solid #E2E1DA' : '1px solid rgba(255,255,255,0.25)',
              backgroundColor: isScrolled ? '#F7F7F2' : 'rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              padding: '8px',
              gap: '5px',
              transition: 'all 0.2s',
            }}
          >
            <span
              style={{
                display: 'block',
                width: '20px',
                height: '2px',
                backgroundColor: isScrolled ? '#153D4B' : '#FFFFFF',
                borderRadius: '2px',
              }}
            />
            <span
              style={{
                display: 'block',
                width: '14px',
                height: '2px',
                backgroundColor: '#E49951',
                alignSelf: 'flex-start',
                marginLeft: '3px',
                borderRadius: '2px',
              }}
            />
            <span
              style={{
                display: 'block',
                width: '20px',
                height: '2px',
                backgroundColor: isScrolled ? '#153D4B' : '#FFFFFF',
                borderRadius: '2px',
              }}
            />
          </button>

          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div
              style={{
                position: 'relative',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img
                src="/images/logo.png"
                alt="Grand Addis Hotel Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '20px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  display: 'block',
                  lineHeight: '1.1',
                  color: isScrolled ? '#153D4B' : '#FFFFFF',
                }}
              >
                GRAND ADDIS
              </span>
              <span
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '2.5px',
                  color: '#E49951',
                  fontWeight: 600,
                  display: 'block',
                }}
              >
                HOTEL & RESORT
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '24px',
          }}
          className="desktop-nav"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  color: isActive
                    ? '#E49951'
                    : isScrolled
                    ? '#153D4B'
                    : '#FFFFFF',
                  padding: '6px 0',
                  position: 'relative',
                  transition: 'color 0.2s',
                }}
              >
                {link.label}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: '#E49951',
                      borderRadius: '1px',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Currency, Phone & Book CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Currency Switcher */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: isScrolled ? '#F2F1EA' : 'rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '2px',
              border: isScrolled ? '1px solid #E2E1DA' : '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.2s ease',
            }}
          >
            <button
              onClick={() => setCurrency('USD')}
              title={`Show prices in US Dollars (1 USD = ${rate} ETB)`}
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: currency === 'USD' ? '#E49951' : 'transparent',
                color: currency === 'USD' ? '#FFFFFF' : isScrolled ? '#153D4B' : 'rgba(255, 255, 255, 0.85)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              USD
            </button>
            <button
              onClick={() => setCurrency('ETB')}
              title={`Show prices in Ethiopian Birr (1 USD = ${rate} ETB)`}
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: currency === 'ETB' ? '#E49951' : 'transparent',
                color: currency === 'ETB' ? '#FFFFFF' : isScrolled ? '#153D4B' : 'rgba(255, 255, 255, 0.85)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              ETB
            </button>
          </div>

          <a
            href={`tel:${HOTEL_INFO.phone}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              color: isScrolled ? '#153D4B' : '#FFFFFF',
              transition: 'color 0.2s',
            }}
            className="header-phone"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(228, 153, 81, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E49951',
              }}
            >
              <Phone size={15} />
            </div>
            <span style={{ letterSpacing: '0.5px' }}>{HOTEL_INFO.phone}</span>
          </a>

          <button
            onClick={() => openBooking()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              backgroundColor: '#E49951',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.25s',
              boxShadow: '0 4px 14px rgba(228, 153, 81, 0.35)',
            }}
            className="header-book-btn"
          >
            <Calendar size={14} />
            <span>Book Your Stay</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 992px) {
          .desktop-nav {
            display: flex !important;
          }
        }
        @media (max-width: 768px) {
          .header-phone {
            display: none !important;
          }
          .header-book-btn span {
            display: none;
          }
          .header-book-btn {
            padding: 8px 12px !important;
          }
        }
      `}</style>
    </header>
  );
}
