import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { JobStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { jobIds, status } = body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Daftar jobIds wajib berupa array dan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    if (!status || !Object.values(JobStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status tidak valid. Harus salah satu dari: ${Object.values(JobStatus).join(', ')}` },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    if (status === 'APPLIED') {
      updateData.appliedAt = new Date();
    }

    const result = await prisma.jobListing.updateMany({
      where: {
        id: { in: jobIds }
      },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil memperbarui ${result.count} lowongan ke status ${status}.`,
      updatedCount: result.count
    });
  } catch (error: any) {
    console.error('[API /api/jobs/batch] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan saat memproses pembaruan massal.' },
      { status: 500 }
    );
  }
}
