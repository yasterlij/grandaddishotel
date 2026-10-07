export type PaymentProviderType =
  | 'SKINA'
  | 'TELEBIRR'
  | 'CHAPA'
  | 'CBE_BIRR'
  | 'CASH_ON_ARRIVAL';

export interface PaymentProviderInfo {
  id: PaymentProviderType;
  name: string;
  badge: string;
  category: 'card' | 'mobile-money' | 'super-gateway' | 'bank' | 'cash';
  color: string;
  bgLight: string;
  description: string;
  acceptedMethods: string[];
}

export const PAYMENT_PROVIDERS: PaymentProviderInfo[] = [
  {
    id: 'SKINA',
    name: 'SkinaPay (Cards & Digital)',
    badge: 'Default • Visa, Mastercard & All Cards',
    category: 'card',
    color: '#153D4B',
    bgLight: '#EBF1F4',
    description: 'Fast, secure instant checkout accepting Visa, Mastercard, American Express, UnionPay, local Ethiopian debit cards, and Skina digital authorization.',
    acceptedMethods: [
      'Visa (Credit & Debit)',
      'Mastercard (Credit & Debit)',
      'American Express',
      'UnionPay',
      'Ethiopian Local Cards',
      'Skina Digital Wallet',
    ],
  },
  {
    id: 'TELEBIRR',
    name: 'Telebirr',
    badge: 'Mobile Money',
    category: 'mobile-money',
    color: '#0072CE',
    bgLight: '#E6F1FA',
    description: 'Instant mobile payment via Ethio Telecom USSD Push (*127#) or Telebirr SuperApp QR scan.',
    acceptedMethods: ['Telebirr USSD Push (*127#)', 'SuperApp QR Code', 'Telebirr PIN'],
  },
  {
    id: 'CHAPA',
    name: 'Chapa',
    badge: 'Fast & Secure Gateway',
    category: 'super-gateway',
    color: '#00A36C',
    bgLight: '#E8F8F1',
    description: "Ethiopia's premier online payment gateway supporting Telebirr, CBE Birr, Awash, Amole, and local/intl cards.",
    acceptedMethods: ['Telebirr', 'CBE Birr', 'Debit/Credit Cards', 'Awash Bank'],
  },
  {
    id: 'CBE_BIRR',
    name: 'CBE Birr / CEB',
    badge: 'Commercial Bank of Ethiopia',
    category: 'bank',
    color: '#6E2585',
    bgLight: '#F5ECF8',
    description: 'Direct transfer to Grand Addis Hotel via CBE Birr Shortcode (882200) or CBE Mobile Banking App (1000188220011).',
    acceptedMethods: ['CBE Birr Shortcode (882200)', 'CBE Mobile Banking (1000188220011)', 'CBE USSD (*847#)'],
  },
  {
    id: 'CASH_ON_ARRIVAL',
    name: 'Cash / Pay at Hotel',
    badge: 'Front Desk Payment',
    category: 'cash',
    color: '#E49951',
    bgLight: '#FDF9F4',
    description: 'Guarantee your room reservation now and pay upon arrival at the Grand Addis front desk in ETB or USD.',
    acceptedMethods: ['Cash (ETB / USD)', 'POS Terminal at Reception', 'Front Desk Transfer'],
  },
];
