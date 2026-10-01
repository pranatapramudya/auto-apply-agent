import { NextResponse } from 'next/server';
import { scrapeSocialMediaJobs, VERIFIED_SOCIAL_SOURCES } from '@/services/social-scraper/social-crawler';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    sources: VERIFIED_SOCIAL_SOURCES
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, platform, customCaptionOrUrl, locationFilter } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId wajib disertakan.' },
        { status: 400 }
      );
    }

    const result = await scrapeSocialMediaJobs({
      userId,
      platform,
      customCaptionOrUrl,
      locationFilter: locationFilter || 'Semua'
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengekstrak ${result.totalProcessed} info loker media sosial (${result.inserted} baru disimpan ke database).`,
      data: result
    });
  } catch (err: any) {
    console.error('Error scrape-social route:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal mengekstrak info loker media sosial' },
      { status: 500 }
    );
  }
}
