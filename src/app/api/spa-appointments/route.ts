import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const serviceId = body.serviceId || body.service_id || 'sp1';
    const serviceName = body.serviceName || body.service_name || 'Spa Treatment';
    const date = body.date;
    const time = body.time;
    const clientName = body.clientName || body.name || body.guestName;
    const clientPhone = body.clientPhone || body.phone || body.guestPhone;
    const clientEmail = body.clientEmail || body.email || body.guestEmail;

    if (!date || !time || !clientName || !clientPhone || !clientEmail) {
      return NextResponse.json(
        { success: false, error: 'Please fill all required appointment fields' },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    await query(
      `INSERT INTO spa_appointments (
        id, service_id, service_name, date, time, client_name, client_phone, client_email, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CONFIRMED', NOW())`,
      [id, serviceId, serviceName, date, time, clientName, clientPhone, clientEmail]
    );

    return NextResponse.json({
      success: true,
      id,
      message: 'Spa appointment scheduled and saved to PostgreSQL',
      appointment: {
        id,
        serviceId,
        serviceName,
        date,
        time,
        clientName,
        clientPhone,
        clientEmail,
      },
    });
  } catch (error: any) {
    console.error('Error inserting spa appointment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const res = await query(`SELECT * FROM spa_appointments ORDER BY created_at DESC LIMIT 50`);
    return NextResponse.json({ success: true, count: res.rows.length, appointments: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
