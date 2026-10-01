import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseRecruitmentEmail } from '@/services/email/email-tracker';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { from, subject, body: emailBody, jobListingId } = body;

    if (!from || !subject || !emailBody) {
      return NextResponse.json(
        { success: false, error: 'Parameter from, subject, dan body wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Ekstraksi status via AI
    const scanResult = await parseRecruitmentEmail({
      from,
      subject,
      body: emailBody
    });

    let updatedJob = null;

    // 2. Jika ada jobListingId spesifik atau perusahaan yang cocok di database
    if (jobListingId) {
      if (['INTERVIEW', 'REJECTED', 'UNDER_REVIEW'].includes(scanResult.lifecycleStatus)) {
        updatedJob = await prisma.jobListing.update({
          where: { id: jobListingId },
          data: {
            status: scanResult.lifecycleStatus as any,
            failureReason: scanResult.lifecycleStatus === 'REJECTED' ? `[Email Rejection] ${scanResult.reasoning}` : null
          }
        }).catch(() => null);
      }
    } else if (scanResult.companyName) {
      // Cari job listing aktif kandidat yang cocok dengan nama perusahaan
      const matchedJob = await prisma.jobListing.findFirst({
        where: {
          companyName: {
            contains: scanResult.companyName,
            mode: 'insensitive'
          }
        }
      });

      if (matchedJob && ['INTERVIEW', 'REJECTED', 'UNDER_REVIEW'].includes(scanResult.lifecycleStatus)) {
        updatedJob = await prisma.jobListing.update({
          where: { id: matchedJob.id },
          data: {
            status: scanResult.lifecycleStatus as any,
            failureReason: scanResult.lifecycleStatus === 'REJECTED' ? `[Email Rejection] ${scanResult.reasoning}` : null
          }
        }).catch(() => null);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        scanResult,
        updatedJobListing: updatedJob
      }
    });
  } catch (error: any) {
    console.error('[API /api/agent/track-status] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses tracking email.' },
      { status: 500 }
    );
  }
}
