'use client';

import React, { useState, useEffect } from 'react';
import { Check, Send, ThumbsUp, MessageSquare, ArrowRight } from 'lucide-react';
import { TESTIMONIALS } from '@/data/hotelData';
import { useFormSubmit } from '@/hooks/useFormSubmit';

export default function TestimonialsPage() {
  const [reviews, setReviews] = useState(TESTIMONIALS);
  const [content, setContent] = useState<Record<string, string>>({});
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formRoom, setFormRoom] = useState('Deluxe Room');
  const [formRating, setFormRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const { isSubmitting, error, submit } = useFormSubmit();

  useEffect(() => {
    async function loadData() {
      try {
        const [testRes, contentRes] = await Promise.all([
          fetch('/api/testimonials').then((res) => res.json()).catch(() => null),
          fetch('/api/content').then((res) => res.json()).catch(() => null),
        ]);
        if (testRes?.success && testRes.testimonials?.length > 0) {
          setReviews(testRes.testimonials);
        }
        if (contentRes?.success && contentRes.content) {
          setContent(contentRes.content);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submit(
      '/api/testimonials',
      {
        name: formName,
        location: formLocation,
        rating: formRating,
        title: formTitle,
        comment: formComment,
        roomType: formRoom,
      },
      (data) => {
        setSubmittedMessage(
          data?.message || 'Thank you! Your review has been submitted and is awaiting moderation.'
        );
        if (data?.review && data?.status === 'APPROVED') {
          setReviews((prev) => [data.review, ...prev]);
        }
        setSubmitted(true);
        setFormName('');
        setFormLocation('');
        setFormTitle('');
        setFormComment('');
      }
    );
  };

  const bannerImg = content.page_testimonials_hero_image || '/images/BO5A5826-scaled.jpg';

  return (
    <div style={{ paddingTop: 'var(--header-height, 96px)' }}>
      {/* Banner */}
      <section
        style={{
          backgroundColor: '#0F2A33',
          color: '#FFFFFF',
          padding: '80px 0 60px',
          textAlign: 'center',
          backgroundImage: `linear-gradient(rgba(15, 42, 51, 0.85), rgba(15, 42, 51, 0.95)), url('${bannerImg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container">
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '3px', color: '#E49951', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
            {content.page_testimonials_hero_tag || 'VERIFIED GUEST FEEDBACK'}
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 5vw, 54px)', fontWeight: 500, marginBottom: '16px' }}>
            {content.page_testimonials_hero_title || 'What Customers Have To Say'}
          </h1>
          <p style={{ fontSize: '16px', color: '#A2B5BD', maxWidth: '640px', margin: '0 auto', lineHeight: '1.7' }}>
            {content.page_testimonials_hero_subtitle || '99% of guests recommend Grand Addis Hotel. Discover real impressions and stories from our international travelers.'}
          </p>
        </div>
      </section>

      {/* Ratings Overview Bar */}
      <section style={{ backgroundColor: '#F7F7F2', borderBottom: '1px solid #E2E1DA', padding: '32px 0' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-around',
              alignItems: 'center',
              gap: '24px',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '38px', fontFamily: 'var(--font-serif)', fontWeight: 700, color: '#153D4B', lineHeight: '1' }}>
                500+
              </div>
              <span style={{ fontSize: '12px', color: '#838A8D', display: 'block', marginTop: '6px' }}>
                Happy Guests Hosted
              </span>
            </div>

            <div>
              <div style={{ fontSize: '38px', fontFamily: 'var(--font-serif)', fontWeight: 700, color: '#E49951', lineHeight: '1' }}>
                99%
              </div>
              <span style={{ fontSize: '12px', color: '#838A8D', display: 'block', marginTop: '6px' }}>
                Recommendation Rate
              </span>
            </div>

            <div>
              <div style={{ fontSize: '38px', fontFamily: 'var(--font-serif)', fontWeight: 700, color: '#153D4B', lineHeight: '1' }}>
                100%
              </div>
              <span style={{ fontSize: '12px', color: '#838A8D', display: 'block', marginTop: '6px' }}>
                Verified Stays
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="section-padding bg-light">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', marginBottom: '64px' }}>
            {reviews.map((t) => (
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#E49951', fontWeight: 600 }}>Verified Guest</span>
                  <span style={{ fontSize: '11px', color: '#838A8D' }}>{t.date}</span>
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#153D4B', marginBottom: '10px' }}>
                  “{t.title}”
                </h3>

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

          {/* Review Submission Form */}
          <div style={{ maxWidth: '680px', margin: '0 auto', backgroundColor: '#FFFFFF', padding: '36px', borderRadius: '16px', border: '1px solid #E2E1DA', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#153D4B', marginBottom: '8px' }}>
              Leave Your Review
            </h3>
            <p style={{ fontSize: '14px', color: '#5E6E75', marginBottom: '24px' }}>
              Have you stayed at Grand Addis Hotel? Share your experience with future guests.
            </p>

            {submitted ? (
              <div style={{ padding: '20px', backgroundColor: '#ECFDF5', color: '#047857', borderRadius: '8px', textAlign: 'center', fontSize: '14px', lineHeight: '1.6' }}>
                <Check size={22} style={{ margin: '0 auto 8px', color: '#10B981' }} />
                <strong>Thank you!</strong>
                <p style={{ margin: '4px 0 0', color: '#065F46' }}>
                  {submittedMessage || 'Your review has been submitted and is awaiting moderation before appearing on the site.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Michael Smith"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      City / Country *
                    </label>
                    <input
                      type="text"
                      required
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="e.g. Frankfurt, Germany"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Room Stayed In *
                    </label>
                    <select
                      value={formRoom}
                      onChange={(e) => setFormRoom(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    >
                      <option value="Deluxe Room">Deluxe Room</option>
                      <option value="Deluxe Twin Room">Deluxe Twin Room</option>
                      <option value="Standard Room">Standard Room</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Star Rating *
                    </label>
                    <select
                      value={formRating}
                      onChange={(e) => setFormRating(Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    >
                      <option value={5}>★★★★★ (5/5 Exceptional)</option>
                      <option value={4}>★★★★☆ (4/5 Very Good)</option>
                      <option value={3}>★★★☆☆ (3/5 Average)</option>
                      <option value={2}>★★☆☆☆ (2/5 Fair)</option>
                      <option value={1}>★☆☆☆☆ (1/5 Poor)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                    Headline / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Fantastic stay, will definitely come back!"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                    Your Review *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Tell us about the room, food, staff, and overall ambiance..."
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    style={{
                      padding: '12px 16px',
                      marginBottom: '16px',
                      borderRadius: '8px',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#B91C1C',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      textAlign: 'center',
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ width: '100%', opacity: isSubmitting ? 0.6 : 1 }}
                >
                  <Send size={15} /> {isSubmitting ? 'Submitting...' : 'Submit Your Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
