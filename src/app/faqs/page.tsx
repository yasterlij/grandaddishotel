'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Sparkles,
  Calendar,
  CreditCard,
  Wifi,
  Clock,
  Check,
} from 'lucide-react';
import { HOTEL_INFO } from '@/data/hotelData';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
}

const CATEGORIES = [
  { id: 'all', label: 'All Questions', icon: HelpCircle },
  { id: 'reservations', label: 'Reservations & Booking', icon: Calendar },
  { id: 'checkin', label: 'Check-In & Check-Out', icon: Clock },
  { id: 'services', label: 'Hotel Services & Wi-Fi', icon: Wifi },
  { id: 'payment', label: 'Payment & Rates', icon: CreditCard },
];

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [content, setContent] = useState<Record<string, string>>({
    page_faqs_hero_tag: 'FREQUENTLY ASKED QUESTIONS',
    page_faqs_hero_title: 'Everything You Need To Know',
    page_faqs_hero_subtitle:
      'Answers to commonly asked questions about booking, check-in, amenities, dining, and your stay at Grand Addis Hotel.',
    page_faqs_hero_image: '/images/BO5A5779-scaled.jpg',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [faqsRes, contentRes] = await Promise.all([
          fetch('/api/faqs').then((r) => r.json()),
          fetch('/api/content').then((r) => r.json()),
        ]);

        if (faqsRes?.success && Array.isArray(faqsRes.faqs)) {
          setFaqs(faqsRes.faqs);
          // Open the first two FAQs by default
          if (faqsRes.faqs.length > 0) {
            setOpenIds({
              [faqsRes.faqs[0].id]: true,
              ...(faqsRes.faqs[1] ? { [faqsRes.faqs[1].id]: true } : {}),
            });
          }
        }
        if (contentRes?.success && contentRes.content) {
          setContent((prev) => ({ ...prev, ...contentRes.content }));
        }
      } catch (err) {
        console.error('Error loading FAQs page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleFaq = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      activeCategory === 'all' ||
      faq.category?.toLowerCase() === activeCategory.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const phone = content.page_contact_phone || content.hotel_phone || HOTEL_INFO.phone;
  const emailAddr = content.page_contact_email || content.hotel_email || HOTEL_INFO.email;

  return (
    <div style={{ backgroundColor: '#FAF9F5', minHeight: '100vh', color: '#153D4B' }}>
      {/* Hero Banner */}
      <section
        style={{
          position: 'relative',
          padding: '160px 0 90px',
          backgroundColor: '#0F2A33',
          color: '#FFFFFF',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        <Image
          src={content.page_faqs_hero_image || '/images/BO5A5779-scaled.jpg'}
          alt="Grand Addis Hotel"
          fill
          priority
          style={{ objectFit: 'cover', opacity: 0.35 }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(15, 42, 51, 0.7) 0%, rgba(15, 42, 51, 0.95) 100%)',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '820px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(228, 153, 81, 0.15)',
              border: '1px solid rgba(228, 153, 81, 0.4)',
              borderRadius: '20px',
              padding: '6px 16px',
              marginBottom: '18px',
            }}
          >
            <HelpCircle size={15} color="#E49951" />
            <span
              style={{
                color: '#E49951',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              {content.page_faqs_hero_tag || 'FREQUENTLY ASKED QUESTIONS'}
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(32px, 4.5vw, 54px)',
              fontWeight: 500,
              lineHeight: 1.2,
              marginBottom: '20px',
            }}
          >
            {content.page_faqs_hero_title || 'Everything You Need To Know'}
          </h1>

          <p
            style={{
              fontSize: '16px',
              color: '#A2B5BD',
              lineHeight: 1.7,
              maxWidth: '680px',
              margin: '0 auto 32px',
            }}
          >
            {content.page_faqs_hero_subtitle ||
              'Find quick answers regarding direct bookings, check-in policies, shuttle services, and premium amenities at Grand Addis Hotel.'}
          </p>

          {/* Search Box inside Hero */}
          <div
            style={{
              maxWidth: '540px',
              margin: '0 auto',
              position: 'relative',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <input
              type="text"
              placeholder="Search questions or keywords (e.g., wifi, check-in, shuttle)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 48px 16px 20px',
                fontSize: '15px',
                border: 'none',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                color: '#153D4B',
              }}
            />
            <Search
              size={20}
              color="#838A8D"
              style={{
                position: 'absolute',
                right: '18px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section style={{ padding: '60px 0 90px' }}>
        <div className="container" style={{ maxWidth: '920px' }}>
          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              justifyContent: 'center',
              marginBottom: '40px',
            }}
          >
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '24px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    border: isActive
                      ? '1px solid #E49951'
                      : '1px solid rgba(21, 61, 75, 0.15)',
                    backgroundColor: isActive ? '#E49951' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#153D4B',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(228, 153, 81, 0.25)' : 'none',
                  }}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Filter Notice if searching */}
          {searchQuery && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                backgroundColor: 'rgba(228, 153, 81, 0.1)',
                border: '1px solid rgba(228, 153, 81, 0.3)',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '13px',
              }}
            >
              <span>
                Showing results for &ldquo;<strong>{searchQuery}</strong>&rdquo; ({filteredFaqs.length} found)
              </span>
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#E49951',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Clear Search
              </button>
            </div>
          )}

          {/* FAQ Accordion List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#838A8D' }}>
              <p>Loading questions and answers...</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 24px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E1DA',
              }}
            >
              <HelpCircle size={44} color="#A2B5BD" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', color: '#153D4B', marginBottom: '8px' }}>
                No matching questions found
              </h3>
              <p style={{ fontSize: '14px', color: '#838A8D', maxWidth: '440px', margin: '0 auto 20px' }}>
                We couldn&apos;t find an answer matching your query. Our reservations concierge is available 24/7 to assist.
              </p>
              <Link
                href="/contact"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <span>Ask A Question</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredFaqs.map((faq) => {
                const isOpen = Boolean(openIds[faq.id]);
                return (
                  <div
                    key={faq.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      border: isOpen
                        ? '1px solid #E49951'
                        : '1px solid #E2E1DA',
                      boxShadow: isOpen
                        ? '0 6px 20px rgba(228, 153, 81, 0.08)'
                        : '0 2px 6px rgba(0,0,0,0.02)',
                      transition: 'all 0.25s ease',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      aria-expanded={isOpen}
                      style={{
                        width: '100%',
                        padding: '22px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: isOpen ? '#E49951' : 'rgba(21, 61, 75, 0.06)',
                            color: isOpen ? '#FFFFFF' : '#153D4B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.2s',
                          }}
                        >
                          <HelpCircle size={16} />
                        </div>
                        <div>
                          <span
                            style={{
                              fontSize: '16px',
                              fontWeight: 600,
                              color: isOpen ? '#153D4B' : '#153D4B',
                              lineHeight: 1.4,
                              display: 'block',
                            }}
                          >
                            {faq.question}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#E49951',
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                              fontWeight: 600,
                              marginTop: '2px',
                              display: 'inline-block',
                            }}
                          >
                            {faq.category}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.25s ease',
                          color: isOpen ? '#E49951' : '#838A8D',
                          flexShrink: 0,
                        }}
                      >
                        <ChevronDown size={20} />
                      </div>
                    </button>

                    {isOpen && (
                      <div
                        style={{
                          padding: '0 24px 24px 70px',
                          borderTop: '1px solid rgba(226, 225, 218, 0.5)',
                          paddingTop: '16px',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '15px',
                            lineHeight: 1.7,
                            color: '#4B5563',
                            margin: 0,
                          }}
                        >
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Still Have Questions CTA Card */}
          <div
            style={{
              marginTop: '60px',
              backgroundColor: '#0F2A33',
              borderRadius: '14px',
              padding: '40px',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(15, 42, 51, 0.25)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #E49951 0%, #CD8948 50%, #E49951 100%)',
              }}
            />

            <Sparkles size={28} color="#E49951" style={{ marginBottom: '14px' }} />
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '28px',
                fontWeight: 500,
                marginBottom: '10px',
              }}
            >
              Still Have Questions?
            </h3>
            <p
              style={{
                fontSize: '15px',
                color: '#A2B5BD',
                maxWidth: '540px',
                lineHeight: 1.6,
                marginBottom: '28px',
              }}
            >
              Our front desk and concierge team is available around the clock to assist you with room inquiries, airport transfers, corporate bookings, and special requests.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '14px',
              }}
            >
              <a
                href={`tel:${phone}`}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                }}
              >
                <Phone size={16} />
                <span>Call {phone}</span>
              </a>

              <Link
                href="/contact"
                className="btn btn-outline"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderColor: 'rgba(255,255,255,0.25)',
                  color: '#FFFFFF',
                }}
              >
                <Mail size={16} />
                <span>Send An Inquiry</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
