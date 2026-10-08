import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, invalidateCache } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
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

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { roomNumber, floor = 1, roomTypeId, status = 'AVAILABLE' } = await req.json();

    if (!roomNumber || !roomTypeId) {
      return NextResponse.json({ success: false, error: 'Room number and Room Type are required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await query(
      `INSERT INTO rooms (id, "roomNumber", floor, status, "roomTypeId", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [id, roomNumber.trim(), Number(floor), status, roomTypeId]
    );

    invalidateCache('db_room');
    return NextResponse.json({ success: true, message: 'Room created successfully', id });
  } catch (error: any) {
    console.error('Error creating physical room:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id, roomNumber, floor, status, roomTypeId } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Room ID is required' }, { status: 400 });
    }

    await query(
      `UPDATE rooms SET
        "roomNumber" = COALESCE($1, "roomNumber"),
        floor = COALESCE($2, floor),
        status = COALESCE($3, status),
        "roomTypeId" = COALESCE($4, "roomTypeId"),
        "updatedAt" = NOW()
      WHERE id = $5`,
      [
        roomNumber ? roomNumber.trim() : null,
        floor !== undefined ? Number(floor) : null,
        status || null,
        roomTypeId || null,
        id,
      ]
    );

    invalidateCache('db_room');
    return NextResponse.json({ success: true, message: 'Room updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Missing id or status' }, { status: 400 });
    }

    await query(
      `UPDATE rooms SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
      [status, id]
    );

    invalidateCache('db_room');
    return NextResponse.json({ success: true, message: 'Room status updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Room ID required' }, { status: 400 });
    }

    await query(`DELETE FROM rooms WHERE id = $1`, [id]);
    invalidateCache('db_room');
    return NextResponse.json({ success: true, message: 'Room deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
