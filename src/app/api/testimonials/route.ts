import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, invalidateCache } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(
      `SELECT id, name, location, rating, date, title, comment, room_type AS "roomType"
       FROM testimonials
       WHERE status = 'APPROVED'
       ORDER BY created_at DESC
       LIMIT 50`
    );
    return NextResponse.json(
      { success: true, testimonials: res.rows },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, location, rating, title, comment, roomType } = await req.json();

    if (!name || !title || !comment) {
      return NextResponse.json(
        { success: false, error: 'Please provide name, title, and review comment' },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    await query(
      `INSERT INTO testimonials (id, name, location, rating, date, title, comment, room_type, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'APPROVED', NOW())`,
      [id, name, location || 'Addis Ababa', rating || 5, currentDate, title, comment, roomType || 'Deluxe Room']
    );

    invalidateCache('db_testimonials');

    return NextResponse.json({
      success: true,
      id,
      message: 'Review saved in PostgreSQL',
      review: {
        id,
        name,
        location: location || 'Addis Ababa',
        rating: rating || 5,
        date: currentDate,
        title,
        comment,
        roomType: roomType || 'Deluxe Room',
      },
    });
  } catch (error: any) {
    console.error('Error saving testimonial:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
