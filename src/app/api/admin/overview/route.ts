import { NextResponse } from 'next/server';
import { getDbStats, query } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getDbStats();

    // Also get latest 5 of each for quick preview
    const [recentBookings, recentDining, recentSpa, recentMessages] = await Promise.all([
      query(`
        SELECT 
          r.id, r."bookingRef", r."checkInDate", r."checkOutDate", r.status, r.currency, r."totalAmount", r."createdAt",
          rt.name as "roomName",
          CONCAT(g."firstName", ' ', g."lastName") as "guestName",
          g.email as "guestEmail",
          g."phoneNumber" as "guestPhone"
        FROM reservations r
        JOIN room_types rt ON rt.id = r."roomTypeId"
        JOIN guests g ON g.id = r."guestId"
        ORDER BY r."createdAt" DESC
        LIMIT 5
      `),
      query(`SELECT * FROM table_reservations ORDER BY created_at DESC LIMIT 5`),
      query(`SELECT * FROM spa_appointments ORDER BY created_at DESC LIMIT 5`),
      query(`SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 5`),
    ]);

    return NextResponse.json({
      success: true,
      database: {
        name: 'grand_addis_db',
        status: 'CONNECTED',
        host: 'localhost:5432',
      },
      stats,
      recent: {
        bookings: recentBookings.rows,
        dining: recentDining.rows,
        spa: recentSpa.rows,
        messages: recentMessages.rows,
      },
    });
  } catch (error: any) {
    console.error('Admin overview error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database query error' },
      { status: 500 }
    );
  }
}
