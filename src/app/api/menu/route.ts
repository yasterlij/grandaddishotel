import { NextResponse } from 'next/server';
import { getDbMenuItems } from '@/lib/db';

export async function GET() {
  try {
    const items = await getDbMenuItems();
    return NextResponse.json(
      { success: true, count: items.length, items },
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
