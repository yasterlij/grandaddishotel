import { NextResponse } from 'next/server';
import { getDbPageContent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const content = await getDbPageContent();
    return NextResponse.json(
      { success: true, content },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch page content' },
      { status: 500 }
    );
  }
}
