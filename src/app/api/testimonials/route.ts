import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, invalidateCache } from '@/lib/db';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';

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
    return NextResponse.json({ success: false, error: 'Failed to load reviews.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`testimonials:${getClientIp(req)}`, 3, 15 * 60 * 1000);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

    const { name, location, rating, title, comment, roomType } = await req.json();

    if (!name || !title || !comment) {
      return NextResponse.json(
        { success: false, error: 'Please provide name, title, and review comment' },
        { status: 400 }
      );
    }

    const ratingNum = Math.floor(Number(rating) || 5);
    if (ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // New public reviews enter the moderation queue — an admin approves them
    // from the dashboard before they appear on the site.
    await query(
      `INSERT INTO testimonials (id, name, location, rating, date, title, comment, room_type, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', NOW())`,
      [id, name, location || 'Addis Ababa', ratingNum, currentDate, title, comment, roomType || 'Deluxe Room']
    );

    invalidateCache('db_testimonials');

    return NextResponse.json({
      success: true,
      id,
      status: 'PENDING',
      message: 'Thank you! Your review was submitted and is awaiting moderation.',
      review: {
        id,
        name,
        location: location || 'Addis Ababa',
        rating: ratingNum,
        date: currentDate,
        title,
        comment,
        roomType: roomType || 'Deluxe Room',
      },
    });
  } catch (error: any) {
    console.error('Error saving testimonial:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit review.' }, { status: 500 });
  }
}
