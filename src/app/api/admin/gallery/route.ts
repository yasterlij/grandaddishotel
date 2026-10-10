import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import {
  getDbGalleryImages,
  addDbGalleryImage,
  updateDbGalleryImage,
  deleteDbGalleryImage,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const images = await getDbGalleryImages();
    return NextResponse.json({ success: true, count: images.length, images });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch gallery images' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { src, title, category, sort_order } = body;

    if (!src || !title) {
      return NextResponse.json(
        { success: false, error: 'Image source (src) and title are required.' },
        { status: 400 }
      );
    }

    const newImage = await addDbGalleryImage({
      src: src.trim(),
      title: title.trim(),
      category: (category || 'hotel').trim().toLowerCase(),
      sort_order: sort_order !== undefined ? Number(sort_order) : 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Photo successfully added to gallery',
      image: newImage,
    });
  } catch (error: any) {
    console.error('Error adding gallery image:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add image' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { id, src, title, category, sort_order } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Image ID is required for update.' },
        { status: 400 }
      );
    }

    const updated = await updateDbGalleryImage(id, {
      src: src ? src.trim() : undefined,
      title: title ? title.trim() : undefined,
      category: category ? category.trim().toLowerCase() : undefined,
      sort_order: sort_order !== undefined ? Number(sort_order) : undefined,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Gallery photo not found or no changes made.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Gallery photo updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating gallery image:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update image' },
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
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Image ID is required for deletion.' },
        { status: 400 }
      );
    }

    const deleted = await deleteDbGalleryImage(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Gallery photo not found or already deleted.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Gallery photo deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting gallery image:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
}
