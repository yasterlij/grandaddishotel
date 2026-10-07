import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { calculateStayNights } from '@/lib/dates';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        r.id,
        r."bookingRef",
        TO_CHAR(r."checkInDate", 'YYYY-MM-DD') AS "checkInDate",
        TO_CHAR(r."checkOutDate", 'YYYY-MM-DD') AS "checkOutDate",
        r."adultsCount",
        r."childrenCount",
        r.status,
        r.currency,
        r."subtotal",
        r."taxAmount",
        r."totalAmount",
        r."specialRequests",
        r."createdAt",
        r."roomId",
        r."roomTypeId",
        rm."roomNumber",
        rt.name AS "roomTypeName",
        rt.slug AS "roomSlug",
        g.id AS "guestId",
        g."firstName",
        g."lastName",
        g.email,
        g."phoneNumber",
        p.status AS "paymentStatus",
        p.provider AS "paymentProvider"
      FROM reservations r
      JOIN room_types rt ON rt.id = r."roomTypeId"
      JOIN guests g ON g.id = r."guestId"
      LEFT JOIN rooms rm ON rm.id = r."roomId"
      LEFT JOIN LATERAL (
        SELECT status, provider
        FROM payments
        WHERE "reservationId" = r.id
        ORDER BY CASE WHEN status = 'SUCCESS' THEN 1 ELSE 2 END, "createdAt" DESC
        LIMIT 1
      ) p ON true
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      guestName,
      guestEmail,
      guestPhone,
      checkInDate,
      checkOutDate,
      roomTypeId,
      roomId = null,
      adultsCount = 2,
      childrenCount = 0,
      totalAmount = 0,
      currency = 'ETB',
      status = 'CONFIRMED',
      specialRequests = '',
    } = body;

    if (!guestName || !guestEmail || !checkInDate || !checkOutDate || !roomTypeId) {
      return NextResponse.json(
        { success: false, error: 'Guest name, email, dates, and room type are required' },
        { status: 400 }
      );
    }

    // 1. Upsert guest
    const nameParts = guestName.trim().split(' ');
    const firstName = nameParts[0] || 'Guest';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    let guestId: string;
    const existingGuest = await query(`SELECT id FROM guests WHERE email = $1 LIMIT 1`, [
      guestEmail.toLowerCase().trim(),
    ]);

    if (existingGuest.rows.length > 0) {
      guestId = existingGuest.rows[0].id;
      if (guestPhone) {
        await query(`UPDATE guests SET "phoneNumber" = $1, "updatedAt" = NOW() WHERE id = $2`, [
          guestPhone.trim(),
          guestId,
        ]);
      }
    } else {
      guestId = crypto.randomUUID();
      await query(
        `INSERT INTO guests (id, "firstName", "lastName", email, "phoneNumber", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [guestId, firstName, lastName, guestEmail.toLowerCase().trim(), guestPhone || '']
      );
    }

    // 2. Generate Booking Reference
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingRef = `GAH-${datePrefix}-${randomSuffix}`;
    const reservationId = crypto.randomUUID();

    const subtotal = Number(totalAmount) / 1.15;
    const taxAmount = Number(totalAmount) - subtotal;

    await query(
      `INSERT INTO reservations (
        id, "bookingRef", "checkInDate", "checkOutDate", "adultsCount", "childrenCount",
        status, currency, subtotal, "taxAmount", "totalAmount", "specialRequests",
        "guestId", "roomTypeId", "roomId", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())`,
      [
        reservationId,
        bookingRef,
        checkInDate,
        checkOutDate,
        adultsCount,
        childrenCount,
        status,
        currency,
        Number(subtotal.toFixed(2)),
        Number(taxAmount.toFixed(2)),
        Number(totalAmount),
        specialRequests,
        guestId,
        roomTypeId,
        roomId || null,
      ]
    );

    // Create payment entry
    const paymentId = crypto.randomUUID();
    await query(
      `INSERT INTO payments (id, "txRef", provider, status, amount, currency, "reservationId", "createdAt", "updatedAt")
       VALUES ($1, $2, 'CASH_ON_ARRIVAL', 'PENDING', $3, $4, $5, NOW(), NOW())`,
      [paymentId, `TX-${bookingRef}`, Number(totalAmount), currency, reservationId]
    );

    return NextResponse.json({
      success: true,
      message: 'Reservation created successfully',
      bookingRef,
      reservationId,
    });
  } catch (error: any) {
    console.error('Error creating manual reservation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      checkInDate,
      checkOutDate,
      adultsCount,
      childrenCount,
      totalAmount,
      currency,
      status,
      specialRequests,
      roomId,
      roomTypeId,
      guestName,
      guestEmail,
      guestPhone,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Reservation ID is required' }, { status: 400 });
    }

    const existingRes = await query(
      `SELECT 
        r.id, 
        TO_CHAR(r."checkInDate", 'YYYY-MM-DD') AS "checkInDate",
        TO_CHAR(r."checkOutDate", 'YYYY-MM-DD') AS "checkOutDate",
        r."roomTypeId", 
        r.currency,
        r."totalAmount",
        rt."basePriceUSD", 
        rt."basePriceETB" 
       FROM reservations r 
       JOIN room_types rt ON rt.id = r."roomTypeId" 
       WHERE r.id = $1`,
      [id]
    );

    if (existingRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
    }

    const current = existingRes.rows[0];
    const effCheckIn = checkInDate || current.checkInDate;
    const effCheckOut = checkOutDate || current.checkOutDate;
    const effRoomTypeId = roomTypeId || current.roomTypeId;
    const effCurrency = currency || current.currency;
    const nights = calculateStayNights(effCheckIn, effCheckOut);

    let finalTotal: number;
    if (totalAmount !== undefined && Number(totalAmount) > 0) {
      finalTotal = Number(Number(totalAmount).toFixed(2));
    } else {
      let rate = effCurrency === 'ETB' ? Number(current.basePriceETB) : Number(current.basePriceUSD);
      if (roomTypeId && roomTypeId !== current.roomTypeId) {
        const rtRow = await query(`SELECT "basePriceUSD", "basePriceETB" FROM room_types WHERE id = $1`, [roomTypeId]);
        if (rtRow.rows.length > 0) {
          rate = effCurrency === 'ETB' ? Number(rtRow.rows[0].basePriceETB) : Number(rtRow.rows[0].basePriceUSD);
        }
      }
      finalTotal = Number((nights * rate * 1.15).toFixed(2));
    }

    const finalSubtotal = Number((finalTotal / 1.15).toFixed(2));
    const finalTax = Number((finalTotal - finalSubtotal).toFixed(2));

    // Update reservation
    await query(
      `UPDATE reservations SET
        "checkInDate" = $1::date,
        "checkOutDate" = $2::date,
        "adultsCount" = COALESCE($3, "adultsCount"),
        "childrenCount" = COALESCE($4, "childrenCount"),
        subtotal = $5,
        "taxAmount" = $6,
        "totalAmount" = $7,
        currency = COALESCE($8, currency),
        status = COALESCE($9, status),
        "specialRequests" = COALESCE($10, "specialRequests"),
        "roomId" = $11,
        "roomTypeId" = COALESCE($12, "roomTypeId"),
        "updatedAt" = NOW()
      WHERE id = $13`,
      [
        effCheckIn,
        effCheckOut,
        adultsCount !== undefined ? Number(adultsCount) : null,
        childrenCount !== undefined ? Number(childrenCount) : null,
        finalSubtotal,
        finalTax,
        finalTotal,
        effCurrency || null,
        status || null,
        specialRequests !== undefined ? specialRequests : null,
        roomId || null,
        effRoomTypeId || null,
        id,
      ]
    );

    // Synchronize linked PENDING payment amount to the new total
    await query(
      `UPDATE payments 
       SET amount = $1, currency = COALESCE($2, currency), "updatedAt" = NOW() 
       WHERE "reservationId" = $3 AND status = 'PENDING'`,
      [finalTotal, effCurrency || null, id]
    );

    // If guest details provided, update the linked guest
    if (guestName || guestEmail || guestPhone) {
      const resData = await query(`SELECT "guestId" FROM reservations WHERE id = $1`, [id]);
      if (resData.rows.length > 0) {
        const guestId = resData.rows[0].guestId;
        const nameParts = (guestName || '').trim().split(' ');
        const firstName = nameParts[0] || undefined;
        const lastName = nameParts.slice(1).join(' ') || undefined;

        await query(
          `UPDATE guests SET
            "firstName" = COALESCE($1, "firstName"),
            "lastName" = COALESCE($2, "lastName"),
            email = COALESCE($3, email),
            "phoneNumber" = COALESCE($4, "phoneNumber"),
            "updatedAt" = NOW()
          WHERE id = $5`,
          [firstName || null, lastName || null, guestEmail || null, guestPhone || null, guestId]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Reservation updated successfully' });
  } catch (error: any) {
    console.error('Error updating reservation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Reservation ID is required' }, { status: 400 });
    }

    // Delete linked payments first (cascade or explicit)
    await query(`DELETE FROM payments WHERE "reservationId" = $1`, [id]);
    await query(`DELETE FROM reservations WHERE id = $1`, [id]);

    return NextResponse.json({ success: true, message: 'Reservation deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
