import { NextResponse } from 'next/server';
import { getDbRooms } from '@/lib/db';

export async function GET() {
  try {
    const rooms = await getDbRooms();
    return NextResponse.json({
      success: true,
      rooms,
    });
  } catch (error: any) {
    console.error('Error fetching rooms from PostgreSQL:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database query error' },
      { status: 500 }
    );
  }
}
