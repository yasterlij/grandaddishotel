'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Award,
  ShieldCheck,
  Heart,
  Users,
  Compass,
  CheckCircle2,
  Calendar,
  Sparkles,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { HOTEL_INFO } from '@/data/hotelData';
import { useBooking } from '@/context/BookingContext';

export default function AboutPage() {
  const { openBooking } = useBooking();

  const timeline = [
    { year: '1983', title: 'Foundational Vision', desc: 'The heritage began with a passion for bringing modern luxury hospitality to the diplomatic capital of Africa.' },
    { year: '2005', title: 'First Expansion', desc: 'Expanded banquet facilities and introduced dedicated corporate business lounges.' },
    { year: '2010', title: 'Boutique Modernization', desc: 'Comprehensive architectural renovation to blend authentic Ethiopian woodwork with contemporary comforts.' },
    { year: '2020', title: 'Thermal Wellness Addition', desc: 'Inaugurated our tranquil hydrothermal spa and rooftop health center.' },
    { year: '2024', title: 'Luxury Standard Renovation', desc: 'Complete guestroom redesign with enhanced soundproofing, high-speed fiber internet, and luxury marble baths.' },
    { year: '2026', title: 'Grand Addis Today', desc: 'Recognized as one of the premier luxury destinations in Addis Ababa for business and leisure travelers alike.' },
  ];

  const reasons = [
    { title: 'World-Class Amenities', desc: 'High-speed fiber Wi-Fi, 24-hour room service, wellness thermal spa, and airport VIP shuttle.' },
    { title: 'Luxurious Rooms', desc: 'Distinctly designed spaces with plush bedding, rain showers, and serene views of Addis Ababa.' },
    { title: 'Central Location', desc: 'Situated at 22 Around Golagul, just 10 minutes from Bole International Airport and major embassies.' },
    { title: 'Dedicated Concierge', desc: 'Round-the-clock personalized service to curate tours, transportation, and special requests.' },
    { title: 'Packages & Cultural Tours', desc: 'Traditional Ethiopian coffee ceremonies, city excursions, and culinary masterclasses.' },
    { title: 'Exceptional Value', desc: 'Unbeatable direct booking rates with complimentary breakfast, zero hidden fees, and member discounts.' },
  ];

  return (
    <div style={{ paddingTop: '84px' }}>
      {/* Banner */}
      <section
        style={{
          backgroundColor: '#0F2A33',
          color: '#FFFFFF',
          padding: '100px 0 70px',
          textAlign: 'center',
          backgroundImage: `linear-gradient(rgba(15, 42, 51, 0.85), rgba(15, 42, 51, 0.95)), url('/images/BO5A5779-scaled.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container">
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', color: '#E49951', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
            OUR STORY & HERITAGE
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 500, marginBottom: '18px' }}>
            A Place Of Heart, Your Home Away
          </h1>
          <p style={{ fontSize: '17px', color: '#A2B5BD', maxWidth: '680px', margin: '0 auto', lineHeight: '1.7' }}>
            Welcome to our oasis of luxury and tranquility in Addis Ababa, where every aspect of your stay is meticulously crafted to exceed your expectations.
          </p>
        </div>
      </section>

      {/* Story Narrative */}
      <section className="section-padding bg-light">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '56px', alignItems: 'center' }}>
            <div>
              <span className="section-subtitle">THE GRAND ADDIS PHILOSOPHY</span>
              <h2 className="section-title">Where Tradition Meets Contemporary Elegance</h2>
              <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#5E6E75', marginBottom: '20px' }}>
                At Grand Addis Hotel, we believe hospitality is more than comfortable rooms—it is about creating an authentic sense of belonging. Nestled in 22 Around Golagul, we provide a peaceful sanctuary amidst the vibrant pulse of Addis Ababa.
              </p>
              <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#5E6E75', marginBottom: '32px' }}>
                Immerse yourself in understated elegance, top-notch service, expertly crafted cocktails, exquisite international and Ethiopian cuisine, and soothing wellness therapies.
              </p>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <button onClick={() => openBooking()} className="btn btn-primary">
                  <Calendar size={16} /> Book Your Stay
                </button>
                <Link href="/contact" className="btn btn-outline">
                  Contact Reception
                </Link>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative', height: '420px', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                <Image
                  src="/images/BO5A5821-scaled.jpg"
                  alt="Interior Details"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  loading="lazy"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Heritage Timeline */}
      <section className="section-padding bg-white" style={{ borderTop: '1px solid #E2E1DA' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span className="section-subtitle">OUR JOURNEY</span>
            <h2 className="section-title">Milestones Through The Decades</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              A enduring commitment to refined hospitality in Ethiopia.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {timeline.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#F7F7F2',
                  padding: '30px',
                  borderRadius: '12px',
                  border: '1px solid #E2E1DA',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, color: '#E49951', marginBottom: '10px' }}>
                  {item.year}
                </div>
                <h4 style={{ fontSize: '17px', fontWeight: 600, color: '#153D4B', marginBottom: '8px' }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#5E6E75' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding bg-dark">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span className="section-subtitle">YOUR HAPPINESS GUARANTEED</span>
            <h2 className="section-title">Why Choose Grand Addis Hotel</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Whether you are seeking total relaxation, productive corporate stays, or cultural discovery.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '28px',
            }}
          >
            {reasons.map((r, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'var(--surface-dark-card)',
                  padding: '30px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <CheckCircle2 size={20} color="#E49951" />
                  <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>{r.title}</h4>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-on-dark-muted)' }}>
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
