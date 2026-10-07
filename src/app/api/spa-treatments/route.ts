import { NextResponse } from 'next/server';
import { getDbSpaTreatments } from '@/lib/db';

export async function GET() {
  try {
    const treatments = await getDbSpaTreatments();
    return NextResponse.json(
      { success: true, count: treatments.length, treatments },
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
