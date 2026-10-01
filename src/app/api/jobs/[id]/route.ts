import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { JobStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, failureReason } = body;

    if (!status || !Object.values(JobStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: "${status}". Must be one of: ${Object.values(JobStatus).join(', ')}` },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    if (failureReason !== undefined) {
      updateData.failureReason = failureReason;
    }
    if (status === 'APPLIED') {
      updateData.appliedAt = new Date();
    }

    const updatedJob = await prisma.jobListing.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: updatedJob });
  } catch (error: any) {
    console.error(`[API PATCH /api/jobs/[id]] Error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
