'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, HelpCircle, Phone, Mail, ArrowRight } from 'lucide-react';
import { FAQS, HOTEL_INFO, FAQItem } from '@/data/hotelData';

export default function FAQsPage() {
  const [faqsList, setFaqsList] = useState<FAQItem[]>(FAQS);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    async function loadPostgresFaqs() {
      try {
        const res = await fetch('/api/faqs');
        const data = await res.json();
        if (data.success && data.faqs && data.faqs.length > 0) {
          setFaqsList(
            data.faqs.map((f: any) => ({
              question: f.question,
              answer: f.answer,
              category: f.category,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load FAQs from PostgreSQL:', err);
      }
    }
    loadPostgresFaqs();
  }, []);

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'reservations', label: 'Reservations' },
    { id: 'checkin', label: 'Check-in & Check-out' },
    { id: 'payment', label: 'Payment & Cancellation' },
    { id: 'services', label: 'Hotel Services' },
  ];

  const filteredFaqs = faqsList.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
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
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 5vw, 54px)', fontWeight: 500, marginBottom: '16px' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: '16px', color: '#A2B5BD', maxWidth: '640px', margin: '0 auto', lineHeight: '1.7' }}>
            Find immediate answers about reservations, airport transfers, amenities, and hotel policies.
          </p>
        </div>
      </section>

      {/* Search & Categories Bar */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E1DA', padding: '24px 0' }}>
        <div className="container">
          <div style={{ maxWidth: '600px', margin: '0 auto 20px', position: 'relative' }}>
            <Search size={18} color="#838A8D" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search frequently asked questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 46px',
                borderRadius: '8px',
                border: '1px solid #D5D4CC',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  border: activeCategory === c.id ? '1px solid #E49951' : '1px solid #E2E1DA',
                  backgroundColor: activeCategory === c.id ? '#E49951' : '#FFFFFF',
                  color: activeCategory === c.id ? '#FFFFFF' : '#153D4B',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accordion List */}
      <section className="section-padding bg-light">
        <div className="container" style={{ maxWidth: '840px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #E2E1DA',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <button
                    onClick={() => toggle(idx)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#153D4B' }}>
                      {faq.question}
                    </span>
                    <span
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                        color: '#E49951',
                        flexShrink: 0,
                        marginLeft: '12px',
                      }}
                    >
                      <ChevronDown size={20} />
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 24px 24px',
                        fontSize: '14px',
                        lineHeight: '1.7',
                        color: '#5E6E75',
                        borderTop: '1px solid #F1F1EB',
                        paddingTop: '16px',
                      }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Need More Assistance Banner */}
          <div
            style={{
              marginTop: '56px',
              backgroundColor: '#0F2A33',
              color: '#FFFFFF',
              padding: '36px',
              borderRadius: '16px',
              textAlign: 'center',
            }}
          >
            <HelpCircle size={32} color="#E49951" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', marginBottom: '8px' }}>
              Still have a question?
            </h3>
            <p style={{ color: '#A2B5BD', fontSize: '14px', maxWidth: '480px', margin: '0 auto 20px' }}>
              Our front desk concierge is available 24 hours a day to assist you with all inquiries.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <a href={`tel:${HOTEL_INFO.phone}`} className="btn btn-primary">
                <Phone size={15} /> Call {HOTEL_INFO.phone}
              </a>
              <Link href="/contact" className="btn btn-outline-white">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
