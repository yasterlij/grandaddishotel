import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { initializePaymentRecord, isValidProvider } from '@/lib/payments';
import { getSkinaConfig, detectCardBrand } from '@/lib/skina';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`payments-init:${getClientIp(req)}`, 20, 5 * 60 * 1000);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

    const body = await req.json().catch(() => ({}));
    const { reservationId, provider = 'SKINA', cardDetails } = body;

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: 'reservationId is required' },
        { status: 400 }
      );
    }
    if (!isValidProvider(provider)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported payment provider' },
        { status: 400 }
      );
    }

    // Load the reservation — the amount/currency/guest details come from the
    // database, never from the request body (no client-controlled amounts).
    const resRes = await query(
      `SELECT
         r.id, r."bookingRef", r."totalAmount", r.currency, r.status,
         g.email AS "guestEmail",
         CONCAT(g."firstName", ' ', g."lastName") AS "guestName"
       FROM reservations r
       JOIN guests g ON g.id = r."guestId"
       WHERE r.id = $1
       LIMIT 1`,
      [reservationId]
    );
    if (resRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      );
    }
    const reservation = resRes.rows[0];

    const skinaConfig = getSkinaConfig();
    let cardInfo = null;

    if (provider === 'SKINA' && cardDetails?.number) {
      const detected = detectCardBrand(cardDetails.number);
      const cleanNum = String(cardDetails.number).replace(/\D/g, '');
      const masked =
        cleanNum.length >= 4 ? `•••• •••• •••• ${cleanNum.slice(-4)}` : '•••• 4242';
      cardInfo = {
        brand: detected.brand,
        maskedNumber: masked,
        expiry: cardDetails.expiry || '12/28',
        cardHolder: cardDetails.cardHolder || reservation.guestName || 'VALUED GUEST',
        gateway: 'SkinaPay Sandbox',
        baseUrl: skinaConfig.baseUrl,
      };
    }

    const extraPayload = {
      skinaConfig: {
        baseUrl: skinaConfig.baseUrl,
        isSandbox: skinaConfig.isSandbox,
      },
      cardInfo,
    };

    const payment = await initializePaymentRecord({
      reservationId,
      provider,
      amount: Number(reservation.totalAmount),
      currency: reservation.currency === 'USD' ? 'USD' : 'ETB',
      guestEmail: reservation.guestEmail,
      guestName: reservation.guestName,
      bookingRef: reservation.bookingRef,
      extraPayload,
    });

    return NextResponse.json({
      success: true,
      message: `Payment initialized for provider ${provider}`,
      payment,
      skina:
        provider === 'SKINA'
          ? {
              isSandbox: skinaConfig.isSandbox,
              baseUrl: skinaConfig.baseUrl,
              detectedCard: cardInfo?.brand || 'Mastercard',
              supportedBrands: ['Mastercard', 'Local Debit Cards (EthSwitch)'],
              unsupportedNote: 'Visa, AmEx, UnionPay support is not yet available on SikinaPay.',
            }
          : undefined,
    });
  } catch (error: any) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment initialization failed.' },
      { status: 500 }
    );
  }
}
