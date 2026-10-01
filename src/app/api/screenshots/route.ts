import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    const screenshotsDir = path.resolve(process.cwd(), 'logs', 'screenshots');
    const errorsDir = path.resolve(process.cwd(), 'logs', 'errors');

    const resultFiles: Array<{
      filename: string;
      url: string;
      type: 'dry-run' | 'applied' | 'error';
      timestamp: number;
    }> = [];

    const scanDir = (dir: string, defaultType: 'dry-run' | 'applied' | 'error') => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (!file.endsWith('.png')) continue;
        if (jobId && !file.includes(jobId)) continue;

        let type = defaultType;
        if (file.startsWith('applied-')) type = 'applied';
        else if (file.startsWith('dry-run-')) type = 'dry-run';
        else if (file.startsWith('error-')) type = 'error';

        // Ekstraksi timestamp jika ada di format name
        const match = file.match(/(\d{10,13})\.png$/);
        const timestamp = match ? parseInt(match[1], 10) : 0;

        resultFiles.push({
          filename: file,
          url: `/api/screenshots/${file}`,
          type,
          timestamp
        });
      }
    };

    scanDir(screenshotsDir, 'dry-run');
    scanDir(errorsDir, 'error');

    // Urutkan dari yang paling baru
    resultFiles.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      success: true,
      data: resultFiles,
      latest: resultFiles[0] || null
    });
  } catch (error: any) {
    console.error('[API /api/screenshots] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
