import { NextResponse } from 'next/server';
import { getSkinaConfig, SKINA_TEST_CARDS } from '@/lib/skina';
import { PAYMENT_PROVIDERS } from '@/lib/payment-types';

export async function GET() {
  // Report the gateway state without crashing when the secret is absent
  // (production fails closed elsewhere — this endpoint only describes config).
  let skina: ReturnType<typeof getSkinaConfig> | null = null;
  try {
    skina = getSkinaConfig();
  } catch {
    skina = null;
  }

  return NextResponse.json({
    success: true,
    defaultProvider: 'SKINA',
    providers: PAYMENT_PROVIDERS,
    skina: {
      baseUrl: skina?.baseUrl || '',
      isSandbox: skina?.isSandbox ?? true,
      hasSecretConfigured: Boolean(skina?.secretKey),
      testCards: skina?.isSandbox ? SKINA_TEST_CARDS : [],
      acceptedBrands: [
        'Mastercard (Credit & Debit)',
        'Ethiopian Local Cards (EthSwitch)',
      ],
      unsupportedBrands: [
        'Visa — coming soon',
        'American Express — coming soon',
        'UnionPay — coming soon',
        'Discover — coming soon',
      ],
    },
  });
}
