import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import AggregatorJobScraper from '@/services/scraper/aggregator';
import { ingestRawJobs } from '@/services/job-ingestion';

export const dynamic = 'force-dynamic';
// Tingkatkan timeout maksimum route handler untuk proses live scraping
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, customQuery } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Parameter userId wajib disertakan.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Susun keyword pencarian dari target roles user
    const roles = user.targetRoles
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    const keywords: string[] = [];
    if (customQuery && customQuery.trim()) {
      keywords.push(customQuery.trim());
    }
    keywords.push(...roles);

    console.log(`[API /api/scrape-jobs] Menjalankan live scraping untuk ${user.fullName} dengan keywords:`, keywords);

    const aggregator = new AggregatorJobScraper();
    const rawJobs = await aggregator.scrape({
      userId: user.id,
      keywords: keywords.slice(0, 4),
      limit: 20
    });

    if (rawJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Scraping selesai, namun tidak ada lowongan baru yang ditemukan pada platform saat ini.',
        summary: {
          totalReceived: 0,
          inserted: 0,
          passedEvaluation: 0,
          skippedDuplicates: 0
        }
      });
    }

    // Salurkan ke Pipeline Ingestion & Heuristic/LLM Evaluator
    const summary = await ingestRawJobs(user.id, rawJobs);

    return NextResponse.json({
      success: true,
      message: `Berhasil menarik ${summary.totalReceived} lowongan real-time. ${summary.inserted} disimpan ke database (${summary.passedEvaluation} lolos seleksi kualifikasi).`,
      summary: {
        totalReceived: summary.totalReceived,
        inserted: summary.inserted,
        skippedDuplicates: summary.skippedDuplicates,
        passedEvaluation: summary.passedEvaluation,
        filteredOut: summary.filteredOut
      }
    });
  } catch (error: any) {
    console.error('[API /api/scrape-jobs] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan saat proses real-time scraping.' },
      { status: 500 }
    );
  }
}
