'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  X,
  CreditCard,
  Lock,
  ArrowRight,
  Printer,
  Copy,
  Check,
  Info,
  Calendar,
} from 'lucide-react';
import {
  detectCardBrand,
  formatCardNumber,
  CardBrandMeta,
  SKINA_SUPPORTED_BRANDS,
} from '@/lib/skina';
import type { PaymentProviderType } from '@/lib/payment-types';
import MastercardCardForm from '@/components/MastercardCardForm';

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
  const currency: 'USD' = 'USD';
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<any>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [provider, setProvider] = useState<PaymentProviderType>(initialProvider);
  const [sandboxTestCard, setSandboxTestCard] = useState<{ number: string; expiry: string; cvc: string } | null>(null);

  // Card fields start EMPTY — never pre-filled with test credentials.
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState(guestName || '');

  useEffect(() => {
    if (isOpen && guestName && !cardHolder) {
      setCardHolder(guestName.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, guestName]);

  // Reset the flow every time the modal is (re)opened so a new booking never
  // inherits the previous paid receipt or stale card details.
  useEffect(() => {
    if (!isOpen) return;
    setPaymentSuccess(false);
    setCompletedPayment(null);
    setPaymentError('');
    setCopiedRef(false);
    setProvider(initialProvider);
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    // In sandbox mode, expose the gateway's test card so the demo flow stays
    // convenient without shipping pre-filled credentials to real guests.
    fetch('/api/payments/config')
      .then((r) => r.json())
      .then((data) => {
        if (data?.skina?.isSandbox && data?.skina?.testCards?.length > 0) {
          const t = data.skina.testCards[0];
          setSandboxTestCard({ number: t.number, expiry: t.expiry, cvc: t.cvc });
        } else {
          setSandboxTestCard(null);
        }
      })
      .catch(() => setSandboxTestCard(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Escape closes the modal (consistent with the other modals)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentAmount = amountUSD;
  const detectedCard: CardBrandMeta = detectCardBrand(cardNumber);
  const cleanDigitsForCheck = cardNumber.replace(/\D/g, '');
  // Only flag as unsupported once enough digits exist to reliably identify the brand
  const hasEnoughDigits = cleanDigitsForCheck.length >= 4;
  const isCardSupported = !hasEnoughDigits || SKINA_SUPPORTED_BRANDS.includes(detectedCard.brand);

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

  /** Light client-side validation before hitting the gateway. */
  const validateCardForm = (): string | null => {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) {
      return 'Please enter a valid card number.';
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      return 'Please enter the card expiry as MM/YY.';
    }
    const [mm, yy] = cardExpiry.split('/').map(Number);
    if (mm < 1 || mm > 12) return 'The expiry month must be between 01 and 12.';
    const expiry = new Date(2000 + yy, mm, 0); // last day of the month
    if (expiry.getTime() < Date.now()) return 'This card has expired.';
    if (!/^\d{3,4}$/.test(cardCvc)) {
      return 'Please enter a valid CVC (3 or 4 digits).';
    }
    if (!cardHolder.trim()) {
      return 'Please enter the card holder name.';
    }
    return null;
  };

  const handleProcessPayment = async () => {
    setPaymentError('');
    const validationError = validateCardForm();
    if (validationError) {
      setPaymentError(validationError);
      return;
    }
    setIsProcessing(true);
    try {
      // 1. Initialize Payment — the server reads the amount from the
      // reservation; card data is only used for brand detection/masking.
      const initRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          provider,
          cardDetails: {
            number: cardNumber,
            expiry: cardExpiry,
            cvc: cardCvc,
            cardHolder: cardHolder || guestName,
          },
        }),
      });
      const initData = await initRes.json();

      if (!initData.success) {
        throw new Error(initData.error || 'Failed to initialize payment');
      }

      const txRef = initData.payment.txRef;

      // Simulate gateway round-trip (sandbox only — in production the gateway
      // confirms payment server-to-server; the client just polls status).
      await new Promise((resolve) => setTimeout(resolve, 1400));

      // Verify Payment as SUCCESS
      const cleanDigits = cardNumber.replace(/\D/g, '');
      const maskedCard = cleanDigits.length >= 4 ? `•••• •••• •••• ${cleanDigits.slice(-4)}` : '•••• 4242';

      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txRef,
          status: 'SUCCESS',
          gatewayRef: `GW-SKINA-${Date.now().toString().slice(-6)}`,
        }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setPaymentSuccess(true);
        const finalReceipt = {
          ...verifyData.payment,
          cardMeta: {
            brand: detectedCard.brand,
            badge: detectedCard.badge,
            masked: maskedCard,
          },
        };
        setCompletedPayment(finalReceipt);
        if (onPaymentSuccess) onPaymentSuccess(finalReceipt);
      } else {
        throw new Error(verifyData.error || 'Payment verification failed');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment processing error — please try again.');
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
      role="dialog"
      aria-modal="true"
      aria-label="Secure payment"
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
              Grand Addis Hotel
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
                    <strong style={{ color: '#153D4B' }}>SkinaPay Secure</strong>
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
                      PCI DSS
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ color: '#838A8D', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>
                    Amount Processed
                  </span>
                  <strong style={{ color: '#28A745', fontSize: '16px' }}>
                    ${amountUSD} USD
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
            {/* Booking Summary Card */}
            <div
              style={{
                backgroundColor: '#0F2A33',
                borderRadius: '14px',
                padding: '18px 20px',
                marginBottom: '20px',
                color: '#FFFFFF',
              }}
            >
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#E49951', fontWeight: 700, marginBottom: '12px' }}>
                BOOKING SUMMARY
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', fontSize: '13px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '2px' }}>ROOM</span>
                  <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{roomName}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '2px' }}>AMOUNT DUE</span>
                  <span style={{ fontWeight: 700, fontSize: '18px', color: '#E49951' }}>${amountUSD} USD</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '2px' }}>STAY DATES</span>
                  <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                    <Calendar size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    {checkInDate} → {checkOutDate}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '2px' }}>BOOKING REF</span>
                  <code style={{ color: '#E49951', fontWeight: 600, fontSize: '13px' }}>{bookingRef}</code>
                </div>
              </div>
            </div>

            {/* Section label */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E1DA' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#153D4B', textTransform: 'uppercase', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>
                <Lock size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Secure Card Payment
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E1DA' }} />
            </div>

            {/* Card Brand Accepted Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#F7F7F2',
                border: '1px solid #E2E1DA',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#5E6E75', marginRight: '2px' }}>
                Accepted:
              </span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#EB001B', backgroundColor: '#FFF0F0', padding: '3px 8px', borderRadius: '4px' }}>
                ✓ Mastercard
              </span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#153D4B', backgroundColor: '#EBF1F4', padding: '3px 8px', borderRadius: '4px' }}>
                ✓ Local Debit Cards
              </span>
              <span style={{ fontSize: '10px', color: '#A0ADB3', backgroundColor: '#F7F7F2', padding: '3px 8px', borderRadius: '4px', border: '1px dashed #D5D4CC' }}>
                Visa · AmEx · UnionPay — coming soon
              </span>
            </div>

            {/* Unsupported card warning */}
            {!isCardSupported && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#FFF8E6',
                  border: '1px solid #F59E0B',
                  marginBottom: '14px',
                  fontSize: '13px',
                  color: '#92400E',
                }}
              >
                <span style={{ fontSize: '18px', lineHeight: 1 }}>⚠️</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>
                    {detectedCard.brand} is not yet supported by SikinaPay
                  </strong>
                  <span style={{ fontSize: '12px' }}>
                    Please use a <strong>Mastercard</strong> or a local Ethiopian debit card to complete your booking.
                  </span>
                </div>
              </div>
            )}

            {/* Interactive Virtual Card Preview */}
            <div
              style={{
                background: 'linear-gradient(135deg, #153D4B 0%, #1F5A6E 50%, #0F2A33 100%)',
                borderRadius: '14px',
                padding: '18px 22px',
                color: '#FFFFFF',
                marginBottom: '16px',
                boxShadow: '0 10px 28px rgba(21, 61, 75, 0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: '-40px',
                  bottom: '-40px',
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.04)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  right: '60px',
                  top: '-20px',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'rgba(228, 153, 81, 0.08)',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '24px',
                      borderRadius: '4px',
                      backgroundColor: '#E49951',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      letterSpacing: '0.5px',
                    }}
                  >
                    CHIP
                  </div>
                  <span style={{ fontSize: '11px', letterSpacing: '2px', opacity: 0.7, fontWeight: 500 }}>GRAND ADDIS</span>
                </div>

                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: detectedCard.accentBg,
                    color: detectedCard.color,
                    fontWeight: 800,
                    fontSize: '12px',
                    letterSpacing: '0.5px',
                  }}
                >
                  {detectedCard.brand}
                </span>
              </div>

              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '19px',
                  letterSpacing: '3px',
                  marginBottom: '16px',
                  textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  opacity: cardNumber ? 1 : 0.4,
                }}
              >
                {cardNumber || '•••• •••• •••• ••••'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '12px' }}>
                <div>
                  <span style={{ fontSize: '9px', opacity: 0.6, display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>
                    Cardholder
                  </span>
                  <span style={{ fontWeight: 600, letterSpacing: '1.5px', fontSize: '13px' }}>
                    {cardHolder || 'GUEST NAME'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '9px', opacity: 0.6, display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>
                    Expires
                  </span>
                  <span style={{ fontWeight: 600, letterSpacing: '2px', fontSize: '13px' }}>
                    {cardExpiry || 'MM/YY'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sandbox helper: fill the gateway test card (demo convenience) */}
            {sandboxTestCard && !paymentSuccess && (
              <button
                type="button"
                onClick={() => {
                  setCardNumber(sandboxTestCard.number);
                  setCardExpiry(sandboxTestCard.expiry);
                  setCardCvc(sandboxTestCard.cvc);
                }}
                style={{
                  width: '100%',
                  padding: '9px',
                  marginBottom: '14px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#5E6E75',
                  backgroundColor: '#F7F7F2',
                  border: '1px dashed #D5D4CC',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                🧪 Sandbox mode — fill test card ({sandboxTestCard.number})
              </button>
            )}

            {/* Standard World Mastercard card input form from reference */}
            <MastercardCardForm
              cardHolder={cardHolder}
              setCardHolder={setCardHolder}
              cardNumber={cardNumber}
              setCardNumber={setCardNumber}
              cardExpiry={cardExpiry}
              setCardExpiry={setCardExpiry}
              cardCvc={cardCvc}
              setCardCvc={setCardCvc}
              agreeTerms={true}
              isProcessing={isProcessing}
              onSubmit={handleProcessPayment}
              submitButtonText={`Pay $${amountUSD} Securely`}
              errorMessage={paymentError}
              showButton={true}
            />

            {/* Powered-by footer */}
            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '10px', color: '#A0ADB3', letterSpacing: '0.3px' }}>
              Transactions processed by{' '}
              <span style={{ fontWeight: 700, color: '#153D4B' }}>SkinaPay™</span>
              {' '}· Secure Gateway
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
