import { NextResponse } from 'next/server';
import { getDbPromotions } from '@/lib/db';

export async function GET() {
  try {
    const promotions = await getDbPromotions();
    return NextResponse.json(
      { success: true, count: promotions.length, promotions },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}
