'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Users,
  Wifi,
  Sparkles,
  ArrowRight,
  Coffee,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Phone,
  Mail,
  ChevronRight,
  CheckCircle2,
  Clock,
  Compass,
} from 'lucide-react';
import BookingBar from '@/components/BookingBar';
import RoomCard from '@/components/RoomCard';
import GalleryLightbox from '@/components/GalleryLightbox';
import { ROOMS, HOTEL_INFO, TESTIMONIALS, GALLERY_IMAGES, Room, Testimonial } from '@/data/hotelData';
import { useBooking } from '@/context/BookingContext';

export default function HomePage() {
  const { openBooking } = useBooking();
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>(ROOMS);
  const [testimonialsList, setTestimonialsList] = useState<Testimonial[]>(TESTIMONIALS);
  const [galleryList, setGalleryList] = useState<any[]>(GALLERY_IMAGES);
  const [pageContent, setPageContent] = useState<Record<string, string>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    async function loadPostgresData() {
      try {
        const [roomsRes, testRes, galRes, contentRes] = await Promise.all([
          fetch('/api/rooms').then((r) => r.json()).catch(() => null),
          fetch('/api/testimonials').then((r) => r.json()).catch(() => null),
          fetch('/api/gallery').then((r) => r.json()).catch(() => null),
          fetch('/api/content').then((r) => r.json()).catch(() => null),
        ]);
        if (roomsRes?.success && roomsRes.rooms?.length > 0) {
          setFeaturedRooms(roomsRes.rooms);
        }
        if (testRes?.success && testRes.testimonials?.length > 0) {
          setTestimonialsList(testRes.testimonials);
        }
        if (galRes?.success && Array.isArray(galRes.images) && galRes.images.length > 0) {
          setGalleryList(galRes.images);
        }
        if (contentRes?.success && contentRes.content) {
          setPageContent(contentRes.content);
        }
      } catch (err) {
        console.error('Failed to load data for homepage:', err);
      }
    }
    loadPostgresData();
  }, []);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      {/* ================= HERO SECTION ================= */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: '#FFFFFF',
          paddingTop: '100px',
          paddingBottom: '80px',
          overflow: 'hidden',
        }}
      >
        {/* LCP Optimized Hero Image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
          }}
        >
          <Image
            src={pageContent.page_home_hero_image || '/images/BO5A5779-scaled.jpg'}
            alt="Grand Addis Hotel & Resort"
            fill
            priority
            sizes="100vw"
            quality={85}
            style={{
              objectFit: 'cover',
              transform: 'scale(1.02)',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(15, 42, 51, 0.72) 0%, rgba(15, 42, 51, 0.85) 60%, rgba(15, 42, 51, 0.96) 100%)',
            zIndex: 1,
          }}
        />

        {/* Hero Content */}
        <div
          className="container"
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '920px',
            marginBottom: '48px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '999px',
              backgroundColor: 'rgba(228, 153, 81, 0.2)',
              border: '1px solid rgba(228, 153, 81, 0.4)',
              color: '#E49951',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '24px',
            }}
          >
            <Sparkles size={14} /> {pageContent.page_home_hero_badge || 'Welcome to Grand Addis Hotel & Resort'}
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(38px, 6vw, 68px)',
              fontWeight: 500,
              lineHeight: 1.15,
              marginBottom: '24px',
              textShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            {pageContent.page_home_hero_title || 'Your Grand Stay In The Heart Of Addis'}
          </h1>

          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              lineHeight: 1.7,
              color: 'rgba(255, 255, 255, 0.88)',
              maxWidth: '680px',
              margin: '0 auto 36px',
              fontWeight: 300,
            }}
          >
            {pageContent.page_home_hero_subtitle ||
              'Rebalance yourself in a timeless space where understated luxury, warm Ethiopian hospitality, and tranquil comfort come together.'}
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={() => openBooking()}
              className="btn btn-primary btn-lg"
              style={{
                boxShadow: '0 6px 20px rgba(228, 153, 81, 0.4)',
              }}
            >
              <Calendar size={18} />
              <span>Book Your Stay</span>
              <ArrowRight size={18} />
            </button>

            <Link href="/rooms" className="btn btn-outline-white btn-lg">
              Explore Our Rooms
            </Link>
          </div>
        </div>

        {/* Floating Booking Bar on Hero Bottom */}
        <div style={{ width: '100%', position: 'relative', zIndex: 10 }}>
          <BookingBar />
        </div>
      </section>

      {/* ================= WELCOME / ABOUT SECTION ================= */}
      <section className="section-padding bg-light">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '56px',
              alignItems: 'center',
            }}
          >
            {/* Left Column: Text */}
            <div>
              <span className="section-subtitle">
                {pageContent.page_home_story_subtitle || 'WELCOME TO OUR OASIS'}
              </span>
              <h2 className="section-title">
                {pageContent.page_home_story_title || 'A Place Of Heart, Your Home Away in Addis Ababa'}
              </h2>
              <p
                style={{
                  fontSize: '16px',
                  lineHeight: '1.8',
                  color: 'var(--text-muted)',
                  marginBottom: '20px',
                }}
              >
                {pageContent.page_home_story_p1 || (
                  <>
                    Nestled at <strong>22 Around Golagul</strong> in Addis Ababa, Grand Addis Hotel offers an unparalleled haven for international travelers, business executives, and vacationers. Our sanctuary harmoniously combines modern refinement with authentic Ethiopian warmth.
                  </>
                )}
              </p>
              <p
                style={{
                  fontSize: '15px',
                  lineHeight: '1.8',
                  color: 'var(--text-muted)',
                  marginBottom: '32px',
                }}
              >
                {pageContent.page_home_story_p2 || (
                  <>
                    Whether you are visiting for diplomatic engagements, conferences, or cultural exploration, enjoy effortless access to Bole International Airport (just 10 minutes away), warm hospitality, and refined luxury accommodations.
                  </>
                )}
              </p>

              {/* Highlights List */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '36px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#E49951" />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>22 Around Golagul</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#E49951" />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>10 Mins to Bole Airport</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#E49951" />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>High-Speed Fiber Wi-Fi</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#E49951" />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>24/7 Room & Concierge</span>
                </div>
              </div>

              <Link href="/about-us" className="btn btn-outline">
                <span>Discover Our Story</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Right Column: Imagery Showcase */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'relative',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <img
                  src={pageContent.page_home_story_image || '/images/BO5A5826-scaled.jpg'}
                  alt="Grand Addis Hotel Suite"
                  style={{ width: '100%', height: '420px', objectFit: 'cover' }}
                />
              </div>

              {/* Floating Accent Card */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-24px',
                  left: '-24px',
                  backgroundColor: '#0F2A33',
                  color: '#FFFFFF',
                  padding: '24px 28px',
                  borderRadius: '12px',
                  boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
                  maxWidth: '260px',
                  border: '1px solid rgba(228, 153, 81, 0.3)',
                }}
              >
                <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-serif)', marginBottom: '4px' }}>
                  99% of Guests
                </div>
                <p style={{ fontSize: '12px', color: '#A2B5BD', lineHeight: '1.4' }}>
                  Recommend Grand Addis Hotel for comfort, safety, and hospitality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= THREE PILLARS: REFRESH, RELAX, RENEW ================= */}
      <section className="section-padding bg-dark">
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="section-subtitle">THE GRAND ADDIS EXPERIENCE</span>
          <h2 className="section-title" style={{ maxWidth: '720px', margin: '0 auto 18px' }}>
            Rebalance Yourself In A Timeless Space
          </h2>
          <p className="section-desc" style={{ margin: '0 auto 56px' }}>
            Every touchpoint at Grand Addis Hotel is designed to nurture your senses, calm your mind, and provide an enriching stay.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '30px',
              textAlign: 'left',
            }}
          >
            {/* Pillar 1: Relax */}
            <div
              style={{
                backgroundColor: 'var(--surface-dark-card)',
                borderRadius: '12px',
                padding: '36px 30px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.3s',
              }}
              className="pillar-card"
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(228, 153, 81, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E49951',
                  marginBottom: '22px',
                }}
              >
                <Sparkles size={26} />
              </div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#E49951', fontWeight: 600 }}>
                ACCOMMODATIONS
              </span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#FFFFFF', margin: '8px 0 14px' }}>
                Relax & Unwind
              </h3>
              <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-on-dark-muted)', marginBottom: '22px' }}>
                Serene guest rooms and suites furnished with orthopedic bedding, soundproof insulation, climate control, and rain showers.
              </p>
              <Link
                href="/rooms"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#E49951',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                View Rooms & Suites <ChevronRight size={15} />
              </Link>
            </div>

            {/* Pillar 2: Culture & Heritage */}
            <div
              style={{
                backgroundColor: 'var(--surface-dark-card)',
                borderRadius: '12px',
                padding: '36px 30px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.3s',
              }}
              className="pillar-card"
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(228, 153, 81, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E49951',
                  marginBottom: '22px',
                }}
              >
                <Coffee size={26} />
              </div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#E49951', fontWeight: 600 }}>
                CULTURE & TRADITION
              </span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#FFFFFF', margin: '8px 0 14px' }}>
                Authentic Experiences
              </h3>
              <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-on-dark-muted)', marginBottom: '22px' }}>
                Immerse yourself in our daily Ethiopian Buna coffee ceremonies, cultural discoveries, and warm Addis Ababa hospitality.
              </p>
              <Link
                href="/experiences"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#E49951',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Discover Experiences <ChevronRight size={15} />
              </Link>
            </div>

            {/* Pillar 3: Prime Location */}
            <div
              style={{
                backgroundColor: 'var(--surface-dark-card)',
                borderRadius: '12px',
                padding: '36px 30px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.3s',
              }}
              className="pillar-card"
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(228, 153, 81, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E49951',
                  marginBottom: '22px',
                }}
              >
                <MapPin size={26} />
              </div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#E49951', fontWeight: 600 }}>
                PRIME LOCATION
              </span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#FFFFFF', margin: '8px 0 14px' }}>
                Heart of Addis
              </h3>
              <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-on-dark-muted)', marginBottom: '22px' }}>
                Located at 22 Around Golagul, just 10 minutes from Bole International Airport with seamless access to diplomatic centers.
              </p>
              <Link
                href="/contact"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#E49951',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Get Directions <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        <style jsx>{`
          .pillar-card:hover {
            transform: translateY(-6px);
            border-color: rgba(228, 153, 81, 0.4) !important;
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
          }
        `}</style>
      </section>

      {/* ================= FEATURED ROOMS SECTION ================= */}
      <section className="section-padding">
        <div className="container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: '48px',
              gap: '20px',
            }}
          >
            <div>
              <span className="section-subtitle">LUXURY ACCOMMODATIONS</span>
              <h2 className="section-title">Our Featured Rooms & Suites</h2>
              <p className="section-desc">
                Immerse yourself in understated elegance. Best rates guaranteed when booking directly on our site.
              </p>
            </div>

            <Link href="/rooms" className="btn btn-outline">
              <span>View All Rooms</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
              gap: '28px',
            }}
          >
            {featuredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOSPITALITY & EXPERIENCES BANNER ================= */}
      <section
        style={{
          position: 'relative',
          padding: '120px 0',
          backgroundImage: `url('/images/BO5A5779-scaled.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(15, 42, 51, 0.95) 0%, rgba(15, 42, 51, 0.75) 100%)',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '640px' }}>
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
              BESPOKE HOSPITALITY
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(32px, 4vw, 48px)',
                lineHeight: 1.2,
                marginBottom: '20px',
              }}
            >
              Authentic Ethiopian Hospitality
            </h2>
            <p
              style={{
                fontSize: '16px',
                lineHeight: 1.8,
                color: '#D1DEE3',
                marginBottom: '32px',
              }}
            >
              Experience the genuine warmth and cultural heritage of Addis Ababa. From complimentary airport shuttle transfers to our daily traditional Buna ceremonies, we make your stay in Ethiopia unforgettable.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <Link href="/experiences" className="btn btn-primary">
                <Coffee size={16} />
                <span>Cultural Experiences</span>
              </Link>
              <Link href="/rooms" className="btn btn-outline-white">
                <Sparkles size={16} />
                <span>Explore Rooms</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INTERACTIVE PHOTO GALLERY ================= */}
      <section className="section-padding bg-light defer-render">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span className="section-subtitle">VISUAL TOUR</span>
            <h2 className="section-title">GALLERY</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Explore the ambiance, architecture, and spaces of Grand Addis Hotel.
            </p>
          </div>

          {/* Photo Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {galleryList.slice(0, 8).map((item, index) => (
              <div
                key={item.id || index}
                onClick={() => openLightbox(index)}
                style={{
                  position: 'relative',
                  height: '240px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  backgroundColor: '#0F2A33',
                }}
                className="gallery-item"
              >
                <Image
                  src={item.src}
                  alt={item.title || 'Grand Addis Hotel Photo'}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 320px"
                  loading="lazy"
                  className="gallery-img"
                  style={{
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(15, 42, 51, 0.45)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '20px',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  }}
                  className="gallery-overlay"
                >
                  <span style={{ fontSize: '11px', color: '#E49951', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {item.category}
                  </span>
                  <h4 style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 600 }}>{item.title}</h4>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Link href="/gallery" className="btn btn-outline">
              <span>View Complete Gallery ({galleryList.length} Photos)</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <style jsx>{`
          .gallery-item:hover .gallery-img {
            transform: scale(1.08);
          }
          .gallery-item:hover .gallery-overlay {
            opacity: 1 !important;
          }
        `}</style>
      </section>

      {/* ================= TESTIMONIALS SECTION ================= */}
      <section className="section-padding defer-render">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span className="section-subtitle">GUEST EXPERIENCES</span>
            <h2 className="section-title">What Customers Have To Say</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Real reviews from international and domestic guests who stayed at Grand Addis Hotel.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}
          >
            {testimonialsList.map((t) => (
              <div
                key={t.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E1DA',
                  padding: '30px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#153D4B', marginBottom: '10px' }}>
                  “{t.title}”
                </h4>

                <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#5E6E75', marginBottom: '20px', flex: 1 }}>
                  {t.comment}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '16px',
                    borderTop: '1px solid #ECEBE5',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <strong style={{ display: 'block', color: '#153D4B', fontSize: '14px' }}>{t.name}</strong>
                    <span style={{ color: '#838A8D' }}>{t.location}</span>
                  </div>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#F7F7F2',
                      color: '#E49951',
                      fontWeight: 600,
                    }}
                  >
                    {t.roomType}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Link href="/testimonials" className="btn btn-outline">
              <span>Read More Reviews & Submit Yours</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= LOCATION & INFO SECTION ================= */}
      <section className="section-padding bg-light" style={{ borderTop: '1px solid #E2E1DA' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '48px',
              alignItems: 'center',
            }}
          >
            {/* Contact details */}
            <div>
              <span className="section-subtitle">FIND US</span>
              <h2 className="section-title">Location and Info</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-muted)', marginBottom: '32px' }}>
                Centrally positioned in the vibrant commercial and cultural heart of Addis Ababa, Grand Addis Hotel offers premier convenience for travelers and delegates.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '36px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E1DA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#E49951',
                      flexShrink: 0,
                    }}
                  >
                    <MapPin size={20} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '15px', color: '#153D4B' }}>Address</strong>
                    <p style={{ fontSize: '14px', color: '#5E6E75' }}>{HOTEL_INFO.address}</p>
                    <span style={{ fontSize: '12px', color: '#E49951', fontWeight: 500 }}>
                      Approx. 10 mins from Addis Ababa Bole International Airport
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E1DA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#E49951',
                      flexShrink: 0,
                    }}
                  >
                    <Phone size={20} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '15px', color: '#153D4B' }}>Reservations Desk</strong>
                    <a
                      href={`tel:${HOTEL_INFO.phone}`}
                      style={{ fontSize: '14px', color: '#5E6E75', textDecoration: 'none' }}
                    >
                      {HOTEL_INFO.phone}
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E1DA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#E49951',
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={20} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '15px', color: '#153D4B' }}>Email Inquiries</strong>
                    <a
                      href={`mailto:${HOTEL_INFO.email}`}
                      style={{ fontSize: '14px', color: '#5E6E75', textDecoration: 'none' }}
                    >
                      {HOTEL_INFO.email}
                    </a>
                  </div>
                </div>
              </div>

              <Link href="/contact" className="btn btn-primary">
                <span>Contact Reception</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Map Card */}
            <div
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #E2E1DA',
                boxShadow: 'var(--shadow-md)',
                backgroundColor: '#FFFFFF',
                height: '420px',
                position: 'relative',
              }}
            >
              <iframe
                title="Grand Addis Hotel Location"
                src="https://maps.google.com/maps?q=Grand+Addis+Hotel,+22,+Addis+Ababa,+Ethiopia&t=&z=17&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* Exact Location Card Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  backgroundColor: 'rgba(21, 61, 75, 0.94)',
                  color: '#FFFFFF',
                  backdropFilter: 'blur(8px)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  maxWidth: '320px',
                  pointerEvents: 'auto',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <MapPin size={15} color="#E49951" />
                  <strong style={{ fontSize: '13px', color: '#FFFFFF', letterSpacing: '0.3px' }}>
                    Grand Addis Hotel
                  </strong>
                  <span
                    style={{
                      fontSize: '10px',
                      backgroundColor: 'rgba(228, 153, 81, 0.25)',
                      color: '#E49951',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    Exact Location
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#C2D1D9', lineHeight: '1.4' }}>
                  22 Around Golagul, behind Meklit Building, Addis Ababa
                </div>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Grand+Addis+Hotel+Addis+Ababa+Ethiopia"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#E49951',
                    fontWeight: 600,
                    marginTop: '8px',
                    textDecoration: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <span>Open in Google Maps / Directions</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      <GalleryLightbox
        images={galleryList}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(idx) => setLightboxIndex(idx)}
      />
    </>
  );
}
