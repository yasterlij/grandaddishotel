'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { detectCardBrand, formatCardNumber, CardBrandMeta } from '@/lib/skina';

export interface MastercardCardFormProps {
  cardHolder: string;
  setCardHolder: (val: string) => void;
  cardNumber: string;
  setCardNumber: (val: string) => void;
  cardExpiry: string;
  setCardExpiry: (val: string) => void;
  cardCvc: string;
  setCardCvc: (val: string) => void;
  agreeTerms?: boolean;
  setAgreeTerms?: (val: boolean) => void;
  subscribeNewsletter?: boolean;
  setSubscribeNewsletter?: (val: boolean) => void;
  isProcessing?: boolean;
  onSubmit?: (e?: React.FormEvent) => void;
  submitButtonText?: string;
  errorMessage?: string;
  showButton?: boolean;
}

export default function MastercardCardForm({
  cardHolder,
  setCardHolder,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvc,
  setCardCvc,
  agreeTerms = true,
  setAgreeTerms,
  subscribeNewsletter = false,
  setSubscribeNewsletter,
  isProcessing = false,
  onSubmit,
  submitButtonText = 'Confirm Booking',
  errorMessage,
  showButton = true,
}: MastercardCardFormProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const detectedCard: CardBrandMeta = detectCardBrand(cardNumber);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    setCardExpiry(val);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvc(val);
  };

  const inputStyle = (fieldName: string): React.CSSProperties => ({
    width: '100%',
    backgroundColor: focusedField === fieldName ? '#FFFFFF' : '#F3F4F6',
    border: focusedField === fieldName ? '1px solid #D4A359' : '1px solid #E5E7EB',
    borderRadius: '6px',
    padding: '12px 14px',
    fontSize: '13.5px',
    color: '#1F2937',
    outline: 'none',
    boxShadow:
      focusedField === fieldName
        ? '0 0 0 3px rgba(212, 163, 89, 0.18)'
        : 'none',
    transition: 'all 0.15s ease-in-out',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: '6px',
    letterSpacing: '0.2px',
  };

  return (
    <div style={{ width: '100%' }}>
      {/* 1. Name On Card */}
      <div style={{ marginBottom: '14px' }}>
        <label htmlFor="card-name" style={labelStyle}>
          Name On Card
        </label>
        <input
          id="card-name"
          type="text"
          autoComplete="cc-name"
          placeholder="Name On Card"
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
          style={{
            ...inputStyle('name'),
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
          }}
        />
      </div>

      {/* 2. Card Number */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label htmlFor="card-number" style={{ ...labelStyle, marginBottom: 0 }}>
            Card Number
          </label>
          {cardNumber && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: detectedCard.color,
                backgroundColor: detectedCard.accentBg,
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              {detectedCard.badge}
            </span>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <input
            id="card-number"
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="XXXX XXXX XXXX XXXX"
            value={cardNumber}
            onChange={handleCardNumberChange}
            onFocus={() => setFocusedField('number')}
            onBlur={() => setFocusedField(null)}
            maxLength={23}
            style={{
              ...inputStyle('number'),
              paddingRight: '48px',
              fontFamily: cardNumber ? 'monospace' : 'inherit',
              letterSpacing: cardNumber ? '1.5px' : 'normal',
              fontWeight: cardNumber ? 600 : 400,
            }}
          />
          {/* Card brand icon badge on right */}
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {detectedCard.brand === 'Mastercard' ? (
              <svg width="30" height="18" viewBox="0 0 34 22" fill="none" aria-label="Mastercard">
                <circle cx="11" cy="11" r="10" fill="#EB001B" />
                <circle cx="23" cy="11" r="10" fill="#F79E1B" />
                <path d="M17 4.1a9.9 9.9 0 0 1 0 13.8 9.9 9.9 0 0 1 0-13.8z" fill="#FF5F00" />
              </svg>
            ) : detectedCard.brand === 'Visa' ? (
              <svg width="32" height="12" viewBox="0 0 50 16" fill="none" aria-label="Visa">
                <text x="0" y="14" fontFamily="sans-serif" fontStyle="italic" fontWeight="900" fontSize="16" fill="#1A1F71">VISA</text>
              </svg>
            ) : (
              <svg width="30" height="18" viewBox="0 0 34 22" fill="none" aria-label="Card">
                <circle cx="11" cy="11" r="10" fill="#EB001B" />
                <circle cx="23" cy="11" r="10" fill="#F79E1B" />
                <path d="M17 4.1a9.9 9.9 0 0 1 0 13.8 9.9 9.9 0 0 1 0-13.8z" fill="#FF5F00" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* 3. Expiry and CVV (Side by side grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
        <div>
          <label htmlFor="card-expiry" style={labelStyle}>
            Expiry
          </label>
          <input
            id="card-expiry"
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM / YY"
            value={cardExpiry}
            onChange={handleExpiryChange}
            onFocus={() => setFocusedField('expiry')}
            onBlur={() => setFocusedField(null)}
            maxLength={5}
            style={{
              ...inputStyle('expiry'),
              textAlign: 'center',
              fontFamily: cardExpiry ? 'monospace' : 'inherit',
              letterSpacing: cardExpiry ? '1.5px' : 'normal',
              fontWeight: cardExpiry ? 600 : 400,
            }}
          />
        </div>

        <div>
          <label htmlFor="card-cvv" style={labelStyle}>
            CVV
          </label>
          <input
            id="card-cvv"
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="***"
            value={cardCvc}
            onChange={handleCvcChange}
            onFocus={() => setFocusedField('cvv')}
            onBlur={() => setFocusedField(null)}
            maxLength={4}
            style={{
              ...inputStyle('cvv'),
              textAlign: 'center',
              letterSpacing: '3px',
              fontWeight: 600,
            }}
          />
        </div>
      </div>

      {/* 4. Guarantee / Disclaimer Notice (Deep red from screenshot) */}
      <p
        style={{
          color: '#881337',
          fontSize: '11px',
          lineHeight: '1.45',
          margin: '12px 0 14px',
          fontWeight: 500,
        }}
      >
        Your credit card will not be charged. It is securely processed and only used to guarantee your booking.
      </p>

      {/* 5. Trust & Brand Badges (PCI DSS on left, Visa & Mastercard on right) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '14px',
          marginBottom: '14px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        {/* PCI DSS Compliant badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="PCI DSS Compliant">
            <path
              d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z"
              fill="#059669"
            />
            <path
              d="M10 15.5l-3.5-3.5 1.4-1.4 2.1 2.1 5.6-5.6 1.4 1.4L10 15.5z"
              fill="#FFFFFF"
            />
          </svg>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px', color: '#065F46' }}>
              PCI DSS
            </div>
            <div style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.5px', color: '#047857' }}>
              COMPLIANT
            </div>
          </div>
        </div>

        {/* Visa & Mastercard Logos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Visa wordmark */}
          <span
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: '15px',
              color: '#1A1F71',
              letterSpacing: '1px',
            }}
          >
            VISA
          </span>

          {/* Mastercard overlapping circles */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="34" height="22" viewBox="0 0 34 22" fill="none" aria-label="Mastercard">
              <circle cx="11" cy="11" r="10" fill="#EB001B" />
              <circle cx="23" cy="11" r="10" fill="#F79E1B" />
              <path d="M17 4.1a9.9 9.9 0 0 1 0 13.8 9.9 9.9 0 0 1 0-13.8z" fill="#FF5F00" />
            </svg>
          </div>
        </div>
      </div>

      {/* 6. Terms and Newsletter Checkboxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '11px',
            color: '#4B5563',
            cursor: 'pointer',
            lineHeight: '1.4',
          }}
        >
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms && setAgreeTerms(e.target.checked)}
            required
            style={{
              marginTop: '2px',
              accentColor: '#D4A359',
              cursor: 'pointer',
            }}
          />
          <span>
            By booking, you have agreed to our{' '}
            <Link
              href="/terms-conditions"
              target="_blank"
              style={{ color: '#D4A359', textDecoration: 'underline', fontWeight: 500 }}
            >
              Terms and Conditions
            </Link>
            {' '}|{' '}
            <Link
              href="/terms-conditions"
              target="_blank"
              style={{ color: '#D4A359', textDecoration: 'underline', fontWeight: 500 }}
            >
              Payment Terms
            </Link>
          </span>
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#4B5563',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={subscribeNewsletter}
            onChange={(e) => setSubscribeNewsletter && setSubscribeNewsletter(e.target.checked)}
            style={{
              accentColor: '#D4A359',
              cursor: 'pointer',
            }}
          />
          <span>Subscribe to Grand Addis Hotel Newsletter</span>
        </label>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#B91C1C',
            fontSize: '12px',
            fontWeight: 500,
            marginBottom: '14px',
            textAlign: 'center',
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* 7. Action Button */}
      {showButton && (
        <button
          type="button"
          onClick={() => onSubmit && onSubmit()}
          disabled={isProcessing}
          style={{
            width: '100%',
            padding: '13px 20px',
            backgroundColor: '#D4A359',
            backgroundImage: 'linear-gradient(180deg, #D9A75C 0%, #C69248 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '7px',
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '0.3px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(212, 163, 89, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            opacity: isProcessing ? 0.7 : 1,
            transition: 'all 0.15s ease-in-out',
          }}
        >
          {isProcessing ? (
            <>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
              <span>Processing...</span>
            </>
          ) : (
            submitButtonText
          )}
        </button>
      )}
    </div>
  );
}
