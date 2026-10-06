import { NextResponse } from 'next/server';
import { getDbMenuItems } from '@/lib/db';

export async function GET() {
  try {
    const items = await getDbMenuItems();
    return NextResponse.json({ success: true, count: items.length, items });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}
