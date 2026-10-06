import { NextResponse } from 'next/server';
import { getDbSpaTreatments } from '@/lib/db';

export async function GET() {
  try {
    const treatments = await getDbSpaTreatments();
    return NextResponse.json({ success: true, count: treatments.length, treatments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}
