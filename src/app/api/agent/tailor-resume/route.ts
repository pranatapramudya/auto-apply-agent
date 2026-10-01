import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateTailoredResumeData } from '@/services/resume/resume-tailor';
import { renderResumeToPdf } from '@/services/resume/pdf-generator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, jobListingId } = body;

    if (!userId || !jobListingId) {
      return NextResponse.json(
        { success: false, error: 'Parameter userId dan jobListingId wajib disertakan.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan.' }, { status: 404 });
    }

    const job = await prisma.jobListing.findUnique({ where: { id: jobListingId } });
    if (!job) {
      return NextResponse.json({ success: false, error: 'Lowongan tidak ditemukan.' }, { status: 404 });
    }

    // 1. Generate struktur data ATS tailored resume via AI
    const resumeData = await generateTailoredResumeData({
      candidateName: user.fullName,
      candidateEmail: user.email,
      candidatePhone: user.phone,
      candidateCity: user.city,
      targetRoles: user.targetRoles,
      coreSkills: user.coreSkills,
      portfolioUrl: user.portfolioUrl,
      linkedInUrl: user.linkedInUrl,
      githubUrl: user.githubUrl,
      jobTitle: job.title,
      companyName: job.companyName,
      jobDescription: job.description
    });

    // 2. Render ke file PDF fisik berstandar ATS
    const pdfResult = await renderResumeToPdf(resumeData, job.id);

    return NextResponse.json({
      success: true,
      data: {
        resumeData,
        pdfResult
      }
    });
  } catch (error: any) {
    console.error('[API /api/agent/tailor-resume] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghasilkan tailored resume.' },
      { status: 500 }
    );
  }
}
