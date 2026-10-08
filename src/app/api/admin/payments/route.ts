import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { confirmPaymentRecord, type PaymentTransitionStatus } from '@/lib/payments';

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
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
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id, status } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Payment ID is required' }, { status: 400 });
    }

    const allowed: PaymentTransitionStatus[] = ['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status must be one of: ${allowed.join(', ')}` },
        { status: 400 }
      );
    }

    // Shared transition logic: keeps the linked reservation in sync
    // (SUCCESS → CONFIRMED, REFUNDED → CANCELLED) and refuses to mutate
    // payments that are already in a terminal state.
    const { payment, reservationUpdated } = await confirmPaymentRecord({
      paymentId: id,
      status,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment record updated successfully',
      payment,
      reservationUpdated,
    });
  } catch (error: any) {
    const statusCode = error?.statusCode || 500;
    if (statusCode === 500) console.error('Error updating payment:', error);
    return NextResponse.json(
      { success: false, error: statusCode === 500 ? 'Failed to update payment' : error.message },
      { status: statusCode }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
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
