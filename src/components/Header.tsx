'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Phone, ArrowRight, Menu, X, Calendar } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import { HOTEL_INFO } from '@/data/hotelData';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [content, setContent] = useState<Record<string, string>>({});
  const pathname = usePathname();
  const { openBooking, openNavDrawer } = useBooking();

  const isHomePage = pathname === '/';

  useEffect(() => {
    fetch('/api/content')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.content) setContent(data.content);
      })
      .catch((e) => console.error('Failed to load header content:', e));

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
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${headerBgClass}`}
      style={{
        backgroundColor: isScrolled
          ? 'rgba(255, 255, 255, 0.96)'
          : isHomePage
          ? 'rgba(15, 42, 51, 0.45)'
          : '#0F2A33',
        backdropFilter: 'blur(12px)',
        borderBottom: isScrolled
          ? '1px solid #E2E1DA'
          : '1px solid rgba(255, 255, 255, 0.12)',
        color: isScrolled ? '#153D4B' : '#FFFFFF',
        paddingTop: isScrolled ? '16px' : '24px',
        paddingBottom: isScrolled ? '16px' : '24px',
        transition: 'padding 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
        
        {/* Left: Brand Logo & Title */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
          <div
            style={{
              position: 'relative',
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: '#082026',
              border: '2px solid rgba(228, 153, 81, 0.7)',
              boxShadow: '0 3px 12px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Image
              src="/images/logo.png"
              alt="Grand Addis Hotel Logo"
              width={58}
              height={58}
              priority
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '21px',
                fontWeight: 600,
                letterSpacing: '1.2px',
                display: 'block',
                lineHeight: '1.15',
                color: isScrolled ? '#153D4B' : '#FFFFFF',
              }}
            >
              GRAND ADDIS
            </span>
            <span
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '2.8px',
                color: '#E49951',
                fontWeight: 600,
                display: 'block',
                marginTop: '2px',
              }}
            >
              HOTEL & RESORT
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation with Breathing Space */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '34px',
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
                  fontSize: '14px',
                  fontWeight: 500,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  color: isActive
                    ? '#E49951'
                    : isScrolled
                    ? '#153D4B'
                    : '#FFFFFF',
                  padding: '10px 4px',
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
                      left: '4px',
                      right: '4px',
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

        {/* Right: Phone, Book CTA & Menu in Standard Right Position */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

          <a
            href={`tel:${content.page_contact_phone || content.hotel_phone || HOTEL_INFO.phone}`}
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
                width: '34px',
                height: '34px',
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
            <span style={{ letterSpacing: '0.5px' }}>{content.page_contact_phone || content.hotel_phone || HOTEL_INFO.phone}</span>
          </a>

          <button
            onClick={() => openBooking()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 22px',
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

          {/* Menu / Drawer Button (Standard Right-hand Position) */}
          <button
            onClick={openNavDrawer}
            aria-label="Open navigation menu"
            className="header-menu-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '6px',
              border: isScrolled ? '1px solid #E2E1DA' : '1px solid rgba(255, 255, 255, 0.25)',
              backgroundColor: isScrolled ? '#F7F7F2' : 'rgba(255, 255, 255, 0.1)',
              color: isScrolled ? '#153D4B' : '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '20px' }}>
              <span
                style={{
                  display: 'block',
                  width: '20px',
                  height: '2px',
                  backgroundColor: isScrolled ? '#153D4B' : '#FFFFFF',
                  borderRadius: '2px',
                  transition: 'all 0.2s',
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: '14px',
                  height: '2px',
                  backgroundColor: '#E49951',
                  borderRadius: '2px',
                  transition: 'all 0.2s',
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: '20px',
                  height: '2px',
                  backgroundColor: isScrolled ? '#153D4B' : '#FFFFFF',
                  borderRadius: '2px',
                  transition: 'all 0.2s',
                }}
              />
            </div>
            <span
              className="header-menu-text"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              Menu
            </span>
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
            padding: 9px 12px !important;
          }
          .header-menu-text {
            display: none !important;
          }
          .header-menu-btn {
            padding: 9px 10px !important;
          }
        }
      `}</style>
    </header>
  );
}
