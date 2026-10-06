import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Please provide name, email, and message' },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    await query(
      `INSERT INTO contact_messages (id, name, email, phone, subject, message, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'NEW', NOW())`,
      [id, name, email, phone || null, subject || 'General Inquiry', message]
    );

    return NextResponse.json({
      success: true,
      id,
      message: 'Your message has been received and stored in PostgreSQL',
    });
  } catch (error: any) {
    console.error('Error saving contact message:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const res = await query(`SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 50`);
    return NextResponse.json({ success: true, count: res.rows.length, messages: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
