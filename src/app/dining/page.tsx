'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Utensils,
  Clock,
  Calendar,
  Users,
  Check,
  Phone,
  Sparkles,
  Coffee,
  X,
  Send,
  ArrowRight,
} from 'lucide-react';
import { DINING_MENUS, HOTEL_INFO, MenuItem } from '@/data/hotelData';
import { useCurrency } from '@/context/CurrencyContext';

export default function DiningPage() {
  const { formatPrice } = useCurrency();
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DINING_MENUS);
  const [activeTab, setActiveTab] = useState<'all' | 'starter' | 'main' | 'ethiopian' | 'dessert' | 'beverage'>('all');
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableDate, setTableDate] = useState('');
  const [tableTime, setTableTime] = useState('19:30');
  const [partySize, setPartySize] = useState(2);
  const [resName, setResName] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resEmail, setResEmail] = useState('');
  const [resNotes, setResNotes] = useState('');
  const [tableConfirmed, setTableConfirmed] = useState(false);

  useEffect(() => {
    async function loadPostgresMenu() {
      try {
        const res = await fetch('/api/menu');
        const data = await res.json();
        if (data.success && data.items && data.items.length > 0) {
          setMenuItems(
            data.items.map((it: any) => ({
              name: it.name,
              category: it.category,
              price: Number(it.price),
              description: it.description,
              tag: it.tag || undefined,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load menu from PostgreSQL:', err);
      }
    }
    loadPostgresMenu();
  }, []);

  const tabs = [
    { id: 'all', label: 'Complete Menu' },
    { id: 'starter', label: 'Starters' },
    { id: 'main', label: 'Mains' },
    { id: 'ethiopian', label: 'Ethiopian Specialties' },
    { id: 'dessert', label: 'Desserts' },
    { id: 'beverage', label: 'Beverages & Coffee' },
  ];

  const filteredItems = menuItems.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  const handleTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/dining-reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: tableDate,
          time: tableTime,
          partySize,
          name: resName,
          phone: resPhone,
          email: resEmail,
          notes: resNotes,
        }),
      });
    } catch (err) {
      console.error('Table reservation error:', err);
    }
    setTableConfirmed(true);
  };

  return (
    <div style={{ paddingTop: '84px' }}>
      {/* Banner */}
      <section
        style={{
          position: 'relative',
          padding: '100px 0 70px',
          backgroundImage: `linear-gradient(rgba(15, 42, 51, 0.85), rgba(15, 42, 51, 0.95)), url('/images/BO5A5957-scaled.jpg')`,
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
            FINEST RESTAURANTS & BARS
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 500,
              marginBottom: '18px',
            }}
          >
            Dining & Culinary Journeys
          </h1>
          <p
            style={{
              fontSize: '17px',
              color: '#A2B5BD',
              maxWidth: '680px',
              margin: '0 auto 32px',
              lineHeight: '1.7',
            }}
          >
            Enjoy an exquisite variety of dining options from around the world alongside rich authentic Ethiopian culinary heritage.
          </p>

          <button
            onClick={() => setIsTableModalOpen(true)}
            className="btn btn-primary"
            style={{ padding: '14px 36px' }}
          >
            <Utensils size={16} />
            <span>Reserve a Table</span>
          </button>
        </div>
      </section>

      {/* Operating Hours Info */}
      <section style={{ backgroundColor: '#F7F7F2', borderBottom: '1px solid #E2E1DA', padding: '28px 0' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px',
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#E49951', fontWeight: 600, display: 'block' }}>
                BREAKFAST BUFFET
              </span>
              <strong style={{ fontSize: '15px', color: '#153D4B' }}>06:30 – 10:30 Daily</strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#E49951', fontWeight: 600, display: 'block' }}>
                LUNCH SERVICE
              </span>
              <strong style={{ fontSize: '15px', color: '#153D4B' }}>12:00 – 15:30 Daily</strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#E49951', fontWeight: 600, display: 'block' }}>
                DINNER & FINE DINING
              </span>
              <strong style={{ fontSize: '15px', color: '#153D4B' }}>18:30 – 22:30 Daily</strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#E49951', fontWeight: 600, display: 'block' }}>
                LOUNGE & IN-ROOM DINING
              </span>
              <strong style={{ fontSize: '15px', color: '#153D4B' }}>24 Hours Round The Clock</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="section-padding">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="section-subtitle">A TASTE OF PERFECTION</span>
            <h2 className="section-title">Our Restaurant Menu</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Handcrafted dishes prepared with fresh regional produce, highland Ethiopian spices, and international culinary finesse.
            </p>
          </div>

          {/* Menu Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '48px',
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: activeTab === tab.id ? '1px solid #E49951' : '1px solid #E2E1DA',
                  backgroundColor: activeTab === tab.id ? '#E49951' : '#FFFFFF',
                  color: activeTab === tab.id ? '#FFFFFF' : '#153D4B',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '24px',
            }}
          >
            {filteredItems.map((item, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E1DA',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: 'var(--shadow-sm)',
                }}
                className="menu-card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '19px', fontWeight: 600, color: '#153D4B' }}>
                    {item.name}
                  </h3>
                  <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#E49951' }}>
                      {formatPrice(item.price).primary}
                    </div>
                  </div>
                </div>

                {item.tag && (
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: 600,
                      backgroundColor: 'rgba(228, 153, 81, 0.12)',
                      color: '#E49951',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      marginBottom: '10px',
                    }}
                  >
                    {item.tag}
                  </span>
                )}

                <p style={{ fontSize: '14px', lineHeight: '1.65', color: '#5E6E75', flex: 1 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <button onClick={() => setIsTableModalOpen(true)} className="btn btn-primary btn-lg">
              <Calendar size={18} />
              <span>Book Table for Breakfast, Lunch or Dinner</span>
            </button>
          </div>
        </div>

        <style jsx>{`
          .menu-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-md) !important;
            border-color: #E49951 !important;
          }
        `}</style>
      </section>

      {/* TABLE RESERVATION MODAL */}
      {isTableModalOpen && (
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
            onClick={() => setIsTableModalOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(9, 25, 31, 0.8)',
              backdropFilter: 'blur(6px)',
            }}
          />

          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#E49951', fontWeight: 600 }}>
                  GRAND ADDIS RESTAURANT
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#153D4B' }}>
                  Reserve Your Table
                </h3>
              </div>

              <button
                onClick={() => setIsTableModalOpen(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#F7F7F2',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {tableConfirmed ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#ECFDF5',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Check size={32} />
                </div>
                <h4 style={{ fontSize: '20px', fontWeight: 600, color: '#153D4B', marginBottom: '8px' }}>
                  Table Reserved!
                </h4>
                <p style={{ fontSize: '14px', color: '#5E6E75', marginBottom: '20px' }}>
                  Thank you, <strong>{resName}</strong>. Your table for <strong>{partySize} guests</strong> has been reserved for <strong>{tableDate || 'today'} at {tableTime}</strong>. A confirmation has been sent to {resEmail}.
                </p>
                <button
                  onClick={() => {
                    setIsTableModalOpen(false);
                    setTableConfirmed(false);
                  }}
                  className="btn btn-primary"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleTableSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={tableDate}
                      onChange={(e) => setTableDate(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Time *
                    </label>
                    <select
                      value={tableTime}
                      onChange={(e) => setTableTime(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    >
                      <option value="07:30">07:30 (Breakfast)</option>
                      <option value="09:00">09:00 (Breakfast)</option>
                      <option value="12:30">12:30 (Lunch)</option>
                      <option value="13:30">13:30 (Lunch)</option>
                      <option value="18:30">18:30 (Dinner)</option>
                      <option value="19:30">19:30 (Dinner)</option>
                      <option value="20:30">20:30 (Dinner)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                    Party Size *
                  </label>
                  <select
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, '9+'].map((num) => (
                      <option key={num} value={num}>
                        {num} Guests
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={resName}
                      onChange={(e) => setResName(e.target.value)}
                      placeholder="Jane Doe"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={resPhone}
                      onChange={(e) => setResPhone(e.target.value)}
                      placeholder="+251..."
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={resEmail}
                    onChange={(e) => setResEmail(e.target.value)}
                    placeholder="jane@example.com"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                    Dietary Notes / Special Requests (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={resNotes}
                    onChange={(e) => setResNotes(e.target.value)}
                    placeholder="Vegetarian, birthday celebration, quiet corner..."
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsTableModalOpen(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Confirm Table Reservation
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
