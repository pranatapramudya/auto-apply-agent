import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Sanitasi filename untuk mencegah directory traversal attack
    const safeFilename = path.basename(filename);

    if (!safeFilename || !safeFilename.endsWith('.png')) {
      return new NextResponse('File tidak valid. Hanya format .png yang diperbolehkan.', { status: 400 });
    }

    const screenshotsDir = path.resolve(process.cwd(), 'logs', 'screenshots');
    const errorsDir = path.resolve(process.cwd(), 'logs', 'errors');

    let filePath = path.join(screenshotsDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      filePath = path.join(errorsDir, safeFilename);
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Screenshot tidak ditemukan di server.', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, immutable'
      }
    });
  } catch (error: any) {
    console.error('[API /api/screenshots/[filename]] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
