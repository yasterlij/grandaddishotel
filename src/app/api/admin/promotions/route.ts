import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import {
  getDbPromotions,
  addDbPromotion,
  updateDbPromotion,
  deleteDbPromotion,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const promotions = await getDbPromotions();
    return NextResponse.json({ success: true, count: promotions.length, promotions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch promotions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { title, badge, discount, description, inclusions, code, valid_until } = body;

    if (!title || !discount || !description || !code) {
      return NextResponse.json(
        { success: false, error: 'Title, discount, description, and code are required.' },
        { status: 400 }
      );
    }

    const created = await addDbPromotion({
      title: title.trim(),
      badge: (badge || 'Special Offer').trim(),
      discount: discount.trim(),
      description: description.trim(),
      inclusions: inclusions || [],
      code: code.trim(),
      valid_until: (valid_until || 'Ongoing').trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'Promotion created successfully',
      promotion: created,
    });
  } catch (error: any) {
    console.error('Error creating promotion:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create promotion' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { id, title, badge, discount, description, inclusions, code, valid_until } = body;

    if (!id || !title || !discount || !description || !code) {
      return NextResponse.json(
        { success: false, error: 'Promotion ID, title, discount, description, and code are required.' },
        { status: 400 }
      );
    }

    const updated = await updateDbPromotion({
      id: String(id),
      title: title.trim(),
      badge: (badge || 'Special Offer').trim(),
      discount: discount.trim(),
      description: description.trim(),
      inclusions: inclusions || [],
      code: code.trim(),
      valid_until: (valid_until || 'Ongoing').trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'Promotion updated successfully',
      promotion: updated,
    });
  } catch (error: any) {
    console.error('Error updating promotion:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update promotion' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // query param fallback
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Promotion ID is required.' },
        { status: 400 }
      );
    }

    await deleteDbPromotion(id);

    return NextResponse.json({
      success: true,
      message: 'Promotion deleted successfully',
      id,
    });
  } catch (error: any) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete promotion' },
      { status: 500 }
    );
  }
}
