import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDbFaqs, addDbFaq, updateDbFaq, deleteDbFaq } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const faqs = await getDbFaqs();
    return NextResponse.json({ success: true, count: faqs.length, faqs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { question, answer, category, sort_order } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, error: 'Question and answer are required.' },
        { status: 400 }
      );
    }

    const created = await addDbFaq({
      question: question.trim(),
      answer: answer.trim(),
      category: (category || 'general').trim(),
      sort_order: Number(sort_order) || 0,
    });

    return NextResponse.json({
      success: true,
      message: 'FAQ created successfully',
      faq: created,
    });
  } catch (error: any) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { id, question, answer, category, sort_order } = body;

    if (!id || !question || !answer) {
      return NextResponse.json(
        { success: false, error: 'FAQ ID, question, and answer are required.' },
        { status: 400 }
      );
    }

    const updated = await updateDbFaq({
      id: String(id),
      question: question.trim(),
      answer: answer.trim(),
      category: (category || 'general').trim(),
      sort_order: Number(sort_order) || 0,
    });

    return NextResponse.json({
      success: true,
      message: 'FAQ updated successfully',
      faq: updated,
    });
  } catch (error: any) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update FAQ' },
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
        { success: false, error: 'FAQ ID is required.' },
        { status: 400 }
      );
    }

    await deleteDbFaq(id);

    return NextResponse.json({
      success: true,
      message: 'FAQ deleted successfully',
      id,
    });
  } catch (error: any) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}
