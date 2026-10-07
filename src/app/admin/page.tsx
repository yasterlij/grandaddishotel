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
  Edit,
  Trash2,
  Plus,
  Upload,
  Image as ImageIcon,
  Users,
  Search,
  Filter,
  CreditCard,
  Copy,
  Printer,
  Lock,
  LogOut,
  Key,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { getTodayDateStr, addDays, calculateStayNights, formatFriendlyDate } from '@/lib/dates';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    'reservations' | 'payments' | 'roomTypes' | 'rooms' | 'dining' | 'spa' | 'messages' | 'testimonials'
  >('reservations');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [dining, setDining] = useState<any[]>([]);
  const [spa, setSpa] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [eventInquiries, setEventInquiries] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Payment filters & inspection modal
  const [paymentProviderFilter, setPaymentProviderFilter] = useState<string>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');
  const [paymentSearch, setPaymentSearch] = useState<string>('');
  const [viewPaymentModal, setViewPaymentModal] = useState<any | null>(null);

  // Modal states
  const [editRoomTypeModal, setEditRoomTypeModal] = useState<any | null>(null);
  const [isCreatingRoomType, setIsCreatingRoomType] = useState(false);

  const [editReservationModal, setEditReservationModal] = useState<any | null>(null);
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);

  const [editDishModal, setEditDishModal] = useState<any | null>(null);
  const [isCreatingDish, setIsCreatingDish] = useState(false);

  const [editSpaModal, setEditSpaModal] = useState<any | null>(null);
  const [isCreatingSpa, setIsCreatingSpa] = useState(false);

  const [editPhysicalRoomModal, setEditPhysicalRoomModal] = useState<any | null>(null);
  const [isCreatingPhysicalRoom, setIsCreatingPhysicalRoom] = useState(false);

  const [editTestimonialModal, setEditTestimonialModal] = useState<any | null>(null);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Quick Price Modal
  const [quickPriceModal, setQuickPriceModal] = useState<any | null>(null);
  const [isSavingQuickPrice, setIsSavingQuickPrice] = useState(false);

  // Universal Forex / Exchange Rate State
  const [universalRate, setUniversalRate] = useState<number>(189);
  const [tempUniversalRate, setTempUniversalRate] = useState<string>('189');
  const [syncRoomsWithRate, setSyncRoomsWithRate] = useState<boolean>(true);
  const [isSavingRate, setIsSavingRate] = useState<boolean>(false);
  const [rateSaveSuccess, setRateSaveSuccess] = useState<string>('');

  // New Image URL input for Room Type modal
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newAmenityText, setNewAmenityText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [
        overviewRes,
        resRes,
        roomTypesRes,
        roomsRes,
        diningRes,
        spaRes,
        msgRes,
        eventsRes,
        testRes,
        payRes,
        rateRes,
      ] = await Promise.all([
        fetch('/api/admin/overview').then((r) => r.json()),
        fetch('/api/admin/reservations').then((r) => r.json()),
        fetch('/api/admin/room-types').then((r) => r.json()),
        fetch('/api/admin/rooms').then((r) => r.json()),
        fetch('/api/admin/menu').then((r) => r.json()),
        fetch('/api/admin/spa').then((r) => r.json()),
        fetch('/api/contact').then((r) => r.json()),
        fetch('/api/events').then((r) => r.json()),
        fetch('/api/admin/testimonials').then((r) => r.json()),
        fetch('/api/admin/payments').then((r) => r.json()),
        fetch('/api/settings/exchange-rate').then((r) => r.json()),
      ]);

      if (overviewRes.success) setOverview(overviewRes);
      if (resRes.success) setReservations(resRes.reservations || []);
      if (roomTypesRes.success) setRoomTypes(roomTypesRes.roomTypes || []);
      if (roomsRes.success) setRooms(roomsRes.rooms || []);
      if (diningRes.success) setDining(diningRes.items || []);
      if (spaRes.success) setSpa(spaRes.treatments || []);
      if (msgRes.success) setMessages(msgRes.messages || []);
      if (eventsRes.success) setEventInquiries(eventsRes.inquiries || []);
      if (testRes.success) setTestimonials(testRes.testimonials || []);
      if (payRes.success) setPayments(payRes.payments || []);
      if (rateRes?.success && rateRes?.rate) {
        setUniversalRate(rateRes.rate);
        setTempUniversalRate(rateRes.rate.toString());
      }
    } catch (err) {
      console.error('Error loading admin data from PostgreSQL:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/auth-check');
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          setAdminUser(data.user);
          loadAllData();
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setAdminUser(data.user);
        loadAllData();
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setAdminUser(null);
      setLoginPassword('');
    }
  };

  const handleQuickPriceSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPriceModal) return;
    setIsSavingQuickPrice(true);
    try {
      const res = await fetch('/api/admin/room-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: quickPriceModal.id,
          basePriceUSD: Number(quickPriceModal.basePriceUSD),
          basePriceETB: Number(quickPriceModal.basePriceETB),
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Price updated for "${quickPriceModal.name}"!`);
        setQuickPriceModal(null);
        loadAllData();
      } else {
        alert(data.error || 'Failed to update price');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating price');
    } finally {
      setIsSavingQuickPrice(false);
    }
  };

  const handleSaveUniversalRate = async (customRate?: number) => {
    const rateToSave = customRate !== undefined ? customRate : parseFloat(tempUniversalRate);
    if (isNaN(rateToSave) || rateToSave <= 0) {
      alert('Please enter a valid exchange rate (e.g. 189)');
      return;
    }
    setIsSavingRate(true);
    setRateSaveSuccess('');
    try {
      const res = await fetch('/api/admin/settings/exchange-rate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: rateToSave, syncRooms: syncRoomsWithRate }),
      });
      const data = await res.json();
      if (data.success) {
        setUniversalRate(rateToSave);
        setTempUniversalRate(rateToSave.toString());
        localStorage.setItem('gah_usd_to_etb_rate', rateToSave.toString());
        window.dispatchEvent(new CustomEvent('gah_exchange_rate_updated', { detail: { rate: rateToSave } }));
        setRateSaveSuccess(data.message || `Universal exchange rate updated to 1 USD = ${rateToSave} ETB!`);
        notify(`Universal exchange rate updated to 1 USD = ${rateToSave} ETB!`);
        // Refresh room types from DB so updated basePriceETB is displayed
        const rtRes = await fetch('/api/admin/room-types').then((r) => r.json());
        if (rtRes.success) setRoomTypes(rtRes.roomTypes || []);
        setTimeout(() => setRateSaveSuccess(''), 7000);
      } else {
        alert(data.error || 'Failed to update exchange rate');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating exchange rate');
    } finally {
      setIsSavingRate(false);
    }
  };

  const notify = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 4500);
  };

  // -------------------------------------------------------------
  // Payment CRUD Handlers
  // -------------------------------------------------------------
  const handleUpdatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paymentId, status }),
      });
      const data = await res.json();
      if (data.success) {
        notify(`Payment status marked as ${status}`);
        loadAllData();
      } else {
        alert(data.error || 'Failed to update payment status');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to permanently delete this payment transaction?')) return;
    try {
      const res = await fetch(`/api/admin/payments?id=${paymentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        notify('Payment transaction deleted from PostgreSQL');
        loadAllData();
      } else {
        alert(data.error || 'Failed to delete payment');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // -------------------------------------------------------------
  // Room Type CRUD Handlers
  // -------------------------------------------------------------
  const handleRoomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadingImage(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        const imgs = editRoomTypeModal.images || [];
        setEditRoomTypeModal({ ...editRoomTypeModal, images: [...imgs, data.url] });
        notify('Photo uploaded and added to room gallery!');
      } else {
        alert(data.error || 'Failed to upload photo');
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading photo');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSaveRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoomTypeModal) return;

    try {
      const isNew = !editRoomTypeModal.id;
      const res = await fetch('/api/admin/room-types', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRoomTypeModal),
      });
      const data = await res.json();
      if (data.success) {
        notify(isNew ? 'Room type created in PostgreSQL' : 'Room type updated in PostgreSQL');
        setEditRoomTypeModal(null);
        setIsCreatingRoomType(false);
        loadAllData();
      } else {
        alert(data.error || 'Failed to save room type');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving room type');
    }
  };

  const handleDeleteRoomType = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete room type "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/room-types?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify(`Room type "${name}" deleted from PostgreSQL`);
        loadAllData();
      } else {
        alert(data.error || 'Cannot delete room type');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting room type');
    }
  };

  // -------------------------------------------------------------
  // Reservation CRUD Handlers
  // -------------------------------------------------------------
  const handleSaveReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReservationModal) return;

    try {
      const isNew = !editReservationModal.id;
      const res = await fetch('/api/admin/reservations', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editReservationModal),
      });
      const data = await res.json();
      if (data.success) {
        notify(isNew ? 'New reservation created in PostgreSQL' : 'Reservation dates & details updated');
        setEditReservationModal(null);
        setIsCreatingReservation(false);
        loadAllData();
      } else {
        alert(data.error || 'Failed to save reservation');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving reservation');
    }
  };

  const handleDeleteReservation = async (id: string, ref: string) => {
    if (!confirm(`Are you sure you want to delete reservation ${ref}?`)) return;
    try {
      const res = await fetch(`/api/admin/reservations?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify(`Reservation ${ref} deleted`);
        loadAllData();
      } else {
        alert(data.error || 'Cannot delete reservation');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting reservation');
    }
  };

  // -------------------------------------------------------------
  // Dining Menu CRUD Handlers
  // -------------------------------------------------------------
  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDishModal) return;

    try {
      const isNew = !editDishModal.id;
      const res = await fetch('/api/admin/menu', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDishModal),
      });
      const data = await res.json();
      if (data.success) {
        notify(isNew ? 'Dish created in PostgreSQL' : 'Dish updated');
        setEditDishModal(null);
        setIsCreatingDish(false);
        loadAllData();
      } else {
        alert(data.error || 'Failed to save dish');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving dish');
    }
  };

  const handleDeleteDish = async (id: string, name: string) => {
    if (!confirm(`Delete dish "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/menu?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify(`Dish "${name}" deleted`);
        loadAllData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // -------------------------------------------------------------
  // Spa CRUD Handlers
  // -------------------------------------------------------------
  const handleSaveSpa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSpaModal) return;

    try {
      const isNew = !editSpaModal.id;
      const res = await fetch('/api/admin/spa', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSpaModal),
      });
      const data = await res.json();
      if (data.success) {
        notify(isNew ? 'Spa treatment created in PostgreSQL' : 'Spa treatment updated');
        setEditSpaModal(null);
        setIsCreatingSpa(false);
        loadAllData();
      } else {
        alert(data.error || 'Failed to save treatment');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSpa = async (id: string, name: string) => {
    if (!confirm(`Delete spa treatment "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/spa?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify(`Treatment "${name}" deleted`);
        loadAllData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // -------------------------------------------------------------
  // Physical Rooms CRUD Handlers
  // -------------------------------------------------------------
  const handleSavePhysicalRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPhysicalRoomModal) return;

    try {
      const isNew = !editPhysicalRoomModal.id;
      const res = await fetch('/api/admin/rooms', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPhysicalRoomModal),
      });
      const data = await res.json();
      if (data.success) {
        notify(isNew ? 'Room added to inventory' : 'Room updated');
        setEditPhysicalRoomModal(null);
        setIsCreatingPhysicalRoom(false);
        loadAllData();
      } else {
        alert(data.error || 'Failed to save room');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePhysicalRoom = async (id: string, roomNum: string) => {
    if (!confirm(`Delete Room ${roomNum}?`)) return;
    try {
      const res = await fetch(`/api/admin/rooms?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify(`Room ${roomNum} deleted`);
        loadAllData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // -------------------------------------------------------------
  // Testimonial CRUD Handlers
  // -------------------------------------------------------------
  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTestimonialModal) return;

    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editTestimonialModal),
      });
      const data = await res.json();
      if (data.success) {
        notify('Testimonial updated');
        setEditTestimonialModal(null);
        loadAllData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      const res = await fetch(`/api/admin/testimonials?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify('Review deleted');
        loadAllData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isCheckingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F2A33', color: '#FFFFFF' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '3px solid rgba(228, 153, 81, 0.2)', borderTopColor: '#E49951', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: '15px', color: '#A2B5BD', letterSpacing: '1px' }}>Verifying Administrator Session...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#09191F',
          backgroundImage: `radial-gradient(circle at 50% 30%, rgba(21, 61, 75, 0.6) 0%, rgba(9, 25, 31, 0.95) 100%), url('/images/BO5A5779-scaled.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: 'rgba(15, 42, 51, 0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(228, 153, 81, 0.35)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
            padding: '40px 32px',
            color: '#FFFFFF',
          }}
        >
          {/* Logo & Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                padding: '6px',
                boxShadow: '0 4px 20px rgba(228, 153, 81, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img src="/images/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '3px', color: '#E49951', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              GRAND ADDIS HOTEL & RESORT
            </span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 600, margin: 0 }}>
              Executive Management Portal
            </h2>
            <p style={{ fontSize: '13px', color: '#A2B5BD', marginTop: '6px' }}>
              Secure access to rates, rooms inventory & reservations.
            </p>
          </div>

          {/* Error Alert */}
          {loginError && (
            <div
              style={{
                backgroundColor: 'rgba(220, 53, 69, 0.2)',
                border: '1px solid rgba(220, 53, 69, 0.5)',
                color: '#FF6B6B',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{loginError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#C5D3D9', marginBottom: '6px', letterSpacing: '0.5px' }}>
                Username or Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="e.g. admin"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <Users size={16} color="#E49951" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#C5D3D9', letterSpacing: '0.5px' }}>
                  Password or Security PIN
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ fontSize: '11px', color: '#E49951', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password or PIN"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <Lock size={16} color="#E49951" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: '10px',
                letterSpacing: '1px',
                boxShadow: '0 8px 24px rgba(228, 153, 81, 0.4)',
                cursor: isLoggingIn ? 'wait' : 'pointer',
              }}
            >
              {isLoggingIn ? 'Verifying Credentials...' : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* Credentials Reminder */}
          <div
            style={{
              marginTop: '24px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(228, 153, 81, 0.1)',
              border: '1px solid rgba(228, 153, 81, 0.25)',
              fontSize: '12px',
              color: '#D1DEE3',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 600, color: '#E49951', marginBottom: '2px' }}>Default Credentials:</div>
            <div>Username: <strong style={{ color: '#FFFFFF' }}>admin</strong> · Password: <strong style={{ color: '#FFFFFF' }}>GrandAddis2026!</strong> (or PIN <strong style={{ color: '#FFFFFF' }}>2026</strong>)</div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link href="/" style={{ fontSize: '12px', color: '#A2B5BD', textDecoration: 'none' }}>
              ← Back to Hotel Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 'var(--header-height, 96px)', backgroundColor: '#F7F7F2', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* Top Banner Header */}
      <section
        style={{
          backgroundColor: '#0F2A33',
          color: '#FFFFFF',
          padding: '36px 0 28px',
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
                  POSTGRESQL LIVE CRUD
                </span>
                <span style={{ fontSize: '12px', color: '#A2B5BD' }}>
                  Connected to: <strong>grand_addis_db</strong> (port 5432)
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', fontWeight: 500, margin: 0 }}>
                Hotel Operations & Database Management
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={loadAllData}
                disabled={refreshing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                <span>Refresh DB</span>
              </button>

              <Link
                href="/rooms-reservation"
                className="btn btn-primary"
                style={{ padding: '9px 18px', fontSize: '13px' }}
              >
                <span>Guest Booking Portal</span>
                <ExternalLink size={14} />
              </Link>

              {/* Admin Profile & Logout */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: '#E49951',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px',
                  }}
                >
                  A
                </div>
                <div style={{ fontSize: '12px', lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{adminUser?.username || 'admin'}</div>
                  <div style={{ fontSize: '10px', color: '#E49951' }}>{adminUser?.role || 'Super Admin'}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out of Dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  backgroundColor: 'rgba(220, 53, 69, 0.2)',
                  color: '#FF6B6B',
                  border: '1px solid rgba(220, 53, 69, 0.4)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Action Message Toast */}
      {actionMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#153D4B',
            color: '#FFFFFF',
            padding: '14px 22px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid #E49951',
          }}
        >
          <CheckCircle size={18} color="#E49951" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="container" style={{ marginTop: '28px' }}>
        {/* Metric Cards Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '14px',
            marginBottom: '28px',
          }}
        >
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E1DA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#838A8D', fontSize: '12px', marginBottom: '6px' }}>
              <span>Total Bookings</span>
              <Calendar size={16} color="#E49951" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#153D4B' }}>{reservations.length}</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E1DA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#838A8D', fontSize: '12px', marginBottom: '6px' }}>
              <span>Total Revenue</span>
              <DollarSign size={16} color="#153D4B" />
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#153D4B' }}>
              ETB {(overview?.stats?.reservations?.revenue || 0).toLocaleString()}
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E1DA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#838A8D', fontSize: '12px', marginBottom: '6px' }}>
              <span>Room Types</span>
              <Bed size={16} color="#E49951" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#153D4B' }}>{roomTypes.length}</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E1DA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#838A8D', fontSize: '12px', marginBottom: '6px' }}>
              <span>Physical Rooms</span>
              <Bed size={16} color="#153D4B" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#153D4B' }}>{rooms.length}</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E1DA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#838A8D', fontSize: '12px', marginBottom: '6px' }}>
              <span>Menu Dishes</span>
              <Utensils size={16} color="#E49951" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#153D4B' }}>{dining.length}</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E1DA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#838A8D', fontSize: '12px', marginBottom: '6px' }}>
              <span>Spa Treatments</span>
              <Flower2 size={16} color="#153D4B" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#153D4B' }}>{spa.length}</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '18px', border: '1px solid #E2E1DA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#838A8D', fontSize: '12px', marginBottom: '6px' }}>
              <span>Transactions</span>
              <CreditCard size={16} color="#00A36C" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#00A36C' }}>{payments.length}</div>
          </div>

          <div
            onClick={() => setActiveTab('roomTypes')}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '18px',
              border: '1px solid #E2E1DA',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#838A8D', fontSize: '12px', marginBottom: '6px' }}>
              <span>Universal Forex</span>
              <span style={{ fontSize: '10px', backgroundColor: '#E49951', color: '#FFFFFF', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>LIVE</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#E49951' }}>
              1 $ = {universalRate} Br
            </div>
            <div style={{ fontSize: '11px', color: '#838A8D', marginTop: '4px' }}>Click to manage rate</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            borderBottom: '2px solid #E2E1DA',
            marginBottom: '24px',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'reservations', label: 'Bookings & Dates', icon: Calendar, count: reservations.length },
            { id: 'payments', label: 'Payments & Transactions', icon: CreditCard, count: payments.length },
            { id: 'roomTypes', label: 'Room Catalog & Prices', icon: Bed, count: roomTypes.length },
            { id: 'rooms', label: 'Physical Rooms', icon: Bed, count: rooms.length },
            { id: 'dining', label: 'Dining Menu', icon: Utensils, count: dining.length },
            { id: 'spa', label: 'Spa Treatments', icon: Flower2, count: spa.length },
            { id: 'messages', label: 'Guest Messages', icon: Mail, count: messages.length + eventInquiries.length },
            { id: 'testimonials', label: 'Reviews', icon: Star, count: testimonials.length },
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
                  padding: '12px 18px',
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
                    padding: '2px 7px',
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

        {/* ============================================================== */}
        {/* TAB 1: RESERVATIONS (DATE EDITING, GUESTS, AMOUNTS, CRUD) */}
        {/* ============================================================== */}
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
                  Manage Bookings & Date Modifications
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#838A8D' }}>
                  Click Edit on any booking to change check-in / check-out dates, guest contacts, room assignments, or amounts
                </p>
              </div>

              <button
                onClick={() => {
                  const today = getTodayDateStr();
                  const tomorrow = addDays(today, 2);
                  const rt = roomTypes[0];
                  const rate = rt ? Number(rt.basePriceUSD) : 50;
                  const initialTotal = Math.round(2 * rate * 1.15 * 100) / 100;
                  setEditReservationModal({
                    guestName: '',
                    guestEmail: '',
                    guestPhone: '',
                    checkInDate: today,
                    checkOutDate: tomorrow,
                    roomTypeId: roomTypes[0]?.id || '',
                    adultsCount: 2,
                    childrenCount: 0,
                    totalAmount: initialTotal,
                    currency: 'USD',
                    status: 'CONFIRMED',
                    specialRequests: '',
                  });
                  setIsCreatingReservation(true);
                }}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <Plus size={16} />
                <span>New Booking</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F7F7F2', borderBottom: '1px solid #E2E1DA', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Ref & Dates</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Guest</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Room Type</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Total Billing</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r, idx) => {
                    const statusColors: any = {
                      CONFIRMED: { bg: '#EBF8F0', text: '#28A745' },
                      CHECKED_IN: { bg: '#E6F0FA', text: '#0066CC' },
                      CHECKED_OUT: { bg: '#F2F2F2', text: '#666666' },
                      PENDING: { bg: '#FFF8E6', text: '#D97706' },
                      CANCELLED: { bg: '#FDF0ED', text: '#DC3545' },
                    };
                    const col = statusColors[r.status] || statusColors.PENDING;

                    return (
                      <tr key={`${r.id}-${idx}`} style={{ borderBottom: '1px solid #F0EFEB' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, color: '#153D4B' }}>{r.bookingRef}</div>
                          <div style={{ fontSize: '12px', color: '#E49951', fontWeight: 500, marginTop: '2px' }}>
                            📅 {r.checkInDate} → {r.checkOutDate}
                          </div>
                          {r.isDateExtended && (
                            <div style={{ marginTop: '5px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: r.dateChangeNote?.toLowerCase().includes('shorten') ? '#EFF6FF' : '#FEF3C7',
                                  color: r.dateChangeNote?.toLowerCase().includes('shorten') ? '#1E40AF' : '#B45309',
                                  border: r.dateChangeNote?.toLowerCase().includes('shorten') ? '1px solid #93C5FD' : '1px solid #F59E0B',
                                  borderRadius: '6px',
                                  padding: '2px 7px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                }}
                              >
                                {r.dateChangeNote?.toLowerCase().includes('shorten') ? '🚩 Stay Shortened' : '🚩 Stay Extended'}
                              </span>
                              {r.dateChangeNote && (
                                <div style={{ fontSize: '10px', color: '#838A8D', marginTop: '2px', maxWidth: '190px', lineHeight: 1.25 }}>
                                  {r.dateChangeNote}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 600, color: '#153D4B' }}>
                            {r.firstName} {r.lastName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#838A8D' }}>{r.email}</div>
                          <div style={{ fontSize: '11px', color: '#838A8D' }}>{r.phoneNumber}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 500, color: '#153D4B' }}>{r.roomTypeName}</div>
                          {r.roomNumber && (
                            <span style={{ fontSize: '11px', color: '#5E6E75' }}>Assigned: Room {r.roomNumber}</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 600, color: '#153D4B' }}>
                          {r.currency} {Number(r.totalAmount).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: col.bg,
                              color: col.text,
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setEditReservationModal({
                                  id: r.id,
                                  bookingRef: r.bookingRef,
                                  guestName: `${r.firstName} ${r.lastName}`.trim(),
                                  guestEmail: r.email,
                                  guestPhone: r.phoneNumber,
                                  checkInDate: r.checkInDate,
                                  checkOutDate: r.checkOutDate,
                                  roomTypeId: r.roomTypeId,
                                  roomId: r.roomId,
                                  adultsCount: r.adultsCount,
                                  childrenCount: r.childrenCount,
                                  totalAmount: r.totalAmount,
                                  currency: r.currency,
                                  status: r.status,
                                  specialRequests: r.specialRequests || '',
                                  isDateExtended: r.isDateExtended,
                                  dateChangeNote: r.dateChangeNote,
                                });
                                setIsCreatingReservation(false);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                backgroundColor: '#153D4B',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              <Edit size={13} />
                              <span>Edit Dates</span>
                            </button>

                            <button
                              onClick={() => handleDeleteReservation(r.id, r.bookingRef)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#FFF0F0',
                                color: '#DC3545',
                                border: '1px solid #FDCBCB',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
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

        {/* ============================================================== */}
        {/* TAB: PAYMENTS & TRANSACTIONS (CHAPA, TELEBIRR, CBE BIRR, SKINA) */}
        {/* ============================================================== */}
        {activeTab === 'payments' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E1DA', overflow: 'hidden' }}>
            {/* Header & Controls */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E1DA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#153D4B', fontWeight: 600 }}>
                  Payments & Multi-Gateway Transactions
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#838A8D' }}>
                  Live processing logs for Chapa, Telebirr, CBE Birr / CEB, Skina Card Pay, & Front Desk Cash
                </p>
              </div>

              {/* Real-time Search Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '280px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#838A8D' }} />
                  <input
                    type="text"
                    placeholder="Search by txRef, booking ref, guest..."
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      borderRadius: '8px',
                      border: '1px solid #D5D4CC',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Micro-Metrics Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                padding: '16px 24px',
                backgroundColor: '#FBF9F4',
                borderBottom: '1px solid #E2E1DA',
              }}
            >
              <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E1DA' }}>
                <span style={{ fontSize: '11px', color: '#838A8D', textTransform: 'uppercase', fontWeight: 600 }}>Total Collected (ETB)</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#00A36C', marginTop: '2px' }}>
                  {payments
                    .filter((p) => p.status === 'SUCCESS' && p.currency === 'ETB')
                    .reduce((acc, p) => acc + Number(p.amount || 0), 0)
                    .toLocaleString()}{' '}
                  ETB
                </div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E1DA' }}>
                <span style={{ fontSize: '11px', color: '#838A8D', textTransform: 'uppercase', fontWeight: 600 }}>Total Collected (USD)</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#153D4B', marginTop: '2px' }}>
                  $
                  {payments
                    .filter((p) => p.status === 'SUCCESS' && p.currency === 'USD')
                    .reduce((acc, p) => acc + Number(p.amount || 0), 0)
                    .toLocaleString()}
                </div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E1DA' }}>
                <span style={{ fontSize: '11px', color: '#838A8D', textTransform: 'uppercase', fontWeight: 600 }}>Successful Transactions</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#10B981', marginTop: '2px' }}>
                  {payments.filter((p) => p.status === 'SUCCESS').length} / {payments.length}
                </div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E1DA' }}>
                <span style={{ fontSize: '11px', color: '#838A8D', textTransform: 'uppercase', fontWeight: 600 }}>Pending Collections</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#D97706', marginTop: '2px' }}>
                  {payments.filter((p) => p.status === 'PENDING').length}
                </div>
              </div>
            </div>

            {/* Filter Pills Toolbar */}
            <div
              style={{
                padding: '12px 24px',
                borderBottom: '1px solid #E2E1DA',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: '12px',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
              }}
            >
              {/* Provider Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#838A8D', marginRight: '4px' }}>Gateway:</span>
                {[
                  { id: 'ALL', label: 'All Gateways' },
                  { id: 'CHAPA', label: 'Chapa', color: '#00A36C' },
                  { id: 'TELEBIRR', label: 'Telebirr', color: '#0072CE' },
                  { id: 'CBE_BIRR', label: 'CBE Birr', color: '#6E2585' },
                  { id: 'SKINA', label: 'Skina Card', color: '#153D4B' },
                  { id: 'CASH_ON_ARRIVAL', label: 'Front Desk Cash', color: '#E49951' },
                ].map((prov) => {
                  const isSel = paymentProviderFilter === prov.id;
                  const count =
                    prov.id === 'ALL'
                      ? payments.length
                      : payments.filter((p) => p.provider === prov.id).length;
                  return (
                    <button
                      key={prov.id}
                      onClick={() => setPaymentProviderFilter(prov.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: isSel ? `1px solid ${prov.color || '#153D4B'}` : '1px solid #E2E1DA',
                        backgroundColor: isSel ? prov.color || '#153D4B' : '#FFFFFF',
                        color: isSel ? '#FFFFFF' : '#5E6E75',
                        fontSize: '11px',
                        fontWeight: isSel ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {prov.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Status Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#838A8D', marginRight: '4px' }}>Status:</span>
                {['ALL', 'SUCCESS', 'PENDING', 'REFUNDED'].map((st) => {
                  const isSel = paymentStatusFilter === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setPaymentStatusFilter(st)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: isSel ? '1px solid #153D4B' : '1px solid #E2E1DA',
                        backgroundColor: isSel ? '#153D4B' : '#FFFFFF',
                        color: isSel ? '#FFFFFF' : '#5E6E75',
                        fontSize: '11px',
                        fontWeight: isSel ? 600 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9F9F6', borderBottom: '1px solid #E2E1DA', color: '#838A8D', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 600 }}>Tx Reference</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600 }}>Booking & Room</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600 }}>Guest</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600 }}>Gateway</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600 }}>Date & Time</th>
                    <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments
                    .filter((p) => {
                      if (paymentProviderFilter !== 'ALL' && p.provider !== paymentProviderFilter) return false;
                      if (paymentStatusFilter !== 'ALL' && p.status !== paymentStatusFilter) return false;
                      if (paymentSearch.trim()) {
                        const q = paymentSearch.toLowerCase();
                        const matchTx = (p.txRef || '').toLowerCase().includes(q);
                        const matchBooking = (p.bookingRef || '').toLowerCase().includes(q);
                        const matchGuest = `${p.firstName || ''} ${p.lastName || ''} ${p.guestEmail || ''}`.toLowerCase().includes(q);
                        if (!matchTx && !matchBooking && !matchGuest) return false;
                      }
                      return true;
                    })
                    .map((p) => {
                      // Provider badge styles
                      const providerStyles: Record<string, { bg: string; color: string; label: string }> = {
                        CHAPA: { bg: '#E8F8F1', color: '#00A36C', label: 'Chapa' },
                        TELEBIRR: { bg: '#E6F1FA', color: '#0072CE', label: 'Telebirr' },
                        CBE_BIRR: { bg: '#F5ECF8', color: '#6E2585', label: 'CBE Birr' },
                        SKINA: { bg: '#EBF1F4', color: '#153D4B', label: 'Skina Card' },
                        CASH_ON_ARRIVAL: { bg: '#FDF9F4', color: '#E49951', label: 'Cash Front Desk' },
                      };
                      const pStyle = providerStyles[p.provider] || { bg: '#F3F4F6', color: '#4B5563', label: p.provider };

                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #ECEBE5', transition: 'background-color 0.15s' }}>
                          <td style={{ padding: '12px 18px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <code style={{ fontSize: '11px', color: '#153D4B', fontWeight: 600 }}>
                                {p.txRef}
                              </code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(p.txRef);
                                  notify('Transaction reference copied');
                                }}
                                title="Copy TxRef"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#838A8D' }}
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                            {p.gatewayRef && (
                              <div style={{ fontSize: '10px', color: '#838A8D', marginTop: '2px' }}>
                                GW: {p.gatewayRef}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '12px 18px' }}>
                            <div style={{ fontWeight: 600, color: '#E49951', fontSize: '12px' }}>
                              {p.bookingRef || 'Direct Settle'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#5E6E75' }}>
                              {p.roomTypeName || 'Room Stay'}
                            </div>
                          </td>

                          <td style={{ padding: '12px 18px' }}>
                            <div style={{ fontWeight: 600, color: '#153D4B' }}>
                              {p.firstName ? `${p.firstName} ${p.lastName}` : 'Guest Customer'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#838A8D' }}>
                              {p.guestEmail || p.guestPhone || 'No contact specified'}
                            </div>
                          </td>

                          <td style={{ padding: '12px 18px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: pStyle.bg,
                                color: pStyle.color,
                              }}
                            >
                              {pStyle.label}
                            </span>
                          </td>

                          <td style={{ padding: '12px 18px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 700, color: '#153D4B', fontSize: '14px' }}>
                              {p.currency === 'ETB'
                                ? `${Number(p.amount).toLocaleString()} ETB`
                                : `$${Number(p.amount).toLocaleString()}`}
                            </div>
                            <span style={{ fontSize: '10px', color: '#838A8D' }}>
                              Currency: {p.currency}
                            </span>
                          </td>

                          <td style={{ padding: '12px 18px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor:
                                  p.status === 'SUCCESS' ? '#DEF7EC' : p.status === 'PENDING' ? '#FEF3C7' : '#F3F4F6',
                                color:
                                  p.status === 'SUCCESS' ? '#03543F' : p.status === 'PENDING' ? '#92400E' : '#4B5563',
                              }}
                            >
                              {p.status === 'SUCCESS' ? '✓ SUCCESS' : p.status === 'PENDING' ? '⏳ PENDING' : p.status}
                            </span>
                          </td>

                          <td style={{ padding: '12px 18px', fontSize: '11px', color: '#838A8D', whiteSpace: 'nowrap' }}>
                            <div>{new Date(p.createdAt).toLocaleDateString()}</div>
                            <div>{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>

                          <td style={{ padding: '12px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              {p.status !== 'SUCCESS' ? (
                                <button
                                  onClick={() => handleUpdatePaymentStatus(p.id, 'SUCCESS')}
                                  title="Mark Verified & Paid"
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #10B981',
                                    backgroundColor: '#ECFDF5',
                                    color: '#047857',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Mark Paid
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdatePaymentStatus(p.id, 'REFUNDED')}
                                  title="Refund Transaction"
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #D1D5DB',
                                    backgroundColor: '#F9FAFB',
                                    color: '#4B5563',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Refund
                                </button>
                              )}

                              <button
                                onClick={() => setViewPaymentModal(p)}
                                title="Inspect & Print Receipt"
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #E2E1DA',
                                  backgroundColor: '#FFFFFF',
                                  color: '#153D4B',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                }}
                              >
                                Receipt
                              </button>

                              <button
                                onClick={() => handleDeletePayment(p.id)}
                                title="Delete Record"
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #FEE2E2',
                                  backgroundColor: '#FEF2F2',
                                  color: '#DC2626',
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: '#838A8D' }}>
                        No payment records registered in PostgreSQL yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ROOM TYPES & CATALOG (PRICE EDITING, IMAGES, CRUD) */}
        {/* ============================================================== */}
        {activeTab === 'roomTypes' && (
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
                  Room Categories, Prices & Gallery Management
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#838A8D' }}>
                  Manage rates in USD ($) and ETB, upload or reorder photos, edit capacities, sizes, and amenities
                </p>
              </div>

              <button
                onClick={() => {
                  setEditRoomTypeModal({
                    name: '',
                    slug: '',
                    category: 'Hotel Rooms',
                    size: '32 m²',
                    bedType: 'King Bed',
                    view: 'City View',
                    basePriceUSD: 75,
                    basePriceETB: 8500,
                    baseCapacity: 2,
                    maxCapacity: 3,
                    description: '',
                    amenities: ['High-speed Wi-Fi', 'Air Conditioning', 'En-suite Marble Bath', 'Smart TV'],
                    images: ['/images/BO5A5826-scaled.jpg', '/images/vikbooking/bo5a5878.jpg'],
                    featured: true,
                    aliases: [],
                  });
                  setIsCreatingRoomType(true);
                }}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <Plus size={16} />
                <span>Add Room Type</span>
              </button>
            </div>

            {/* ============================================================== */}
            {/* UNIVERSAL FOREX / EXCHANGE RATE CONTROLLER */}
            {/* ============================================================== */}
            <div
              style={{
                margin: '20px 24px 0',
                padding: '22px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0F2A33 0%, #153D4B 100%)',
                color: '#FFFFFF',
                boxShadow: '0 4px 16px rgba(15, 42, 51, 0.15)',
                border: '1px solid #1E4E5F',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span
                      style={{
                        backgroundColor: '#E49951',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Global Forex Engine
                    </span>
                    <span style={{ fontSize: '13px', color: '#A2B5BD' }}>Live USD to Ethiopian Birr (ETB) Converter</span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#FFFFFF' }}>
                    Universal Exchange Rate: 1 USD = <span style={{ color: '#E49951' }}>{universalRate} ETB</span>
                  </h4>
                  <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#B5C4CB', maxWidth: '680px', lineHeight: '1.5' }}>
                    Updating this rate automatically recalculates prices across room cards, booking modals, direct reservations, and checkout totals site-wide in real-time.
                  </p>
                </div>

                {/* Quick Status / Reset */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => {
                      loadAllData();
                      notify('Exchange rate synced with database');
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
                    <span>Refresh Rate</span>
                  </button>
                </div>
              </div>

              {rateSaveSuccess && (
                <div
                  style={{
                    backgroundColor: 'rgba(0, 163, 108, 0.2)',
                    border: '1px solid #00A36C',
                    color: '#A3E635',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle size={18} color="#00A36C" />
                  <span>{rateSaveSuccess}</span>
                </div>
              )}

              {/* Rate Adjustment Controls */}
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.22)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>1 USD =</span>
                    <div style={{ position: 'relative', width: '130px' }}>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        value={tempUniversalRate}
                        onChange={(e) => setTempUniversalRate(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveUniversalRate();
                          }
                        }}
                        placeholder="e.g. 189"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 14px',
                          borderRadius: '8px',
                          border: '2px solid #E49951',
                          backgroundColor: '#09191F',
                          color: '#FFFFFF',
                          fontSize: '18px',
                          fontWeight: 700,
                          outline: 'none',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#E49951' }}>ETB (Birr)</span>
                  </div>

                  {/* Preset quick buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#8BA1AB', marginRight: '4px' }}>Presets:</span>
                    {[180, 185, 189, 190, 195, 200].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTempUniversalRate(preset.toString())}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: tempUniversalRate === preset.toString() ? '1px solid #E49951' : '1px solid rgba(255,255,255,0.15)',
                          backgroundColor: tempUniversalRate === preset.toString() ? 'rgba(228, 153, 81, 0.25)' : 'rgba(255,255,255,0.06)',
                          color: tempUniversalRate === preset.toString() ? '#E49951' : '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#CAD5DA', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={syncRoomsWithRate}
                      onChange={(e) => setSyncRoomsWithRate(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#E49951', cursor: 'pointer' }}
                    />
                    <span>Auto-sync all room catalog Birr prices (USD × Rate)</span>
                  </label>

                  <button
                    onClick={() => handleSaveUniversalRate()}
                    disabled={isSavingRate}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '8px',
                      backgroundColor: '#E49951',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: isSavingRate ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(228, 153, 81, 0.3)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Sparkles size={16} />
                    <span>{isSavingRate ? 'Applying Rate...' : 'Save & Update Whole Site'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              {roomTypes.map((rt) => (
                <div
                  key={rt.id}
                  style={{
                    border: '1px solid #E2E1DA',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Photo Strip */}
                  <div style={{ position: 'relative', height: '180px', backgroundColor: '#0F2A33' }}>
                    {rt.images && rt.images.length > 0 ? (
                      <img
                        src={rt.images[0]}
                        alt={rt.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#A2B5BD' }}>
                        No Image
                      </div>
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: 'rgba(15, 42, 51, 0.85)',
                        color: '#E49951',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {rt.category}
                    </span>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        color: '#FFFFFF',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <ImageIcon size={13} />
                      {rt.images?.length || 0} Photos
                    </span>
                  </div>

                  {/* Body Details */}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '18px', color: '#153D4B', fontWeight: 600 }}>{rt.name}</h4>
                    </div>

                    <div style={{ fontSize: '12px', color: '#838A8D', marginBottom: '14px' }}>
                      Slug: <code>{rt.slug}</code>
                    </div>

                    {/* Dual Pricing Badge with Quick Price Edit Button */}
                    <div
                      style={{
                        padding: '12px',
                        backgroundColor: '#FDF9F4',
                        border: '1px solid #F5E6D3',
                        borderRadius: '8px',
                        marginBottom: '14px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '11px', color: '#838A8D', textTransform: 'uppercase' }}>USD Rate</div>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#E49951' }}>${rt.basePriceUSD} / night</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: '#838A8D', textTransform: 'uppercase' }}>ETB Rate</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#153D4B' }}>{Number(rt.basePriceETB).toLocaleString()} Br</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setQuickPriceModal({
                            id: rt.id,
                            name: rt.name,
                            basePriceUSD: rt.basePriceUSD,
                            basePriceETB: rt.basePriceETB,
                          })
                        }
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(228, 153, 81, 0.15)',
                          color: '#C57E37',
                          border: '1px dashed #E49951',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <DollarSign size={13} />
                        <span>Quick Edit Price ($ / Br)</span>
                      </button>
                    </div>

                    {/* Specs Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px', fontSize: '12px' }}>
                      <span style={{ padding: '3px 8px', backgroundColor: '#F7F7F2', borderRadius: '4px', color: '#5E6E75' }}>
                        📐 {rt.size || '32 m²'}
                      </span>
                      <span style={{ padding: '3px 8px', backgroundColor: '#F7F7F2', borderRadius: '4px', color: '#5E6E75' }}>
                        🛏️ {rt.bedType || 'King Bed'}
                      </span>
                      <span style={{ padding: '3px 8px', backgroundColor: '#F7F7F2', borderRadius: '4px', color: '#5E6E75' }}>
                        👥 {rt.baseCapacity}-{rt.maxCapacity} Guests
                      </span>
                      <span style={{ padding: '3px 8px', backgroundColor: '#F7F7F2', borderRadius: '4px', color: '#5E6E75' }}>
                        🌆 {rt.view || 'City View'}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#5E6E75', lineHeight: '1.5', flex: 1 }}>
                      {rt.description?.slice(0, 110)}...
                    </p>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F0EFEB', paddingTop: '14px' }}>
                      <button
                        onClick={() => {
                          setEditRoomTypeModal({ ...rt });
                          setIsCreatingRoomType(false);
                        }}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: '#153D4B',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        <Edit size={14} />
                        <span>Edit Price & Photos</span>
                      </button>

                      <button
                        onClick={() => handleDeleteRoomType(rt.id, rt.name)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#FFF0F0',
                          color: '#DC3545',
                          border: '1px solid #FDCBCB',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: PHYSICAL ROOMS INVENTORY */}
        {/* ============================================================== */}
        {activeTab === 'rooms' && (
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
                  Physical Rooms & Floor Inventory
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#838A8D' }}>
                  Manage individual room numbers, floor levels, type mapping, and occupancy states
                </p>
              </div>

              <button
                onClick={() => {
                  setEditPhysicalRoomModal({
                    roomNumber: '',
                    floor: 1,
                    roomTypeId: roomTypes[0]?.id || '',
                    status: 'AVAILABLE',
                  });
                  setIsCreatingPhysicalRoom(true);
                }}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <Plus size={16} />
                <span>Add Room Number</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F7F7F2', borderBottom: '1px solid #E2E1DA', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Room Number</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Floor</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Room Type</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((rm) => {
                    const statusBg: any = {
                      AVAILABLE: '#EBF8F0',
                      OCCUPIED: '#FFF8E6',
                      MAINTENANCE: '#FDF0ED',
                      OUT_OF_SERVICE: '#F2F2F2',
                    };
                    const statusColor: any = {
                      AVAILABLE: '#28A745',
                      OCCUPIED: '#D97706',
                      MAINTENANCE: '#DC3545',
                      OUT_OF_SERVICE: '#666666',
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
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setEditPhysicalRoomModal({ ...rm });
                                setIsCreatingPhysicalRoom(false);
                              }}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#153D4B',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePhysicalRoom(rm.id, rm.roomNumber)}
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#FFF0F0',
                                color: '#DC3545',
                                border: '1px solid #FDCBCB',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
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

        {/* ============================================================== */}
        {/* TAB 4: DINING MENU CRUD */}
        {/* ============================================================== */}
        {activeTab === 'dining' && (
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
                  Dining & Restaurant Menu Items
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#838A8D' }}>
                  Manage food & beverage prices, descriptions, categories, and chef tags
                </p>
              </div>

              <button
                onClick={() => {
                  setEditDishModal({
                    name: '',
                    category: 'main',
                    price: 28,
                    description: '',
                    tag: '',
                  });
                  setIsCreatingDish(true);
                }}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <Plus size={16} />
                <span>Add Dish / Item</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F7F7F2', borderBottom: '1px solid #E2E1DA', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Dish Name</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Price</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dining.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F0EFEB' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#153D4B' }}>{item.name}</div>
                        {item.tag && (
                          <span style={{ fontSize: '11px', color: '#E49951', fontWeight: 600 }}>
                            ★ {item.tag}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', textTransform: 'capitalize', color: '#5E6E75' }}>
                        {item.category}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#E49951', fontSize: '14px' }}>
                        ${Number(item.price).toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#5E6E75', maxWidth: '360px' }}>
                        {item.description}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setEditDishModal({ ...item });
                              setIsCreatingDish(false);
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#153D4B',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDish(item.id, item.name)}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#FFF0F0',
                              color: '#DC3545',
                              border: '1px solid #FDCBCB',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: SPA TREATMENTS CRUD */}
        {/* ============================================================== */}
        {activeTab === 'spa' && (
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
                  Wellness & Spa Treatments
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#838A8D' }}>
                  Manage treatment pricing, duration, category, and descriptions
                </p>
              </div>

              <button
                onClick={() => {
                  setEditSpaModal({
                    name: '',
                    category: 'Massage Therapy',
                    duration: '60 mins',
                    price: 65,
                    description: '',
                  });
                  setIsCreatingSpa(true);
                }}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <Plus size={16} />
                <span>Add Spa Service</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F7F7F2', borderBottom: '1px solid #E2E1DA', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Treatment</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Duration</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Price</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '12px 18px', color: '#5E6E75', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {spa.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F0EFEB' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#153D4B' }}>{s.name}</td>
                      <td style={{ padding: '14px 18px', color: '#5E6E75' }}>{s.category}</td>
                      <td style={{ padding: '14px 18px', color: '#5E6E75' }}>{s.duration}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#E49951', fontSize: '14px' }}>
                        ${Number(s.price).toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#5E6E75', maxWidth: '360px' }}>
                        {s.description}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setEditSpaModal({ ...s });
                              setIsCreatingSpa(false);
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#153D4B',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSpa(s.id, s.name)}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#FFF0F0',
                              color: '#DC3545',
                              border: '1px solid #FDCBCB',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: MESSAGES & PROPOSALS */}
        {/* ============================================================== */}
        {activeTab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E1DA', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E1DA' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#153D4B', fontWeight: 600 }}>
                  Contact Inquiries ({messages.length})
                </h3>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {messages.length === 0 ? (
                  <p style={{ color: '#838A8D', textAlign: 'center', margin: '30px 0' }}>No contact inquiries yet.</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#F7F7F2', border: '1px solid #E8E7DF' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ color: '#153D4B', fontSize: '15px' }}>{m.subject}</strong>
                        <span style={{ fontSize: '12px', color: '#838A8D' }}>{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#4B5563', lineHeight: '1.5' }}>{m.message}</p>
                      <div style={{ fontSize: '12px', color: '#838A8D' }}>
                        From: <strong>{m.name}</strong> • <a href={`mailto:${m.email}`} style={{ color: '#E49951' }}>{m.email}</a> {m.phone ? `• ${m.phone}` : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E1DA', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E1DA' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#153D4B', fontWeight: 600 }}>
                  Weddings & Events RFPs ({eventInquiries.length})
                </h3>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {eventInquiries.length === 0 ? (
                  <p style={{ color: '#838A8D', textAlign: 'center', margin: '30px 0' }}>No event inquiries yet.</p>
                ) : (
                  eventInquiries.map((ev) => (
                    <div key={ev.id} style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#F7F7F2', border: '1px solid #E8E7DF' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ color: '#153D4B', fontSize: '15px' }}>
                          {ev.event_type} ({ev.guests_count} Guests)
                        </strong>
                        <span style={{ fontSize: '12px', color: '#838A8D' }}>
                          Target: {new Date(ev.target_date).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#4B5563', lineHeight: '1.5' }}>
                        {ev.details || 'No additional details'}
                      </p>
                      <div style={{ fontSize: '12px', color: '#838A8D' }}>
                        Planner: <strong>{ev.name}</strong> • <a href={`mailto:${ev.email}`} style={{ color: '#E49951' }}>{ev.email}</a> • {ev.phone}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: TESTIMONIALS & REVIEWS CRUD */}
        {/* ============================================================== */}
        {activeTab === 'testimonials' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E1DA', overflow: 'hidden' }}>
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #E2E1DA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#153D4B', fontWeight: 600 }}>
                  Guest Testimonials & Review Moderation
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#838A8D' }}>
                  Edit reviews, star ratings, or approve/reject guest feedback
                </p>
              </div>
            </div>

            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {testimonials.map((t) => (
                <div key={t.id} style={{ padding: '20px', borderRadius: '10px', backgroundColor: '#F7F7F2', border: '1px solid #E2E1DA', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ color: '#E49951', display: 'flex', gap: '2px' }}>
                      {[...Array(t.rating || 5)].map((_, i) => (
                        <Star key={i} size={14} fill="#E49951" color="#E49951" />
                      ))}
                    </div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '10px',
                        fontWeight: 600,
                        backgroundColor: t.status === 'APPROVED' ? '#EBF8F0' : '#FFF8E6',
                        color: t.status === 'APPROVED' ? '#28A745' : '#D97706',
                      }}
                    >
                      {t.status || 'APPROVED'}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#153D4B', fontWeight: 600 }}>{t.title}</h4>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#5E6E75', lineHeight: '1.6', flex: 1 }}>{t.comment}</p>
                  
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '14px' }}>
                    {t.name} <span style={{ fontWeight: 400, color: '#838A8D' }}>— {t.location}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #E8E7DF', paddingTop: '12px' }}>
                    <button
                      onClick={() => setEditTestimonialModal({ ...t })}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        backgroundColor: '#153D4B',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Edit Review
                    </button>
                    <button
                      onClick={() => handleDeleteTestimonial(t.id)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#FFF0F0',
                        color: '#DC3545',
                        border: '1px solid #FDCBCB',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 0: QUICK ROOM PRICE EDITOR (1-CLICK INSTANT RATE CHANGER) */}
      {/* ========================================================================= */}
      {quickPriceModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '18px 24px',
                backgroundColor: '#0F2A33',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(228, 153, 81, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E49951' }}>
                  <DollarSign size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Quick Price Editor</h3>
                  <div style={{ fontSize: '11px', color: '#E49951' }}>{quickPriceModal.name}</div>
                </div>
              </div>
              <button
                onClick={() => setQuickPriceModal(null)}
                style={{ background: 'none', border: 'none', color: '#A2B5BD', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickPriceSave} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Base Rate in US Dollars ($ / night)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#E49951' }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={quickPriceModal.basePriceUSD}
                    onChange={(e) => {
                      const usd = parseFloat(e.target.value) || 0;
                      setQuickPriceModal({
                        ...quickPriceModal,
                        basePriceUSD: e.target.value,
                        basePriceETB: Math.round(usd * universalRate),
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 28px',
                      borderRadius: '8px',
                      border: '1px solid #D5D4CC',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#153D4B',
                      outline: 'none',
                    }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: '#838A8D', marginTop: '3px', display: 'block' }}>
                  Updating USD automatically recalculates ETB at the active universal rate (1 USD = {universalRate} ETB). Can be manually adjusted below.
                </span>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Base Rate in Ethiopian Birr (ETB / night)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#153D4B' }}>Br</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={quickPriceModal.basePriceETB}
                    onChange={(e) =>
                      setQuickPriceModal({
                        ...quickPriceModal,
                        basePriceETB: e.target.value,
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 36px',
                      borderRadius: '8px',
                      border: '1px solid #D5D4CC',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#153D4B',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #F0EFEB', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setQuickPriceModal(null)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #D5D4CC',
                    backgroundColor: '#FFFFFF',
                    color: '#5E6E75',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuickPrice}
                  className="btn btn-primary"
                  style={{
                    padding: '10px 22px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isSavingQuickPrice ? 'wait' : 'pointer',
                  }}
                >
                  {isSavingQuickPrice ? 'Updating...' : 'Update Price in PostgreSQL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ROOM TYPE & PRICING & IMAGES EDITOR (CRUD) */}
      {/* ========================================================================= */}
      {editRoomTypeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                padding: '20px 28px',
                borderBottom: '1px solid #E2E1DA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0F2A33',
                color: '#FFFFFF',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  {isCreatingRoomType ? 'Add New Room Type' : `Edit: ${editRoomTypeModal.name}`}
                </h3>
                <span style={{ fontSize: '12px', color: '#E49951' }}>
                  Manage Dual Currency Pricing, Photo Gallery & Specifications
                </span>
              </div>
              <button
                onClick={() => setEditRoomTypeModal(null)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRoomType} style={{ padding: '24px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Room Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editRoomTypeModal.name || ''}
                    onChange={(e) => setEditRoomTypeModal({ ...editRoomTypeModal, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={editRoomTypeModal.slug || ''}
                    onChange={(e) => setEditRoomTypeModal({ ...editRoomTypeModal, slug: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* DUAL PRICING EDITING SECTION */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#FDF9F4',
                  border: '1px solid #E8D7C3',
                  borderRadius: '10px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontWeight: 600, color: '#153D4B', fontSize: '14px', marginBottom: '10px' }}>
                  💰 Rate Configuration (Dual Currency)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#E49951', marginBottom: '4px' }}>
                      Price in USD ($ / night) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editRoomTypeModal.basePriceUSD || ''}
                      onChange={(e) => {
                        const usd = parseFloat(e.target.value) || 0;
                        setEditRoomTypeModal({
                          ...editRoomTypeModal,
                          basePriceUSD: e.target.value,
                          basePriceETB: usd > 0 ? Math.round(usd * universalRate) : editRoomTypeModal.basePriceETB,
                        });
                      }}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '14px', fontWeight: 600 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '4px' }}>
                      Price in ETB (Birr / night) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={editRoomTypeModal.basePriceETB || ''}
                      onChange={(e) => setEditRoomTypeModal({ ...editRoomTypeModal, basePriceETB: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '14px', fontWeight: 600 }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#838A8D', marginTop: '6px' }}>
                  💡 Universal Exchange Rate: <strong>1 USD = {universalRate} ETB</strong>. Typing USD auto-calculates Birr (or enter custom ETB).
                </div>
              </div>

              {/* IMAGE MANAGER SECTION */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#F7F7F2',
                  border: '1px solid #E2E1DA',
                  borderRadius: '10px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, color: '#153D4B', fontSize: '14px' }}>
                    🖼️ Photography Gallery ({editRoomTypeModal.images?.length || 0} images)
                  </div>
                </div>

                {/* Thumbnails list with delete X */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                  {(editRoomTypeModal.images || []).map((imgUrl: string, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        height: '75px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: idx === 0 ? '2px solid #E49951' : '1px solid #D5D4CC',
                      }}
                    >
                      <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {idx === 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '2px',
                            left: '2px',
                            backgroundColor: '#E49951',
                            color: '#FFFFFF',
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 4px',
                            borderRadius: '3px',
                          }}
                        >
                          MAIN
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...editRoomTypeModal.images];
                          updated.splice(idx, 1);
                          setEditRoomTypeModal({ ...editRoomTypeModal, images: updated });
                        }}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          backgroundColor: 'rgba(220, 53, 69, 0.85)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Upload & Add Image Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* File Upload Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: '#E49951',
                        color: '#FFFFFF',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: uploadingImage ? 'wait' : 'pointer',
                        boxShadow: '0 2px 6px rgba(228, 153, 81, 0.3)',
                      }}
                    >
                      <Upload size={14} />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Photo from Device'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={handleRoomImageUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <span style={{ fontSize: '11px', color: '#838A8D' }}>
                      Supports JPG, PNG, WEBP (Saved to /public/uploads/)
                    </span>
                  </div>

                  {/* Add Image URL / Path Row */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Or enter image URL / path (e.g. /hotel_images/1760816082.webp)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #D5D4CC', fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newImageUrl.trim()) return;
                        const imgs = editRoomTypeModal.images || [];
                        setEditRoomTypeModal({ ...editRoomTypeModal, images: [...imgs, newImageUrl.trim()] });
                        setNewImageUrl('');
                      }}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#153D4B',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              </div>

              {/* SPECS & CAPACITIES */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={editRoomTypeModal.category || 'Hotel Rooms'}
                    onChange={(e) => setEditRoomTypeModal({ ...editRoomTypeModal, category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  >
                    <option value="Hotel Rooms">Hotel Rooms</option>
                    <option value="Suites">Suites</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '4px' }}>
                    Room Size
                  </label>
                  <input
                    type="text"
                    value={editRoomTypeModal.size || '32 m²'}
                    onChange={(e) => setEditRoomTypeModal({ ...editRoomTypeModal, size: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '4px' }}>
                    Bed Type
                  </label>
                  <input
                    type="text"
                    value={editRoomTypeModal.bedType || 'King Bed'}
                    onChange={(e) => setEditRoomTypeModal({ ...editRoomTypeModal, bedType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '4px' }}>
                    View
                  </label>
                  <input
                    type="text"
                    value={editRoomTypeModal.view || 'City View'}
                    onChange={(e) => setEditRoomTypeModal({ ...editRoomTypeModal, view: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Room Description
                </label>
                <textarea
                  rows={3}
                  value={editRoomTypeModal.description || ''}
                  onChange={(e) => setEditRoomTypeModal({ ...editRoomTypeModal, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px', lineHeight: '1.5' }}
                />
              </div>

              {/* SAVE / CANCEL BUTTONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #E2E1DA', paddingTop: '18px' }}>
                <button
                  type="button"
                  onClick={() => setEditRoomTypeModal(null)}
                  style={{ padding: '10px 18px', backgroundColor: '#F0EFEB', color: '#5E6E75', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 24px' }}
                >
                  Save Room in PostgreSQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESERVATION & DATE EDITING (CRUD) */}
      {/* ========================================================================= */}
      {editReservationModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                padding: '20px 28px',
                borderBottom: '1px solid #E2E1DA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0F2A33',
                color: '#FFFFFF',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  {isCreatingReservation ? 'Create Manual Reservation' : `Edit Booking: ${editReservationModal.bookingRef}`}
                </h3>
                <span style={{ fontSize: '12px', color: '#E49951' }}>
                  Modify Check-in / Check-out Dates, Guest Details & Rates
                </span>
              </div>
              <button
                onClick={() => setEditReservationModal(null)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReservation} style={{ padding: '24px 28px' }}>
              {/* DATE PICKERS SECTION */}
                {(() => {
                  const modalNights = calculateStayNights(editReservationModal.checkInDate || '', editReservationModal.checkOutDate || '');
                  const currentRt = roomTypes.find((rt) => rt.id === editReservationModal.roomTypeId) || roomTypes[0];
                  const isETB = editReservationModal.currency === 'ETB';
                  const baseRate = currentRt ? (isETB ? Number(currentRt.basePriceETB) : Number(currentRt.basePriceUSD)) : 50;

                  const applyDateExtension = (deltaDays: number) => {
                    const newNights = Math.max(1, modalNights + deltaDays);
                    const newOut = addDays(editReservationModal.checkInDate || getTodayDateStr(), newNights);
                    const newTotal = Math.round(newNights * baseRate * 1.15 * 100) / 100;
                    const isShortened = deltaDays < 0;
                    const isChanged = newNights !== modalNights;
                    setEditReservationModal({
                      ...editReservationModal,
                      checkOutDate: newOut,
                      totalAmount: newTotal,
                      isDateExtended: isChanged || newNights > 1,
                      dateChangeNote: isShortened
                        ? `Stay shortened by ${Math.abs(deltaDays)} ${Math.abs(deltaDays) === 1 ? 'night' : 'nights'} (${newNights} nights total)`
                        : `Stay extended by +${deltaDays} ${deltaDays === 1 ? 'night' : 'nights'} (${newNights} nights total)`,
                    });
                  };

                  const handleModalCheckIn = (newIn: string) => {
                    let newOut = editReservationModal.checkOutDate || addDays(newIn, 1);
                    if (newOut <= newIn) {
                      newOut = addDays(newIn, 1);
                    }
                    const n = calculateStayNights(newIn, newOut);
                    const newTotal = Math.round(n * baseRate * 1.15 * 100) / 100;
                    const isExt = n > 1;
                    setEditReservationModal({
                      ...editReservationModal,
                      checkInDate: newIn,
                      checkOutDate: newOut,
                      totalAmount: newTotal,
                      isDateExtended: isExt,
                      dateChangeNote: isExt ? `Stay scheduled for ${n} nights (${newIn} to ${newOut})` : '',
                    });
                  };

                  const handleModalCheckOut = (newOut: string) => {
                    const cIn = editReservationModal.checkInDate || getTodayDateStr();
                    const validOut = newOut <= cIn ? addDays(cIn, 1) : newOut;
                    const n = calculateStayNights(cIn, validOut);
                    const newTotal = Math.round(n * baseRate * 1.15 * 100) / 100;
                    const isExt = n > 1;
                    setEditReservationModal({
                      ...editReservationModal,
                      checkOutDate: validOut,
                      totalAmount: newTotal,
                      isDateExtended: isExt,
                      dateChangeNote: isExt ? `Stay scheduled for ${n} nights (${cIn} to ${validOut})` : '',
                    });
                  };

                  return (
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: '#FDF9F4',
                        border: '1px solid #E8D7C3',
                        borderRadius: '10px',
                        marginBottom: '20px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontWeight: 600, color: '#153D4B', fontSize: '14px' }}>
                          📅 Reservation Dates & Auto Billing Recalculation
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#153D4B', color: '#FFFFFF', padding: '2px 8px', borderRadius: '10px' }}>
                          {modalNights} {modalNights === 1 ? 'Night' : 'Nights'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '4px' }}>
                            Check-in Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={editReservationModal.checkInDate || ''}
                            onChange={(e) => handleModalCheckIn(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '14px', fontWeight: 600 }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '4px' }}>
                            Check-out Date *
                          </label>
                          <input
                            type="date"
                            required
                            min={addDays(editReservationModal.checkInDate || getTodayDateStr(), 1)}
                            value={editReservationModal.checkOutDate || ''}
                            onChange={(e) => handleModalCheckOut(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '14px', fontWeight: 600 }}
                          />
                        </div>
                      </div>

                      {/* Quick Duration Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E8D7C3', paddingTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#5E6E75' }}>
                          Stay: <strong>{formatFriendlyDate(editReservationModal.checkInDate)} → {formatFriendlyDate(editReservationModal.checkOutDate)}</strong>
                        </span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#153D4B' }}>Quick Adjust:</span>
                          <button
                            type="button"
                            disabled={modalNights <= 1}
                            onClick={() => applyDateExtension(-1)}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #D5D4CC', backgroundColor: '#FFFFFF', fontSize: '11px', fontWeight: 600, cursor: modalNights <= 1 ? 'not-allowed' : 'pointer', color: modalNights <= 1 ? '#A0AEC0' : '#153D4B' }}
                          >
                            −1 Night
                          </button>
                          <button
                            type="button"
                            onClick={() => applyDateExtension(1)}
                            style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #E49951', backgroundColor: '#FEF3C7', color: '#B45309', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            +1 Night
                          </button>
                          <button
                            type="button"
                            onClick={() => applyDateExtension(2)}
                            style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #E49951', backgroundColor: '#FEF3C7', color: '#B45309', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            +2 Nights
                          </button>
                          <button
                            type="button"
                            onClick={() => applyDateExtension(3)}
                            style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #E49951', backgroundColor: '#FEF3C7', color: '#B45309', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            +3 Nights
                          </button>
                        </div>
                      </div>

                      {/* Date Extension / Adjustment Alert Flag Banner */}
                      {(modalNights > 1 || editReservationModal.isDateExtended) && (
                        <div
                          style={{
                            marginTop: '12px',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            backgroundColor: editReservationModal.dateChangeNote?.toLowerCase().includes('shorten') ? '#EFF6FF' : '#FEF3C7',
                            border: editReservationModal.dateChangeNote?.toLowerCase().includes('shorten') ? '1px solid #93C5FD' : '1px solid #F59E0B',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '12px',
                            color: editReservationModal.dateChangeNote?.toLowerCase().includes('shorten') ? '#1E40AF' : '#92400E',
                            fontWeight: 600,
                          }}
                        >
                          <span style={{ fontSize: '16px' }}>🚩</span>
                          <div style={{ flex: 1 }}>
                            <strong>
                              {editReservationModal.dateChangeNote?.toLowerCase().includes('shorten')
                                ? 'Stay Shortened / Decreased Notice:'
                                : 'Date Extension Notification Flag Active:'}
                            </strong>{' '}
                            <span>
                              {editReservationModal.dateChangeNote || `Stay of ${modalNights} nights (${formatFriendlyDate(editReservationModal.checkInDate)} → ${formatFriendlyDate(editReservationModal.checkOutDate)}).`} Total billing automatically adjusted to {editReservationModal.currency || 'USD'} {editReservationModal.totalAmount}.
                            </span>
                          </div>
                          <span
                            style={{
                              backgroundColor: editReservationModal.dateChangeNote?.toLowerCase().includes('shorten') ? '#2563EB' : '#F59E0B',
                              color: '#FFFFFF',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '10px',
                              fontWeight: 700,
                            }}
                          >
                            {editReservationModal.dateChangeNote?.toLowerCase().includes('shorten') ? 'Payment Decreased' : 'Payment Scaled'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* GUEST DETAILS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editReservationModal.guestName || ''}
                    onChange={(e) => setEditReservationModal({ ...editReservationModal, guestName: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Guest Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editReservationModal.guestEmail || ''}
                    onChange={(e) => setEditReservationModal({ ...editReservationModal, guestEmail: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editReservationModal.guestPhone || ''}
                    onChange={(e) => setEditReservationModal({ ...editReservationModal, guestPhone: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Reservation Status
                  </label>
                  <select
                    value={editReservationModal.status || 'CONFIRMED'}
                    onChange={(e) => setEditReservationModal({ ...editReservationModal, status: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="CHECKED_IN">CHECKED_IN</option>
                    <option value="CHECKED_OUT">CHECKED_OUT</option>
                    <option value="PENDING">PENDING</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              {/* ROOM & RATE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Room Type
                  </label>
                  <select
                    value={editReservationModal.roomTypeId || ''}
                    onChange={(e) => {
                      const newRtId = e.target.value;
                      const rt = roomTypes.find((r) => r.id === newRtId);
                      const n = calculateStayNights(editReservationModal.checkInDate || '', editReservationModal.checkOutDate || '');
                      const isETB = editReservationModal.currency === 'ETB';
                      const rate = rt ? (isETB ? Number(rt.basePriceETB) : Number(rt.basePriceUSD)) : 50;
                      const newTotal = Math.round(n * rate * 1.15 * 100) / 100;
                      setEditReservationModal({ ...editReservationModal, roomTypeId: newRtId, totalAmount: newTotal });
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  >
                    {roomTypes.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name} (${rt.basePriceUSD} / {rt.basePriceETB} Br)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Total Billing Amount
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={editReservationModal.currency || 'USD'}
                      onChange={(e) => {
                        const newCurr = e.target.value;
                        const rt = roomTypes.find((r) => r.id === editReservationModal.roomTypeId);
                        const n = calculateStayNights(editReservationModal.checkInDate || '', editReservationModal.checkOutDate || '');
                        const isETB = newCurr === 'ETB';
                        const rate = rt ? (isETB ? Number(rt.basePriceETB) : Number(rt.basePriceUSD)) : 50;
                        const newTotal = Math.round(n * rate * 1.15 * 100) / 100;
                        setEditReservationModal({ ...editReservationModal, currency: newCurr, totalAmount: newTotal });
                      }}
                      style={{ padding: '10px 8px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px', width: '80px' }}
                    >
                      <option value="USD">USD</option>
                      <option value="ETB">ETB</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={editReservationModal.totalAmount || ''}
                      onChange={(e) => setEditReservationModal({ ...editReservationModal, totalAmount: e.target.value })}
                      style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>

              {/* SPECIAL REQUESTS */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Special Requests / Guest Notes
                </label>
                <textarea
                  rows={2}
                  value={editReservationModal.specialRequests || ''}
                  onChange={(e) => setEditReservationModal({ ...editReservationModal, specialRequests: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                />
              </div>

              {/* SAVE / CANCEL BUTTONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #E2E1DA', paddingTop: '18px' }}>
                <button
                  type="button"
                  onClick={() => setEditReservationModal(null)}
                  style={{ padding: '10px 18px', backgroundColor: '#F0EFEB', color: '#5E6E75', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 24px' }}
                >
                  Save Changes to PostgreSQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DINING DISH EDITOR (CRUD) */}
      {/* ========================================================================= */}
      {editDishModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E1DA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0F2A33',
                color: '#FFFFFF',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                {isCreatingDish ? 'Add New Dish' : `Edit: ${editDishModal.name}`}
              </h3>
              <button
                onClick={() => setEditDishModal(null)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDish} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  value={editDishModal.name || ''}
                  onChange={(e) => setEditDishModal({ ...editDishModal, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Category *
                  </label>
                  <select
                    value={editDishModal.category || 'main'}
                    onChange={(e) => setEditDishModal({ ...editDishModal, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  >
                    <option value="starter">Starter</option>
                    <option value="main">Main</option>
                    <option value="ethiopian">Ethiopian Specialty</option>
                    <option value="dessert">Dessert</option>
                    <option value="beverage">Beverage</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#E49951', marginBottom: '6px' }}>
                    Price ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editDishModal.price || ''}
                    onChange={(e) => setEditDishModal({ ...editDishModal, price: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '14px', fontWeight: 600 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Tag (optional, e.g. "Chef's Choice", "Local Favorite")
                </label>
                <input
                  type="text"
                  value={editDishModal.tag || ''}
                  onChange={(e) => setEditDishModal({ ...editDishModal, tag: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Ingredients / Description
                </label>
                <textarea
                  rows={3}
                  value={editDishModal.description || ''}
                  onChange={(e) => setEditDishModal({ ...editDishModal, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #E2E1DA', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setEditDishModal(null)}
                  style={{ padding: '9px 16px', backgroundColor: '#F0EFEB', color: '#5E6E75', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '9px 20px' }}>
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SPA TREATMENT EDITOR (CRUD) */}
      {/* ========================================================================= */}
      {editSpaModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E1DA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0F2A33',
                color: '#FFFFFF',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                {isCreatingSpa ? 'Add New Spa Treatment' : `Edit: ${editSpaModal.name}`}
              </h3>
              <button
                onClick={() => setEditSpaModal(null)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSpa} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Treatment Name *
                </label>
                <input
                  type="text"
                  required
                  value={editSpaModal.name || ''}
                  onChange={(e) => setEditSpaModal({ ...editSpaModal, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={editSpaModal.category || 'Massage Therapy'}
                    onChange={(e) => setEditSpaModal({ ...editSpaModal, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Duration (e.g. 60 mins) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editSpaModal.duration || '60 mins'}
                    onChange={(e) => setEditSpaModal({ ...editSpaModal, duration: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#E49951', marginBottom: '6px' }}>
                  Price ($ USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editSpaModal.price || ''}
                  onChange={(e) => setEditSpaModal({ ...editSpaModal, price: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '14px', fontWeight: 600 }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editSpaModal.description || ''}
                  onChange={(e) => setEditSpaModal({ ...editSpaModal, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #E2E1DA', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setEditSpaModal(null)}
                  style={{ padding: '9px 16px', backgroundColor: '#F0EFEB', color: '#5E6E75', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '9px 20px' }}>
                  Save Treatment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: PHYSICAL ROOM INVENTORY EDITOR (CRUD) */}
      {/* ========================================================================= */}
      {editPhysicalRoomModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E1DA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0F2A33',
                color: '#FFFFFF',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                {isCreatingPhysicalRoom ? 'Add New Physical Room' : `Edit Room: ${editPhysicalRoomModal.roomNumber}`}
              </h3>
              <button
                onClick={() => setEditPhysicalRoomModal(null)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePhysicalRoom} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Room Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101"
                    value={editPhysicalRoomModal.roomNumber || ''}
                    onChange={(e) => setEditPhysicalRoomModal({ ...editPhysicalRoomModal, roomNumber: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Floor Level
                  </label>
                  <input
                    type="number"
                    value={editPhysicalRoomModal.floor || 1}
                    onChange={(e) => setEditPhysicalRoomModal({ ...editPhysicalRoomModal, floor: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Assigned Room Type *
                </label>
                <select
                  value={editPhysicalRoomModal.roomTypeId || ''}
                  onChange={(e) => setEditPhysicalRoomModal({ ...editPhysicalRoomModal, roomTypeId: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                >
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Occupancy Status
                </label>
                <select
                  value={editPhysicalRoomModal.status || 'AVAILABLE'}
                  onChange={(e) => setEditPhysicalRoomModal({ ...editPhysicalRoomModal, status: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                >
                  <option value="AVAILABLE">AVAILABLE (Ready for Guests)</option>
                  <option value="OCCUPIED">OCCUPIED (Guest in Residence)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Housekeeping / Repair)</option>
                  <option value="OUT_OF_SERVICE">OUT_OF_SERVICE (Closed)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #E2E1DA', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setEditPhysicalRoomModal(null)}
                  style={{ padding: '9px 16px', backgroundColor: '#F0EFEB', color: '#5E6E75', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '9px 20px' }}>
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: TESTIMONIAL EDITOR */}
      {/* ========================================================================= */}
      {editTestimonialModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E1DA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0F2A33',
                color: '#FFFFFF',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Edit Guest Testimonial</h3>
              <button
                onClick={() => setEditTestimonialModal(null)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTestimonial} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTestimonialModal.name || ''}
                    onChange={(e) => setEditTestimonialModal({ ...editTestimonialModal, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={editTestimonialModal.location || ''}
                    onChange={(e) => setEditTestimonialModal({ ...editTestimonialModal, location: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Star Rating (1-5)
                  </label>
                  <select
                    value={editTestimonialModal.rating || 5}
                    onChange={(e) => setEditTestimonialModal({ ...editTestimonialModal, rating: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                    <option value={3}>⭐⭐⭐ (3 Stars)</option>
                    <option value={2}>⭐⭐ (2 Stars)</option>
                    <option value={1}>⭐ (1 Star)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Moderation Status
                  </label>
                  <select
                    value={editTestimonialModal.status || 'APPROVED'}
                    onChange={(e) => setEditTestimonialModal({ ...editTestimonialModal, status: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  >
                    <option value="APPROVED">APPROVED (Visible on Site)</option>
                    <option value="PENDING">PENDING (In Review)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Review Title
                </label>
                <input
                  type="text"
                  required
                  value={editTestimonialModal.title || ''}
                  onChange={(e) => setEditTestimonialModal({ ...editTestimonialModal, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Review Comment
                </label>
                <textarea
                  rows={4}
                  required
                  value={editTestimonialModal.comment || ''}
                  onChange={(e) => setEditTestimonialModal({ ...editTestimonialModal, comment: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #E2E1DA', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setEditTestimonialModal(null)}
                  style={{ padding: '9px 16px', backgroundColor: '#F0EFEB', color: '#5E6E75', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '9px 20px' }}>
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Payment Transaction / Receipt Modal */}
      {viewPaymentModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 42, 51, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              border: '1px solid #E2E1DA',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                backgroundColor: '#0F2A33',
                color: '#FFFFFF',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CreditCard size={20} color="#E49951" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Payment Receipt & Audit</h3>
              </div>
              <button
                onClick={() => setViewPaymentModal(null)}
                style={{ background: 'none', border: 'none', color: '#A2B5BD', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Receipt Body */}
            <div style={{ padding: '24px' }}>
              <div
                style={{
                  backgroundColor: '#FDF9F4',
                  border: '1px solid #F5E6D3',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: '#838A8D', textTransform: 'uppercase', fontWeight: 600 }}>
                    Amount Surcharged
                  </span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#153D4B' }}>
                    {viewPaymentModal.currency === 'ETB'
                      ? `${Number(viewPaymentModal.amount).toLocaleString()} ETB`
                      : `$${Number(viewPaymentModal.amount).toLocaleString()}`}
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor:
                        viewPaymentModal.status === 'SUCCESS'
                          ? '#DEF7EC'
                          : viewPaymentModal.status === 'PENDING'
                          ? '#FEF3C7'
                          : '#F3F4F6',
                      color:
                        viewPaymentModal.status === 'SUCCESS'
                          ? '#03543F'
                          : viewPaymentModal.status === 'PENDING'
                          ? '#92400E'
                          : '#4B5563',
                    }}
                  >
                    {viewPaymentModal.status}
                  </span>
                </div>
              </div>

              {/* Grid of properties */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: '#838A8D', display: 'block' }}>Transaction Reference</span>
                  <code style={{ color: '#E49951', fontWeight: 600, fontSize: '12px' }}>{viewPaymentModal.txRef}</code>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#838A8D', display: 'block' }}>Gateway Provider</span>
                  <strong style={{ color: '#153D4B' }}>{viewPaymentModal.provider}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#838A8D', display: 'block' }}>Gateway External Ref</span>
                  <span style={{ color: '#5E6E75' }}>{viewPaymentModal.gatewayRef || 'Direct Transfer'}</span>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#838A8D', display: 'block' }}>Booking Reference</span>
                  <strong style={{ color: '#153D4B' }}>{viewPaymentModal.bookingRef || 'None'}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#838A8D', display: 'block' }}>Guest Customer</span>
                  <strong style={{ color: '#153D4B' }}>
                    {viewPaymentModal.firstName ? `${viewPaymentModal.firstName} ${viewPaymentModal.lastName}` : 'Guest Customer'}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#838A8D', display: 'block' }}>Guest Contact</span>
                  <span style={{ color: '#5E6E75' }}>
                    {viewPaymentModal.guestEmail || viewPaymentModal.guestPhone || 'None'}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#838A8D', display: 'block' }}>Room Category</span>
                  <span style={{ color: '#5E6E75' }}>{viewPaymentModal.roomTypeName || 'Room Stay'}</span>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#838A8D', display: 'block' }}>Created At</span>
                  <span style={{ color: '#5E6E75' }}>{new Date(viewPaymentModal.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #E2E1DA',
                  paddingTop: '16px',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  {viewPaymentModal.status !== 'SUCCESS' ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdatePaymentStatus(viewPaymentModal.id, 'SUCCESS');
                        setViewPaymentModal(null);
                      }}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Mark Paid
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdatePaymentStatus(viewPaymentModal.id, 'REFUNDED');
                        setViewPaymentModal(null);
                      }}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Issue Refund
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#FFFFFF',
                      color: '#153D4B',
                      border: '1px solid #D5D4CC',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Printer size={13} /> Print
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setViewPaymentModal(null)}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: '12px' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
