import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`SELECT * FROM testimonials ORDER BY created_at DESC`);
    return NextResponse.json({ success: true, count: res.rows.length, testimonials: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, location = 'Addis Ababa', rating = 5, title, comment, roomType = 'Deluxe Room', status = 'APPROVED' } = await req.json();

    if (!name || !title || !comment) {
      return NextResponse.json({ success: false, error: 'Name, title, and comment required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const date = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    await query(
      `INSERT INTO testimonials (id, name, location, rating, date, title, comment, room_type, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [id, name, location, Number(rating), date, title, comment, roomType, status]
    );

    return NextResponse.json({ success: true, message: 'Testimonial created successfully', id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, name, location, rating, title, comment, roomType, status } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Testimonial ID required' }, { status: 400 });
    }

    await query(
      `UPDATE testimonials SET
        name = COALESCE($1, name),
        location = COALESCE($2, location),
        rating = COALESCE($3, rating),
        title = COALESCE($4, title),
        comment = COALESCE($5, comment),
        room_type = COALESCE($6, room_type),
        status = COALESCE($7, status)
      WHERE id = $8`,
      [
        name || null,
        location || null,
        rating !== undefined ? Number(rating) : null,
        title || null,
        comment || null,
        roomType || null,
        status || null,
        id,
      ]
    );

    return NextResponse.json({ success: true, message: 'Testimonial updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Testimonial ID required' }, { status: 400 });
    }

    await query(`DELETE FROM testimonials WHERE id = $1`, [id]);
    return NextResponse.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
