import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`SELECT * FROM spa_treatments ORDER BY category, price ASC`);
    return NextResponse.json({ success: true, count: res.rows.length, treatments: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, category = 'Massage Therapy', duration = '60 mins', price = 50, description = '' } = await req.json();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Treatment name is required' }, { status: 400 });
    }

    const id = 'sp-' + crypto.randomUUID().slice(0, 8);
    await query(
      `INSERT INTO spa_treatments (id, name, category, duration, price, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [id, name, category, duration, Number(price), description]
    );

    return NextResponse.json({ success: true, message: 'Spa treatment created successfully', id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, name, category, duration, price, description } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Treatment ID is required' }, { status: 400 });
    }

    await query(
      `UPDATE spa_treatments SET
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        duration = COALESCE($3, duration),
        price = COALESCE($4, price),
        description = COALESCE($5, description)
      WHERE id = $6`,
      [
        name || null,
        category || null,
        duration || null,
        price !== undefined ? Number(price) : null,
        description !== undefined ? description : null,
        id,
      ]
    );

    return NextResponse.json({ success: true, message: 'Spa treatment updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Treatment ID required' }, { status: 400 });
    }

    await query(`DELETE FROM spa_treatments WHERE id = $1`, [id]);
    return NextResponse.json({ success: true, message: 'Spa treatment deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
