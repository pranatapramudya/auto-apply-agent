import prisma from '../lib/prisma';
import KalibrrScraper from '../services/scraper/kalibrr-scraper';
import { ingestRawJobs } from '../services/job-ingestion';

async function main() {
  console.log('================================================================');
  console.log('🚀 REAL-TIME JOB INGESTION & DISCOVERY ENGINE (INDONESIA)');
  console.log('================================================================\n');

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' }
  });

  if (users.length === 0) {
    console.log('Tidak ada user aktif.');
    return;
  }

  const scraper = new KalibrrScraper();

  for (const user of users) {
    console.log(`\n================================================================`);
    console.log(`👤 MENGAMBIL LOKER REAL-TIME UNTUK: ${user.fullName}`);
    console.log(`   - Email        : ${user.email}`);
    console.log(`   - Target Roles : ${user.targetRoles}`);
    console.log(`   - Core Skills  : ${user.coreSkills}`);
    console.log(`================================================================`);

    const isPartnerAdmin = user.fullName.toLowerCase().includes('partner') ||
      user.targetRoles.toLowerCase().includes('administrasi');

    let searchKeywords: string[] = [];
    if (isPartnerAdmin) {
      // Jurusan Administrasi Publik & Posisi Terkait
      searchKeywords = [
        'administrasi',
        'general affairs',
        'admin perkantoran',
        'document controller',
        'public relations',
        'operasional kantor',
        'arsip',
        'kebijakan publik'
      ];
    } else {
      // Software Engineering & Tech
      searchKeywords = [
        'fullstack',
        'frontend',
        'backend',
        'developer',
        'next.js',
        'react',
        'typescript',
        'software engineer'
      ];
    }

    console.log(`🔍 Menjalankan scraper real-time dengan kata kunci:`, searchKeywords);

    const rawJobs = await scraper.scrape({
      userId: user.id,
      keywords: searchKeywords,
      limit: 25
    });

    console.log(`📥 Berhasil menarik ${rawJobs.length} lowongan real-time dari Kalibrr.`);

    if (rawJobs.length > 0) {
      console.log(`🔄 Memproses ingestion & evaluasi ke database...`);
      const summary = await ingestRawJobs(user.id, rawJobs);
      console.log(`\n📊 Ringkasan Ingestion untuk ${user.fullName}:`);
      console.log(`   - Total Diperoleh     : ${summary.totalReceived}`);
      console.log(`   - Baru Disimpan ke DB : ${summary.inserted}`);
      console.log(`   - Duplikat Dilewati   : ${summary.skippedDuplicates}`);
      console.log(`   - Lolos Evaluasi (✅)  : ${summary.passedEvaluation}`);
      console.log(`   - Dibuang/Filtered (❌): ${summary.filteredOut}`);
    }
  }

  console.log('\n================================================================');
  console.log('🎉 SELURUH PROSES SCRAPING REAL-TIME SELESAI!');
  console.log('================================================================\n');
}

main()
  .catch((err) => {
    console.error('❌ Terjadi kesalahan fatal:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
