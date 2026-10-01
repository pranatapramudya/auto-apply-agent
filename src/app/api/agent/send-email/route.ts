import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { dispatchApplicationEmail } from '../../../../services/email/email-dispatcher';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, jobId, toEmail, subject, bodyText, isDryRun } = body;

    if (!userId || !jobId || !toEmail || !subject || !bodyText) {
      return NextResponse.json(
        { error: 'Parameter tidak lengkap: userId, jobId, toEmail, subject, dan bodyText wajib diisi' },
        { status: 400 }
      );
    }

    const [user, job] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.jobListing.findUnique({ where: { id: jobId } })
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }
    if (!job) {
      return NextResponse.json({ error: 'Lowongan tidak ditemukan' }, { status: 404 });
    }

    // Eksekusi pengiriman email (Dry-run atau Live Send)
    const result = await dispatchApplicationEmail({
      toEmail,
      candidateName: user.fullName,
      candidateEmail: user.email,
      subject,
      bodyText,
      bodyHtml: '',
      resumePdfPath: user.resumeLocalPath,
      isDryRun: isDryRun ?? true,
      companyName: job.companyName,
      jobTitle: job.title
    });

    // Update status lowongan menjadi APPLIED di database
    const updatedJob = await prisma.jobListing.update({
      where: { id: job.id },
      data: {
        status: 'APPLIED',
        appliedAt: new Date(),
        failureReason: null
      }
    });

    return NextResponse.json({
      success: true,
      result,
      job: {
        id: updatedJob.id,
        status: updatedJob.status,
        appliedAt: updatedJob.appliedAt
      }
    });
  } catch (error: any) {
    console.error('API Error send-email:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses pengiriman email' },
      { status: 500 }
    );
  }
}
