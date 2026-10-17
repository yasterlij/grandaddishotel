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
import { ROOMS, HOTEL_INFO, TESTIMONIALS, GALLERY_IMAGES, Room, Testimonial, formatMapEmbedUrl } from '@/data/hotelData';
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
            alt="Grand Addis Hotel"
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
            <Sparkles size={14} /> {pageContent.page_home_hero_badge || 'Welcome to Grand Addis Hotel'}
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(38px, 6vw, 48px)',
              fontWeight: 500,
              lineHeight: 1.15,
              marginBottom: '24px',
              textShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            {pageContent.page_home_hero_title || 'Your Grand Stay In The Heart Of Addis'}
          </h1>

          {pageContent.page_home_hero_subtitle && (
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
              {pageContent.page_home_hero_subtitle}
            </p>
          )}

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
              <span>{pageContent.page_home_hero_btn1_text || 'Book Your Stay'}</span>
              <ArrowRight size={18} />
            </button>

            <Link href="/rooms" className="btn btn-outline-white btn-lg">
              {pageContent.page_home_hero_btn2_text || 'Explore Our Rooms'}
            </Link>
          </div>
        </div>

        {/* Floating Booking Bar on Hero Bottom */}
        <div style={{ width: '100%', position: 'relative', zIndex: 10 }}>
          <BookingBar />
        </div>
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
              <span className="section-subtitle">
                {pageContent.page_home_rooms_subtitle || 'LUXURY ACCOMMODATIONS'}
              </span>
              <h2 className="section-title">
                {pageContent.page_home_rooms_title || 'Our Featured Rooms & Suites'}
              </h2>
              <p className="section-desc">
                {pageContent.page_home_rooms_desc || 'Immerse yourself in understated elegance. Best rates guaranteed when booking directly on our site.'}
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
          backgroundImage: `url('${pageContent.page_home_banner_image || '/images/BO5A5779-scaled.jpg'}')`,
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
              {pageContent.page_home_banner_tag || 'BESPOKE HOSPITALITY'}
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(32px, 4vw, 48px)',
                lineHeight: 1.2,
                marginBottom: '20px',
              }}
            >
              {pageContent.page_home_banner_title || 'Authentic Ethiopian Hospitality'}
            </h2>
            <p
              style={{
                fontSize: '16px',
                lineHeight: 1.8,
                color: '#D1DEE3',
                marginBottom: '32px',
              }}
            >
              {pageContent.page_home_banner_desc ||
                'Experience the genuine warmth and cultural heritage of Addis Ababa. From complimentary airport shuttle transfers to our daily traditional Buna ceremonies, we make your stay in Ethiopia unforgettable.'}
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
            <span className="section-subtitle">{pageContent.page_home_gallery_subtitle || 'VISUAL TOUR'}</span>
            <h2 className="section-title">{pageContent.page_home_gallery_title || 'GALLERY'}</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              {pageContent.page_home_gallery_desc || 'Explore the ambiance, architecture, and spaces of Grand Addis Hotel.'}
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
            <span className="section-subtitle">{pageContent.page_home_testimonials_subtitle || 'GUEST EXPERIENCES'}</span>
            <h2 className="section-title">{pageContent.page_home_testimonials_title || 'What Customers Have To Say'}</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              {pageContent.page_home_testimonials_desc || 'Real reviews from international and domestic guests who stayed at Grand Addis Hotel.'}
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
              <span className="section-subtitle">
                {pageContent.page_home_location_subtitle || 'FIND US'}
              </span>
              <h2 className="section-title">
                {pageContent.page_home_location_title || 'Location and Info'}
              </h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-muted)', marginBottom: '32px' }}>
                {pageContent.page_home_location_desc ||
                  'Centrally positioned in the vibrant commercial and cultural heart of Addis Ababa, Grand Addis Hotel offers premier convenience for travelers and delegates.'}
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
                    <p style={{ fontSize: '14px', color: '#5E6E75' }}>
                      {pageContent.page_contact_address || HOTEL_INFO.address}
                    </p>
                    <span style={{ fontSize: '12px', color: '#E49951', fontWeight: 500 }}>
                      {pageContent.page_contact_airport || 'Approx. 10 mins from Addis Ababa Bole International Airport'}
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
                      href={`tel:${pageContent.page_contact_phone || HOTEL_INFO.phone}`}
                      style={{ fontSize: '14px', color: '#5E6E75', textDecoration: 'none' }}
                    >
                      {pageContent.page_contact_phone || HOTEL_INFO.phone}
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
                      href={`mailto:${pageContent.page_contact_email || HOTEL_INFO.email}`}
                      style={{ fontSize: '14px', color: '#5E6E75', textDecoration: 'none' }}
                    >
                      {pageContent.page_contact_email || HOTEL_INFO.email}
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
                src={formatMapEmbedUrl(pageContent.page_home_map_embed || HOTEL_INFO.mapEmbedUrl)}
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
