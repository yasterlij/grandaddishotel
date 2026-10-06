import { NextRequest, NextResponse } from 'next/server';
import { confirmPaymentRecord } from '@/lib/payments';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentId, txRef, gatewayRef, status = 'SUCCESS' } = body;

    if (!paymentId && !txRef) {
      return NextResponse.json(
        { success: false, error: 'paymentId or txRef is required' },
        { status: 400 }
      );
    }

    const updated = await confirmPaymentRecord({
      paymentId,
      txRef,
      gatewayRef,
      status: status as 'SUCCESS' | 'FAILED' | 'PENDING',
    });

    return NextResponse.json({
      success: true,
      message: `Payment confirmed as ${status} in PostgreSQL`,
      payment: updated,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
