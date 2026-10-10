import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDbPageContent, updateDbPageContent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const content = await getDbPageContent();
    return NextResponse.json({ success: true, content });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch page content' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const contentToUpdate = body.content || body;

    if (!contentToUpdate || typeof contentToUpdate !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Content payload must be a key-value object.' },
        { status: 400 }
      );
    }

    await updateDbPageContent(contentToUpdate);
    const updatedContent = await getDbPageContent();

    return NextResponse.json({
      success: true,
      message: 'Page content and banners updated successfully',
      content: updatedContent,
    });
  } catch (error: any) {
    console.error('Error updating page content:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save page content' },
      { status: 500 }
    );
  }
}
