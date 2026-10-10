import { NextRequest, NextResponse } from 'next/server';
import { getDbGalleryImages } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    let images = await getDbGalleryImages();

    if (category && category !== 'all') {
      images = images.filter((img) => img.category.toLowerCase() === category.toLowerCase());
    }

    return NextResponse.json(
      { success: true, count: images.length, images },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch gallery images' },
      { status: 500 }
    );
  }
}
