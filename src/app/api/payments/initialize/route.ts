import { NextRequest, NextResponse } from 'next/server';
import { initializePaymentRecord, PaymentProviderType } from '@/lib/payments';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      reservationId,
      provider = 'CHAPA',
      amount,
      currency = 'ETB',
      guestEmail,
      guestName,
      bookingRef,
    } = body;

    if (!reservationId || !amount) {
      return NextResponse.json(
        { success: false, error: 'reservationId and amount are required' },
        { status: 400 }
      );
    }

    const payment = await initializePaymentRecord({
      reservationId,
      provider: provider as PaymentProviderType,
      amount: Number(amount),
      currency: currency === 'USD' ? 'USD' : 'ETB',
      guestEmail,
      guestName,
      bookingRef,
    });

    return NextResponse.json({
      success: true,
      message: `Payment initialized for provider ${provider}`,
      payment,
    });
  } catch (error: any) {
    console.error('Payment initialization error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
