'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Camera, Eye, ArrowRight } from 'lucide-react';
import GalleryLightbox from '@/components/GalleryLightbox';
import { GALLERY_IMAGES } from '@/data/hotelData';

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const categories = [
    { id: 'all', label: 'All Photos' },
    { id: 'rooms', label: 'Rooms & Suites' },
    { id: 'dining', label: 'Restaurants & Bar' },
    { id: 'wellness', label: 'Wellness & Spa' },
    { id: 'events', label: 'Conferences & Events' },
    { id: 'hotel', label: 'Hotel & Grounds' },
  ];

  const filteredImages = GALLERY_IMAGES.filter((img) => {
    if (activeCategory === 'all') return true;
    return img.category === activeCategory;
  });

  const handleOpenLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
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
            VISUAL IMMERSION
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(36px, 5vw, 54px)',
              fontWeight: 500,
              marginBottom: '16px',
            }}
          >
            Photo Gallery
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: '#A2B5BD',
              maxWidth: '620px',
              margin: '0 auto',
              lineHeight: '1.7',
            }}
          >
            Take a visual tour through Grand Addis Hotel. From bespoke suites to tranquil spa spaces and savory culinary creations.
          </p>
        </div>
      </section>

      {/* Filter Tabs Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E1DA',
          padding: '20px 0',
          position: 'sticky',
          top: '72px',
          zIndex: 30,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              style={{
                padding: '8px 20px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 500,
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

      {/* Image Grid */}
      <section className="section-padding bg-light">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {filteredImages.map((img, idx) => (
              <div
                key={idx}
                onClick={() => handleOpenLightbox(idx)}
                style={{
                  position: 'relative',
                  height: '280px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  backgroundColor: '#0F2A33',
                  boxShadow: 'var(--shadow-sm)',
                }}
                className="gallery-grid-item"
              >
                <img
                  src={img.src}
                  alt={img.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease',
                  }}
                  className="gallery-grid-img"
                />

                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(15, 42, 51, 0.55)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '24px',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  }}
                  className="gallery-grid-overlay"
                >
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#E49951',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: 600,
                    }}
                  >
                    {img.category}
                  </span>
                  <h4 style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 600 }}>{img.title}</h4>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#E49951',
                      fontSize: '12px',
                      marginTop: '8px',
                    }}
                  >
                    <Eye size={14} /> Click to expand
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .gallery-grid-item:hover .gallery-grid-img {
            transform: scale(1.06);
          }
          .gallery-grid-item:hover .gallery-grid-overlay {
            opacity: 1 !important;
          }
        `}</style>
      </section>

      {/* Lightbox */}
      <GalleryLightbox
        images={filteredImages}
        currentIndex={currentIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(idx) => setCurrentIndex(idx)}
      />
    </div>
  );
}
