'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutGrid, List, Search, Filter, Calendar, Sparkles, Check } from 'lucide-react';
import RoomCard from '@/components/RoomCard';
import { ROOMS, Room } from '@/data/hotelData';
import { useBooking } from '@/context/BookingContext';

export default function RoomsPage() {
  const { openBooking } = useBooking();
  const [rooms, setRooms] = useState<Room[]>(ROOMS);
  const [content, setContent] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recommended');

  useEffect(() => {
    async function loadData() {
      try {
        const [roomsRes, contentRes] = await Promise.all([
          fetch('/api/rooms').then((r) => r.json()).catch(() => null),
          fetch('/api/content').then((r) => r.json()).catch(() => null),
        ]);
        if (roomsRes?.success && roomsRes.rooms && roomsRes.rooms.length > 0) {
          setRooms(roomsRes.rooms);
        }
        if (contentRes?.success && contentRes.content) {
          setContent(contentRes.content);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    }
    loadData();
  }, []);

  const categories = ['All', 'Hotel Rooms', 'Suites'];

  const filteredRooms = rooms.filter((room) => {
    const matchesCategory = selectedCategory === 'All' || room.category === selectedCategory;
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.pricePerNight - b.pricePerNight;
    if (sortBy === 'price-high') return b.pricePerNight - a.pricePerNight;
    return 0; // recommended
  });

  const bannerImg = content.page_rooms_hero_image || '/images/BO5A5826-scaled.jpg';

  return (
    <div style={{ paddingTop: 'var(--header-height, 96px)' }}>
      {/* Page Header Banner */}
      <section
        style={{
          backgroundColor: '#0F2A33',
          color: '#FFFFFF',
          padding: '80px 0 60px',
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: `linear-gradient(rgba(15, 42, 51, 0.85), rgba(15, 42, 51, 0.95)), url('${bannerImg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
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
            {content.page_rooms_hero_tag || 'ACCOMMODATIONS AT GRAND ADDIS'}
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(36px, 5vw, 54px)',
              fontWeight: 500,
              marginBottom: '16px',
            }}
          >
            {content.page_rooms_hero_title || 'Our Rooms & Suites'}
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: '#A2B5BD',
              maxWidth: '640px',
              margin: '0 auto 28px',
              lineHeight: '1.7',
            }}
          >
            {content.page_rooms_hero_subtitle || 'Choose from our collection of distinctly designed rooms and suites, each crafted for serene comfort, peaceful sleep, and luxury living.'}
          </p>

          <button
            onClick={() => openBooking()}
            className="btn btn-primary"
            style={{ padding: '12px 30px' }}
          >
            <Calendar size={16} />
            <span>Check Availability & Rates</span>
          </button>
        </div>
      </section>

      {/* Filter and Control Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E1DA',
          padding: '20px 0',
          position: 'sticky',
          top: '72px',
          zIndex: 30,
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: selectedCategory === cat ? '1px solid #E49951' : '1px solid #E2E1DA',
                  backgroundColor: selectedCategory === cat ? '#E49951' : '#FFFFFF',
                  color: selectedCategory === cat ? '#FFFFFF' : '#153D4B',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                color="#838A8D"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px 8px 36px',
                  borderRadius: '6px',
                  border: '1px solid #D5D4CC',
                  fontSize: '13px',
                  width: '180px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #D5D4CC',
                fontSize: '13px',
                color: '#153D4B',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <option value="recommended">Sort: Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>

            {/* Grid / List View Toggle */}
            <div
              style={{
                display: 'flex',
                border: '1px solid #D5D4CC',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                style={{
                  padding: '8px 12px',
                  backgroundColor: viewMode === 'grid' ? '#153D4B' : '#FFFFFF',
                  color: viewMode === 'grid' ? '#FFFFFF' : '#5E6E75',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="List view"
                style={{
                  padding: '8px 12px',
                  backgroundColor: viewMode === 'list' ? '#153D4B' : '#FFFFFF',
                  color: viewMode === 'list' ? '#FFFFFF' : '#5E6E75',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Listing Section */}
      <section className="section-padding bg-light">
        <div className="container">
          {filteredRooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#153D4B', marginBottom: '8px' }}>
                No rooms match your filter
              </h3>
              <p style={{ color: '#838A8D', marginBottom: '20px' }}>
                Try adjusting your search criteria or view all accommodations.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="btn btn-outline"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  viewMode === 'grid' ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
                gap: '28px',
              }}
            >
              {filteredRooms.map((room) => (
                <RoomCard key={room.id} room={room} viewMode={viewMode} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Inclusions Banner */}
      <section className="section-padding bg-white" style={{ borderTop: '1px solid #E2E1DA' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="section-subtitle">COMPLIMENTARY PRIVILEGES</span>
            <h2 className="section-title">Included With Every Stay</h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px',
            }}
          >
            {[
              { title: 'High-Speed Fiber Wi-Fi', desc: 'Seamless connectivity throughout the hotel for business and leisure.' },
              { title: '24-Hour Concierge & Room Service', desc: 'Our dedicated guest services team is available round the clock.' },
              { title: 'Complimentary Mineral Water', desc: 'Fresh bottled mineral water replenished daily in your room.' },
              { title: 'Airport Shuttle Assistance', desc: 'Convenient transfer arrangements to and from Bole Airport.' },
            ].map((feat, idx) => (
              <div
                key={idx}
                style={{
                  padding: '24px',
                  borderRadius: '8px',
                  backgroundColor: '#F7F7F2',
                  border: '1px solid #E8E7DF',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#E49951',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                    }}
                  >
                    ✓
                  </span>
                  <strong style={{ fontSize: '15px', color: '#153D4B' }}>{feat.title}</strong>
                </div>
                <p style={{ fontSize: '13px', color: '#5E6E75', lineHeight: '1.6' }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
