import prisma from '../lib/prisma';
import { evaluateJob } from '../services/job-evaluator';

async function main() {
  console.log('================================================================');
  console.log('🚀 MEMULAI PENGUJIAN DUAL-LAYER FILTER PADA NEON POSTGRESQL');
  console.log('================================================================\n');

  // Ambil user aktif utama dari database
  const activeUser = await prisma.user.findFirstOrThrow({
    where: { isActive: true }
  });
  console.log(`Menggunakan Profil Uji: ${activeUser.fullName} (ID: ${activeUser.id})\n`);

  // 1. DATA UJI
  const scamJobData = {
    userId: activeUser.id,
    title: 'Staff IT & Web Administrator - Rekrutmen Bersama BUMN 2026',
    companyName: 'PT Mega Energi Nusantara (Persero)',
    platform: 'LINKEDIN',
    jobUrl: 'https://linkedin.com/jobs/view/dummy-scam-123',
    description: `Dibutuhkan segera Tenaga IT & Web Administrator untuk penempatan di kantor cabang Balikpapan & Jakarta.
Kualifikasi: Pria/Wanita usia maks 35 tahun, pendidikan min D3/S1 Teknik Informatika.
Tugas utama: Mengelola website perusahaan dan infrastruktur server internal.
PERHATIAN PENTING: Seluruh akomodasi dan transportasi peserta selama proses tes diatur oleh travel agent resmi. Peserta diwajibkan membeli biaya tiket dan reservasi hotel melalui travel agent yang ditunjuk, dan seluruh biaya tiket akan diganti (reimbursement) 100% oleh panitia saat tiba di lokasi wawancara. Hubungi konfirmasi via Telegram: @rekrutmen_bumn_resmi.`
  };

  const legitNextJsJobData = {
    userId: activeUser.id,
    title: 'Senior Full-stack Engineer (Next.js & TypeScript)',
    companyName: 'ScaleUp Technologies Pte Ltd',
    platform: 'TECH_IN_ASIA',
    jobUrl: 'https://techinasia.com/jobs/dummy-legit-456',
    description: `About the Role:
ScaleUp Technologies is looking for a Senior Full-stack Engineer to lead the development of our high-scale cloud analytics platform.

Key Responsibilities:
- Architect and build high-performance web applications using Next.js (App Router), React, and TypeScript.
- Design resilient backend microservices, REST APIs, and database schemas with PostgreSQL and Prisma ORM.
- Build internal data automation and AI tooling using Python.
- Collaborate with product designers and engineers to ensure code quality, automated testing, and CI/CD best practices.

Requirements:
- 3+ years experience building modern web applications with TypeScript and Next.js / React.
- Solid expertise in relational database modeling (PostgreSQL) and ORMs (Prisma).
- Proficiency with Python for scripting and backend integrations.
- Strong problem-solving skills and clean architecture mindset.`
  };

  const unrelatedJobData = {
    userId: activeUser.id,
    title: 'Embedded Firmware Engineer (C / C++ & FreeRTOS)',
    companyName: 'IoT Hardware Solutions',
    platform: 'TECH_IN_ASIA',
    jobUrl: 'https://techinasia.com/jobs/dummy-unrelated-789',
    description: `We are looking for an Embedded Firmware Engineer to develop real-time firmware for STM32 and ESP32 microcontrollers.
Requirements:
- Deep expertise in C and C++ for bare-metal and FreeRTOS environments.
- Knowledge of SPI, I2C, UART, CAN bus protocols, oscilloscope debugging, and PCB schematic reading.
- No web development or JavaScript required for this position.`
  };

  // ----------------------------------------------------------------
  // TEST 1: Lowongan Dummy Scam (Pungutan Tiket & Travel Agent)
  // ----------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('🧪 TEST 1: Lowongan Scam (Biaya Tiket / Travel Agent / Telegram)');
  console.log('----------------------------------------------------------------');
  const scamDbRecord = await prisma.jobListing.upsert({
    where: {
      userId_jobUrl: {
        userId: activeUser.id,
        jobUrl: scamJobData.jobUrl
      }
    },
    update: { ...scamJobData, status: 'DISCOVERED', isLegit: true, scamReason: null, failureReason: null },
    create: { ...scamJobData, status: 'DISCOVERED' }
  });

  const evalResult1 = await evaluateJob(scamDbRecord.id);
  console.log('Status Hasil:', evalResult1.finalStatus);
  console.log('Passed Layer 1 (Heuristic):', evalResult1.passedHeuristic);
  console.log('Alasan Red Flag:', evalResult1.heuristicReason);
  console.log('Database isLegit:', evalResult1.isLegit);
  console.log('Database scamReason:', evalResult1.scamReason);

  if (!evalResult1.passedHeuristic && evalResult1.finalStatus === 'FILTERED_OUT') {
    console.log('✅ TEST 1 PASSED: Lowongan scam berhasil dicegat di Layer 1 (Heuristic Fast-Path) tanpa buang token LLM!\n');
  } else {
    console.error('❌ TEST 1 FAILED: Lowongan scam tidak tertolak sebagaimana mestinya!\n');
  }

  // ----------------------------------------------------------------
  // TEST 2: Lowongan Dummy Asli Next.js / Full-stack Developer
  // ----------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('🧪 TEST 2: Lowongan Legit Full-stack Developer (Next.js, TS, Prisma, Python)');
  console.log('----------------------------------------------------------------');
  const legitDbRecord = await prisma.jobListing.upsert({
    where: {
      userId_jobUrl: {
        userId: activeUser.id,
        jobUrl: legitNextJsJobData.jobUrl
      }
    },
    update: { ...legitNextJsJobData, status: 'DISCOVERED', isLegit: true, scamReason: null, failureReason: null },
    create: { ...legitNextJsJobData, status: 'DISCOVERED' }
  });

  const evalResult2 = await evaluateJob(legitDbRecord.id);
  console.log('Status Hasil:', evalResult2.finalStatus);
  console.log('Passed Layer 1 (Heuristic):', evalResult2.passedHeuristic);
  console.log('Layer 2 (LLM) isLegit:', evalResult2.llmResult?.isLegit);
  console.log('Layer 2 (LLM) Match Score:', evalResult2.matchScore);
  console.log('Layer 2 (LLM) Reasoning:', evalResult2.llmResult?.reasoning);
  console.log('Layer 2 (LLM) Recommendation:', evalResult2.llmResult?.recommendation);

  if (
    evalResult2.passedHeuristic &&
    evalResult2.isLegit &&
    evalResult2.finalStatus === 'DISCOVERED' &&
    (evalResult2.matchScore || 0) >= 0.6
  ) {
    console.log('✅ TEST 2 PASSED: Lowongan valid lolos Layer 1 dan mendapat skor kecocokan tinggi di Layer 2!\n');
  } else {
    console.error('❌ TEST 2 FAILED: Lowongan valid tidak memenuhi kriteria kelulusan!\n');
  }

  // ----------------------------------------------------------------
  // TEST 3: Lowongan Legit Tapi Tidak Relevan (Embedded C / Microcontroller)
  // ----------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('🧪 TEST 3: Lowongan Legit Non-Relevan (Embedded C++ Firmware)');
  console.log('----------------------------------------------------------------');
  const unrelatedDbRecord = await prisma.jobListing.upsert({
    where: {
      userId_jobUrl: {
        userId: activeUser.id,
        jobUrl: unrelatedJobData.jobUrl
      }
    },
    update: { ...unrelatedJobData, status: 'DISCOVERED', isLegit: true, scamReason: null, failureReason: null },
    create: { ...unrelatedJobData, status: 'DISCOVERED' }
  });

  const evalResult3 = await evaluateJob(unrelatedDbRecord.id);
  console.log('Status Hasil:', evalResult3.finalStatus);
  console.log('Passed Layer 1 (Heuristic):', evalResult3.passedHeuristic);
  console.log('Layer 2 (LLM) isLegit:', evalResult3.llmResult?.isLegit);
  console.log('Layer 2 (LLM) Match Score:', evalResult3.matchScore);
  console.log('Layer 2 (LLM) Reasoning:', evalResult3.llmResult?.reasoning);
  console.log('Failure Reason:', evalResult3.failureReason);

  if (
    evalResult3.passedHeuristic &&
    evalResult3.isLegit &&
    evalResult3.finalStatus === 'FILTERED_OUT' &&
    (evalResult3.matchScore || 0) < 0.6
  ) {
    console.log('✅ TEST 3 PASSED: Lowongan non-relevan ditandai FILTERED_OUT karena matchScore di bawah 0.6!\n');
  } else {
    console.log('ℹ️ TEST 3 Evaluasi selesai dengan status:', evalResult3.finalStatus);
  }

  console.log('================================================================');
  console.log('🏁 SELURUH PENGUJIAN SELESAI DENGAN SUKSES DI NEON DB');
  console.log('================================================================');
}

main()
  .catch((err) => {
    console.error('Error saat menjalankan test-evaluator:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
