import { NextRequest, NextResponse } from 'next/server';
import { getDbRoomBySlug } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const room = await getDbRoomBySlug(slug);

    if (!room) {
      return NextResponse.json(
        { success: false, error: `Room with slug "${slug}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        room,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching room by slug from PostgreSQL:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database query error' },
      { status: 500 }
    );
  }
}
