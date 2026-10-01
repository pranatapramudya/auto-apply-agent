import prisma from '../lib/prisma';
import PlaywrightApplyEngine from '../services/action/apply-engine';

const DAILY_QUOTA_CAP = 10;

async function main() {
  console.log('================================================================');
  console.log('⚡ AUTONOMOUS AUTO-APPLY ACTION ENGINE RUNNER (FASE 5)');
  console.log('================================================================\n');

  // 1. SAFETY KILLSWITCH & DEFAULT DRY-RUN
  // Live Submit HANYA aktif jika KEDUA syarat terpenuhi:
  // - Flag CLI: --production-submit
  // - Variabel Lingkungan: ALLOW_LIVE_APPLY=true di .env
  const isProductionSubmitFlag = process.argv.includes('--production-submit');
  const envAllowsLive = process.env.ALLOW_LIVE_APPLY === 'true';
  const isDryRun = !(isProductionSubmitFlag && envAllowsLive);

  const targetUserIdArg = process.argv.find((arg) => arg.startsWith('--user='))?.split('=')[1];
  const limitArg = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1]) || 1;

  console.log(`Pengaturan Eksekusi:`);
  console.log(`- Status Keamanan   : ${isDryRun ? '🛡️ STRICT DRY-RUN (BAWAAN: Tidak klik submit akhir)' : '🚨 LIVE SUBMIT DIAKTIFKAN'}`);
  if (isProductionSubmitFlag && !envAllowsLive) {
    console.warn(`⚠️ [KILLSWITCH ALERT] Flag --production-submit terdeteksi, tetapi ALLOW_LIVE_APPLY != "true" di .env.`);
    console.warn(`   Sistem memaksakan DRY-RUN demi perlindungan human-in-the-loop.`);
  } else if (!isProductionSubmitFlag) {
    console.log(`ℹ️ Untuk submit live, jalankan dengan flag --production-submit dan set ALLOW_LIVE_APPLY=true di .env.`);
  }
  console.log(`- Maksimal Diproses : ${limitArg} lowongan`);
  console.log(`- Daily Quota Cap   : Maksimal ${DAILY_QUOTA_CAP} per user/hari\n`);

  // 2. Ambil User yang akan diproses (Utamakan User 1: Pranata Pramudya jika tidak ada spesifikasi)
  const user = targetUserIdArg
    ? await prisma.user.findUnique({ where: { id: targetUserIdArg } })
    : await prisma.user.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });

  if (!user) {
    throw new Error('User aktif tidak ditemukan di database.');
  }

  // Pre-flight check ukuran resume
  const path = await import('path');
  const fs = await import('fs');
  const absoluteResumePath = path.resolve(process.cwd(), user.resumeLocalPath);
  const resumeExists = fs.existsSync(absoluteResumePath);
  const resumeSize = resumeExists ? fs.statSync(absoluteResumePath).size : 0;
  const MIN_RESUME_SIZE = 10 * 1024; // 10KB

  console.log(`👤 User Terpilih: ${user.fullName} (${user.email})`);
  console.log(`   - Target Roles : ${user.targetRoles}`);
  console.log(`   - Core Skills  : ${user.coreSkills}`);
  console.log(`   - File Resume  : ${user.resumeLocalPath} (${(resumeSize / 1024).toFixed(2)} KB)`);

  if (!resumeExists || resumeSize < MIN_RESUME_SIZE) {
    if (!isDryRun) {
      console.error(`\n❌ [PRE-FLIGHT BLOCKED] Ukuran file resume (${user.resumeLocalPath}) hanya ${resumeSize} bytes (< 10KB).`);
      console.error(`   Sistem menolak submit live karena file CV masih berupa dummy/placeholder.`);
      console.error(`   Harap timpa file "${user.resumeLocalPath}" dengan PDF CV asli Anda terlebih dahulu.`);
      return;
    } else {
      console.warn(`\n⚠️ [PRE-FLIGHT WARNING] Resume terdeteksi dummy (${resumeSize} bytes). Melanjutkan simulasi pengisian dry-run.`);
    }
  }
  console.log('');

  // 2. Cek Kuota Harian: Hitung berapa lamaran yang sudah disubmit hari ini
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const appliedTodayCount = await prisma.jobListing.count({
    where: {
      userId: user.id,
      status: 'APPLIED',
      appliedAt: { gte: startOfDay }
    }
  });

  console.log(`📊 Kuota Harian Terpakai: ${appliedTodayCount} / ${DAILY_QUOTA_CAP}`);

  if (appliedTodayCount >= DAILY_QUOTA_CAP) {
    console.log('🛑 Kuota harian lamaran tercapai untuk user ini. Menunda eksekusi.');
    return;
  }

  const remainingQuota = Math.min(limitArg, DAILY_QUOTA_CAP - appliedTodayCount);

  // 3. Ambil Antrean Lowongan: PRIORITASKAN lowongan yang disetujui user (QUEUED_FOR_APPLY)
  let candidateJobs = await prisma.jobListing.findMany({
    where: {
      userId: user.id,
      status: 'QUEUED_FOR_APPLY'
    },
    orderBy: [
      { matchScore: 'desc' },
      { createdAt: 'desc' }
    ],
    take: remainingQuota
  });

  if (candidateJobs.length > 0) {
    console.log(`🎯 Ditemukan ${candidateJobs.length} lowongan dalam antrean persetujuan dashboard (QUEUED_FOR_APPLY)!`);
  } else {
    console.log('ℹ️ Tidak ada antrean manual (QUEUED_FOR_APPLY). Mengecek lowongan DISCOVERED dengan skor relevansi tinggi...');
    candidateJobs = await prisma.jobListing.findMany({
      where: {
        userId: user.id,
        status: 'DISCOVERED',
        matchScore: { gte: 0.7 }
      },
      orderBy: { matchScore: 'desc' },
      take: remainingQuota
    });
  }

  if (candidateJobs.length === 0) {
    console.log('ℹ️ Tidak ada lowongan yang siap diproses saat ini.');
    return;
  }

  console.log(`Total ${candidateJobs.length} lowongan siap diproses:\n`);
  for (let i = 0; i < candidateJobs.length; i++) {
    const j = candidateJobs[i];
    console.log(`[${i + 1}] ${j.title} @ ${j.companyName}`);
    console.log(`    Score: ${j.matchScore?.toFixed(2)} | URL: ${j.jobUrl}`);
  }
  console.log('');

  const engine = new PlaywrightApplyEngine();
  const summary = [];

  for (const job of candidateJobs) {
    console.log('----------------------------------------------------------------');
    console.log(`🚀 Memproses Pelamaran ID: ${job.id}`);
    console.log(`   Posisi: ${job.title} @ ${job.companyName}`);
    console.log('----------------------------------------------------------------');

    // Update status awal ke APPLYING
    if (!isDryRun) {
      await prisma.jobListing.update({
        where: { id: job.id },
        data: { status: 'APPLYING' }
      });
    }

    const applyResult = await engine.applyToJob(
      {
        id: job.id,
        title: job.title,
        companyName: job.companyName,
        jobUrl: job.jobUrl,
        description: job.description
      },
      user,
      { dryRun: isDryRun, headless: true }
    );

    // Update status akhir pada database
    if (applyResult.success) {
      if (!isDryRun) {
        await prisma.jobListing.update({
          where: { id: job.id },
          data: {
            status: 'APPLIED',
            appliedAt: applyResult.appliedAt || new Date(),
            failureReason: null
          }
        });
        console.log(`\n🎉 STATUS DATABASE DIPERBARUI: APPLIED`);
      } else {
        console.log(`\n🔎 HASIL DRY-RUN: Form terisi (${applyResult.fieldsFilled} field) tanpa klik submit.`);
        console.log(`   Status di DB dipertahankan: DISCOVERED`);
      }
    } else {
      await prisma.jobListing.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          failureReason: applyResult.error || 'Gagal mengisi formulir'
        }
      });
      console.log(`\n⚠️ STATUS DATABASE DIPERBARUI: FAILED`);
    }

    summary.push({
      jobTitle: job.title,
      company: job.companyName,
      success: applyResult.success,
      dryRun: applyResult.dryRun,
      screenshot: applyResult.screenshotPath,
      fieldsFilled: applyResult.fieldsFilled,
      error: applyResult.error
    });
  }

  // REKAPITULASI
  console.log('\n================================================================');
  console.log('📋 REKAPITULASI RUN-APPLY ENGINE');
  console.log('================================================================');
  for (const item of summary) {
    console.log(`- ${item.jobTitle} @ ${item.company}`);
    console.log(`  * Sukses      : ${item.success}`);
    console.log(`  * Mode        : ${item.dryRun ? 'DRY-RUN' : 'LIVE'}`);
    console.log(`  * Field Terisi: ${item.fieldsFilled}`);
    if (item.screenshot) console.log(`  * Bukti Gambar: ${item.screenshot}`);
    if (item.error) console.log(`  * Error       : ${item.error}`);
  }
  console.log('================================================================\n');
}

main()
  .catch((err) => {
    console.error('❌ Error fatal pada run-apply:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
