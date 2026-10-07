import crypto from 'crypto';
import { query } from '@/lib/db';

export * from './payment-types';
import { PaymentProviderType } from './payment-types';

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

export async function confirmPaymentRecord({
  paymentId,
  txRef,
  gatewayRef,
  status = 'SUCCESS',
}: {
  paymentId?: string;
  txRef?: string;
  gatewayRef?: string;
  status?: 'SUCCESS' | 'FAILED' | 'PENDING';
}) {
  const generatedGatewayRef = gatewayRef || `GW-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const isPaid = status === 'SUCCESS';
  let res;
  if (paymentId) {
    res = await query(
      `UPDATE payments SET
        status = $1::"PaymentStatus",
        "gatewayRef" = $2,
        "paidAt" = CASE WHEN $4 = true THEN NOW() ELSE "paidAt" END,
        "updatedAt" = NOW()
      WHERE id = $3
      RETURNING *`,
      [status, generatedGatewayRef, paymentId, isPaid]
    );
  } else if (txRef) {
    res = await query(
      `UPDATE payments SET
        status = $1::"PaymentStatus",
        "gatewayRef" = $2,
        "paidAt" = CASE WHEN $4 = true THEN NOW() ELSE "paidAt" END,
        "updatedAt" = NOW()
      WHERE "txRef" = $3
      RETURNING *`,
      [status, generatedGatewayRef, txRef, isPaid]
    );
  }

  if (!res || res.rows.length === 0) {
    throw new Error('Payment record not found');
  }

  const payment = res.rows[0];

  // Update linked reservation
  if (payment.reservationId && status === 'SUCCESS') {
    await query(
      `UPDATE reservations SET status = 'CONFIRMED', "updatedAt" = NOW() WHERE id = $1`,
      [payment.reservationId]
    );
  }

  return payment;
}
