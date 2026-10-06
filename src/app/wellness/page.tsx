'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flower2,
  Clock,
  Sparkles,
  Check,
  Calendar,
  X,
  Phone,
  Heart,
  Droplets,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { WELLNESS_SERVICES, HOTEL_INFO, SpaTreatment } from '@/data/hotelData';

export default function WellnessPage() {
  const [services, setServices] = useState<SpaTreatment[]>(WELLNESS_SERVICES);
  const [isSpaModalOpen, setIsSpaModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(WELLNESS_SERVICES[0].id);
  const [spaDate, setSpaDate] = useState('');
  const [spaTime, setSpaTime] = useState('14:00');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [spaConfirmed, setSpaConfirmed] = useState(false);

  useEffect(() => {
    async function loadPostgresSpa() {
      try {
        const res = await fetch('/api/spa-treatments');
        const data = await res.json();
        if (data.success && data.treatments && data.treatments.length > 0) {
          setServices(
            data.treatments.map((t: any) => ({
              id: t.id,
              name: t.name,
              category: t.category,
              duration: t.duration,
              price: Number(t.price),
              description: t.description,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load spa treatments from PostgreSQL:', err);
      }
    }
    loadPostgresSpa();
  }, []);

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  const handleSpaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/spa-appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          date: spaDate,
          time: spaTime,
          clientName,
          clientPhone,
          clientEmail,
        }),
      });
    } catch (err) {
      console.error('Spa appointment error:', err);
    }
    setSpaConfirmed(true);
  };

  return (
    <div style={{ paddingTop: '84px' }}>
      {/* Banner */}
      <section
        style={{
          position: 'relative',
          padding: '100px 0 70px',
          backgroundImage: `linear-gradient(rgba(15, 42, 51, 0.82), rgba(15, 42, 51, 0.94)), url('/images/BO5A5988-scaled.jpg')`,
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
            SERENITY & REJUVENATION
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 500,
              marginBottom: '18px',
            }}
          >
            Wellness & Spa Sanctuary
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
            Extensive wellness. Thermal steam. Team of dedicated therapists. A delightful journey of relaxation and pampering in the heart of Addis Ababa.
          </p>

          <button
            onClick={() => setIsSpaModalOpen(true)}
            className="btn btn-primary"
            style={{ padding: '14px 36px' }}
          >
            <Flower2 size={16} />
            <span>Book a Spa Treatment</span>
          </button>
        </div>
      </section>

      {/* Spa Pillars Banner */}
      <section style={{ backgroundColor: '#F7F7F2', borderBottom: '1px solid #E2E1DA', padding: '40px 0' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px',
              textAlign: 'center',
            }}
          >
            <div>
              <Droplets size={28} color="#E49951" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#153D4B', marginBottom: '4px' }}>
                Thermal Steam & Sauna
              </h4>
              <p style={{ fontSize: '13px', color: '#5E6E75' }}>Highland eucalyptus steam for respiratory clarity and deep detox.</p>
            </div>
            <div>
              <Heart size={28} color="#E49951" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#153D4B', marginBottom: '4px' }}>
                Organic Botanicals
              </h4>
              <p style={{ fontSize: '13px', color: '#5E6E75' }}>Ethiopian coffee scrubs, pure beeswax, and natural flower extracts.</p>
            </div>
            <div>
              <Activity size={28} color="#E49951" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#153D4B', marginBottom: '4px' }}>
                Holistic Fitness
              </h4>
              <p style={{ fontSize: '13px', color: '#5E6E75' }}>State-of-the-art cardio and weight training gym facility.</p>
            </div>
            <div>
              <Phone size={28} color="#E49951" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#153D4B', marginBottom: '4px' }}>
                Call To Book
              </h4>
              <p style={{ fontSize: '13px', color: '#5E6E75' }}>Direct desk booking: {HOTEL_INFO.phone}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Spa Menu Section */}
      <section className="section-padding">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span className="section-subtitle">TREATMENTS & RITUALS</span>
            <h2 className="section-title">Finding Your Inner Balance</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Choose from our curated therapeutic treatments designed to revive tired muscles and nurture mental serenity.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '28px',
            }}
          >
            {WELLNESS_SERVICES.map((service) => (
              <div
                key={service.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E1DA',
                  padding: '30px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.25s',
                }}
                className="service-card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#E49951', fontWeight: 600 }}>
                    {service.category}
                  </span>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#E49951' }}>
                    ${service.price}
                  </div>
                </div>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, color: '#153D4B', marginBottom: '8px' }}>
                  {service.name}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#838A8D', marginBottom: '14px' }}>
                  <Clock size={14} color="#E49951" />
                  <span>Duration: {service.duration}</span>
                </div>

                <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#5E6E75', marginBottom: '24px', flex: 1 }}>
                  {service.description}
                </p>

                <button
                  onClick={() => {
                    setSelectedServiceId(service.id);
                    setIsSpaModalOpen(true);
                  }}
                  className="btn btn-outline"
                  style={{ width: '100%', padding: '10px' }}
                >
                  <Calendar size={14} />
                  <span>Book This Service</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .service-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-md) !important;
            border-color: #E49951 !important;
          }
        `}</style>
      </section>

      {/* SPA BOOKING MODAL */}
      {isSpaModalOpen && (
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
            onClick={() => setIsSpaModalOpen(false)}
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
                  GRAND ADDIS WELLNESS
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#153D4B' }}>
                  Schedule Your Spa Appointment
                </h3>
              </div>

              <button
                onClick={() => setIsSpaModalOpen(false)}
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

            {spaConfirmed ? (
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
                  Treatment Confirmed!
                </h4>
                <p style={{ fontSize: '14px', color: '#5E6E75', marginBottom: '20px' }}>
                  Thank you, <strong>{clientName}</strong>. Your appointment for <strong>{selectedService.name} (${selectedService.price})</strong> has been scheduled for <strong>{spaDate || 'today'} at {spaTime}</strong>.
                </p>
                <button
                  onClick={() => {
                    setIsSpaModalOpen(false);
                    setSpaConfirmed(false);
                  }}
                  className="btn btn-primary"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSpaSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                    Select Treatment *
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  >
                    {WELLNESS_SERVICES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — ${s.price} ({s.duration})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={spaDate}
                      onChange={(e) => setSpaDate(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Preferred Time *
                    </label>
                    <select
                      value={spaTime}
                      onChange={(e) => setSpaTime(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    >
                      <option value="10:00">10:00 AM</option>
                      <option value="11:30">11:30 AM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:30">03:30 PM</option>
                      <option value="17:00">05:00 PM</option>
                      <option value="18:30">06:30 PM</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Your name"
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
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+251..."
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', display: 'block', marginBottom: '4px' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsSpaModalOpen(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Confirm Appointment
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
