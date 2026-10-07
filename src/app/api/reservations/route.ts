import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { calculateStayNights } from '@/lib/dates';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      roomId,
      roomSlug,
      checkIn,
      checkOut,
      adults = 2,
      children = 0,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests = '',
      addons = {},
      totalAmount,
      currency = 'USD',
      paymentProvider = 'CASH_ON_ARRIVAL',
      paymentStatus = 'PENDING',
    } = body;

    if (!guestName || !guestEmail || !guestPhone || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: 'Missing required reservation fields' },
        { status: 400 }
      );
    }

    // 1. Resolve room_type
    let roomTypeQuery = await query(
      `SELECT * FROM room_types WHERE id = $1 OR slug = $2 LIMIT 1`,
      [roomId, roomSlug || '']
    );

    if (roomTypeQuery.rows.length === 0) {
      // Fallback to first available room type
      roomTypeQuery = await query(`SELECT * FROM room_types LIMIT 1`);
    }

    if (roomTypeQuery.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No room types available in database' },
        { status: 400 }
      );
    }

    const roomType = roomTypeQuery.rows[0];

    // 2. Find an available physical room for this room type
    const roomQuery = await query(
      `SELECT id FROM rooms WHERE "roomTypeId" = $1 AND status = 'AVAILABLE' LIMIT 1`,
      [roomType.id]
    );
    const physicalRoomId = roomQuery.rows.length > 0 ? roomQuery.rows[0].id : null;

    // 3. Upsert guest
    const nameParts = guestName.trim().split(' ');
    const firstName = nameParts[0] || 'Guest';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    let guestId: string;
    const existingGuest = await query(
      `SELECT id FROM guests WHERE email = $1 LIMIT 1`,
      [guestEmail.toLowerCase().trim()]
    );

    if (existingGuest.rows.length > 0) {
      guestId = existingGuest.rows[0].id;
      // Update phone
      await query(
        `UPDATE guests SET "phoneNumber" = $1, "updatedAt" = NOW() WHERE id = $2`,
        [guestPhone.trim(), guestId]
      );
    } else {
      guestId = crypto.randomUUID();
      await query(
        `INSERT INTO guests (id, "firstName", "lastName", email, "phoneNumber", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          guestId,
          firstName,
          lastName,
          guestEmail.toLowerCase().trim(),
          guestPhone.trim(),
        ]
      );
    }

    // 4. Generate unique Booking Reference
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingRef = `GAH-${datePrefix}-${randomSuffix}`;

    // 5. Calculate amounts with exact nights arithmetic
    const nights = calculateStayNights(checkIn, checkOut);
    const pricePerNight = currency === 'ETB' ? Number(roomType.basePriceETB) : Number(roomType.basePriceUSD);
    const roomSubtotal = Number((pricePerNight * nights).toFixed(2));

    let addonsTotal = 0;
    if (addons && typeof addons === 'object') {
      if (addons.airportShuttle) addonsTotal += 15;
      if (addons.breakfast) addonsTotal += 12 * (Number(adults) || 1) * nights;
      if (addons.spaTreatment) addonsTotal += 65;
      if (addons.coffeeCeremony) addonsTotal += 8 * (Number(adults) || 1);
    }

    const calculatedSubtotal = Number((roomSubtotal + addonsTotal).toFixed(2));
    const computedTax = Number((calculatedSubtotal * 0.15).toFixed(2));
    const computedGrandTotal = Number((calculatedSubtotal + computedTax).toFixed(2));

    const finalTotal = totalAmount && Number(totalAmount) > 0 ? Number(Number(totalAmount).toFixed(2)) : computedGrandTotal;
    const finalSubtotal = calculatedSubtotal > 0 ? calculatedSubtotal : Number((finalTotal / 1.15).toFixed(2));
    const finalTax = Number((finalTotal - finalSubtotal).toFixed(2));

    const reservationId = crypto.randomUUID();

    // 6. Insert Reservation into PostgreSQL
    await query(
      `INSERT INTO reservations (
        id,
        "bookingRef",
        "checkInDate",
        "checkOutDate",
        "adultsCount",
        "childrenCount",
        status,
        currency,
        subtotal,
        "taxAmount",
        "totalAmount",
        "specialRequests",
        "guestId",
        "roomTypeId",
        "roomId",
        "createdAt",
        "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, 'CONFIRMED', $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
      [
        reservationId,
        bookingRef,
        checkIn,
        checkOut,
        adults,
        children,
        currency === 'ETB' ? 'ETB' : 'USD',
        finalSubtotal,
        finalTax,
        finalTotal,
        specialRequests,
        guestId,
        roomType.id,
        physicalRoomId,
      ]
    );

    // 7. Insert Payment record into PostgreSQL
    const validProviders: Record<string, string> = {
      CHAPA: 'CHAPA',
      TELEBIRR: 'TELEBIRR',
      CBE_BIRR: 'CBE_BIRR',
      CEB: 'CBE_BIRR',
      CBE: 'CBE_BIRR',
      SKINA: 'SKINA',
      STRIPE: 'STRIPE',
      CARD: 'SKINA',
      CASH_ON_ARRIVAL: 'CASH_ON_ARRIVAL',
      CASH: 'CASH_ON_ARRIVAL',
    };

    const mappedProvider =
      validProviders[String(paymentProvider).toUpperCase()] || 'CASH_ON_ARRIVAL';
    const isPaid = paymentStatus === 'SUCCESS';

    const paymentId = crypto.randomUUID();
    const txRef = `TX-${mappedProvider}-${bookingRef.replace(/[^A-Za-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

    await query(
      `INSERT INTO payments (
        id,
        "txRef",
        provider,
        status,
        amount,
        currency,
        "reservationId",
        "paidAt",
        "createdAt",
        "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        paymentId,
        txRef,
        mappedProvider,
        isPaid ? 'SUCCESS' : 'PENDING',
        finalTotal,
        currency === 'ETB' ? 'ETB' : 'USD',
        reservationId,
        isPaid ? new Date() : null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Reservation recorded successfully in PostgreSQL',
      bookingRef,
      reservationId,
      paymentId,
      txRef,
      paymentProvider: mappedProvider,
      paymentStatus: isPaid ? 'SUCCESS' : 'PENDING',
      roomName: roomType.name,
      checkIn,
      checkOut,
      nights,
      totalAmount: finalTotal,
      currency,
      guest: {
        name: `${firstName} ${lastName}`,
        email: guestEmail,
        phone: guestPhone,
      },
    });
  } catch (error: any) {
    console.error('Error creating reservation in PostgreSQL:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database insert error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingRef = searchParams.get('bookingRef');

    if (bookingRef) {
      const res = await query(
        `SELECT 
          r.id,
          r."bookingRef",
          r."checkInDate",
          r."checkOutDate",
          r."adultsCount",
          r."childrenCount",
          r.status,
          r.currency,
          r."totalAmount",
          r."specialRequests",
          r."createdAt",
          rt.name AS "roomTypeName",
          g."firstName",
          g."lastName",
          g.email,
          g."phoneNumber"
        FROM reservations r
        JOIN room_types rt ON rt.id = r."roomTypeId"
        JOIN guests g ON g.id = r."guestId"
        WHERE r."bookingRef" = $1
        LIMIT 1`,
        [bookingRef]
      );

      if (res.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Reservation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, reservation: res.rows[0] });
    }

    // Default: return recent 20 reservations
    const list = await query(
      `SELECT 
        r.id,
        r."bookingRef",
        r."checkInDate",
        r."checkOutDate",
        r.status,
        r.currency,
        r."totalAmount",
        r."createdAt",
        rt.name AS "roomTypeName",
        CONCAT(g."firstName", ' ', g."lastName") AS "guestName"
      FROM reservations r
      JOIN room_types rt ON rt.id = r."roomTypeId"
      JOIN guests g ON g.id = r."guestId"
      ORDER BY r."createdAt" DESC
      LIMIT 20`
    );

    return NextResponse.json({ success: true, count: list.rows.length, reservations: list.rows });
  } catch (error: any) {
    console.error('Error querying reservations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}
