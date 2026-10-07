import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getExchangeRate, setExchangeRate } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
    }

    const rate = await getExchangeRate();
    return NextResponse.json({
      success: true,
      rate,
      baseCurrency: 'USD',
      targetCurrency: 'ETB',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
    }

    const body = await req.json();
    const rate = parseFloat(body.rate);

    if (isNaN(rate) || rate <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid exchange rate. Must be a positive number.' },
        { status: 400 }
      );
    }

    const syncRooms = body.syncRooms === true;
    const result = await setExchangeRate(rate, syncRooms);

    return NextResponse.json({
      success: true,
      rate: result.rate,
      updatedRoomsCount: result.updatedRoomsCount,
      message: syncRooms
        ? `Universal exchange rate updated to 1 USD = ${result.rate} ETB, and ${result.updatedRoomsCount} room types synchronized.`
        : `Universal exchange rate updated to 1 USD = ${result.rate} ETB.`,
    });
  } catch (error: any) {
    console.error('Error updating exchange rate:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update exchange rate' },
      { status: 500 }
    );
  }
}
