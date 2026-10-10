import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool, { query, getExchangeRate, resolveDbRoomType } from '@/lib/db';
import { calculateStayNights, getHotelTodayDateStr, isIsoDateStr } from '@/lib/dates';
import { requireAdmin } from '@/lib/auth';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';
import {
  computeBookingTotals,
  getPromoDiscountPercent,
  ADDON_PRICES_USD,
  type AddonUnitPrices,
  type BookingAddons,
} from '@/lib/booking-pricing';

/** Payment providers accepted from the booking flow (mapped to DB enum). */
const VALID_PROVIDERS: Record<string, string> = {
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function badRequest(error: string) {
  return NextResponse.json({ success: false, error }, { status: 400 });
}

/** Generate a booking reference with enough entropy to avoid collisions. */
function makeBookingRef(): string {
  const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
  const suffix = crypto.randomInt(0, 2176782336).toString(36).toUpperCase().padStart(6, '0');
  return `GAH-${datePrefix}-${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    // Basic abuse protection for the public booking endpoint.
    const maxBookings = process.env.NODE_ENV === 'production' ? 10 : 100;
    const rl = rateLimit(`reservations:${getClientIp(req)}`, maxBookings, 5 * 60 * 1000);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

    const body = await req.json().catch(() => ({}));
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
      promoCode = '',
      currency = 'USD',
      paymentProvider = 'CASH_ON_ARRIVAL',
      // Audit fields written by the booking UI when the guest changes dates.
      isDateExtended = false,
      dateChangeNote = '',
    } = body;

    // NOTE: `totalAmount` and `paymentStatus` from the request body are
    // deliberately IGNORED. Totals are computed server-side and new payments
    // always start PENDING — only a verified gateway flow may mark them paid.

    // ---------- 1. Validate input ----------
    if (!guestName || !guestEmail || !guestPhone || !checkIn || !checkOut) {
      return badRequest('Missing required reservation fields');
    }
    if (!isIsoDateStr(checkIn) || !isIsoDateStr(checkOut)) {
      return badRequest('Check-in and check-out must be valid dates (YYYY-MM-DD)');
    }
    if (checkIn >= checkOut) {
      return badRequest('Check-out date must be after the check-in date');
    }
    const nights = calculateStayNights(checkIn, checkOut);
    if (nights < 1) {
      return badRequest('Check-out date must be after the check-in date');
    }
    if (checkIn < getHotelTodayDateStr()) {
      return badRequest('Check-in date cannot be in the past');
    }
    if (!EMAIL_RE.test(String(guestEmail).trim())) {
      return badRequest('Please provide a valid email address');
    }
    const adultsCount = Math.floor(Number(adults));
    const childrenCount = Math.floor(Number(children) || 0);
    if (!Number.isFinite(adultsCount) || adultsCount < 1 || adultsCount > 8) {
      return badRequest('Adults must be between 1 and 8');
    }
    if (!Number.isFinite(childrenCount) || childrenCount < 0 || childrenCount > 6) {
      return badRequest('Children must be between 0 and 6');
    }
    const cur = currency === 'ETB' ? 'ETB' : 'USD';
    const mappedProvider =
      VALID_PROVIDERS[String(paymentProvider).toUpperCase()] || 'CASH_ON_ARRIVAL';

    // ---------- 2. Resolve room type (resilient lookup with alias & numeric ID support) ----------
    const roomType = await resolveDbRoomType(roomId, roomSlug);
    if (!roomType) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // ---------- 3. Server-authoritative pricing ----------
    const discountPercent = getPromoDiscountPercent(promoCode);
    const exchangeRate = cur === 'ETB' ? await getExchangeRate() : 1;
    const addonUnitPrices: AddonUnitPrices =
      cur === 'ETB'
        ? {
            airportShuttle: ADDON_PRICES_USD.airportShuttle * exchangeRate,
            breakfastPerAdultPerNight:
              ADDON_PRICES_USD.breakfastPerAdultPerNight * exchangeRate,
            spaTreatment: ADDON_PRICES_USD.spaTreatment * exchangeRate,
            coffeeCeremonyPerAdult: ADDON_PRICES_USD.coffeeCeremonyPerAdult * exchangeRate,
          }
        : ADDON_PRICES_USD;

    const pricePerNight =
      cur === 'ETB' ? Number(roomType.basePriceETB) : Number(roomType.basePriceUSD);
    const totals = computeBookingTotals({
      pricePerNight,
      nights,
      adults: adultsCount,
      addons: addons as BookingAddons,
      discountPercent,
      addonUnitPrices,
    });

    // ---------- 4. Persist atomically (transaction) ----------
    const nameParts = String(guestName).trim().split(' ');
    const firstName = nameParts[0] || 'Guest';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';
    const email = String(guestEmail).toLowerCase().trim();
    const phone = String(guestPhone).trim();

    const isExtendedFlag = Boolean(isDateExtended);
    const finalNote = dateChangeNote || null;

    const client = await pool.connect();
    const initialReservationStatus =
      mappedProvider === 'CASH_ON_ARRIVAL' ? 'CONFIRMED' : 'PENDING';
    let bookingRef = '';
    let reservationId = '';
    let paymentId = '';
    let txRef = '';
    let physicalRoomId: string | null = null;

    try {
      await client.query('BEGIN');

      // 4a. Does this room type track physical rooms at all?
      const roomCountRes = await client.query(
        `SELECT COUNT(*)::int AS count FROM rooms WHERE "roomTypeId" = $1`,
        [roomType.id]
      );
      const tracksPhysicalRooms = Number(roomCountRes.rows[0]?.count || 0) > 0;

      if (tracksPhysicalRooms) {
        // Pick a physical room that is AVAILABLE and has no overlapping
        // active reservation. SKIP LOCKED keeps concurrent bookings from
        // blocking each other (and from grabbing the same room).
        const roomRes = await client.query(
          `SELECT id FROM rooms
           WHERE "roomTypeId" = $1 AND status = 'AVAILABLE'
             AND id NOT IN (
               SELECT COALESCE(r."roomId", '')
               FROM reservations r
               WHERE r."roomTypeId" = $1
                 AND (
                   r.status IN ('CONFIRMED', 'CHECKED_IN')
                   OR (r.status = 'PENDING' AND (r."expiresAt" IS NULL OR r."expiresAt" > NOW()))
                 )
                 AND r."checkInDate" < $3::date
                 AND r."checkOutDate" > $2::date
             )
           ORDER BY "roomNumber"
           FOR UPDATE SKIP LOCKED
           LIMIT 1`,
          [roomType.id, checkIn, checkOut]
        );
        if (roomRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            {
              success: false,
              error: 'No rooms of this type are available for the selected dates. Please choose different dates or another room type.',
            },
            { status: 409 }
          );
        }
        physicalRoomId = roomRes.rows[0].id;
      }

      // 4b. Upsert guest atomically (avoids the unique-email race).
      const generatedGuestId = crypto.randomUUID();
      const guestRes = await client.query(
        `INSERT INTO guests (id, "firstName", "lastName", email, "phoneNumber", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (email) DO UPDATE
           SET "phoneNumber" = EXCLUDED."phoneNumber", "updatedAt" = NOW()
         RETURNING id`,
        [generatedGuestId, firstName, lastName, email, phone]
      );

      let guestId = guestRes.rows?.[0]?.id;
      if (!guestId) {
        // Fallback for MySQL where INSERT does not return rows
        const lookup = await client.query(
          `SELECT id FROM guests WHERE email = $1 LIMIT 1`,
          [email]
        );
        guestId = lookup.rows?.[0]?.id || generatedGuestId;
      }

      const expiresAt =
        initialReservationStatus === 'PENDING'
          ? new Date(Date.now() + 30 * 60 * 1000)
          : null;

      // 4c. Insert reservation (retry on the rare bookingRef collision).
      for (let attempt = 0; attempt < 5; attempt++) {
        bookingRef = makeBookingRef();
        reservationId = crypto.randomUUID();
        try {
          await client.query(
            `INSERT INTO reservations (
              id, "bookingRef", "checkInDate", "checkOutDate",
              "adultsCount", "childrenCount", status, currency,
              subtotal, "taxAmount", "totalAmount", "specialRequests",
              "guestId", "roomTypeId", "roomId",
              "isDateExtended", "dateChangeNote",
              "expiresAt",
              "createdAt", "updatedAt"
            ) VALUES (
              $1, $2, $3::date, $4::date,
              $5, $6, $7::"ReservationStatus", $8,
              $9, $10, $11, $12,
              $13, $14, $15,
              $16, $17,
              $18,
              NOW(), NOW()
            )`,
            [
              reservationId,
              bookingRef,
              checkIn,
              checkOut,
              adultsCount,
              childrenCount,
              initialReservationStatus,
              cur,
              totals.subtotal,
              totals.tax,
              totals.grandTotal,
              specialRequests,
              guestId,
              roomType.id,
              physicalRoomId,
              isExtendedFlag,
              finalNote,
              expiresAt,
            ]
          );
          break;
        } catch (err: any) {
          if (err?.code === '23505' && attempt < 4) continue; // unique collision → retry
          throw err;
        }
      }

      // 4d. Payment record — always starts PENDING, never client-controlled.
      paymentId = crypto.randomUUID();
      txRef = `TX-${mappedProvider}-${bookingRef.replace(/[^A-Za-z0-9]/g, '')}-${Date.now()
        .toString()
        .slice(-4)}`;
      await client.query(
        `INSERT INTO payments (
          id, "txRef", provider, status, amount, currency,
          "reservationId", "paidAt", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, 'PENDING', $4, $5, $6, NULL, NOW(), NOW())`,
        [paymentId, txRef, mappedProvider, totals.grandTotal, cur, reservationId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      message: 'Reservation recorded successfully in PostgreSQL',
      bookingRef,
      reservationId,
      paymentId,
      txRef,
      paymentProvider: mappedProvider,
      paymentStatus: 'PENDING',
      reservationStatus: initialReservationStatus,
      status: initialReservationStatus,
      roomName: roomType.name,
      checkIn,
      checkOut,
      nights,
      totalAmount: totals.grandTotal,
      currency: cur,
      discountPercent,
      isDateExtended: isExtendedFlag,
      dateChangeNote: finalNote,
      guest: {
        name: `${firstName} ${lastName}`,
        email,
        phone,
      },
    });
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Could not create the reservation. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

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
      { success: false, error: 'Database error' },
      { status: 500 }
    );
  }
}
