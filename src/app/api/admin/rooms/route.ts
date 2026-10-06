import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        r.id,
        r."roomNumber",
        r.floor,
        r.status,
        rt.id AS "roomTypeId",
        rt.name AS "roomTypeName",
        rt.slug AS "roomTypeSlug"
      FROM rooms r
      JOIN room_types rt ON rt.id = r."roomTypeId"
      ORDER BY r."roomNumber" ASC
    `);

    return NextResponse.json({ success: true, count: res.rows.length, rooms: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Missing id or status' }, { status: 400 });
    }

    await query(
      `UPDATE rooms SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
      [status, id]
    );

    return NextResponse.json({ success: true, message: 'Room status updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
