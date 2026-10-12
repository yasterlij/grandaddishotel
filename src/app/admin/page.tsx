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
  Compass,
  Coffee,
  MapPin,
  BedDouble,
} from 'lucide-react';
import { getTodayDateStr, addDays, calculateStayNights, formatFriendlyDate } from '@/lib/dates';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    | 'reservations'
    | 'payments'
    | 'roomTypes'
    | 'rooms'
    | 'pageContent'
    | 'gallery'
    | 'experiences'
    | 'dining'
    | 'spa'
    | 'messages'
    | 'testimonials'
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

  // Photo Gallery CMS states
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState<string>('ALL');
  const [gallerySearch, setGallerySearch] = useState<string>('');
  const [editGalleryModal, setEditGalleryModal] = useState<any | null>(null);
  const [isCreatingGallery, setIsCreatingGallery] = useState(false);
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);

  // Page Content CMS states
  const [pageContent, setPageContent] = useState<Record<string, string>>({});
  const [activeContentSection, setActiveContentSection] = useState<
    'home' | 'about' | 'contact' | 'gallery' | 'experiences' | 'rooms' | 'testimonials' | 'terms' | 'footer'
  >('home');
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [uploadingContentKey, setUploadingContentKey] = useState<string | null>(null);

  // Cultural Experiences CMS states
  const [experiencesList, setExperiencesList] = useState<any[]>([]);
  const [editExperienceModal, setEditExperienceModal] = useState<any | null>(null);
  const [isCreatingExperience, setIsCreatingExperience] = useState(false);
  const [uploadingExpImage, setUploadingExpImage] = useState(false);

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
  const [loginUsername, setLoginUsername] = useState('');
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
        galRes,
        contentRes,
        expRes,
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
        fetch('/api/admin/gallery').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/admin/content').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/admin/experiences').then((r) => r.json()).catch(() => ({ success: false })),
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
      if (galRes?.success) setGalleryImages(galRes.images || []);
      if (contentRes?.success) setPageContent(contentRes.content || {});
      if (expRes?.success) setExperiencesList(expRes.experiences || []);
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

  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedDatabase = async () => {
    if (
      !confirm(
        'This will populate the database with Grand Addis Hotel default rooms, physical inventory (101-502), cultural experiences, and exchange rates. Proceed?'
      )
    )
      return;
    setIsSeeding(true);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        notify('✓ Database seeded successfully with default hotel inventory!');
        await loadAllData();
      } else {
        alert(data.error || 'Failed to seed database');
      }
    } catch (err: any) {
      alert(err.message || 'Seeding request failed');
    } finally {
      setIsSeeding(false);
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

  const handleApproveTestimonial = async (id: string) => {
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'APPROVED' }),
      });
      const data = await res.json();
      if (data.success) {
        notify('Review approved & published');
        loadAllData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // -------------------------------------------------------------
  // Photo Gallery CRUD Handlers
  // -------------------------------------------------------------
  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadingGalleryImage(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setEditGalleryModal((prev: any) => ({
          ...prev,
          src: data.url,
        }));
        notify('Photo uploaded successfully!');
      } else {
        alert(data.error || 'Failed to upload photo');
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading photo');
    } finally {
      setUploadingGalleryImage(false);
      e.target.value = '';
    }
  };

  const handleSaveGalleryImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGalleryModal) return;

    if (!editGalleryModal.src || !editGalleryModal.title) {
      alert('Photo image URL and title are required');
      return;
    }

    try {
      const isNew = isCreatingGallery || !editGalleryModal.id;
      const res = await fetch('/api/admin/gallery', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editGalleryModal),
      });
      const data = await res.json();
      if (data.success) {
        notify(isNew ? 'Photo added to gallery' : 'Gallery photo updated');
        setEditGalleryModal(null);
        setIsCreatingGallery(false);
        loadAllData();
      } else {
        alert(data.error || 'Failed to save gallery photo');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving photo');
    }
  };

  const handleDeleteGalleryImage = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title || 'this photo'}" from gallery?`)) return;
    try {
      const res = await fetch(`/api/admin/gallery?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify('Photo deleted from gallery');
        loadAllData();
      } else {
        alert(data.error || 'Failed to delete photo');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting photo');
    }
  };

  // -------------------------------------------------------------
  // Page Content & Banners CMS Handlers
  // -------------------------------------------------------------
  const handleContentImageUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadingContentKey(key);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setPageContent((prev) => ({
          ...prev,
          [key]: data.url,
        }));
        notify('Banner photo uploaded and applied!');
      } else {
        alert(data.error || 'Failed to upload photo');
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading image');
    } finally {
      setUploadingContentKey(null);
      e.target.value = '';
    }
  };

  const handleSavePageContent = async () => {
    setIsSavingContent(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: pageContent }),
      });
      const data = await res.json();
      if (data.success) {
        notify('Page content & banner media saved successfully!');
        loadAllData();
      } else {
        alert(data.error || 'Failed to save page content');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving page content');
    } finally {
      setIsSavingContent(false);
    }
  };

  // -------------------------------------------------------------
  // Cultural Experiences Handlers
  // -------------------------------------------------------------
  const handleExperienceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadingExpImage(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setEditExperienceModal((prev: any) => ({
          ...prev,
          image: data.url,
        }));
        notify('Experience photo uploaded!');
      } else {
        alert(data.error || 'Failed to upload photo');
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading photo');
    } finally {
      setUploadingExpImage(false);
      e.target.value = '';
    }
  };

  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExperienceModal) return;

    if (!editExperienceModal.title || !editExperienceModal.description) {
      alert('Title and description are required for experience');
      return;
    }

    try {
      const isNew = isCreatingExperience || !editExperienceModal.id;
      const res = await fetch('/api/admin/experiences', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editExperienceModal),
      });
      const data = await res.json();
      if (data.success) {
        notify(isNew ? 'Experience created' : 'Experience updated');
        setEditExperienceModal(null);
        setIsCreatingExperience(false);
        loadAllData();
      } else {
        alert(data.error || 'Failed to save experience');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving experience');
    }
  };

  const handleDeleteExperience = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete experience "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/experiences?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify('Experience deleted');
        loadAllData();
      } else {
        alert(data.error || 'Failed to delete experience');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting experience');
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
                width: '72px',
                height: '72px',
                margin: '0 auto 16px',
                borderRadius: '50%',
                backgroundColor: '#082026',
                border: '2px solid rgba(228, 153, 81, 0.6)',
                overflow: 'hidden',
                boxShadow: '0 6px 24px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img src="/images/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                  placeholder="Enter your username or email"
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
                  LIVE DATABASE CRUD
                </span>
                <span style={{ fontSize: '12px', color: '#A2B5BD' }}>
                  Database: <strong>grandaddis_db</strong>
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', fontWeight: 500, margin: 0 }}>
                Hotel Operations & Database Management
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  backgroundColor: '#E49951',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSeeding ? 'wait' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(228, 153, 81, 0.3)',
                }}
              >
                <Sparkles size={15} style={{ animation: isSeeding ? 'spin 1s linear infinite' : 'none' }} />
                <span>{isSeeding ? 'Seeding...' : 'Seed Hotel Data'}</span>
              </button>

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

          {roomTypes.length === 0 && !refreshing && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px 20px',
                borderRadius: '8px',
                backgroundColor: 'rgba(228, 153, 81, 0.15)',
                border: '1px solid rgba(228, 153, 81, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <strong style={{ color: '#E49951', fontSize: '14px', display: 'block', marginBottom: '3px' }}>
                  ⚠️ Database is currently empty (0 rooms found)
                </strong>
                <span style={{ fontSize: '12px', color: '#CBD5E1' }}>
                  Click to populate default room types, physical rooms (101-502), cultural experiences, and settings.
                </span>
              </div>
              <button
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                style={{
                  padding: '9px 20px',
                  backgroundColor: '#E49951',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isSeeding ? 'wait' : 'pointer',
                  boxShadow: '0 2px 8px rgba(228, 153, 81, 0.4)',
                }}
              >
                {isSeeding ? 'Seeding Database...' : '🌱 Seed Hotel Data Now'}
              </button>
            </div>
          )}
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
            { id: 'gallery', label: 'Photo Gallery', icon: ImageIcon, count: galleryImages.length },
            { id: 'pageContent', label: 'Pages & Media CMS', icon: Sparkles, count: undefined },
            { id: 'experiences', label: 'Cultural Experiences', icon: Compass, count: experiencesList.length },
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
                  {tab.count !== undefined ? tab.count : 'CMS'}
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
                    {t.status === 'PENDING' && (
                      <button
                        onClick={() => handleApproveTestimonial(t.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Approve
                      </button>
                    )}
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

        {/* ============================================================== */}
        {/* TAB: PHOTO GALLERY MEDIA CMS */}
        {/* ============================================================== */}
        {activeTab === 'gallery' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E1DA', overflow: 'hidden' }}>
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
                  Hotel Photo Gallery Manager
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#838A8D' }}>
                  Upload new photos from device, update titles and categories, set display order, or remove images.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setIsCreatingGallery(true);
                    setEditGalleryModal({
                      title: '',
                      src: '',
                      category: 'hotel',
                      sort_order: galleryImages.length + 1,
                    });
                  }}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <Plus size={16} /> Add New Photo
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #F0EFEA',
                backgroundColor: '#FAF9F5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: 'All Photos' },
                  { id: 'HOTEL', label: 'Hotel & Grounds' },
                  { id: 'ROOMS', label: 'Rooms & Suites' },
                  { id: 'DINING', label: 'Dining & Lounge' },
                  { id: 'WELLNESS', label: 'Spa & Wellness' },
                ].map((cat) => {
                  const isSel = galleryCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setGalleryCategoryFilter(cat.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 500,
                        border: isSel ? '1px solid #E49951' : '1px solid #E2E1DA',
                        backgroundColor: isSel ? '#E49951' : '#FFFFFF',
                        color: isSel ? '#FFFFFF' : '#153D4B',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={14} color="#838A8D" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Filter by photo title..."
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '6px',
                    border: '1px solid #E2E1DA',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Photos Grid */}
            <div style={{ padding: '24px' }}>
              {(() => {
                const filtered = galleryImages.filter((img) => {
                  const matchCat =
                    galleryCategoryFilter === 'ALL' ||
                    (img.category || '').toUpperCase() === galleryCategoryFilter;
                  const matchSearch =
                    !gallerySearch ||
                    (img.title || '').toLowerCase().includes(gallerySearch.toLowerCase());
                  return matchCat && matchSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#838A8D' }}>
                      <ImageIcon size={40} color="#D5D4CC" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#153D4B' }}>No photos found</div>
                      <div style={{ fontSize: '13px', marginTop: '4px' }}>
                        Click &quot;Add New Photo&quot; to upload your first gallery photo.
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '20px',
                    }}
                  >
                    {filtered.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        style={{
                          borderRadius: '12px',
                          border: '1px solid #E2E1DA',
                          overflow: 'hidden',
                          backgroundColor: '#FFFFFF',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                      >
                        {/* Image Thumbnail Container */}
                        <div
                          style={{
                            position: 'relative',
                            height: '190px',
                            backgroundColor: '#0F2A33',
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={img.src}
                            alt={img.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: '10px',
                              left: '10px',
                              backgroundColor: 'rgba(15, 42, 51, 0.85)',
                              color: '#E49951',
                              fontSize: '11px',
                              fontWeight: 700,
                              letterSpacing: '1px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                            }}
                          >
                            {img.category || 'HOTEL'}
                          </div>
                          <div
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              color: '#153D4B',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            #{img.sort_order || idx + 1}
                          </div>
                        </div>

                        {/* Details */}
                        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: '#153D4B', fontWeight: 600 }}>
                            {img.title}
                          </h4>
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#838A8D',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginBottom: '14px',
                            }}
                          >
                            {img.src}
                          </span>

                          <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', borderTop: '1px solid #F0EFEA', paddingTop: '12px' }}>
                            <button
                              onClick={() => {
                                setIsCreatingGallery(false);
                                setEditGalleryModal({ ...img });
                              }}
                              style={{
                                flex: 1,
                                padding: '7px 12px',
                                backgroundColor: '#153D4B',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <Edit size={13} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteGalleryImage(img.id, img.title)}
                              style={{
                                padding: '7px 12px',
                                backgroundColor: '#FFF0F0',
                                color: '#DC3545',
                                border: '1px solid #FDCBCB',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: PAGES CONTENT & BANNERS CMS */}
        {/* ============================================================== */}
        {activeTab === 'pageContent' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E1DA', overflow: 'hidden' }}>
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
                  Page Content, Media & Banners CMS
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#838A8D' }}>
                  Manage hero banners, welcome stories, narrative headlines, and public contact information across all pages.
                </p>
              </div>

              <button
                onClick={handleSavePageContent}
                disabled={isSavingContent}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '10px 20px' }}
              >
                {isSavingContent ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                <span>{isSavingContent ? 'Saving Changes...' : 'Save All Page Changes'}</span>
              </button>
            </div>

            {/* Sub-tabs for Pages */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #E2E1DA',
                backgroundColor: '#FAF9F5',
                overflowX: 'auto',
              }}
            >
              {[
                { id: 'home', label: '🏠 Home Page' },
                { id: 'about', label: 'ℹ️ About Us Page' },
                { id: 'contact', label: '📞 Contact & Hotel Info' },
                { id: 'gallery', label: '🖼️ Gallery Banner' },
                { id: 'experiences', label: '🧭 Experiences Banner' },
                { id: 'rooms', label: '🛏️ Rooms Banner' },
                { id: 'testimonials', label: '⭐ Testimonials Banner' },
                { id: 'terms', label: '📜 Terms & Policies' },
                { id: 'footer', label: '🏷️ Footer & Branding' },
              ].map((sec) => {
                const isActive = activeContentSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveContentSection(sec.id as any)}
                    style={{
                      padding: '12px 20px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      borderBottom: isActive ? '3px solid #E49951' : '3px solid transparent',
                      color: isActive ? '#153D4B' : '#838A8D',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {sec.label}
                  </button>
                );
              })}
            </div>

            {/* Page Sections Editor */}
            <div style={{ padding: '28px' }}>
              {/* HOME PAGE CMS */}
              {activeContentSection === 'home' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {/* Hero Banner Section */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="#E49951" /> Hero Banner & Headline
                    </h4>

                    {/* Banner Image Preview & Upload */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '8px' }}>
                        Hero Background Image
                      </label>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ width: '240px', height: '140px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#0F2A33', border: '1px solid #D5D4CC', position: 'relative' }}>
                          <img
                            src={pageContent.page_home_hero_image || '/images/BO5A5779-scaled.jpg'}
                            alt="Hero Banner Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '260px' }}>
                          <input
                            type="text"
                            value={pageContent.page_home_hero_image || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_home_hero_image: e.target.value })}
                            placeholder="/images/BO5A5779-scaled.jpg or image URL"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px', marginBottom: '10px' }}
                          />
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              backgroundColor: '#153D4B',
                              color: '#FFFFFF',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: uploadingContentKey === 'page_home_hero_image' ? 'wait' : 'pointer',
                            }}
                          >
                            <Upload size={14} />
                            <span>{uploadingContentKey === 'page_home_hero_image' ? 'Uploading...' : 'Upload Photo from Device'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingContentKey === 'page_home_hero_image'}
                              onChange={(e) => handleContentImageUpload('page_home_hero_image', e)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Top Eyebrow Badge
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_home_hero_badge || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_hero_badge: e.target.value })}
                          placeholder="Welcome to Grand Addis Hotel & Resort"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Hero Main Title
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_home_hero_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_hero_title: e.target.value })}
                          placeholder="Your Grand Stay In The Heart Of Addis"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Hero Subtitle / Description
                      </label>
                      <textarea
                        rows={2}
                        value={pageContent.page_home_hero_subtitle || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_home_hero_subtitle: e.target.value })}
                        placeholder="Rebalance yourself in a timeless space where understated luxury, warm Ethiopian hospitality, and tranquil comfort come together."
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Primary Call-to-Action Button Text
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_home_hero_btn1_text || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_hero_btn1_text: e.target.value })}
                          placeholder="Book Your Stay"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Secondary Button Text
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_home_hero_btn2_text || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_hero_btn2_text: e.target.value })}
                          placeholder="Explore Our Rooms"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Story & Philosophy Section */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="#E49951" /> Welcome Story & Narrative Section
                    </h4>

                    {/* Story Image Preview & Upload */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '8px' }}>
                        Featured Story Image
                      </label>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ width: '240px', height: '140px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#0F2A33', border: '1px solid #D5D4CC' }}>
                          <img
                            src={pageContent.page_home_story_image || '/images/BO5A5826-scaled.jpg'}
                            alt="Story Image Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '260px' }}>
                          <input
                            type="text"
                            value={pageContent.page_home_story_image || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_home_story_image: e.target.value })}
                            placeholder="/images/BO5A5826-scaled.jpg or image URL"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px', marginBottom: '10px' }}
                          />
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              backgroundColor: '#153D4B',
                              color: '#FFFFFF',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: uploadingContentKey === 'page_home_story_image' ? 'wait' : 'pointer',
                            }}
                          >
                            <Upload size={14} />
                            <span>{uploadingContentKey === 'page_home_story_image' ? 'Uploading...' : 'Upload Photo from Device'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingContentKey === 'page_home_story_image'}
                              onChange={(e) => handleContentImageUpload('page_home_story_image', e)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Story Subtitle / Eyebrow
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_home_story_subtitle || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_story_subtitle: e.target.value })}
                          placeholder="WELCOME TO OUR OASIS"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Story Section Title
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_home_story_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_story_title: e.target.value })}
                          placeholder="A Place Of Heart, Your Home Away in Addis Ababa"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Paragraph 1
                        </label>
                        <textarea
                          rows={3}
                          value={pageContent.page_home_story_p1 || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_story_p1: e.target.value })}
                          placeholder="Nestled at 22 Around Golagul in Addis Ababa..."
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Paragraph 2
                        </label>
                        <textarea
                          rows={3}
                          value={pageContent.page_home_story_p2 || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_story_p2: e.target.value })}
                          placeholder="Whether you are visiting for diplomatic engagements..."
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    {/* Story Feature Highlights (4 Bullets) */}
                    <div style={{ paddingTop: '16px', borderTop: '1px solid #EAE8E0', marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '10px' }}>
                        Story Feature Checkmarks (4 Highlights)
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <div>
                          <input
                            type="text"
                            value={pageContent.page_home_story_feat1 || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_home_story_feat1: e.target.value })}
                            placeholder="22 Around Golagul"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={pageContent.page_home_story_feat2 || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_home_story_feat2: e.target.value })}
                            placeholder="10 Mins to Bole Airport"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={pageContent.page_home_story_feat3 || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_home_story_feat3: e.target.value })}
                            placeholder="High-Speed Fiber Wi-Fi"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={pageContent.page_home_story_feat4 || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_home_story_feat4: e.target.value })}
                            placeholder="24/7 Room & Concierge"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Floating Guest Satisfaction Badge */}
                    <div style={{ paddingTop: '16px', borderTop: '1px solid #EAE8E0' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '10px' }}>
                        Floating Rating Badge (Overlaid on Story Photo)
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: '#838A8D', marginBottom: '4px' }}>
                            Badge Statistic / Rating Title
                          </label>
                          <input
                            type="text"
                            value={pageContent.page_home_story_badge_title || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_home_story_badge_title: e.target.value })}
                            placeholder="99% of Guests"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: '#838A8D', marginBottom: '4px' }}>
                            Badge Sub-text
                          </label>
                          <input
                            type="text"
                            value={pageContent.page_home_story_badge_desc || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_home_story_badge_desc: e.target.value })}
                            placeholder="Recommend Grand Addis Hotel for comfort, safety, and hospitality."
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Experience Pillars Section */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Coffee size={16} color="#E49951" /> The Grand Addis Experience Pillars (3 Feature Cards)
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Section Eyebrow Subtitle
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_home_pillars_subtitle || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_pillars_subtitle: e.target.value })}
                          placeholder="THE GRAND ADDIS EXPERIENCE"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Section Main Title
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_home_pillars_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_pillars_title: e.target.value })}
                          placeholder="Rebalance Yourself In A Timeless Space"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Section Overview Paragraph
                      </label>
                      <textarea
                        rows={2}
                        value={pageContent.page_home_pillars_desc || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_home_pillars_desc: e.target.value })}
                        placeholder="Every touchpoint at Grand Addis Hotel is designed to nurture your senses..."
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>

                    {/* Pillar Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                      {/* Pillar 1 */}
                      <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E2E1DA' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#E49951', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                          Pillar 1: Accommodations
                        </span>
                        <input
                          type="text"
                          value={pageContent.page_home_pillar1_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_pillar1_title: e.target.value })}
                          placeholder="Relax & Unwind"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px', marginBottom: '8px' }}
                        />
                        <textarea
                          rows={3}
                          value={pageContent.page_home_pillar1_desc || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_pillar1_desc: e.target.value })}
                          placeholder="Serene guest rooms and suites furnished with orthopedic bedding..."
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '12px' }}
                        />
                      </div>

                      {/* Pillar 2 */}
                      <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E2E1DA' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#E49951', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                          Pillar 2: Culture & Heritage
                        </span>
                        <input
                          type="text"
                          value={pageContent.page_home_pillar2_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_pillar2_title: e.target.value })}
                          placeholder="Authentic Experiences"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px', marginBottom: '8px' }}
                        />
                        <textarea
                          rows={3}
                          value={pageContent.page_home_pillar2_desc || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_pillar2_desc: e.target.value })}
                          placeholder="Immerse yourself in our daily Ethiopian Buna coffee ceremonies..."
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '12px' }}
                        />
                      </div>

                      {/* Pillar 3 */}
                      <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E2E1DA' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#E49951', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                          Pillar 3: Prime Location
                        </span>
                        <input
                          type="text"
                          value={pageContent.page_home_pillar3_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_pillar3_title: e.target.value })}
                          placeholder="Heart of Addis"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px', marginBottom: '8px' }}
                        />
                        <textarea
                          rows={3}
                          value={pageContent.page_home_pillar3_desc || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_pillar3_desc: e.target.value })}
                          placeholder="Located at 22 Around Golagul, just 10 minutes from Bole International Airport..."
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '12px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Featured Rooms Section Header */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#153D4B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BedDouble size={16} color="#E49951" /> Featured Rooms Section Headline
                      </h4>
                      <span style={{ fontSize: '12px', color: '#838A8D', backgroundColor: '#EDECE6', padding: '4px 10px', borderRadius: '4px' }}>
                        💡 To manage actual room cards, pricing & photos, use the "Rooms" tab
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Section Eyebrow Subtitle
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_home_rooms_subtitle || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_rooms_subtitle: e.target.value })}
                          placeholder="LUXURY ACCOMMODATIONS"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Section Main Title
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_home_rooms_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_rooms_title: e.target.value })}
                          placeholder="Our Featured Rooms & Suites"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Section Description
                      </label>
                      <textarea
                        rows={2}
                        value={pageContent.page_home_rooms_desc || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_home_rooms_desc: e.target.value })}
                        placeholder="Immerse yourself in understated elegance. Best rates guaranteed when booking directly on our site."
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Bespoke Hospitality Mid-Banner */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="#E49951" /> Mid-Page Bespoke Hospitality Banner
                    </h4>

                    {/* Banner Image Preview & Upload */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '8px' }}>
                        Banner Parallax Background Image
                      </label>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ width: '240px', height: '140px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#0F2A33', border: '1px solid #D5D4CC', position: 'relative' }}>
                          <img
                            src={pageContent.page_home_banner_image || '/images/BO5A5779-scaled.jpg'}
                            alt="Hospitality Banner Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '260px' }}>
                          <input
                            type="text"
                            value={pageContent.page_home_banner_image || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_home_banner_image: e.target.value })}
                            placeholder="/images/BO5A5779-scaled.jpg or image URL"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px', marginBottom: '10px' }}
                          />
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              backgroundColor: '#153D4B',
                              color: '#FFFFFF',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: uploadingContentKey === 'page_home_banner_image' ? 'wait' : 'pointer',
                            }}
                          >
                            <Upload size={14} />
                            <span>{uploadingContentKey === 'page_home_banner_image' ? 'Uploading...' : 'Upload Photo from Device'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingContentKey === 'page_home_banner_image'}
                              onChange={(e) => handleContentImageUpload('page_home_banner_image', e)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Banner Eyebrow Tag
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_home_banner_tag || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_banner_tag: e.target.value })}
                          placeholder="BESPOKE HOSPITALITY"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Banner Title
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_home_banner_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_banner_title: e.target.value })}
                          placeholder="Authentic Ethiopian Hospitality"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Banner Description
                      </label>
                      <textarea
                        rows={2}
                        value={pageContent.page_home_banner_desc || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_home_banner_desc: e.target.value })}
                        placeholder="Experience the genuine warmth and cultural heritage of Addis Ababa..."
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Gallery & Testimonials Section Headers */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="#E49951" /> Gallery & Reviews Section Headlines
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E2E1DA' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#153D4B', display: 'block', marginBottom: '10px' }}>
                          Photo Gallery Section
                        </span>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', fontSize: '11px', color: '#838A8D', marginBottom: '4px' }}>Title</label>
                          <input
                            type="text"
                            value={pageContent.page_home_gallery_title || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_home_gallery_title: e.target.value })}
                            placeholder="GALLERY"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: '#838A8D', marginBottom: '4px' }}>Subtitle</label>
                          <input
                            type="text"
                            value={pageContent.page_home_gallery_subtitle || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_home_gallery_subtitle: e.target.value })}
                            placeholder="VISUAL TOUR"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                          />
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E2E1DA' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#153D4B', display: 'block', marginBottom: '10px' }}>
                          Testimonials Section
                        </span>
                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', fontSize: '11px', color: '#838A8D', marginBottom: '4px' }}>Title</label>
                          <input
                            type="text"
                            value={pageContent.page_home_testimonials_title || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_home_testimonials_title: e.target.value })}
                            placeholder="What Customers Have To Say"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: '#838A8D', marginBottom: '4px' }}>Subtitle</label>
                          <input
                            type="text"
                            value={pageContent.page_home_testimonials_subtitle || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_home_testimonials_subtitle: e.target.value })}
                            placeholder="GUEST EXPERIENCES"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Home Location & Info Section */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#153D4B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="#E49951" /> Location & Contact Info Section
                      </h4>
                      <span style={{ fontSize: '12px', color: '#838A8D', backgroundColor: '#EDECE6', padding: '4px 10px', borderRadius: '4px' }}>
                        💡 Phone, Email and Address are shared with the "Contact & Hotel Info" tab
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Section Eyebrow Subtitle
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_home_location_subtitle || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_location_subtitle: e.target.value })}
                          placeholder="FIND US"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Section Main Title
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_home_location_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_home_location_title: e.target.value })}
                          placeholder="Location and Info"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Section Description
                      </label>
                      <textarea
                        rows={2}
                        value={pageContent.page_home_location_desc || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_home_location_desc: e.target.value })}
                        placeholder="Centrally positioned in the vibrant commercial and cultural heart of Addis Ababa..."
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABOUT US CMS */}
              {activeContentSection === 'about' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {/* Hero Banner */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      About Us Hero Banner
                    </h4>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '8px' }}>
                        About Banner Image
                      </label>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ width: '240px', height: '140px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#0F2A33', border: '1px solid #D5D4CC' }}>
                          <img
                            src={pageContent.page_about_hero_image || '/images/BO5A5779-scaled.jpg'}
                            alt="About Banner Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '260px' }}>
                          <input
                            type="text"
                            value={pageContent.page_about_hero_image || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_about_hero_image: e.target.value })}
                            placeholder="/images/BO5A5779-scaled.jpg"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px', marginBottom: '10px' }}
                          />
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              backgroundColor: '#153D4B',
                              color: '#FFFFFF',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: uploadingContentKey === 'page_about_hero_image' ? 'wait' : 'pointer',
                            }}
                          >
                            <Upload size={14} />
                            <span>{uploadingContentKey === 'page_about_hero_image' ? 'Uploading...' : 'Upload Photo from Device'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingContentKey === 'page_about_hero_image'}
                              onChange={(e) => handleContentImageUpload('page_about_hero_image', e)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Eyebrow Tag
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_about_hero_tag || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_about_hero_tag: e.target.value })}
                          placeholder="OUR STORY & HERITAGE"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Page Headline
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_about_hero_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_about_hero_title: e.target.value })}
                          placeholder="A Place Of Heart, Your Home Away"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Description Subtitle
                      </label>
                      <textarea
                        rows={2}
                        value={pageContent.page_about_hero_subtitle || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_about_hero_subtitle: e.target.value })}
                        placeholder="Welcome to our oasis of luxury and tranquility..."
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Philosophy Narrative */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Philosophy & Story Narrative
                    </h4>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '8px' }}>
                        Philosophy Image
                      </label>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ width: '240px', height: '140px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#0F2A33', border: '1px solid #D5D4CC' }}>
                          <img
                            src={pageContent.page_about_story_image || '/images/BO5A5821-scaled.jpg'}
                            alt="Philosophy Image Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '260px' }}>
                          <input
                            type="text"
                            value={pageContent.page_about_story_image || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_about_story_image: e.target.value })}
                            placeholder="/images/BO5A5821-scaled.jpg"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px', marginBottom: '10px' }}
                          />
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              backgroundColor: '#153D4B',
                              color: '#FFFFFF',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: uploadingContentKey === 'page_about_story_image' ? 'wait' : 'pointer',
                            }}
                          >
                            <Upload size={14} />
                            <span>{uploadingContentKey === 'page_about_story_image' ? 'Uploading...' : 'Upload Photo from Device'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingContentKey === 'page_about_story_image'}
                              onChange={(e) => handleContentImageUpload('page_about_story_image', e)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Story Subtitle
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_about_story_subtitle || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_about_story_subtitle: e.target.value })}
                          placeholder="THE GRAND ADDIS PHILOSOPHY"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Story Title
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_about_story_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_about_story_title: e.target.value })}
                          placeholder="Where Tradition Meets Contemporary Elegance"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Narrative Paragraph 1
                        </label>
                        <textarea
                          rows={3}
                          value={pageContent.page_about_story_p1 || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_about_story_p1: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Narrative Paragraph 2
                        </label>
                        <textarea
                          rows={3}
                          value={pageContent.page_about_story_p2 || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_about_story_p2: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Heritage Timeline Section Headers */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Heritage Milestones & Decades Journey Headers
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Timeline Eyebrow Tag
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_about_timeline_subtitle || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_about_timeline_subtitle: e.target.value })}
                          placeholder="OUR JOURNEY"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Timeline Headline
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_about_timeline_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_about_timeline_title: e.target.value })}
                          placeholder="Milestones Through The Decades"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Timeline Description Subtitle
                      </label>
                      <input
                        type="text"
                        value={pageContent.page_about_timeline_desc || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_about_timeline_desc: e.target.value })}
                        placeholder="An enduring commitment to refined hospitality in Ethiopia."
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Why Choose Us Section Headers */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Why Choose Grand Addis Headers
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Why Choose Us Eyebrow Tag
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_about_why_subtitle || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_about_why_subtitle: e.target.value })}
                          placeholder="YOUR HAPPINESS GUARANTEED"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Why Choose Us Headline
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_about_why_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_about_why_title: e.target.value })}
                          placeholder="Why Choose Grand Addis Hotel"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Why Choose Us Description Subtitle
                      </label>
                      <input
                        type="text"
                        value={pageContent.page_about_why_desc || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_about_why_desc: e.target.value })}
                        placeholder="Whether you are seeking total relaxation, productive corporate stays, or cultural discovery."
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CONTACT & HOTEL INFO CMS */}
              {activeContentSection === 'contact' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Contact Page Hero Banner
                    </h4>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '8px' }}>
                        Contact Banner Image
                      </label>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ width: '240px', height: '140px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#0F2A33', border: '1px solid #D5D4CC' }}>
                          <img
                            src={pageContent.page_contact_hero_image || '/images/BO5A5779-scaled.jpg'}
                            alt="Contact Banner Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '260px' }}>
                          <input
                            type="text"
                            value={pageContent.page_contact_hero_image || ''}
                            onChange={(e) => setPageContent({ ...pageContent, page_contact_hero_image: e.target.value })}
                            placeholder="/images/BO5A5779-scaled.jpg"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px', marginBottom: '10px' }}
                          />
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              backgroundColor: '#153D4B',
                              color: '#FFFFFF',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: uploadingContentKey === 'page_contact_hero_image' ? 'wait' : 'pointer',
                            }}
                          >
                            <Upload size={14} />
                            <span>{uploadingContentKey === 'page_contact_hero_image' ? 'Uploading...' : 'Upload Photo from Device'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingContentKey === 'page_contact_hero_image'}
                              onChange={(e) => handleContentImageUpload('page_contact_hero_image', e)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Banner Title
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_contact_hero_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_contact_hero_title: e.target.value })}
                          placeholder="Contact Grand Addis Hotel"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Banner Subtitle
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_contact_hero_subtitle || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_contact_hero_subtitle: e.target.value })}
                          placeholder="We would love to hear from you..."
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Public Contact & Location Details */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Public Contact, Check-in & Location Details
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Primary Telephone
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_contact_phone || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_contact_phone: e.target.value })}
                          placeholder="+251 116 672 828"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Alternate Phone / Mobile
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_contact_phone_alt || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_contact_phone_alt: e.target.value })}
                          placeholder="+251 911 234 567"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Reservations Email
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_contact_email || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_contact_email: e.target.value })}
                          placeholder="reservations@egrandaddishotel.com"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          General Inquiry Email
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_contact_email_alt || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_contact_email_alt: e.target.value })}
                          placeholder="info@grandaddishotel.com"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Standard Check-in Time
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_contact_checkin || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_contact_checkin: e.target.value })}
                          placeholder="14:00 (2:00 PM)"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Standard Check-out Time
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_contact_checkout || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_contact_checkout: e.target.value })}
                          placeholder="12:00 (12:00 PM)"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Front Desk Operating Hours
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_contact_hours || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_contact_hours: e.target.value })}
                          placeholder="Open 24 Hours • 7 Days a Week"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Airport Proximity Description
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_contact_airport || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_contact_airport: e.target.value })}
                          placeholder="5.2 km from Bole International Airport (~10 mins)"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Physical Address
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_contact_address || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_contact_address: e.target.value })}
                          placeholder="22 Around Golagul, behind Meklit Building, Addis Ababa, Ethiopia"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 24/7 Guest Support Narrative */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Support Narrative & Introduction
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Support Eyebrow Subtitle
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_contact_intro_subtitle || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_contact_intro_subtitle: e.target.value })}
                          placeholder="24/7 GUEST SUPPORT"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Support Section Headline
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_contact_intro_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_contact_intro_title: e.target.value })}
                          placeholder="We’re Here For You"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Support Paragraph Description
                      </label>
                      <textarea
                        rows={2}
                        value={pageContent.page_contact_intro_desc || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_contact_intro_desc: e.target.value })}
                        placeholder="Whether you need assistance with room reservations, airport shuttle transfers..."
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Social Media Channels */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Official Social Media Channels
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Instagram Profile Link
                        </label>
                        <input
                          type="text"
                          value={pageContent.hotel_social_instagram || ''}
                          onChange={(e) => setPageContent({ ...pageContent, hotel_social_instagram: e.target.value })}
                          placeholder="https://instagram.com/grandaddishotel"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Facebook Page Link
                        </label>
                        <input
                          type="text"
                          value={pageContent.hotel_social_facebook || ''}
                          onChange={(e) => setPageContent({ ...pageContent, hotel_social_facebook: e.target.value })}
                          placeholder="https://facebook.com/grandaddishotel"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Telegram Channel Link
                        </label>
                        <input
                          type="text"
                          value={pageContent.hotel_social_telegram || ''}
                          onChange={(e) => setPageContent({ ...pageContent, hotel_social_telegram: e.target.value })}
                          placeholder="https://t.me/grandaddishotel"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GALLERY, EXPERIENCES, ROOMS, AND TESTIMONIALS BANNERS */}
              {['gallery', 'experiences', 'rooms', 'testimonials'].includes(activeContentSection) && (
                <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600, textTransform: 'capitalize' }}>
                    {activeContentSection} Page Banner
                  </h4>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '8px' }}>
                      Banner Image
                    </label>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ width: '240px', height: '140px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#0F2A33', border: '1px solid #D5D4CC' }}>
                        <img
                          src={pageContent[`page_${activeContentSection}_hero_image`] || '/images/BO5A5779-scaled.jpg'}
                          alt="Banner Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '260px' }}>
                        <input
                          type="text"
                          value={pageContent[`page_${activeContentSection}_hero_image`] || ''}
                          onChange={(e) => setPageContent({ ...pageContent, [`page_${activeContentSection}_hero_image`]: e.target.value })}
                          placeholder="/images/BO5A5779-scaled.jpg"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px', marginBottom: '10px' }}
                        />
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            backgroundColor: '#153D4B',
                            color: '#FFFFFF',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: uploadingContentKey === `page_${activeContentSection}_hero_image` ? 'wait' : 'pointer',
                          }}
                        >
                          <Upload size={14} />
                          <span>{uploadingContentKey === `page_${activeContentSection}_hero_image` ? 'Uploading...' : 'Upload Photo from Device'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingContentKey === `page_${activeContentSection}_hero_image`}
                            onChange={(e) => handleContentImageUpload(`page_${activeContentSection}_hero_image`, e)}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Top Eyebrow Tag
                      </label>
                      <input
                        type="text"
                        value={pageContent[`page_${activeContentSection}_hero_tag`] || ''}
                        onChange={(e) => setPageContent({ ...pageContent, [`page_${activeContentSection}_hero_tag`]: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Page Title
                      </label>
                      <input
                        type="text"
                        value={pageContent[`page_${activeContentSection}_hero_title`] || ''}
                        onChange={(e) => setPageContent({ ...pageContent, [`page_${activeContentSection}_hero_title`]: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                      Page Subtitle / Tagline
                    </label>
                    <textarea
                      rows={2}
                      value={pageContent[`page_${activeContentSection}_hero_subtitle`] || ''}
                      onChange={(e) => setPageContent({ ...pageContent, [`page_${activeContentSection}_hero_subtitle`]: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                    />
                  </div>
                </div>
              )}

              {/* TERMS & CONDITIONS CMS */}
              {activeContentSection === 'terms' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {/* Hero & Meta */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Legal Banner & Last Updated
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Eyebrow Tag
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_terms_hero_tag || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_terms_hero_tag: e.target.value })}
                          placeholder="LEGAL & POLICIES"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Page Title
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_terms_hero_title || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_terms_hero_title: e.target.value })}
                          placeholder="Terms & Conditions"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Last Updated Text
                      </label>
                      <input
                        type="text"
                        value={pageContent.page_terms_updated || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_terms_updated: e.target.value })}
                        placeholder="Last updated: October 2026 • Grand Addis Hotel"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Section 1 */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Section 1: General Policies
                    </h4>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Section Title
                      </label>
                      <input
                        type="text"
                        value={pageContent.page_terms_sec1_title || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_terms_sec1_title: e.target.value })}
                        placeholder="1. General Hotel Policies"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Policy Description
                      </label>
                      <textarea
                        rows={3}
                        value={pageContent.page_terms_sec1 || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_terms_sec1: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Section 2: Reservations & Guarantee
                    </h4>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Section Title
                      </label>
                      <input
                        type="text"
                        value={pageContent.page_terms_sec2_title || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_terms_sec2_title: e.target.value })}
                        placeholder="2. Reservations & Guarantee"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Policy Description
                      </label>
                      <textarea
                        rows={3}
                        value={pageContent.page_terms_sec2 || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_terms_sec2: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Section 3 */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Section 3: Check-In & Check-Out Times
                    </h4>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Section Title
                      </label>
                      <input
                        type="text"
                        value={pageContent.page_terms_sec3_title || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_terms_sec3_title: e.target.value })}
                        placeholder="3. Check-In & Check-Out Times"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Policy Description
                      </label>
                      <textarea
                        rows={3}
                        value={pageContent.page_terms_sec3 || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_terms_sec3: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Section 4: Cancellation & Modifications
                    </h4>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Section Title
                      </label>
                      <input
                        type="text"
                        value={pageContent.page_terms_sec4_title || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_terms_sec4_title: e.target.value })}
                        placeholder="4. Cancellation & Modifications"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Policy Description
                      </label>
                      <textarea
                        rows={3}
                        value={pageContent.page_terms_sec4 || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_terms_sec4: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Section 5 */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Section 5: Payment Terms & Card Guarantee
                    </h4>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Section Title
                      </label>
                      <input
                        type="text"
                        value={pageContent.page_terms_sec5_title || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_terms_sec5_title: e.target.value })}
                        placeholder="5. Payment Terms & Card Guarantee"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Policy Description
                      </label>
                      <textarea
                        rows={3}
                        value={pageContent.page_terms_sec5 || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_terms_sec5: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Section 6 */}
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Section 6: Contact & Inquiries
                    </h4>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Section Title
                      </label>
                      <input
                        type="text"
                        value={pageContent.page_terms_sec6_title || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_terms_sec6_title: e.target.value })}
                        placeholder="6. Contact & Inquiries"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Inquiries Instructions Text
                      </label>
                      <textarea
                        rows={2}
                        value={pageContent.page_terms_sec6 || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_terms_sec6: e.target.value })}
                        placeholder="For any questions concerning your stay, payment verification, or these policies, please contact our 24/7 guest relations department..."
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* FOOTER & GLOBAL BRANDING CMS */}
              {activeContentSection === 'footer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Footer Gold Accent & Subscribe Banner
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Eyebrow Tag
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_footer_tag || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_footer_tag: e.target.value })}
                          placeholder="EXPERIENCE LUXURY IN ETHIOPIA"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                          Main Headline
                        </label>
                        <input
                          type="text"
                          value={pageContent.page_footer_headline || ''}
                          onChange={(e) => setPageContent({ ...pageContent, page_footer_headline: e.target.value })}
                          placeholder="Your Grand Stay In The Heart Of Addis"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Description Subtitle
                      </label>
                      <textarea
                        rows={2}
                        value={pageContent.page_footer_desc || ''}
                        onChange={(e) => setPageContent({ ...pageContent, page_footer_desc: e.target.value })}
                        placeholder="A place of heart, your home away in Addis Ababa..."
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#FAF9F5', borderRadius: '12px', border: '1px solid #E2E1DA', padding: '24px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      Global Brand Statement & Tagline
                    </h4>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5E6E75', marginBottom: '6px' }}>
                        Brand Tagline (Shown under Logo in Footer)
                      </label>
                      <textarea
                        rows={2}
                        value={pageContent.hotel_tagline || ''}
                        onChange={(e) => setPageContent({ ...pageContent, hotel_tagline: e.target.value })}
                        placeholder="Distinctly designed rooms, timeless ambiance, and warm boutique service in the heart of Addis Ababa."
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E1DA', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: CULTURAL EXPERIENCES CRUD */}
        {/* ============================================================== */}
        {activeTab === 'experiences' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E1DA', overflow: 'hidden' }}>
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
                  Cultural Experiences & Excursions Manager
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#838A8D' }}>
                  Manage tours, traditional coffee ceremonies, chef masterclasses, and packages.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsCreatingExperience(true);
                  setEditExperienceModal({
                    title: '',
                    subtitle: '',
                    category: 'Culture',
                    duration: '2-3 Hours',
                    image: '',
                    description: '',
                    highlights: [],
                  });
                }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <Plus size={16} /> Add Experience
              </button>
            </div>

            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {experiencesList.map((exp) => (
                <div
                  key={exp.id}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid #E2E1DA',
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ position: 'relative', height: '180px', backgroundColor: '#0F2A33' }}>
                    <img
                      src={exp.image || '/images/BO5A5779-scaled.jpg'}
                      alt={exp.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: 'rgba(15, 42, 51, 0.85)',
                        color: '#E49951',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {exp.category}
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: '#153D4B',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {exp.duration}
                    </div>
                  </div>

                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '16px', color: '#153D4B', fontWeight: 600 }}>
                      {exp.title}
                    </h4>
                    <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#E49951', fontWeight: 500 }}>
                      {exp.subtitle}
                    </p>
                    <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#5E6E75', lineHeight: '1.6', flex: 1 }}>
                      {exp.description}
                    </p>

                    {/* Highlights tags */}
                    {Array.isArray(exp.highlights) && exp.highlights.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                        {exp.highlights.map((h: string, idx: number) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '11px',
                              backgroundColor: '#FAF9F5',
                              border: '1px solid #E2E1DA',
                              color: '#5E6E75',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            ✓ {h}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F0EFEA', paddingTop: '14px' }}>
                      <button
                        onClick={() => {
                          setIsCreatingExperience(false);
                          setEditExperienceModal({
                            ...exp,
                            highlightsText: Array.isArray(exp.highlights) ? exp.highlights.join('\n') : '',
                          });
                        }}
                        style={{
                          flex: 1,
                          padding: '7px 12px',
                          backgroundColor: '#153D4B',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Edit size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteExperience(exp.id, exp.title)}
                        style={{
                          padding: '7px 12px',
                          backgroundColor: '#FFF0F0',
                          color: '#DC3545',
                          border: '1px solid #FDCBCB',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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

      {/* Edit Gallery Image Modal */}
      {editGalleryModal && (
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
              maxHeight: '90vh',
              overflowY: 'auto',
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
                {isCreatingGallery ? 'Add Gallery Photo' : `Edit: ${editGalleryModal.title || 'Photo'}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditGalleryModal(null)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveGalleryImage} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Photo Title / Caption *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Luxury Presidential Suite"
                  value={editGalleryModal.title || ''}
                  onChange={(e) => setEditGalleryModal({ ...editGalleryModal, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Gallery Category *
                  </label>
                  <select
                    value={editGalleryModal.category || 'hotel'}
                    onChange={(e) => setEditGalleryModal({ ...editGalleryModal, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="hotel">Hotel & Architecture</option>
                    <option value="rooms">Rooms & Suites</option>
                    <option value="dining">Dining & Bars</option>
                    <option value="wellness">Spa & Wellness</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={editGalleryModal.sort_order ?? 0}
                    onChange={(e) => setEditGalleryModal({ ...editGalleryModal, sort_order: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Photo Image Upload and URL */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Photo Image *
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <input
                    type="text"
                    required
                    placeholder="https://... or /uploads/..."
                    value={editGalleryModal.src || ''}
                    onChange={(e) => setEditGalleryModal({ ...editGalleryModal, src: e.target.value })}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                  <label
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#153D4B',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      cursor: uploadingGalleryImage ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Upload size={14} />
                    {uploadingGalleryImage ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingGalleryImage}
                      onChange={handleGalleryImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {editGalleryModal.src && (
                  <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E1DA', height: '180px', backgroundColor: '#F9F8F6', position: 'relative' }}>
                    <img
                      src={editGalleryModal.src}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setEditGalleryModal(null)}
                  className="btn btn-secondary"
                  style={{ padding: '9px 18px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '9px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Check size={16} /> Save Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cultural Experience Modal */}
      {editExperienceModal && (
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
              maxWidth: '620px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
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
                {isCreatingExperience ? 'Add Cultural Experience' : `Edit: ${editExperienceModal.title || 'Experience'}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditExperienceModal(null)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveExperience} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Experience Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Traditional Coffee Ceremony"
                  value={editExperienceModal.title || ''}
                  onChange={(e) => setEditExperienceModal({ ...editExperienceModal, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Subtitle / Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g., An Authentic Ethiopian Ritual"
                  value={editExperienceModal.subtitle || ''}
                  onChange={(e) => setEditExperienceModal({ ...editExperienceModal, subtitle: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Culture, Excursion, Culinary"
                    value={editExperienceModal.category || ''}
                    onChange={(e) => setEditExperienceModal({ ...editExperienceModal, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                    Duration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 2 Hours, Full Day"
                    value={editExperienceModal.duration || ''}
                    onChange={(e) => setEditExperienceModal({ ...editExperienceModal, duration: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Experience Image
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="https://... or /uploads/..."
                    value={editExperienceModal.image || ''}
                    onChange={(e) => setEditExperienceModal({ ...editExperienceModal, image: e.target.value })}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                  />
                  <label
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#153D4B',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      cursor: uploadingExpImage ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Upload size={14} />
                    {uploadingExpImage ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingExpImage}
                      onChange={handleExperienceImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {editExperienceModal.image && (
                  <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E1DA', height: '160px', backgroundColor: '#F9F8F6' }}>
                    <img
                      src={editExperienceModal.image}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Full Description *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed narrative describing this experience for guests..."
                  value={editExperienceModal.description || ''}
                  onChange={(e) => setEditExperienceModal({ ...editExperienceModal, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '6px' }}>
                  Highlights / Inclusions (one per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Freshly roasted Sidamo beans&#10;Incense ceremony ritual&#10;Traditional snacks (kolo & popcorn)"
                  value={
                    Array.isArray(editExperienceModal.highlights)
                      ? editExperienceModal.highlights.join('\n')
                      : editExperienceModal.highlights || ''
                  }
                  onChange={(e) =>
                    setEditExperienceModal({
                      ...editExperienceModal,
                      highlights: e.target.value.split('\n').filter((h: string) => h.trim().length > 0),
                    })
                  }
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D5D4CC', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditExperienceModal(null)}
                  className="btn btn-secondary"
                  style={{ padding: '9px 18px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '9px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Check size={16} /> Save Experience
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
