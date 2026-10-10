import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import {
  getDbExperiences,
  addDbExperience,
  updateDbExperience,
  deleteDbExperience,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const experiences = await getDbExperiences();
    return NextResponse.json({ success: true, count: experiences.length, experiences });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch experiences' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { title, subtitle, category, duration, image, description, highlights } = body;

    if (!title || !description || !image) {
      return NextResponse.json(
        { success: false, error: 'Title, image, and description are required.' },
        { status: 400 }
      );
    }

    const newExp = await addDbExperience({
      title: title.trim(),
      subtitle: (subtitle || '').trim(),
      category: (category || 'Culture').trim(),
      duration: (duration || '2-3 Hours').trim(),
      image: image.trim(),
      description: description.trim(),
      highlights: Array.isArray(highlights)
        ? highlights.filter(Boolean)
        : typeof highlights === 'string'
        ? highlights.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
    });

    return NextResponse.json({
      success: true,
      message: 'Experience created successfully',
      experience: newExp,
    });
  } catch (error: any) {
    console.error('Error creating experience:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create experience' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { id, title, subtitle, category, duration, image, description, highlights } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Experience ID is required.' },
        { status: 400 }
      );
    }

    const updated = await updateDbExperience(id, {
      title: title ? title.trim() : undefined,
      subtitle: subtitle !== undefined ? subtitle.trim() : undefined,
      category: category ? category.trim() : undefined,
      duration: duration ? duration.trim() : undefined,
      image: image ? image.trim() : undefined,
      description: description ? description.trim() : undefined,
      highlights: highlights
        ? Array.isArray(highlights)
          ? highlights.filter(Boolean)
          : typeof highlights === 'string'
          ? highlights.split('\n').map((s) => s.trim()).filter(Boolean)
          : undefined
        : undefined,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Experience not found or no changes made.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Experience updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating experience:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update experience' },
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
        { success: false, error: 'Experience ID is required.' },
        { status: 400 }
      );
    }

    const deleted = await deleteDbExperience(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Experience not found or already deleted.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Experience deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting experience:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete experience' },
      { status: 500 }
    );
  }
}
