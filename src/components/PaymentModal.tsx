'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Zap,
  Info,
} from 'lucide-react';
import { PAYMENT_PROVIDERS, PaymentProviderType } from '@/lib/payment-types';
import {
  detectCardBrand,
  formatCardNumber,
  SKINA_TEST_CARDS,
  CardBrandMeta,
} from '@/lib/skina';

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
  initialProvider?: PaymentProviderType;
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
  initialProvider = 'SKINA',
  onPaymentSuccess,
}: PaymentModalProps) {
  // Default to SkinaPay as requested
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderType>(initialProvider || 'SKINA');
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

  // SkinaPay Card State
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardHolder, setCardHolder] = useState(guestName || 'VALUED GUEST');

  // Sync initialProvider when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedProvider(initialProvider || 'SKINA');
      if (guestName && (!cardHolder || cardHolder === 'VALUED GUEST')) {
        setCardHolder(guestName.toUpperCase());
      }
    }
  }, [isOpen, initialProvider, guestName]);

  if (!isOpen) return null;

  const currentAmount = currency === 'ETB' ? amountETB : amountUSD;
  const detectedCard: CardBrandMeta = detectCardBrand(cardNumber);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let clean = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
      clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    setCardExpiry(clean);
  };

  const applyTestCard = (testCard: (typeof SKINA_TEST_CARDS)[0]) => {
    setCardNumber(testCard.number);
    setCardExpiry(testCard.expiry);
    setCardCvc(testCard.cvc);
  };

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
          cardDetails:
            selectedProvider === 'SKINA'
              ? {
                  number: cardNumber,
                  expiry: cardExpiry,
                  cvc: cardCvc,
                  cardHolder: cardHolder || guestName,
                }
              : undefined,
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
      const cleanDigits = cardNumber.replace(/\D/g, '');
      const maskedCard = cleanDigits.length >= 4 ? `•••• •••• •••• ${cleanDigits.slice(-4)}` : '•••• 4242';

      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txRef,
          status: 'SUCCESS',
          gatewayRef:
            selectedProvider === 'SKINA'
              ? `GW-SKINA-${Date.now().toString().slice(-6)}`
              : `GW-${selectedProvider}-${Date.now().toString().slice(-6)}`,
        }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setPaymentSuccess(true);
        const finalReceipt = {
          ...verifyData.payment,
          cardMeta:
            selectedProvider === 'SKINA'
              ? {
                  brand: detectedCard.brand,
                  badge: detectedCard.badge,
                  masked: maskedCard,
                }
              : undefined,
        };
        setCompletedPayment(finalReceipt);
        if (onPaymentSuccess) onPaymentSuccess(finalReceipt);
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
        backgroundColor: 'rgba(15, 42, 51, 0.78)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '94vh',
          overflowY: 'auto',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.28)',
          border: '1px solid #E2E1DA',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#0F2A33',
            color: '#FFFFFF',
            padding: '22px 28px',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  color: '#E49951',
                  fontWeight: 600,
                }}
              >
                SECURE CHECKOUT
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
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '23px', margin: 0, fontWeight: 500 }}>
              Grand Addis Hotel & Resorts
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
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
              {completedPayment?.status?.includes('PENDING')
                ? 'Reservation Confirmed (Pay on Arrival)'
                : 'Payment Verified & Confirmed!'}
            </h3>
            <p style={{ color: '#5E6E75', fontSize: '14px', maxWidth: '480px', margin: '0 auto 24px', lineHeight: '1.6' }}>
              Your stay at Grand Addis Hotel has been successfully secured in our PostgreSQL database. A confirmation has been registered for <strong>{guestEmail}</strong>.
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
                  <span style={{ color: '#838A8D', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                    Booking Reference
                  </span>
                  <strong style={{ color: '#153D4B', fontSize: '15px' }}>{bookingRef}</strong>
                </div>

                <div>
                  <span style={{ color: '#838A8D', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                    Transaction Reference
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <code style={{ color: '#E49951', fontSize: '12px', fontWeight: 600 }}>
                      {completedPayment?.txRef || 'TX-PENDING'}
                    </code>
                    <button
                      onClick={() => copyRef(completedPayment?.txRef || bookingRef)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5E6E75' }}
                      title="Copy transaction ref"
                    >
                      {copiedRef ? <Check size={13} color="#28A745" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span style={{ color: '#838A8D', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                    Payment Gateway
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ color: '#153D4B' }}>{selectedProvider}</strong>
                    {selectedProvider === 'SKINA' && (
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#EBF1F4',
                          color: '#153D4B',
                          fontWeight: 600,
                        }}
                      >
                        Skina Sandbox
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ color: '#838A8D', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                    Amount Processed
                  </span>
                  <strong style={{ color: '#28A745', fontSize: '16px' }}>
                    {currency === 'ETB' ? `${currentAmount.toLocaleString()} ETB` : `$${currentAmount}`}
                  </strong>
                </div>

                {completedPayment?.cardMeta && (
                  <div>
                    <span style={{ color: '#838A8D', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                      Card Processed
                    </span>
                    <strong style={{ color: '#153D4B' }}>
                      {completedPayment.cardMeta.brand} ({completedPayment.cardMeta.masked})
                    </strong>
                  </div>
                )}

                <div>
                  <span style={{ color: '#838A8D', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                    Room Category
                  </span>
                  <span style={{ color: '#153D4B', fontWeight: 500 }}>{roomName}</span>
                </div>

                <div>
                  <span style={{ color: '#838A8D', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                    Stay Dates
                  </span>
                  <span style={{ color: '#153D4B', fontWeight: 500 }}>
                    {checkInDate} → {checkOutDate}
                  </span>
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
          <div style={{ padding: '24px 28px' }}>
            {/* Amount Banner */}
            <div
              style={{
                backgroundColor: '#FDF9F4',
                border: '1px solid #F5E6D3',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#838A8D', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Amount Due
                </span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#153D4B' }}>
                  {currency === 'ETB' ? `${amountETB.toLocaleString()} ETB` : `$${amountUSD}`}
                </div>
                <div style={{ fontSize: '11px', color: '#5E6E75' }}>
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
                    padding: '7px 13px',
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
                    padding: '7px 13px',
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

            {/* Provider Tabs Selector - Ordered: SkinaPay first, then Telebirr, Chapa, CBE, Cash */}
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#153D4B', marginBottom: '8px' }}>
              Select Payment Provider (Default: SkinaPay):
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))',
                gap: '8px',
                marginBottom: '20px',
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
                      padding: '10px 8px',
                      borderRadius: '10px',
                      border: isSelected ? `2px solid ${p.color}` : '1px solid #E2E1DA',
                      backgroundColor: isSelected ? p.bgLight : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {p.id === 'SKINA' && <CreditCard size={13} color={p.color} />}
                      {p.id === 'TELEBIRR' && <Smartphone size={13} color={p.color} />}
                      {p.id === 'CHAPA' && <Zap size={13} color={p.color} />}
                      {p.id === 'CBE_BIRR' && <Building2 size={13} color={p.color} />}
                      {p.id === 'CASH_ON_ARRIVAL' && <Banknote size={13} color={p.color} />}
                      <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? p.color : '#153D4B' }}>
                        {p.name.split(' ')[0]}
                      </span>
                    </div>
                    <span style={{ fontSize: '9px', color: isSelected ? p.color : '#838A8D', fontWeight: 500 }}>
                      {p.id === 'SKINA' ? 'Visa / All Cards' : p.badge.slice(0, 16)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* PROVIDER-SPECIFIC INTERFACES */}

            {/* 1. SKINAPAY INTERFACE (DEFAULT) */}
            {selectedProvider === 'SKINA' && (
              <div
                style={{
                  backgroundColor: '#F8FAFB',
                  border: '1px solid #CAD9E0',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  marginBottom: '22px',
                }}
              >
                {/* Skina Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#153D4B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                      }}
                    >
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ color: '#153D4B', fontSize: '15px' }}>SkinaPay Instant Checkout</strong>
                        <span
                          style={{
                            fontSize: '10px',
                            backgroundColor: '#EBF1F4',
                            color: '#153D4B',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          DEFAULT
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#5E6E75' }}>
                        Accepts Visa, Mastercard & all cards supported by Skina
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      backgroundColor: '#E8F8F1',
                      color: '#00A36C',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      border: '1px solid #B7E4D0',
                    }}
                  >
                    ● Sandbox Configured (.env)
                  </span>
                </div>

                {/* Accepted Cards Icons Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E1DA',
                    marginBottom: '16px',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#5E6E75', marginRight: '4px' }}>
                    Accepted:
                  </span>
                  {[
                    { label: 'Visa', color: '#1A1F71', bg: '#EBF0FF' },
                    { label: 'Mastercard', color: '#EB001B', bg: '#FFF0F0' },
                    { label: 'American Express', color: '#006FCF', bg: '#EEF7FF' },
                    { label: 'UnionPay', color: '#007B80', bg: '#E6F8F8' },
                    { label: 'Local Debit Cards', color: '#153D4B', bg: '#EBF1F4' },
                  ].map((card, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: card.color,
                        backgroundColor: card.bg,
                        padding: '2px 7px',
                        borderRadius: '4px',
                      }}
                    >
                      ✓ {card.label}
                    </span>
                  ))}
                </div>

                {/* Interactive Virtual Card Preview */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #153D4B 0%, #1F5A6E 50%, #0F2A33 100%)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    color: '#FFFFFF',
                    marginBottom: '16px',
                    boxShadow: '0 8px 20px rgba(21, 61, 75, 0.25)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      right: '-30px',
                      bottom: '-30px',
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.05)',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '30px',
                          height: '22px',
                          borderRadius: '4px',
                          backgroundColor: '#E49951',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '9px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                        }}
                      >
                        CHIP
                      </div>
                      <span style={{ fontSize: '11px', letterSpacing: '1px', opacity: 0.8 }}>SKINAPAY SECURE</span>
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: detectedCard.accentBg,
                        color: detectedCard.color,
                        fontWeight: 800,
                        fontSize: '11px',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {detectedCard.brand}
                    </span>
                  </div>

                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '17px',
                      letterSpacing: '2.5px',
                      marginBottom: '14px',
                      textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                    }}
                  >
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px' }}>
                    <div>
                      <span style={{ fontSize: '9px', opacity: 0.7, display: 'block', textTransform: 'uppercase' }}>
                        Cardholder
                      </span>
                      <span style={{ fontWeight: 600, letterSpacing: '1px' }}>
                        {cardHolder || 'GUEST NAME'}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '9px', opacity: 0.7, display: 'block', textTransform: 'uppercase' }}>
                        Expires
                      </span>
                      <span style={{ fontWeight: 600, letterSpacing: '1px' }}>
                        {cardExpiry || 'MM/YY'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick 1-Click Test Cards Bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#5E6E75' }}>
                      Testing Credentials (1-Click Presets):
                    </span>
                    <span style={{ fontSize: '10px', color: '#E49951', fontWeight: 600 }}>
                      Click any test card to auto-fill
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {SKINA_TEST_CARDS.map((tc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyTestCard(tc)}
                        style={{
                          padding: '5px 9px',
                          borderRadius: '6px',
                          border: `1px solid ${tc.color}33`,
                          backgroundColor: tc.bg,
                          color: tc.color,
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>{tc.label}</span>
                        <span style={{ opacity: 0.6, fontSize: '10px' }}>({tc.number.slice(-4)})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#153D4B' }}>
                        Card Number (Visa, Mastercard, AmEx, UnionPay, Local)
                      </label>
                      <span style={{ fontSize: '11px', color: detectedCard.color, fontWeight: 700 }}>
                        {detectedCard.badge}
                      </span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4242 4242 4242 4242"
                        maxLength={23}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          paddingLeft: '38px',
                          borderRadius: '8px',
                          border: '1px solid #CAD9E0',
                          fontSize: '14px',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          backgroundColor: '#FFFFFF',
                          color: '#153D4B',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: detectedCard.color,
                        }}
                      >
                        <CreditCard size={16} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#153D4B', marginBottom: '3px' }}>
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        placeholder="GUEST NAME"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CAD9E0',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: '#FFFFFF',
                          textTransform: 'uppercase',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#153D4B', marginBottom: '3px' }}>
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="12/28"
                        maxLength={5}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CAD9E0',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: '#FFFFFF',
                          textAlign: 'center',
                          fontFamily: 'monospace',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#153D4B', marginBottom: '3px' }}>
                        CVC / CVV
                      </label>
                      <input
                        type="password"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="888"
                        maxLength={4}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CAD9E0',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: '#FFFFFF',
                          textAlign: 'center',
                          letterSpacing: '2px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sandbox note */}
                <div
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: '#5E6E75',
                  }}
                >
                  <Info size={13} color="#153D4B" />
                  <span>
                    Direct gateway authorization via <strong>https://sandbox.sikinapay.com</strong>. All major card brands supported.
                  </span>
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
                  padding: '18px 20px',
                  marginBottom: '22px',
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

            {/* 3. CHAPA INTERFACE */}
            {selectedProvider === 'CHAPA' && (
              <div
                style={{
                  backgroundColor: '#E8F8F1',
                  border: '1px solid #B7E4D0',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  marginBottom: '22px',
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
                    <div style={{ fontSize: '11px', color: '#00A36C', fontWeight: 600 }}>Ethiopian Super Gateway</div>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.5', margin: '0 0 14px' }}>
                  Pay with Telebirr, CBE Birr, Awash Bank, Amole, or any Debit/Credit Card via Chapa&apos;s secured checkout protocol.
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['Telebirr', 'CBE Birr', 'Awash', 'Visa/Mastercard'].map((b, i) => (
                    <span
                      key={i}
                      style={{
                        backgroundColor: '#FFFFFF',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#153D4B',
                        fontWeight: 500,
                        border: '1px solid #D1E7DD',
                      }}
                    >
                      ✓ {b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 4. CBE BIRR / CEB INTERFACE */}
            {selectedProvider === 'CBE_BIRR' && (
              <div
                style={{
                  backgroundColor: '#F5ECF8',
                  border: '1px solid #E0C7E8',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  marginBottom: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Building2 size={22} color="#6E2585" />
                  <div>
                    <strong style={{ color: '#153D4B', fontSize: '15px' }}>Commercial Bank of Ethiopia (CBE / CBE Birr)</strong>
                    <div style={{ fontSize: '11px', color: '#6E2585', fontWeight: 600 }}>Shortcode: 882200</div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E0C7E8',
                    marginBottom: '14px',
                    fontSize: '13px',
                  }}
                >
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

            {/* 5. CASH ON ARRIVAL */}
            {selectedProvider === 'CASH_ON_ARRIVAL' && (
              <div
                style={{
                  backgroundColor: '#FDF9F4',
                  border: '1px solid #E8D7C3',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  marginBottom: '22px',
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
                  <span>Authorizing via {selectedProvider === 'SKINA' ? 'SkinaPay Sandbox' : selectedProvider}...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>
                    {selectedProvider === 'CASH_ON_ARRIVAL'
                      ? 'Confirm Booking (Pay at Hotel)'
                      : selectedProvider === 'SKINA'
                      ? `Pay ${currency === 'ETB' ? `${currentAmount.toLocaleString()} ETB` : `$${currentAmount}`} with SkinaPay (${detectedCard.brand})`
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
