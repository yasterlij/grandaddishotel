import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    const rl = rateLimit(`events:${getClientIp(req)}`, 5, 10 * 60 * 1000);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  try {
    const { eventType, eventDate, guestCount, name, email, phone, details } = await req.json();

    if (!eventType || !eventDate || !name || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Please provide all required event details' },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    await query(
      `INSERT INTO event_inquiries (id, event_type, target_date, guests_count, name, email, phone, details, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'NEW', NOW())`,
      [id, eventType, eventDate, guestCount || '50-100', name, email, phone, details || '']
    );

    return NextResponse.json({
      success: true,
      id,
      message: 'Event proposal request saved in PostgreSQL',
    });
  } catch (error: any) {
    console.error('Error saving event inquiry:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const res = await query(`SELECT * FROM event_inquiries ORDER BY created_at DESC LIMIT 50`);
    return NextResponse.json({ success: true, count: res.rows.length, inquiries: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
