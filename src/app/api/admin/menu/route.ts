import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, invalidateCache } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const res = await query(`SELECT * FROM dining_menu ORDER BY category, price ASC`);
    return NextResponse.json({ success: true, count: res.rows.length, items: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { name, category = 'main', price = 25, description = '', tag = null } = await req.json();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Dish name is required' }, { status: 400 });
    }

    const id = 'm-' + crypto.randomUUID().slice(0, 8);
    await query(
      `INSERT INTO dining_menu (id, name, category, price, description, tag, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [id, name, category, Number(price), description, tag || null]
    );

    invalidateCache('db_menu');
    return NextResponse.json({ success: true, message: 'Dish created successfully', id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id, name, category, price, description, tag } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Dish ID is required' }, { status: 400 });
    }

    await query(
      `UPDATE dining_menu SET
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        price = COALESCE($3, price),
        description = COALESCE($4, description),
        tag = $5
      WHERE id = $6`,
      [
        name || null,
        category || null,
        price !== undefined ? Number(price) : null,
        description !== undefined ? description : null,
        tag !== undefined ? tag : null,
        id,
      ]
    );

    invalidateCache('db_menu');
    return NextResponse.json({ success: true, message: 'Dish updated successfully' });
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
      return NextResponse.json({ success: false, error: 'Dish ID required' }, { status: 400 });
    }

    await query(`DELETE FROM dining_menu WHERE id = $1`, [id]);
    invalidateCache('db_menu');
    return NextResponse.json({ success: true, message: 'Dish deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
