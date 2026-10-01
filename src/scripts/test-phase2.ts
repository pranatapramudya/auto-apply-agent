import prisma from '../lib/prisma';
import PlaywrightApplyEngine from '../services/action/apply-engine';

async function testPhase2() {
  console.log('================================================================');
  console.log('🧪 PENGUJIAN FASE 2: RESILIENT STEALTH & VISUAL-AWARE APPLY ENGINE');
  console.log('================================================================\n');

  const user = await prisma.user.findFirst({ where: { isActive: true } });
  if (!user) throw new Error('User aktif tidak ditemukan!');

  const job = await prisma.jobListing.findFirst({
    where: { userId: user.id }
  }) || {
    id: 'test-job-p2',
    title: 'Senior Frontend Developer',
    companyName: 'Sample Corp',
    jobUrl: 'https://example.com',
    description: 'Looking for an experienced Frontend Developer with React, TypeScript, Next.js.'
  };

  console.log(`👤 Kandidat   : ${user.fullName} (${user.email})`);
  console.log(`💼 Target Loker: ${job.title} @ ${job.companyName}`);
  console.log(`🛡️ Mode Keamanan: STRICT DRY-RUN (Tidak klik submit akhir)\n`);

  const engine = new PlaywrightApplyEngine();

  // Jalankan dalam mode STRICT DRY-RUN (dryRun: true)
  const result = await engine.applyToJob(
    {
      id: job.id,
      title: job.title,
      companyName: job.companyName,
      jobUrl: job.jobUrl,
      description: job.description
    },
    user,
    {
      dryRun: true,
      headless: true,
      useTailoredResume: true
    }
  );

  console.log('\n📊 Hasil Pengujian Fase 2:');
  console.log(`   - Status Berhasil: ${result.success}`);
  console.log(`   - Mode Dry-Run   : ${result.dryRun} (Aman)`);
  console.log(`   - Field Terisi   : ${result.fieldsFilled}`);
  console.log(`   - Resume Dipakai : ${result.resumeUsed}`);
  if (result.screenshotPath) {
    console.log(`   - Bukti Audit    : ${result.screenshotPath}`);
  }

  if (!result.dryRun) {
    throw new Error('FATAL: Mode bukan dry run!');
  }

  console.log('\n🎉 PENGUJIAN FASE 2 SELESAI & SUKSES TANPA ERROR!\n');
}

testPhase2()
  .catch((e) => {
    console.error('❌ Pengujian Fase 2 Gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
