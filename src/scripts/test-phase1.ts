import prisma from '../lib/prisma';
import { generateTailoredResumeData } from '../services/resume/resume-tailor';
import { renderResumeToPdf } from '../services/resume/pdf-generator';
import fs from 'fs';
import path from 'path';

async function testPhase1() {
  console.log('================================================================');
  console.log('🧪 PENGUJIAN FASE 1: DYNAMIC ATS-TAILORED RESUME GENERATOR');
  console.log('================================================================\n');

  // Ambil user aktif
  const user = await prisma.user.findFirst({ where: { isActive: true } });
  if (!user) {
    throw new Error('User aktif tidak ditemukan!');
  }

  // Ambil salah satu loker sample
  const job = await prisma.jobListing.findFirst({
    where: { userId: user.id }
  }) || {
    id: 'test-job-sample',
    title: 'Senior Full Stack Engineer',
    companyName: 'Tech Innovations Asia',
    description: 'We are seeking a Senior Full Stack Engineer experienced in React, Next.js, Node.js, TypeScript, PostgreSQL, and AI agent integration. Strong understanding of automated testing, scalable API architecture, and CI/CD pipelines is required.'
  };

  console.log(`👤 Kandidat   : ${user.fullName} (${user.email})`);
  console.log(`💼 Target Loker: ${job.title} @ ${job.companyName}\n`);

  console.log('⏳ [1/2] Menghasilkan data resume yang diselaraskan dengan kata kunci ATS via LLM...');
  const tailoredData = await generateTailoredResumeData({
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

  console.log('✅ Data ATS Resume Berhasil Dihasilkan:');
  console.log(`   - Target Role     : ${tailoredData.targetRole}`);
  console.log(`   - Matched Keywords: ${tailoredData.matchedKeywords.join(', ')}`);
  console.log(`   - Ringkasan       : ${tailoredData.professionalSummary.slice(0, 100)}...\n`);

  console.log('⏳ [2/2] Merender berkas PDF resmi berstandar ATS...');
  const pdfResult = await renderResumeToPdf(tailoredData, job.id);

  console.log('✅ Berkas PDF Terbentuk:');
  console.log(`   - Path Relatif    : ${pdfResult.pdfRelativePath}`);
  console.log(`   - Ukuran Berkas   : ${(pdfResult.fileSizeBytes / 1024).toFixed(2)} KB`);
  console.log(`   - Estimasi ATS    : ${(pdfResult.atsScoreEstimate * 100).toFixed(0)}% Match\n`);

  // Validasi ukuran file > 10KB
  if (pdfResult.fileSizeBytes < 10 * 1024) {
    throw new Error(`Ukuran file PDF (${pdfResult.fileSizeBytes} bytes) kurang dari 10KB.`);
  }

  console.log('🎉 PENGUJIAN FASE 1 SELESAI & SUKSES TANPA ERROR!\n');
}

testPhase1()
  .catch((e) => {
    console.error('❌ Pengujian Fase 1 Gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
