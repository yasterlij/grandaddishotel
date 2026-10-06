import { NextResponse } from 'next/server';
import { getDbFaqs } from '@/lib/db';

export async function GET() {
  try {
    const faqs = await getDbFaqs();
    return NextResponse.json({ success: true, count: faqs.length, faqs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}
