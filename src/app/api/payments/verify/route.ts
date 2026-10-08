import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { confirmPaymentRecord, type PaymentTransitionStatus } from '@/lib/payments';
import { getSkinaConfig } from '@/lib/skina';
import { requireAdmin } from '@/lib/auth';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';

const VALID_STATUSES: PaymentTransitionStatus[] = ['SUCCESS', 'FAILED', 'PENDING'];

/**
 * Payment verification endpoint.
 *
 * ⚠️ The SkinaPay integration is currently SIMULATED — there is no real
 * gateway round-trip yet. To keep the sandbox demo flow working, a client may
 * confirm its own payment ONLY while the gateway is in sandbox mode.
 *
 * In production (non-sandbox) this endpoint accepts verification exclusively
 * from:
 *   1. An authenticated admin, or
 *   2. A signed gateway webhook (HMAC-SHA256 of the raw body with
 *      SIKINA_WEBHOOK_SECRET in the `x-skina-signature` header). Replace the
 *      signature scheme with the gateway's documented format when integrating
 *      for real.
 */
export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`payments-verify:${getClientIp(req)}`, 20, 5 * 60 * 1000);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

    const body = await req.json().catch(() => ({}));
    const { paymentId, txRef, gatewayRef, status } = body;

    if (!paymentId && !txRef) {
      return NextResponse.json(
        { success: false, error: 'paymentId or txRef is required' },
        { status: 400 }
      );
    }

    const nextStatus: PaymentTransitionStatus = VALID_STATUSES.includes(status)
      ? status
      : 'SUCCESS';

    const skina = getSkinaConfig();
    if (!skina.isSandbox) {
      // Production: require admin session or a signed webhook.
      const signature = req.headers.get('x-skina-signature');
      const webhookSecret = process.env.SIKINA_WEBHOOK_SECRET || '';
      const rawBody = JSON.stringify(body);
      const expectedSignature = webhookSecret
        ? crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
        : null;

      const signatureValid =
        expectedSignature !== null &&
        signature !== null &&
        signature.length === expectedSignature.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

      if (!signatureValid) {
        const unauthorized = await requireAdmin();
        if (unauthorized) return unauthorized;
      }
    }

    const { payment, reservationUpdated } = await confirmPaymentRecord({
      paymentId,
      txRef,
      gatewayRef,
      status: nextStatus,
    });

    return NextResponse.json({
      success: true,
      message: `Payment confirmed as ${nextStatus} in PostgreSQL`,
      payment,
      reservationUpdated,
    });
  } catch (error: any) {
    const statusCode = error?.statusCode || 500;
    if (statusCode === 500) {
      console.error('Payment verification error:', error);
      return NextResponse.json(
        { success: false, error: 'Payment verification failed.' },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: statusCode });
  }
}
