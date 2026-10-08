import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { requireAdmin } from '@/lib/auth';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Extension allowlist — SVG is deliberately excluded (stored XSS vector). */
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/** Magic-byte signatures so a renamed file cannot bypass the extension check. */
function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  )
    return 'image/png';
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return 'image/webp';
  if (
    buffer.subarray(0, 3).toString('ascii') === 'GIF' &&
    (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' ||
      buffer.subarray(0, 6).toString('ascii') === 'GIF89a')
  )
    return 'image/gif';
  return null;
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Enforce a hard size cap before reading the payload.
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5 MB.' },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate extension…
    const ext = path.extname(file.name).toLowerCase() || '.jpg';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid image format. Allowed: JPG, PNG, WEBP, GIF',
        },
        { status: 400 }
      );
    }

    // …and verify the actual content matches an image type.
    const mime = detectImageMime(buffer);
    const isJpegLike = ext === '.jpg' || ext === '.jpeg';
    const mimeMatchesExt =
      (isJpegLike && mime === 'image/jpeg') ||
      (ext === '.png' && mime === 'image/png') ||
      (ext === '.webp' && mime === 'image/webp') ||
      (ext === '.gif' && mime === 'image/gif');
    if (!mimeMatchesExt) {
      return NextResponse.json(
        { success: false, error: 'File content does not match its image extension.' },
        { status: 400 }
      );
    }

    // Target upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate safe unique filename
    const uniqueName = `room_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      url: publicUrl,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed.' },
      { status: 500 }
    );
  }
}
