import { NextResponse } from 'next/server';
import { getDbExperiences } from '@/lib/db';

export async function GET() {
  try {
    const experiences = await getDbExperiences();
    return NextResponse.json(
      { success: true, count: experiences.length, experiences },
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
