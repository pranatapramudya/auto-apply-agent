import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { JobStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const statusParam = searchParams.get('status');
    const minScoreParam = searchParams.get('minScore');
    const search = searchParams.get('search');

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (statusParam && statusParam !== 'ALL') {
      // Validate against JobStatus enum
      if (Object.values(JobStatus).includes(statusParam as JobStatus)) {
        where.status = statusParam as JobStatus;
      }
    }

    if (minScoreParam) {
      const minScore = parseFloat(minScoreParam);
      if (!isNaN(minScore)) {
        where.matchScore = { gte: minScore };
      }
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { companyName: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    const [jobs, stats] = await Promise.all([
      prisma.jobListing.findMany({
        where,
        orderBy: [
          { matchScore: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      }),
      userId
        ? prisma.jobListing.groupBy({
            by: ['status'],
            where: { userId },
            _count: { status: true }
          })
        : prisma.jobListing.groupBy({
            by: ['status'],
            _count: { status: true }
          })
    ]);

    // Format stats summary
    const counts: Record<string, number> = {
      TOTAL: 0,
      DISCOVERED: 0,
      QUEUED_FOR_APPLY: 0,
      APPLIED: 0,
      FILTERED_OUT: 0,
      APPLYING: 0,
      FAILED: 0
    };

    stats.forEach((s) => {
      counts[s.status] = s._count.status;
      counts.TOTAL += s._count.status;
    });

    return NextResponse.json({
      success: true,
      counts,
      data: jobs
    });
  } catch (error: any) {
    console.error('[API /api/jobs] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
