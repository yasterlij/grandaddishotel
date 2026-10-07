import { NextResponse } from 'next/server';
import { getExchangeRate } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const rate = await getExchangeRate();
    return NextResponse.json(
      {
        success: true,
        rate,
        baseCurrency: 'USD',
        targetCurrency: 'ETB',
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'CDN-Cache-Control': 'no-store',
          'Surrogate-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching exchange rate:', error);
    return NextResponse.json(
      { success: false, rate: 189, error: error.message || 'Failed to fetch exchange rate' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
