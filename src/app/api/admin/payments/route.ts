import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        p.id,
        p."txRef",
        p."gatewayRef",
        p.provider,
        p.status,
        p.amount,
        p.currency,
        p."paidAt",
        p."createdAt",
        p."reservationId",
        r."bookingRef",
        r."checkInDate",
        r."checkOutDate",
        rt.name AS "roomTypeName",
        g."firstName",
        g."lastName",
        g.email AS "guestEmail",
        g."phoneNumber" AS "guestPhone"
      FROM payments p
      LEFT JOIN reservations r ON r.id = p."reservationId"
      LEFT JOIN room_types rt ON rt.id = r."roomTypeId"
      LEFT JOIN guests g ON g.id = r."guestId"
      ORDER BY p."createdAt" DESC
    `);

    return NextResponse.json({
      success: true,
      count: res.rows.length,
      payments: res.rows,
    });
  } catch (error: any) {
    console.error('Error querying admin payments:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, provider } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Payment ID is required' }, { status: 400 });
    }

    const isSuccess = status === 'SUCCESS';
    await query(
      `UPDATE payments SET
        status = COALESCE($1::"PaymentStatus", status),
        provider = COALESCE($2::"PaymentProvider", provider),
        "paidAt" = CASE WHEN $4 = true THEN NOW() ELSE "paidAt" END,
        "updatedAt" = NOW()
      WHERE id = $3`,
      [status || null, provider || null, id, isSuccess]
    );

    // If status is marked SUCCESS, also confirm the linked reservation
    if (status === 'SUCCESS') {
      const p = await query(`SELECT "reservationId" FROM payments WHERE id = $1`, [id]);
      if (p.rows.length > 0 && p.rows[0].reservationId) {
        await query(`UPDATE reservations SET status = 'CONFIRMED', "updatedAt" = NOW() WHERE id = $1`, [
          p.rows[0].reservationId,
        ]);
      }
    }

    return NextResponse.json({ success: true, message: 'Payment record updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Payment ID is required' }, { status: 400 });
    }

    await query(`DELETE FROM payments WHERE id = $1`, [id]);
    return NextResponse.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
