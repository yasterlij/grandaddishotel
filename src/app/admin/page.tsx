'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Database,
  Calendar,
  Bed,
  Utensils,
  Flower2,
  Mail,
  Star,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    'reservations' | 'rooms' | 'dining' | 'spa' | 'messages' | 'testimonials'
  >('reservations');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [dining, setDining] = useState<any[]>([]);
  const [spa, setSpa] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [eventInquiries, setEventInquiries] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionMessage, setActionMessage] = useState('');

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [
        overviewRes,
        resRes,
        roomsRes,
        diningRes,
        spaRes,
        msgRes,
        eventsRes,
        testRes,
      ] = await Promise.all([
        fetch('/api/admin/overview').then((r) => r.json()),
        fetch('/api/admin/reservations').then((r) => r.json()),
        fetch('/api/admin/rooms').then((r) => r.json()),
        fetch('/api/dining-reservations').then((r) => r.json()),
        fetch('/api/spa-appointments').then((r) => r.json()),
        fetch('/api/contact').then((r) => r.json()),
        fetch('/api/events').then((r) => r.json()),
        fetch('/api/testimonials').then((r) => r.json()),
      ]);

      if (overviewRes.success) setOverview(overviewRes);
      if (resRes.success) setReservations(resRes.reservations || []);
      if (roomsRes.success) setRooms(roomsRes.rooms || []);
      if (diningRes.success) setDining(diningRes.reservations || []);
      if (spaRes.success) setSpa(spaRes.appointments || []);
      if (msgRes.success) setMessages(msgRes.messages || []);
      if (eventsRes.success) setEventInquiries(eventsRes.inquiries || []);
      if (testRes.success) setTestimonials(testRes.testimonials || []);
    } catch (err) {
      console.error('Error loading admin data from PostgreSQL:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleUpdateReservationStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Reservation ${id.slice(0, 8)} updated to ${status}`);
        setTimeout(() => setActionMessage(''), 4000);
        loadAllData();
      }
    } catch (err) {
      console.error('Error updating reservation:', err);
    }
  };

  const handleUpdateRoomStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Room status updated to ${status}`);
        setTimeout(() => setActionMessage(''), 4000);
        loadAllData();
      }
    } catch (err) {
      console.error('Error updating room:', err);
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  return (
    <div style={{ paddingTop: '84px', backgroundColor: '#F7F7F2', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Top Banner Header */}
      <section
        style={{
          backgroundColor: '#0F2A33',
          color: '#FFFFFF',
          padding: '40px 0 32px',
          borderBottom: '1px solid rgba(228, 153, 81, 0.2)',
        }}
      >
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(52, 199, 89, 0.15)',
                    color: '#34C759',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#34C759',
                      display: 'inline-block',
                      boxShadow: '0 0 8px #34C759',
                    }}
                  />
                  POSTGRESQL LIVE
                </span>
                <span style={{ fontSize: '12px', color: '#A2B5BD' }}>
                  Database: <strong>grand_addis_db</strong> (port 5432)
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 500, margin: 0 }}>
                Hotel Database & Operations Dashboard
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={loadAllData}
                disabled={refreshing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                <span>Refresh Live DB</span>
              </button>

              <Link
                href="/rooms-reservation"
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                <span>New Booking Test</span>
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Action Notification */}
      {actionMessage && (
        <div
          style={{
            backgroundColor: '#153D4B',
            color: '#FFFFFF',
            padding: '12px 24px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={16} color="#E49951" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="container" style={{ marginTop: '32px' }}>
        {/* Metric Cards Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {/* Card 1: Reservations */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #E2E1DA',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#838A8D', fontWeight: 500 }}>Total Bookings</span>
              <Calendar size={18} color="#E49951" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#153D4B' }}>
              {overview?.stats?.reservations?.total || reservations.length}
            </div>
            <span style={{ fontSize: '11px', color: '#34C759', fontWeight: 500 }}>
              Stored in reservations table
            </span>
          </div>

          {/* Card 2: Revenue */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #E2E1DA',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#838A8D', fontWeight: 500 }}>Total Revenue</span>
              <DollarSign size={18} color="#153D4B" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#153D4B' }}>
              ETB {(overview?.stats?.reservations?.revenue || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: '11px', color: '#838A8D' }}>
              Calculated from confirmed stays
            </span>
          </div>

          {/* Card 3: Room Availability */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #E2E1DA',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#838A8D', fontWeight: 500 }}>Rooms Available</span>
              <Bed size={18} color="#E49951" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#153D4B' }}>
              {overview?.stats?.rooms?.available || 14} / {overview?.stats?.rooms?.total || 15}
            </div>
            <span style={{ fontSize: '11px', color: '#34C759', fontWeight: 500 }}>
              Physical rooms inventory
            </span>
          </div>

          {/* Card 4: Dining Reservations */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #E2E1DA',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#838A8D', fontWeight: 500 }}>Dining Tables</span>
              <Utensils size={18} color="#153D4B" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#153D4B' }}>
              {dining.length}
            </div>
            <span style={{ fontSize: '11px', color: '#838A8D' }}>
              table_reservations table
            </span>
          </div>

          {/* Card 5: Spa & Wellness */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #E2E1DA',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#838A8D', fontWeight: 500 }}>Spa Sessions</span>
              <Flower2 size={18} color="#E49951" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#153D4B' }}>
              {spa.length}
            </div>
            <span style={{ fontSize: '11px', color: '#838A8D' }}>
              spa_appointments table
            </span>
          </div>

          {/* Card 6: Guest Testimonials */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #E2E1DA',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#838A8D', fontWeight: 500 }}>Reviews</span>
              <Star size={18} color="#E49951" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#153D4B' }}>
              {testimonials.length}
            </div>
            <span style={{ fontSize: '11px', color: '#34C759' }}>
              testimonials table
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '2px solid #E2E1DA',
            marginBottom: '24px',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'reservations', label: 'Room Reservations', icon: Calendar, count: reservations.length },
            { id: 'rooms', label: 'Room Inventory', icon: Bed, count: rooms.length },
            { id: 'dining', label: 'Dining Reservations', icon: Utensils, count: dining.length },
            { id: 'spa', label: 'Spa Appointments', icon: Flower2, count: spa.length },
            { id: 'messages', label: 'Inquiries & Proposals', icon: Mail, count: messages.length + eventInquiries.length },
            { id: 'testimonials', label: 'Guest Reviews', icon: Star, count: testimonials.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderBottom: isActive ? '3px solid #E49951' : '3px solid transparent',
                  color: isActive ? '#153D4B' : '#838A8D',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  marginBottom: '-2px',
                }}
              >
                <Icon size={16} color={isActive ? '#E49951' : '#838A8D'} />
                <span>{tab.label}</span>
                <span
                  style={{
                    backgroundColor: isActive ? '#E49951' : '#E2E1DA',
                    color: isActive ? '#FFFFFF' : '#5E6E75',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontWeight: 600,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Room Reservations */}
        {activeTab === 'reservations' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E1DA', overflow: 'hidden' }}>
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #E2E1DA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#153D4B', fontWeight: 600 }}>
                  PostgreSQL `reservations` Records
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#838A8D' }}>
                  Live bookings joined with `guests`, `room_types`, and `payments` tables
                </p>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: statusFilter === st ? '1px solid #E49951' : '1px solid #E2E1DA',
                      backgroundColor: statusFilter === st ? '#E49951' : '#FFFFFF',
                      color: statusFilter === st ? '#FFFFFF' : '#153D4B',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredReservations.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#838A8D' }}>
                <p>No reservations found matching this filter.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F7F7F2', borderBottom: '1px solid #E2E1DA', textAlign: 'left' }}>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Booking Ref</th>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Guest</th>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Room Type</th>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Dates</th>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Total</th>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((r) => {
                      const checkIn = new Date(r.checkInDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                      const checkOut = new Date(r.checkOutDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });

                      const statusColors: any = {
                        CONFIRMED: { bg: '#EBF8F0', text: '#28A745', border: '#BBE6C9' },
                        PENDING: { bg: '#FFF8E6', text: '#D97706', border: '#FCE1A8' },
                        CANCELLED: { bg: '#FDF0ED', text: '#DC3545', border: '#F7BCB6' },
                      };
                      const col = statusColors[r.status] || statusColors.PENDING;

                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid #F0EFEB' }}>
                          <td style={{ padding: '14px 18px', fontWeight: 600, color: '#153D4B' }}>
                            {r.bookingRef}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 600, color: '#153D4B' }}>
                              {r.firstName} {r.lastName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#838A8D' }}>{r.email}</div>
                            <div style={{ fontSize: '11px', color: '#838A8D' }}>{r.phoneNumber}</div>
                          </td>
                          <td style={{ padding: '14px 18px', color: '#153D4B', fontWeight: 500 }}>
                            {r.roomTypeName}
                          </td>
                          <td style={{ padding: '14px 18px', color: '#5E6E75' }}>
                            <div>{checkIn} →</div>
                            <div>{checkOut}</div>
                          </td>
                          <td style={{ padding: '14px 18px', fontWeight: 600, color: '#153D4B' }}>
                            {r.currency} {Number(r.totalAmount).toLocaleString()}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: col.bg,
                                color: col.text,
                                border: `1px solid ${col.border}`,
                              }}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {r.status !== 'CONFIRMED' && (
                                <button
                                  onClick={() => handleUpdateReservationStatus(r.id, 'CONFIRMED')}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    borderRadius: '4px',
                                    backgroundColor: '#28A745',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Confirm
                                </button>
                              )}
                              {r.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => handleUpdateReservationStatus(r.id, 'CANCELLED')}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    borderRadius: '4px',
                                    backgroundColor: '#DC3545',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Physical Room Inventory */}
        {activeTab === 'rooms' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E1DA', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E1DA' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#153D4B', fontWeight: 600 }}>
                PostgreSQL `rooms` Physical Room Inventory
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#838A8D' }}>
                Toggle room occupancy and maintenance states directly in the database
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F7F7F2', borderBottom: '1px solid #E2E1DA', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Room Number</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Floor</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Room Type</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Current Status</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((rm) => {
                    const statusBg: any = {
                      AVAILABLE: '#EBF8F0',
                      OCCUPIED: '#FFF8E6',
                      MAINTENANCE: '#FDF0ED',
                    };
                    const statusColor: any = {
                      AVAILABLE: '#28A745',
                      OCCUPIED: '#D97706',
                      MAINTENANCE: '#DC3545',
                    };
                    return (
                      <tr key={rm.id} style={{ borderBottom: '1px solid #F0EFEB' }}>
                        <td style={{ padding: '14px 18px', fontWeight: 700, color: '#153D4B', fontSize: '15px' }}>
                          Room {rm.roomNumber}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#5E6E75' }}>Floor {rm.floor}</td>
                        <td style={{ padding: '14px 18px', color: '#153D4B', fontWeight: 500 }}>
                          {rm.roomTypeName}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: statusBg[rm.status] || '#E2E1DA',
                              color: statusColor[rm.status] || '#153D4B',
                            }}
                          >
                            {rm.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'].map((st) => (
                              <button
                                key={st}
                                onClick={() => handleUpdateRoomStatus(rm.id, st)}
                                disabled={rm.status === st}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  borderRadius: '4px',
                                  border: '1px solid #D5D4CC',
                                  backgroundColor: rm.status === st ? '#153D4B' : '#FFFFFF',
                                  color: rm.status === st ? '#FFFFFF' : '#153D4B',
                                  cursor: rm.status === st ? 'default' : 'pointer',
                                }}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Dining Table Reservations */}
        {activeTab === 'dining' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E1DA', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E1DA' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#153D4B', fontWeight: 600 }}>
                PostgreSQL `table_reservations` Table
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#838A8D' }}>
                Restaurant table bookings submitted from the dining page
              </p>
            </div>

            {dining.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#838A8D' }}>
                <p>No table reservations in database yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F7F7F2', borderBottom: '1px solid #E2E1DA', textAlign: 'left' }}>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Date & Time</th>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Guests</th>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Customer Name</th>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Contact</th>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Notes</th>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dining.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid #F0EFEB' }}>
                        <td style={{ padding: '14px 18px', fontWeight: 600, color: '#153D4B' }}>
                          {new Date(d.date).toLocaleDateString()} at {d.time}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#5E6E75' }}>{d.party_size} People</td>
                        <td style={{ padding: '14px 18px', fontWeight: 600, color: '#153D4B' }}>{d.guest_name}</td>
                        <td style={{ padding: '14px 18px', color: '#5E6E75' }}>
                          <div>{d.guest_phone}</div>
                          <div style={{ fontSize: '11px', color: '#838A8D' }}>{d.guest_email}</div>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#5E6E75', fontStyle: d.notes ? 'normal' : 'italic' }}>
                          {d.notes || 'None'}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: '#EBF8F0',
                              color: '#28A745',
                            }}
                          >
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Spa Appointments */}
        {activeTab === 'spa' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E1DA', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E1DA' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#153D4B', fontWeight: 600 }}>
                PostgreSQL `spa_appointments` Table
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#838A8D' }}>
                Hydrothermal sanctuary and massage therapy bookings
              </p>
            </div>

            {spa.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#838A8D' }}>
                <p>No spa appointments booked yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F7F7F2', borderBottom: '1px solid #E2E1DA', textAlign: 'left' }}>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Service</th>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Date & Time</th>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Client Name</th>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Contact Details</th>
                      <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spa.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #F0EFEB' }}>
                        <td style={{ padding: '14px 18px', fontWeight: 600, color: '#153D4B' }}>{s.service_name}</td>
                        <td style={{ padding: '14px 18px', color: '#5E6E75' }}>
                          {new Date(s.date).toLocaleDateString()} at {s.time}
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 600, color: '#153D4B' }}>{s.client_name}</td>
                        <td style={{ padding: '14px 18px', color: '#5E6E75' }}>
                          <div>{s.client_phone}</div>
                          <div style={{ fontSize: '11px', color: '#838A8D' }}>{s.client_email}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: '#EBF8F0',
                              color: '#28A745',
                            }}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Inquiries & Event Proposals */}
        {activeTab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Contact Messages */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E1DA', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E1DA' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#153D4B', fontWeight: 600 }}>
                  Contact Messages (`contact_messages` table)
                </h3>
              </div>
              {messages.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#838A8D' }}>
                  No contact messages received yet.
                </div>
              ) : (
                <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {messages.map((m) => (
                    <div key={m.id} style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#F7F7F2', border: '1px solid #E8E7DF' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ color: '#153D4B' }}>{m.subject}</strong>
                        <span style={{ fontSize: '12px', color: '#838A8D' }}>{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#4B5563' }}>{m.message}</p>
                      <div style={{ fontSize: '12px', color: '#838A8D' }}>
                        From: <strong>{m.name}</strong> ({m.email}) {m.phone ? `• ${m.phone}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Event Inquiries */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E1DA', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E1DA' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#153D4B', fontWeight: 600 }}>
                  Weddings & Events Proposals (`event_inquiries` table)
                </h3>
              </div>
              {eventInquiries.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#838A8D' }}>
                  No event proposals requested yet.
                </div>
              ) : (
                <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {eventInquiries.map((ev) => (
                    <div key={ev.id} style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#F7F7F2', border: '1px solid #E8E7DF' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ color: '#153D4B' }}>{ev.event_type} ({ev.guests_count} Guests)</strong>
                        <span style={{ fontSize: '12px', color: '#838A8D' }}>Target: {new Date(ev.target_date).toLocaleDateString()}</span>
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#4B5563' }}>{ev.details || 'No additional details provided'}</p>
                      <div style={{ fontSize: '12px', color: '#838A8D' }}>
                        Planner: <strong>{ev.name}</strong> ({ev.email} • {ev.phone})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Guest Reviews */}
        {activeTab === 'testimonials' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E1DA', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E1DA' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#153D4B', fontWeight: 600 }}>
                PostgreSQL `testimonials` Table
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#838A8D' }}>
                Verified guest reviews displayed on the website
              </p>
            </div>

            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {testimonials.map((t) => (
                <div key={t.id} style={{ padding: '20px', borderRadius: '10px', backgroundColor: '#F7F7F2', border: '1px solid #E2E1DA' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ color: '#E49951', display: 'flex', gap: '2px' }}>
                      {[...Array(t.rating || 5)].map((_, i) => (
                        <Star key={i} size={14} fill="#E49951" color="#E49951" />
                      ))}
                    </div>
                    <span style={{ fontSize: '11px', color: '#838A8D' }}>{t.date}</span>
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#153D4B', fontWeight: 600 }}>{t.title}</h4>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#5E6E75', lineHeight: '1.6' }}>{t.comment}</p>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B' }}>
                    {t.name} <span style={{ fontWeight: 400, color: '#838A8D' }}>— {t.location}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#E49951', marginTop: '4px', fontWeight: 500 }}>
                    Stayed in: {t.room_type || t.roomType}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
