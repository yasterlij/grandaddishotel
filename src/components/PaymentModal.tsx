'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  X,
  CreditCard,
  Smartphone,
  Building2,
  Banknote,
  Lock,
  ArrowRight,
  Printer,
  Copy,
  Check,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { PAYMENT_PROVIDERS, PaymentProviderType } from '@/lib/payment-types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingRef: string;
  reservationId: string;
  amountUSD: number;
  amountETB: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  onPaymentSuccess?: (paymentData: any) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  bookingRef,
  reservationId,
  amountUSD,
  amountETB,
  guestName,
  guestEmail,
  guestPhone,
  roomName,
  checkInDate,
  checkOutDate,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderType>('CHAPA');
  const [currency, setCurrency] = useState<'ETB' | 'USD'>('ETB');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<any>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Form states per provider
  const [telebirrPhone, setTelebirrPhone] = useState(guestPhone || '+251 9');
  const [telebirrPromptSent, setTelebirrPromptSent] = useState(false);
  const [telebirrPin, setTelebirrPin] = useState('');

  const [cbeTxId, setCbeTxId] = useState('');

  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardHolder, setCardHolder] = useState(guestName || 'GUEST HOLDER');

  if (!isOpen) return null;

  const currentAmount = currency === 'ETB' ? amountETB : amountUSD;

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Initialize Payment
      const initRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          provider: selectedProvider,
          amount: currentAmount,
          currency,
          guestEmail,
          guestName,
          bookingRef,
        }),
      });
      const initData = await initRes.json();

      if (!initData.success) {
        throw new Error(initData.error || 'Failed to initialize payment');
      }

      const txRef = initData.payment.txRef;

      // Simulate network / gateway round-trip
      await new Promise((resolve) => setTimeout(resolve, 1400));

      if (selectedProvider === 'CASH_ON_ARRIVAL') {
        // Cash remains PENDING
        setPaymentSuccess(true);
        setCompletedPayment({
          ...initData.payment,
          status: 'PENDING (Pay at Hotel)',
          provider: 'CASH_ON_ARRIVAL',
        });
        if (onPaymentSuccess) onPaymentSuccess(initData.payment);
        return;
      }

      // 2. Verify Payment as SUCCESS in PostgreSQL
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txRef,
          status: 'SUCCESS',
          gatewayRef: `GW-${selectedProvider}-${Date.now().toString().slice(-6)}`,
        }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setPaymentSuccess(true);
        setCompletedPayment(verifyData.payment);
        if (onPaymentSuccess) onPaymentSuccess(verifyData.payment);
      } else {
        throw new Error(verifyData.error || 'Payment verification failed');
      }
    } catch (err: any) {
      alert(err.message || 'Payment processing error');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 42, 51, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E1DA',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#0F2A33',
            color: '#FFFFFF',
            padding: '24px 28px',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#E49951', fontWeight: 600 }}>
                SECURE PAYMENT CHECKOUT
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(52, 199, 89, 0.2)',
                  color: '#34C759',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                <Lock size={11} /> 256-Bit SSL Encrypted
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', margin: 0, fontWeight: 500 }}>
              Grand Addis Hotel & Resorts
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* SUCCESS SCREEN */}
        {paymentSuccess ? (
          <div style={{ padding: '36px 32px', textAlign: 'center' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: completedPayment?.status?.includes('PENDING') ? '#FFF8E6' : '#EBF8F0',
                color: completedPayment?.status?.includes('PENDING') ? '#D97706' : '#28A745',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <CheckCircle size={40} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: '#153D4B', marginBottom: '8px' }}>
              {completedPayment?.status?.includes('PENDING') ? 'Reservation Confirmed (Pay on Arrival)' : 'Payment Verified & Confirmed!'}
            </h3>
            <p style={{ color: '#5E6E75', fontSize: '14px', maxWidth: '480px', margin: '0 auto 24px', lineHeight: '1.6' }}>
              Your stay at Grand Addis Hotel has been successfully secured in our PostgreSQL database. A confirmation notification has been registered for <strong>{guestEmail}</strong>.
            </p>

            {/* Receipt Summary Card */}
            <div
              style={{
                backgroundColor: '#F9F9F6',
                border: '1px solid #E2E1DA',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'left',
                marginBottom: '28px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#838A8D', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Booking Reference</span>
                  <strong style={{ color: '#153D4B', fontSize: '15px' }}>{bookingRef}</strong>
                </div>

                <div>
                  <span style={{ color: '#838A8D', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Transaction Reference</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <code style={{ color: '#E49951', fontSize: '12px', fontWeight: 600 }}>
                      {completedPayment?.txRef || 'TX-PENDING'}
                    </code>
                    <button
                      onClick={() => copyRef(completedPayment?.txRef || bookingRef)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5E6E75' }}
                    >
                      {copiedRef ? <Check size={13} color="#28A745" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span style={{ color: '#838A8D', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Payment Gateway</span>
                  <strong style={{ color: '#153D4B' }}>{selectedProvider}</strong>
                </div>

                <div>
                  <span style={{ color: '#838A8D', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Amount Processed</span>
                  <strong style={{ color: '#28A745', fontSize: '16px' }}>
                    {currency === 'ETB' ? `${currentAmount.toLocaleString()} ETB` : `$${currentAmount}`}
                  </strong>
                </div>

                <div>
                  <span style={{ color: '#838A8D', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Room Category</span>
                  <span style={{ color: '#153D4B', fontWeight: 500 }}>{roomName}</span>
                </div>

                <div>
                  <span style={{ color: '#838A8D', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Stay Dates</span>
                  <span style={{ color: '#153D4B', fontWeight: 500 }}>{checkInDate} → {checkOutDate}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.print()}
                className="btn btn-outline"
                style={{ padding: '12px 24px' }}
              >
                <Printer size={16} />
                <span>Print Official Receipt</span>
              </button>
              <button
                onClick={onClose}
                className="btn btn-primary"
                style={{ padding: '12px 32px' }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* PAYMENT FORM */
          <div style={{ padding: '28px 32px' }}>
            {/* Amount Banner */}
            <div
              style={{
                backgroundColor: '#FDF9F4',
                border: '1px solid #F5E6D3',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: '#838A8D', textTransform: 'uppercase', fontWeight: 600 }}>Total Amount Due</span>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#153D4B' }}>
                  {currency === 'ETB' ? `${amountETB.toLocaleString()} ETB` : `$${amountUSD}`}
                </div>
                <div style={{ fontSize: '12px', color: '#5E6E75' }}>
                  Booking Ref: <strong>{bookingRef}</strong> • {roomName}
                </div>
              </div>

              {/* Currency Toggle */}
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #D5D4CC',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setCurrency('ETB')}
                  style={{
                    padding: '8px 14px',
                    border: 'none',
                    backgroundColor: currency === 'ETB' ? '#153D4B' : '#FFFFFF',
                    color: currency === 'ETB' ? '#FFFFFF' : '#153D4B',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  ETB (Br)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  style={{
                    padding: '8px 14px',
                    border: 'none',
                    backgroundColor: currency === 'USD' ? '#153D4B' : '#FFFFFF',
                    color: currency === 'USD' ? '#FFFFFF' : '#153D4B',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  USD ($)
                </button>
              </div>
            </div>

            {/* Provider Tabs Selector */}
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#153D4B', marginBottom: '10px' }}>
              Select Payment Gateway / Method:
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: '10px',
                marginBottom: '24px',
              }}
            >
              {PAYMENT_PROVIDERS.map((p) => {
                const isSelected = selectedProvider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(p.id);
                      setTelebirrPromptSent(false);
                    }}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '10px',
                      border: isSelected ? `2px solid ${p.color}` : '1px solid #E2E1DA',
                      backgroundColor: isSelected ? p.bgLight : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? p.color : '#153D4B' }}>
                      {p.name}
                    </span>
                    <span style={{ fontSize: '10px', color: '#838A8D' }}>
                      {p.category === 'super-gateway' ? 'All Banks/Cards' : p.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* PROVIDER-SPECIFIC INTERFACES */}

            {/* 1. CHAPA INTERFACE */}
            {selectedProvider === 'CHAPA' && (
              <div
                style={{
                  backgroundColor: '#E8F8F1',
                  border: '1px solid #B7E4D0',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: '#00A36C',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '14px',
                    }}
                  >
                    C
                  </span>
                  <div>
                    <strong style={{ color: '#153D4B', fontSize: '15px' }}>Chapa Payment Gateway</strong>
                    <div style={{ fontSize: '11px', color: '#00A36C', fontWeight: 600 }}>Official Ethiopian Integration</div>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.5', margin: '0 0 14px' }}>
                  Seamlessly pay with Telebirr, CBE Birr, Awash Bank, Amole, or any Debit/Credit Card via Chapa&apos;s secured checkout protocol.
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['Telebirr', 'CBE Birr', 'Awash', 'Visa/Mastercard'].map((b, i) => (
                    <span key={i} style={{ backgroundColor: '#FFFFFF', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', color: '#153D4B', fontWeight: 500, border: '1px solid #D1E7DD' }}>
                      ✓ {b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 2. TELEBIRR INTERFACE */}
            {selectedProvider === 'TELEBIRR' && (
              <div
                style={{
                  backgroundColor: '#E6F1FA',
                  border: '1px solid #B8D5ED',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Smartphone size={22} color="#0072CE" />
                  <div>
                    <strong style={{ color: '#153D4B', fontSize: '15px' }}>Telebirr Mobile Money Checkout</strong>
                    <div style={{ fontSize: '11px', color: '#0072CE', fontWeight: 600 }}>Ethio Telecom SuperApp / USSD Push</div>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '4px' }}>
                    Telebirr Registered Mobile Number:
                  </label>
                  <input
                    type="tel"
                    value={telebirrPhone}
                    onChange={(e) => setTelebirrPhone(e.target.value)}
                    placeholder="+251 911 234 567"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #B8D5ED',
                      fontSize: '14px',
                      fontWeight: 600,
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>

                {!telebirrPromptSent ? (
                  <button
                    type="button"
                    onClick={() => setTelebirrPromptSent(true)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#0072CE',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Send USSD Push (*127# Prompt)
                  </button>
                ) : (
                  <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid #0072CE' }}>
                    <div style={{ fontSize: '12px', color: '#0072CE', fontWeight: 600, marginBottom: '6px' }}>
                      📲 USSD Push sent to {telebirrPhone}! Enter PIN or approve on phone:
                    </div>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="Enter 4-Digit Telebirr PIN to Authorize"
                      value={telebirrPin}
                      onChange={(e) => setTelebirrPin(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #D5D4CC',
                        fontSize: '13px',
                        letterSpacing: '3px',
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 3. CBE BIRR / CEB INTERFACE */}
            {selectedProvider === 'CBE_BIRR' && (
              <div
                style={{
                  backgroundColor: '#F5ECF8',
                  border: '1px solid #E0C7E8',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Building2 size={22} color="#6E2585" />
                  <div>
                    <strong style={{ color: '#153D4B', fontSize: '15px' }}>Commercial Bank of Ethiopia (CBE / CBE Birr)</strong>
                    <div style={{ fontSize: '11px', color: '#6E2585', fontWeight: 600 }}>Shortcode: 882200</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E0C7E8', marginBottom: '14px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#5E6E75' }}>CBE Account Number:</span>
                    <strong style={{ color: '#153D4B' }}>1000188220011 (Grand Addis Hotel)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#5E6E75' }}>CBE Birr Shortcode:</span>
                    <strong style={{ color: '#6E2585' }}>882200</strong>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '4px' }}>
                    CBE Transaction Ref Number (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FT26279X1Y2..."
                    value={cbeTxId}
                    onChange={(e) => setCbeTxId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #E0C7E8',
                      fontSize: '13px',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>
              </div>
            )}

            {/* 4. SKINA / CARD INTERFACE */}
            {selectedProvider === 'SKINA' && (
              <div
                style={{
                  backgroundColor: '#EBF1F4',
                  border: '1px solid #CAD9E0',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CreditCard size={22} color="#153D4B" />
                  <div>
                    <strong style={{ color: '#153D4B', fontSize: '15px' }}>Skina / Card Checkout</strong>
                    <div style={{ fontSize: '11px', color: '#153D4B', fontWeight: 600 }}>Visa, Mastercard & Local Debit</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#5E6E75', marginBottom: '3px' }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CAD9E0', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#5E6E75', marginBottom: '3px' }}>
                        Expiration
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CAD9E0', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#5E6E75', marginBottom: '3px' }}>
                        CVC / CVV
                      </label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CAD9E0', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. CASH ON ARRIVAL */}
            {selectedProvider === 'CASH_ON_ARRIVAL' && (
              <div
                style={{
                  backgroundColor: '#FDF9F4',
                  border: '1px solid #E8D7C3',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Banknote size={22} color="#E49951" />
                  <strong style={{ color: '#153D4B', fontSize: '15px' }}>Pay Upon Check-in at Grand Addis</strong>
                </div>
                <p style={{ fontSize: '13px', color: '#5E6E75', lineHeight: '1.5', margin: 0 }}>
                  Your room reservation will be immediately guaranteed. You can complete settlement at our 24/7 reception desk using cash in Ethiopian Birr, USD, or debit card upon arrival.
                </p>
              </div>
            )}

            {/* ACTION BUTTON */}
            <button
              onClick={handleProcessPayment}
              disabled={isProcessing}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isProcessing ? 0.7 : 1,
              }}
            >
              {isProcessing ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                  <span>Connecting to {selectedProvider} Gateway...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>
                    {selectedProvider === 'CASH_ON_ARRIVAL'
                      ? 'Confirm Booking (Pay at Hotel)'
                      : `Pay ${currency === 'ETB' ? `${currentAmount.toLocaleString()} ETB` : `$${currentAmount}`} with ${selectedProvider}`}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
