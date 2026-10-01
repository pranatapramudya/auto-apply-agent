import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { generateCoverLetter } from '../../../../services/email/cover-letter-generator';

export const dynamic = 'force-dynamic';

/**
 * Ekstraksi alamat email HRD dari deskripsi lowongan secara otomatis
 */
function extractEmailFromText(text?: string | null): string | null {
  if (!text) return null;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const matches = text.match(emailRegex);
  if (!matches || matches.length === 0) return null;

  // Prioritaskan email yang mengandung kata hrd, recruitment, career, job, talent
  const priorityMatch = matches.find((m) =>
    /(hrd|recruit|career|job|talent|hiring|people)/i.test(m)
  );

  return priorityMatch || matches[0];
}

function inferRecruiterEmail(job: { companyName: string; jobUrl?: string; description?: string }): string {
  // 1. Cek jika email tertera eksplisit dalam deskripsi
  const textMatch = extractEmailFromText(job.description);
  if (textMatch) return textMatch;

  // 2. Cek jika URL pekerjaan memiliki domain perusahaan mandiri
  if (job.jobUrl) {
    try {
      const urlObj = new URL(job.jobUrl);
      const host = urlObj.hostname.toLowerCase().replace(/^www\./, '');
      const isAggregator = /^(kalibrr|techinasia|glints|jobstreet|linkedin|indeed|dealls|karir)\./.test(host);
      if (!isAggregator && host.includes('.')) {
        return `recruitment@${host}`;
      }
    } catch {}
  }

  // 3. Fallback cerdas dari nama perusahaan
  if (job.companyName) {
    const cleanCompany = job.companyName
      .replace(/^(pt|cv|inc|ltd|tbk|group)\.?\s+/i, '')
      .replace(/\s+(indonesia|nusantara|jaya|abadi|sejahtera)$/i, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    if (cleanCompany.length >= 2) {
      return `careers@${cleanCompany}.co.id`;
    }
  }

  return 'recruitment@perusahaan.co.id';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, jobId } = body;

    if (!userId || !jobId) {
      return NextResponse.json(
        { error: 'userId dan jobId wajib disertakan' },
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

    // 1. Deteksi otomatis email HRD dari deskripsi / domain perusahaan
    const detectedEmail = inferRecruiterEmail(job);

    // 2. Buat surat lamaran terpersonalisasi via AI Groq
    const coverLetter = await generateCoverLetter({
      candidateName: user.fullName,
      candidateEmail: user.email,
      candidatePhone: user.phone,
      candidateCity: user.city || 'Sumedang / Bandung Raya',
      candidateRoles: user.targetRoles,
      candidateSkills: user.coreSkills,
      portfolioUrl: user.portfolioUrl,
      linkedInUrl: user.linkedInUrl,
      jobTitle: job.title,
      companyName: job.companyName,
      jobDescription: job.description
    });

    return NextResponse.json({
      success: true,
      recipientEmail: detectedEmail,
      coverLetter,
      job: {
        id: job.id,
        title: job.title,
        companyName: job.companyName,
        platform: job.platform
      },
      candidate: {
        fullName: user.fullName,
        email: user.email,
        resumePath: user.resumeLocalPath
      }
    });
  } catch (error: any) {
    console.error('API Error generate-cover-letter:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghasilkan cover letter' },
      { status: 500 }
    );
  }
}
