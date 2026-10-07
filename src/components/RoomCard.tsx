'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Wifi, Tv, Wind, Bath, ArrowRight, Calendar, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Room } from '@/data/hotelData';
import { useBooking } from '@/context/BookingContext';
import { useCurrency } from '@/context/CurrencyContext';

export default function RoomCard({ room, viewMode = 'grid' }: { room: Room; viewMode?: 'grid' | 'list' }) {
  const { openBooking } = useBooking();
  const { formatPrice } = useCurrency();
  const price = formatPrice(room.pricePerNight);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % room.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + room.images.length) % room.images.length);
  };

  const isList = viewMode === 'list';

  return (
    <div
      className="luxury-card"
      style={{
        display: isList ? 'grid' : 'flex',
        gridTemplateColumns: isList ? '380px 1fr' : undefined,
        flexDirection: isList ? undefined : 'column',
        position: 'relative',
      }}
    >
      {/* Image Slider */}
      <div
        style={{
          position: 'relative',
          height: isList ? '100%' : '260px',
          minHeight: '240px',
          overflow: 'hidden',
          backgroundColor: '#0F2A33',
        }}
      >
        <img
          src={room.images[activeImageIndex]}
          alt={room.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
        />

        {/* Price Badge */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: 'rgba(15, 42, 51, 0.92)',
            backdropFilter: 'blur(4px)',
            color: '#FFFFFF',
            padding: '6px 12px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            zIndex: 2,
            textAlign: 'right',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '3px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#E49951' }}>{price.primary}</span>
            <span style={{ fontSize: '10px', color: '#A2B5BD' }}>/ nt</span>
          </div>
          <div style={{ fontSize: '10px', color: '#8BA1AB', marginTop: '1px' }}>
            ≈ {price.secondary}
          </div>
        </div>

        {/* Category Pill */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            backgroundColor: 'rgba(255,255,255,0.92)',
            color: '#153D4B',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            zIndex: 2,
          }}
        >
          {room.category}
        </div>

        {/* Image navigation arrows if more than 1 image */}
        {room.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              aria-label="Previous photo"
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                zIndex: 3,
                transition: 'background 0.2s',
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={nextImage}
              aria-label="Next photo"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                zIndex: 3,
                transition: 'background 0.2s',
              }}
            >
              <ChevronRight size={18} />
            </button>
            {/* Dots */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                gap: '5px',
                zIndex: 2,
              }}
            >
              {room.images.map((_, idx) => (
                <span
                  key={idx}
                  style={{
                    width: activeImageIndex === idx ? '16px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: activeImageIndex === idx ? '#E49951' : 'rgba(255,255,255,0.6)',
                    transition: 'all 0.2s',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 600, color: '#153D4B' }}>
            <Link href={`/rooms/${room.slug}`} style={{ color: 'inherit' }}>
              {room.name}
            </Link>
          </h3>
        </div>

        {/* Specs bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            fontSize: '12px',
            color: '#5E6E75',
            paddingBottom: '14px',
            marginBottom: '14px',
            borderBottom: '1px solid #ECEBE5',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Users size={14} color="#E49951" /> {room.capacity} Guests
          </span>
          <span>•</span>
          <span>{room.size}</span>
          <span>•</span>
          <span>{room.bedType}</span>
          <span>•</span>
          <span>{room.view}</span>
        </div>

        {/* Description */}
        <p style={{ fontSize: '13px', lineHeight: '1.65', color: '#6A7880', marginBottom: '18px', flex: 1 }}>
          {room.description}
        </p>

        {/* Feature Icons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '22px' }}>
          {room.amenities.slice(0, 4).map((amenity, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '11px',
                padding: '4px 9px',
                borderRadius: '4px',
                backgroundColor: '#F7F7F2',
                color: '#153D4B',
                border: '1px solid #E8E7DF',
              }}
            >
              {amenity}
            </span>
          ))}
          {room.amenities.length > 4 && (
            <span style={{ fontSize: '11px', color: '#838A8D', alignSelf: 'center' }}>
              +{room.amenities.length - 4} more
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
          <Link
            href={`/rooms/${room.slug}`}
            className="btn btn-outline"
            style={{ flex: 1, padding: '10px', fontSize: '12px' }}
          >
            <Eye size={14} />
            <span>Details</span>
          </Link>
          <button
            onClick={() => openBooking({ roomId: room.id })}
            className="btn btn-primary"
            style={{ flex: 1.2, padding: '10px', fontSize: '12px' }}
          >
            <Calendar size={14} />
            <span>Book Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
