import crypto from 'crypto';
import pool, { query } from '@/lib/db';

export * from './payment-types';
import { PaymentProviderType } from './payment-types';

const VALID_PROVIDERS: PaymentProviderType[] = [
  'SKINA',
  'TELEBIRR',
  'CHAPA',
  'CBE_BIRR',
  'CASH_ON_ARRIVAL',
];

export function isValidProvider(value: unknown): value is PaymentProviderType {
  return typeof value === 'string' && (VALID_PROVIDERS as string[]).includes(value);
}

export async function initializePaymentRecord({
  reservationId,
  provider,
  amount,
  currency,
  guestEmail,
  guestName,
  bookingRef,
  extraPayload,
}: {
  reservationId: string;
  provider: PaymentProviderType;
  amount: number;
  currency: 'ETB' | 'USD';
  guestEmail?: string;
  guestName?: string;
  bookingRef?: string;
  extraPayload?: any;
}) {
  const paymentId = crypto.randomUUID();
  const txRef = `TX-${provider}-${(bookingRef || Date.now().toString()).replace(/[^A-Za-z0-9]/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const isInstant = provider !== 'CASH_ON_ARRIVAL';
  const initialStatus = provider === 'CASH_ON_ARRIVAL' ? 'PENDING' : 'INITIALIZED';

  const rawPayload = JSON.stringify({
    guestEmail,
    guestName,
    initializedAt: new Date().toISOString(),
    ...(extraPayload || {}),
  });

  await query(
    `INSERT INTO payments (
      id, "txRef", provider, status, amount, currency, "reservationId", "rawPayload", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
    [
      paymentId,
      txRef,
      provider,
      initialStatus,
      Number(amount),
      currency,
      reservationId,
      rawPayload,
    ]
  );

  return {
    paymentId,
    txRef,
    provider,
    status: initialStatus,
    amount,
    currency,
  };
}

export type PaymentTransitionStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';

/**
 * Transition a payment to a new status, keeping the linked reservation in
 * sync inside the same transaction:
 *   - PENDING/INITIALIZED → SUCCESS  : reservation becomes CONFIRMED
 *   - CONFIRMED reservation + FAILED : reservation goes back to PENDING
 *   - CONFIRMED reservation + REFUNDED: reservation becomes CANCELLED
 *
 * Terminal states (SUCCESS, REFUNDED) are immutable — a payment can never be
 * re-confirmed or re-refunded.
 */
export async function confirmPaymentRecord({
  paymentId,
  txRef,
  gatewayRef,
  status = 'SUCCESS',
}: {
  paymentId?: string;
  txRef?: string;
  gatewayRef?: string;
  status?: PaymentTransitionStatus;
}): Promise<{ payment: any; reservationUpdated: boolean }> {
  const generatedGatewayRef =
    gatewayRef || `GW-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const isPaid = status === 'SUCCESS';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the payment row first.
    const currentRes = await client.query(
      `SELECT * FROM payments WHERE ${paymentId ? 'id = $1' : '"txRef" = $1'} LIMIT 1 FOR UPDATE`,
      [paymentId || txRef]
    );
    if (currentRes.rows.length === 0) {
      throw Object.assign(new Error('Payment record not found'), { statusCode: 404 });
    }
    const current = currentRes.rows[0];

    // Terminal-state guard: SUCCESS and REFUNDED payments never change again.
    if (current.status === 'SUCCESS' || current.status === 'REFUNDED') {
      throw Object.assign(
        new Error(`Payment is already in terminal state ${current.status}`),
        { statusCode: 409 }
      );
    }

    const updatedRes = await client.query(
      `UPDATE payments SET
        status = $1::"PaymentStatus",
        "gatewayRef" = $2,
        "paidAt" = CASE WHEN $3 = true THEN NOW() ELSE "paidAt" END,
        "updatedAt" = NOW()
      WHERE id = $4
      RETURNING *`,
      [status, generatedGatewayRef, isPaid, current.id]
    );
    const payment = updatedRes.rows[0];

    // Keep the reservation in sync with the payment outcome.
    let reservationUpdated = false;
    if (payment.reservationId) {
      if (isPaid) {
        const res = await client.query(
          `UPDATE reservations
           SET status = 'CONFIRMED', "updatedAt" = NOW()
           WHERE id = $1 AND status IN ('PENDING')
           RETURNING id`,
          [payment.reservationId]
        );
        reservationUpdated = (res.rowCount ?? 0) > 0;
      } else if (status === 'FAILED') {
        const res = await client.query(
          `UPDATE reservations
           SET status = 'PENDING', "updatedAt" = NOW()
           WHERE id = $1 AND status = 'CONFIRMED'
           RETURNING id`,
          [payment.reservationId]
        );
        reservationUpdated = (res.rowCount ?? 0) > 0;
      } else if (status === 'REFUNDED') {
        const res = await client.query(
          `UPDATE reservations
           SET status = 'CANCELLED', "updatedAt" = NOW()
           WHERE id = $1 AND status = 'CONFIRMED'
           RETURNING id`,
          [payment.reservationId]
        );
        reservationUpdated = (res.rowCount ?? 0) > 0;
      }
    }

    await client.query('COMMIT');
    return { payment, reservationUpdated };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
