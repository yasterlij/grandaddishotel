import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    const rl = rateLimit(`dining:${getClientIp(req)}`, 5, 10 * 60 * 1000);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  try {
    const body = await req.json();
    const date = body.date;
    const time = body.time;
    const partySize = body.partySize || body.party_size || 2;
    const name = body.name || body.guestName || body.clientName;
    const phone = body.phone || body.guestPhone || body.clientPhone;
    const email = body.email || body.guestEmail || body.clientEmail;
    const notes = body.notes || body.specialRequests || '';

    if (!date || !time || !name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'Please fill all required table reservation fields' },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    await query(
      `INSERT INTO table_reservations (
        id, date, time, party_size, guest_name, guest_phone, guest_email, notes, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CONFIRMED', NOW())`,
      [id, date, time, partySize, name, phone, email, notes]
    );

    return NextResponse.json({
      success: true,
      id,
      message: 'Dining table reservation confirmed and saved to PostgreSQL',
      reservation: {
        id,
        date,
        time,
        partySize,
        name,
        phone,
        email,
        notes,
      },
    });
  } catch (error: any) {
    console.error('Error inserting table reservation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const res = await query(
      `SELECT * FROM table_reservations ORDER BY created_at DESC LIMIT 50`
    );
    return NextResponse.json({ success: true, count: res.rows.length, reservations: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
