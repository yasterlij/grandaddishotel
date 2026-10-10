'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Clock,
  Sparkles,
  Coffee,
  Check,
  Send,
  Calendar,
  X,
  ArrowRight,
} from 'lucide-react';
import { EXPERIENCES } from '@/data/hotelData';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { getTodayDateStr } from '@/lib/dates';

export default function ExperiencesPage() {
  const [experiencesList, setExperiencesList] = useState<any[]>(EXPERIENCES);
  const [content, setContent] = useState<Record<string, string>>({});
  const [selectedExp, setSelectedExp] = useState<string | null>(null);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryDate, setInquiryDate] = useState('');
  const [guestsCount, setGuestsCount] = useState<number | string>(2);
  const [inquirySent, setInquirySent] = useState(false);
  const { isSubmitting, error, submit, clearError } = useFormSubmit();

  useEffect(() => {
    async function loadData() {
      try {
        const [expRes, contentRes] = await Promise.all([
          fetch('/api/experiences').then((r) => r.json()).catch(() => null),
          fetch('/api/content').then((r) => r.json()).catch(() => null),
        ]);
        if (expRes?.success && Array.isArray(expRes.experiences) && expRes.experiences.length > 0) {
          setExperiencesList(expRes.experiences);
        }
        if (contentRes?.success && contentRes.content) {
          setContent(contentRes.content);
        }
      } catch (err) {
        console.error('Error loading experiences:', err);
      }
    }
    loadData();
  }, []);

  const activeExp = experiencesList.find((e) => e.id === selectedExp);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submit('/api/contact', {
      name: inquiryName,
      email: inquiryEmail,
      subject: `Experience Booking: ${activeExp?.title || 'Custom Experience'}`,
      message: `Experience: ${activeExp?.title || 'Custom Experience'} | Preferred Date: ${inquiryDate} | Participants: ${guestsCount}`,
    });
    if (ok) setInquirySent(true);
  };

  const bannerImg = content.page_experiences_hero_image || '/images/BO5A5779-scaled.jpg';

  return (
    <div style={{ paddingTop: 'var(--header-height, 96px)' }}>
      {/* Banner */}
      <section
        style={{
          position: 'relative',
          padding: '100px 0 70px',
          backgroundImage: `linear-gradient(rgba(15, 42, 51, 0.85), rgba(15, 42, 51, 0.95)), url('${bannerImg}')`,
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
            {content.page_experiences_hero_tag || 'DISCOVER ETHIOPIA'}
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 500,
              marginBottom: '18px',
            }}
          >
            {content.page_experiences_hero_title || 'Unforgettable Experiences'}
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
            {content.page_experiences_hero_subtitle ||
              'Here’s where memories are truly made. Mindfully curated journeys into the heart, heritage, and soul of Addis Ababa.'}
          </p>
        </div>
      </section>

      {/* Experiences Grid */}
      <section className="section-padding bg-light">
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {experiencesList.map((exp, idx) => {
              const isEven = idx % 2 === 1;
              return (
                <div
                  key={exp.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E1DA',
                    overflow: 'hidden',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  {/* Photo */}
                  <div
                    style={{
                      height: '380px',
                      position: 'relative',
                      order: isEven ? 2 : 1,
                    }}
                  >
                    <img
                      src={exp.image}
                      alt={exp.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '18px',
                        left: '18px',
                        backgroundColor: 'rgba(15, 42, 51, 0.85)',
                        color: '#E49951',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      {exp.category}
                    </div>
                  </div>

                  {/* Details */}
                  <div
                    style={{
                      padding: '40px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      order: isEven ? 1 : 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#838A8D', marginBottom: '8px' }}>
                      <Clock size={14} color="#E49951" />
                      <span>{exp.duration}</span>
                    </div>

                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: '#153D4B', marginBottom: '8px' }}>
                      {exp.title}
                    </h2>

                    <p style={{ fontSize: '14px', fontStyle: 'italic', color: '#E49951', marginBottom: '16px' }}>
                      {exp.subtitle}
                    </p>

                    <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#5E6E75', marginBottom: '24px' }}>
                      {exp.description}
                    </p>

                    <div style={{ marginBottom: '28px' }}>
                      <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#153D4B', fontWeight: 600, marginBottom: '10px' }}>
                        Experience Highlights:
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {(exp.highlights || []).map((h: string, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#153D4B' }}>
                            <Check size={14} color="#E49951" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => setSelectedExp(exp.id)}
                        className="btn btn-primary"
                        style={{ padding: '12px 28px' }}
                      >
                        <Calendar size={16} />
                        <span>Book This Experience</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Experience Booking Modal */}
      {selectedExp && activeExp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={() => {
              setSelectedExp(null);
              setInquirySent(false);
            }}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(9, 25, 31, 0.8)', backdropFilter: 'blur(6px)' }}
          />

          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#E49951', fontWeight: 600 }}>
                  EXPERIENCE RESERVATION
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: '#153D4B' }}>
                  {activeExp.title}
                </h3>
              </div>

              <button
                onClick={() => {
                  setSelectedExp(null);
                  setInquirySent(false);
                }}
                style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F7F7F2', border: 'none', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {inquirySent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#ECFDF5',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Check size={28} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#153D4B', marginBottom: '8px' }}>
                  Inquiry Dispatched!
                </h4>
                <p style={{ fontSize: '14px', color: '#5E6E75', marginBottom: '20px' }}>
                  Our hospitality concierge will contact you at <strong>{inquiryEmail}</strong> to finalize details.
                </p>
                <button
                  onClick={() => {
                    setSelectedExp(null);
                    setInquirySent(false);
                    clearError();
                  }}
                  className="btn btn-primary"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={getTodayDateStr()}
                      value={inquiryDate}
                      onChange={(e) => setInquiryDate(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Number of Participants *
                    </label>
                    <select
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    >
                      {[1, 2, 3, 4, 5, 6, '7+ Private Group'].map((n) => (
                        <option key={n} value={n}>
                          {n} Guests
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="Jane Doe"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      placeholder="jane@example.com"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    style={{
                      padding: '10px 14px',
                      marginBottom: '16px',
                      borderRadius: '6px',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#B91C1C',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      textAlign: 'center',
                    }}
                  >
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExp(null);
                      clearError();
                    }}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{ opacity: isSubmitting ? 0.6 : 1 }}
                  >
                    <Send size={14} /> {isSubmitting ? 'Sending Request...' : 'Send Booking Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
