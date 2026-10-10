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
        rt.id,
        rt.slug,
        rt.name,
        rt.description,
        rt."baseCapacity",
        rt."maxCapacity",
        COALESCE(rt.size, '32 m²') AS size,
        COALESCE(rt."bedType", 'King Bed') AS "bedType",
        COALESCE(rt.view, 'City View') AS view,
        COALESCE(rt.category, 'Hotel Rooms') AS category,
        COALESCE(rt.featured, true) AS featured,
        rt.amenities,
        rt.images,
        rt."basePriceETB",
        rt."basePriceUSD",
        rt.aliases,
        SUM(CASE WHEN r.status = 'AVAILABLE' THEN 1 ELSE 0 END) AS "availableCount",
        COUNT(r.id) AS "totalRoomsCount"
      FROM room_types rt
      LEFT JOIN rooms r ON r."roomTypeId" = rt.id
      GROUP BY rt.id
      ORDER BY rt."basePriceUSD" ASC;
    `);

    return NextResponse.json({ success: true, count: res.rows.length, roomTypes: res.rows });
  } catch (error: any) {
    console.error('Error fetching room types:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const body = await req.json();
    const {
      name,
      slug,
      description,
      category = 'Hotel Rooms',
      size = '32 m²',
      bedType = 'King Bed',
      view = 'City View',
      basePriceUSD = 75,
      basePriceETB = 8500,
      baseCapacity = 2,
      maxCapacity = 3,
      amenities = [],
      images = [],
      featured = true,
      aliases = [],
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: 'Name and slug are required' }, { status: 400 });
    }

    const id = crypto.randomUUID();

    await query(
      `INSERT INTO room_types (
        id, slug, name, description, "baseCapacity", "maxCapacity", amenities, images,
        "basePriceETB", "basePriceUSD", size, "bedType", view, category, featured, aliases, "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())`,
      [
        id,
        slug.toLowerCase().trim().replace(/\s+/g, '-'),
        name,
        description || '',
        baseCapacity,
        maxCapacity,
        amenities,
        images,
        basePriceETB,
        basePriceUSD,
        size,
        bedType,
        view,
        category,
        featured,
        aliases,
      ]
    );

    invalidateCache('db_room');
    return NextResponse.json({ success: true, message: 'Room type created successfully', id });
  } catch (error: any) {
    console.error('Error creating room type:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const body = await req.json();
    const {
      id,
      name,
      slug,
      description,
      category,
      size,
      bedType,
      view,
      basePriceUSD,
      basePriceETB,
      baseCapacity,
      maxCapacity,
      amenities,
      images,
      featured,
      aliases,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Room type ID is required' }, { status: 400 });
    }

    await query(
      `UPDATE room_types SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        category = COALESCE($4, category),
        size = COALESCE($5, size),
        "bedType" = COALESCE($6, "bedType"),
        view = COALESCE($7, view),
        "basePriceUSD" = COALESCE($8, "basePriceUSD"),
        "basePriceETB" = COALESCE($9, "basePriceETB"),
        "baseCapacity" = COALESCE($10, "baseCapacity"),
        "maxCapacity" = COALESCE($11, "maxCapacity"),
        amenities = COALESCE($12, amenities),
        images = COALESCE($13, images),
        featured = COALESCE($14, featured),
        aliases = COALESCE($15, aliases),
        "updatedAt" = NOW()
      WHERE id = $16`,
      [
        name,
        slug ? slug.toLowerCase().trim().replace(/\s+/g, '-') : null,
        description,
        category,
        size,
        bedType,
        view,
        basePriceUSD !== undefined ? Number(basePriceUSD) : null,
        basePriceETB !== undefined ? Number(basePriceETB) : null,
        baseCapacity !== undefined ? Number(baseCapacity) : null,
        maxCapacity !== undefined ? Number(maxCapacity) : null,
        amenities,
        images,
        featured,
        aliases,
        id,
      ]
    );

    invalidateCache('db_room');
    return NextResponse.json({ success: true, message: 'Room type updated successfully' });
  } catch (error: any) {
    console.error('Error updating room type:', error);
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
      return NextResponse.json({ success: false, error: 'Room type ID required' }, { status: 400 });
    }

    // Check if room has active reservations
    const resCheck = await query(`SELECT count(*) FROM reservations WHERE "roomTypeId" = $1`, [id]);
    if (parseInt(resCheck.rows[0].count, 10) > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete: ${resCheck.rows[0].count} reservations reference this room type` },
        { status: 400 }
      );
    }

    // Unlink any rooms
    await query(`DELETE FROM rooms WHERE "roomTypeId" = $1`, [id]);
    await query(`DELETE FROM room_types WHERE id = $1`, [id]);

    invalidateCache('db_room');
    return NextResponse.json({ success: true, message: 'Room type deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting room type:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
