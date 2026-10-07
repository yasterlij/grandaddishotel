import { NextResponse } from 'next/server';
import { getSkinaConfig, SKINA_TEST_CARDS } from '@/lib/skina';
import { PAYMENT_PROVIDERS } from '@/lib/payment-types';

export async function GET() {
  const skina = getSkinaConfig();

  return NextResponse.json({
    success: true,
    defaultProvider: 'SKINA',
    providers: PAYMENT_PROVIDERS,
    skina: {
      baseUrl: skina.baseUrl,
      isSandbox: skina.isSandbox,
      hasSecretConfigured: Boolean(skina.secretKey),
      testCards: SKINA_TEST_CARDS,
      acceptedBrands: [
        'Visa (Credit & Debit)',
        'Mastercard (Credit & Debit)',
        'American Express',
        'UnionPay',
        'Discover',
        'Ethiopian Local Cards (EthSwitch)',
        'Skina Digital Wallet',
      ],
    },
  });
}
