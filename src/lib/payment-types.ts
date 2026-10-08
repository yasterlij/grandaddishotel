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
    badge: 'Default • Mastercard & Local Ethiopian Cards',
    category: 'card',
    color: '#153D4B',
    bgLight: '#EBF1F4',
    description: 'Secure checkout via SikinaPay — accepting Mastercard (Credit & Debit) and Ethiopian local debit cards (EthSwitch). Visa, AmEx, and UnionPay support coming soon.',
    acceptedMethods: [
      'Mastercard (Credit & Debit)',
      'Ethiopian Local Cards (EthSwitch)',
    ],
  },
];
