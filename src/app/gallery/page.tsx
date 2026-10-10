'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Camera, Eye, ArrowRight } from 'lucide-react';
import GalleryLightbox from '@/components/GalleryLightbox';
import { GALLERY_IMAGES } from '@/data/hotelData';

export default function GalleryPage() {
  const [images, setImages] = useState<any[]>(GALLERY_IMAGES);
  const [content, setContent] = useState<Record<string, string>>({
    page_gallery_hero_tag: 'VISUAL IMMERSION',
    page_gallery_hero_title: 'Photo Gallery',
    page_gallery_hero_subtitle:
      'Take a visual tour through Grand Addis Hotel. From bespoke suites to tranquil spa spaces and savory culinary creations.',
    page_gallery_hero_image: '/images/BO5A5779-scaled.jpg',
  });
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [galRes, contentRes] = await Promise.all([
          fetch('/api/gallery').then((r) => r.json()),
          fetch('/api/content').then((r) => r.json()),
        ]);
        if (galRes?.success && Array.isArray(galRes.images) && galRes.images.length > 0) {
          setImages(galRes.images);
        }
        if (contentRes?.success && contentRes.content) {
          setContent((prev) => ({ ...prev, ...contentRes.content }));
        }
      } catch (err) {
        console.error('Error loading dynamic gallery:', err);
      }
    }
    loadData();
  }, []);

  // Compute available categories dynamically based on loaded images
  const uniqueCategories = Array.from(
    new Set(images.map((img) => (img.category || 'hotel').toLowerCase()))
  );

  const categoryLabels: Record<string, string> = {
    all: 'All Photos',
    rooms: 'Rooms & Suites',
    hotel: 'Hotel & Grounds',
    dining: 'Dining & Lounge',
    wellness: 'Spa & Wellness',
  };

  const categories = [
    { id: 'all', label: 'All Photos' },
    ...uniqueCategories.map((cat) => ({
      id: cat,
      label: categoryLabels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1),
    })),
  ];

  const filteredImages = images.filter((img) => {
    if (activeCategory === 'all') return true;
    return (img.category || '').toLowerCase() === activeCategory.toLowerCase();
  });

  const handleOpenLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const bannerImg = content.page_gallery_hero_image || '/images/BO5A5779-scaled.jpg';

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
            {content.page_gallery_hero_tag || 'VISUAL IMMERSION'}
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(36px, 5vw, 54px)',
              fontWeight: 500,
              marginBottom: '16px',
            }}
          >
            {content.page_gallery_hero_title || 'Photo Gallery'}
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
            {content.page_gallery_hero_subtitle ||
              'Take a visual tour through Grand Addis Hotel. From bespoke suites to tranquil spa spaces and savory culinary creations.'}
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
                key={img.id || idx}
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
                <Image
                  src={img.src}
                  alt={img.title || 'Grand Addis Hotel Photo'}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                  loading="lazy"
                  className="gallery-grid-img"
                  style={{
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease',
                  }}
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
                      letterSpacing: '1.5px',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    {(img.category || 'Hotel').toUpperCase()}
                  </span>
                  <h3
                    style={{
                      color: '#FFFFFF',
                      fontSize: '16px',
                      fontWeight: 500,
                      fontFamily: 'var(--font-serif)',
                    }}
                  >
                    {img.title}
                  </h3>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#153D4B',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  }}
                  className="gallery-zoom-icon"
                >
                  <Eye size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        style={{
          backgroundColor: '#153D4B',
          color: '#FFFFFF',
          padding: '60px 0',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '28px',
              fontWeight: 500,
              marginBottom: '12px',
            }}
          >
            Experience Grand Addis In Person
          </h2>
          <p
            style={{
              color: '#A2B5BD',
              maxWidth: '520px',
              margin: '0 auto 28px',
              fontSize: '15px',
            }}
          >
            Book your stay directly with us for best available rates, complimentary breakfast, and personalized concierge care.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/our-rooms" className="btn btn-primary">
              View Our Rooms <ArrowRight size={16} />
            </Link>
            <Link href="/contact" className="btn btn-outline" style={{ borderColor: '#A2B5BD', color: '#FFFFFF' }}>
              Contact Reception
            </Link>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
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
