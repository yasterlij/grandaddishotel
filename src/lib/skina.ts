export interface SkinaConfig {
  secretKey: string;
  webhookSecret: string;
  baseUrl: string;
  successRedirectUrl: string;
  failedRedirectUrl: string;
  appBaseUrl: string;
  isSandbox: boolean;
}

export function getSkinaConfig(): SkinaConfig {
  const isProduction = process.env.NODE_ENV === 'production';

  // The secret key comes from the environment only — never from source.
  // (Historically a sandbox key was committed here as a fallback, which silently
  // ran production payments against sandbox credentials.)
  const secretKey = process.env.SIKINA_SECRET_KEY || process.env.SKINA_SECRET_KEY || '';

  if (isProduction && !secretKey) {
    throw new Error(
      'SIKINA_SECRET_KEY is not configured — payment initialization is disabled.'
    );
  }

  const baseUrl =
    process.env.SIKINA_BASE_URL ||
    process.env.SKINA_BASE_URL ||
    'https://sandbox.sikinapay.com';

  const explicitSandbox = process.env.SIKINA_SANDBOX === 'true';

  return {
    secretKey,
    webhookSecret: process.env.SIKINA_WEBHOOK_SECRET || process.env.SKINA_WEBHOOK_SECRET || '',
    baseUrl,
    successRedirectUrl: process.env.SIKINA_SUCCESS_REDIRECT_URL || '/your-booking-detail',
    failedRedirectUrl: process.env.SIKINA_FAILED_REDIRECT_URL || '/rooms-reservation',
    appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3050',
    // Sandbox when explicitly flagged, when the key is a test key, when pointed
    // at the sandbox host, or (dev only) when no key is configured at all.
    isSandbox:
      explicitSandbox ||
      secretKey.includes('test_') ||
      baseUrl.includes('sandbox') ||
      (!isProduction && !secretKey),
  };
}

export type CardBrand =
  | 'Visa'
  | 'Mastercard'
  | 'American Express'
  | 'UnionPay'
  | 'Discover'
  | 'Local Debit Card';

/** Card brands SikinaPay currently processes */
export const SKINA_SUPPORTED_BRANDS: CardBrand[] = ['Mastercard', 'Local Debit Card'];

export interface CardBrandMeta {
  brand: CardBrand;
  iconName: string;
  color: string;
  accentBg: string;
  badge: string;
}

export function detectCardBrand(cardNumber: string): CardBrandMeta {
  const clean = cardNumber.replace(/\D/g, '');
  if (/^4/.test(clean)) {
    return {
      brand: 'Visa',
      iconName: 'visa',
      color: '#1A1F71',
      accentBg: '#EBF0FF',
      badge: 'Visa Verified',
    };
  }
  if (/^(5[1-5]|2[2-7])/.test(clean)) {
    return {
      brand: 'Mastercard',
      iconName: 'mastercard',
      color: '#EB001B',
      accentBg: '#FFF0F0',
      badge: 'Mastercard ID Check',
    };
  }
  if (/^3[47]/.test(clean)) {
    return {
      brand: 'American Express',
      iconName: 'amex',
      color: '#006FCF',
      accentBg: '#EEF7FF',
      badge: 'AmEx SafeKey',
    };
  }
  if (/^62/.test(clean)) {
    return {
      brand: 'UnionPay',
      iconName: 'unionpay',
      color: '#007B80',
      accentBg: '#E6F8F8',
      badge: 'UnionPay SecurePay',
    };
  }
  if (/^(6011|65|64[4-9])/.test(clean)) {
    return {
      brand: 'Discover',
      iconName: 'discover',
      color: '#FF6000',
      accentBg: '#FFF4EB',
      badge: 'Discover ProtectBuy',
    };
  }
  return {
    brand: 'Local Debit Card',
    iconName: 'card',
    color: '#153D4B',
    accentBg: '#EBF1F4',
    badge: 'EthSwitch / Local Debit',
  };
}

export function formatCardNumber(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 19);
  // Amex: 4-6-5
  if (/^3[47]/.test(clean)) {
    const p1 = clean.slice(0, 4);
    const p2 = clean.slice(4, 10);
    const p3 = clean.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(' ');
  }
  // Standard 4-4-4-4
  const matches = clean.match(/.{1,4}/g);
  return matches ? matches.join(' ') : clean;
}

export const SKINA_TEST_CARDS = [
  {
    brand: 'Mastercard',
    number: '5555 5555 5555 4444',
    expiry: '11/27',
    cvc: '555',
    label: 'Mastercard Test',
    tag: 'Global Credit/Debit',
    color: '#EB001B',
    bg: '#FFF0F0',
  },
  {
    brand: 'Local Debit Card',
    number: '9876 5432 1098 7654',
    expiry: '05/27',
    cvc: '123',
    label: 'Local Card Test',
    tag: 'EthSwitch / Local ATM',
    color: '#153D4B',
    bg: '#EBF1F4',
  },
];
