import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';

export async function GET() {
  try {
    const roomTypes = await db.orm.public.RoomTypes.all();
    const rooms = await db.orm.public.Rooms.all();
    const reservations = await db.orm.public.Reservations.all();

    return NextResponse.json({
      success: true,
      engine: 'Prisma ORM (Latest) + PostgreSQL',
      database: 'grand_addis_db',
      stats: {
        roomTypesCount: roomTypes.length,
        physicalRoomsCount: rooms.length,
        reservationsCount: reservations.length,
      },
      sampleRooms: roomTypes.slice(0, 3).map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        basePriceUSD: r.basePriceUSD,
        basePriceETB: r.basePriceETB,
      })),
    });
  } catch (error: any) {
    console.error('Prisma query error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Prisma error' },
      { status: 500 }
    );
  }
}
