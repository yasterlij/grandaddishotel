import { NextRequest, NextResponse } from 'next/server';
import { initializePaymentRecord, PaymentProviderType } from '@/lib/payments';
import { getSkinaConfig, detectCardBrand } from '@/lib/skina';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      reservationId,
      provider = 'SKINA', // Default to SKINA as requested
      amount,
      currency = 'ETB',
      guestEmail,
      guestName,
      bookingRef,
      cardDetails,
    } = body;

    if (!reservationId || !amount) {
      return NextResponse.json(
        { success: false, error: 'reservationId and amount are required' },
        { status: 400 }
      );
    }

    const skinaConfig = getSkinaConfig();
    let cardInfo = null;

    if (provider === 'SKINA' && cardDetails?.number) {
      const detected = detectCardBrand(cardDetails.number);
      const cleanNum = cardDetails.number.replace(/\D/g, '');
      const masked = cleanNum.length >= 4 ? `•••• •••• •••• ${cleanNum.slice(-4)}` : '•••• 4242';
      cardInfo = {
        brand: detected.brand,
        maskedNumber: masked,
        expiry: cardDetails.expiry || '12/28',
        cardHolder: cardDetails.cardHolder || guestName || 'VALUED GUEST',
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
      provider: provider as PaymentProviderType,
      amount: Number(amount),
      currency: currency === 'USD' ? 'USD' : 'ETB',
      guestEmail,
      guestName,
      bookingRef,
      extraPayload,
    });

    return NextResponse.json({
      success: true,
      message: `Payment initialized for provider ${provider}`,
      payment,
      skina: provider === 'SKINA' ? {
        isSandbox: skinaConfig.isSandbox,
        baseUrl: skinaConfig.baseUrl,
        detectedCard: cardInfo?.brand || 'Visa',
        supportedBrands: ['Visa', 'Mastercard', 'American Express', 'UnionPay', 'Local Debit'],
      } : undefined,
    });
  } catch (error: any) {
    console.error('Payment initialization error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
