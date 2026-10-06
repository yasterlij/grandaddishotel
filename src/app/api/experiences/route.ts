import { NextResponse } from 'next/server';
import { getDbExperiences } from '@/lib/db';

export async function GET() {
  try {
    const experiences = await getDbExperiences();
    return NextResponse.json({ success: true, count: experiences.length, experiences });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}
