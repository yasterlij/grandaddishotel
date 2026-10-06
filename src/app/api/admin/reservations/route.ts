import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        r.id,
        r."bookingRef",
        r."checkInDate",
        r."checkOutDate",
        r."adultsCount",
        r."childrenCount",
        r.status,
        r.currency,
        r."subtotal",
        r."taxAmount",
        r."totalAmount",
        r."specialRequests",
        r."createdAt",
        rt.name AS "roomTypeName",
        rt.slug AS "roomSlug",
        g."firstName",
        g."lastName",
        g.email,
        g."phoneNumber",
        p.status AS "paymentStatus",
        p.provider AS "paymentProvider"
      FROM reservations r
      JOIN room_types rt ON rt.id = r."roomTypeId"
      JOIN guests g ON g.id = r."guestId"
      LEFT JOIN payments p ON p."reservationId" = r.id
      ORDER BY r."createdAt" DESC
    `);

    return NextResponse.json({
      success: true,
      count: res.rows.length,
      reservations: res.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Missing id or status' }, { status: 400 });
    }

    await query(
      `UPDATE reservations SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
      [status, id]
    );

    return NextResponse.json({ success: true, message: 'Reservation updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
