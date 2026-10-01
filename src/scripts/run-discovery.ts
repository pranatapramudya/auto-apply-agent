import prisma from '../lib/prisma';
import AggregatorJobScraper from '../services/scraper/aggregator';
import { ingestRawJobs } from '../services/job-ingestion';

async function main() {
  console.log('================================================================');
  console.log('🤖 AUTONOMOUS JOB DISCOVERY & MULTI-PLATFORM SCRAPER (FASE 4)');
  console.log('================================================================\n');

  // Cek apakah ada argumen spesifik userId di CLI (misal: npx tsx src/scripts/run-discovery.ts <userId>)
  const targetUserIdArg = process.argv[2];

  let usersToProcess = [];

  if (targetUserIdArg) {
    console.log(`Target spesifik User ID diberikan: ${targetUserIdArg}`);
    const user = await prisma.user.findUnique({
      where: { id: targetUserIdArg }
    });
    if (!user) {
      throw new Error(`User dengan ID "${targetUserIdArg}" tidak ditemukan.`);
    }
    usersToProcess.push(user);
  } else {
    // Ambil seluruh user aktif dari database
    usersToProcess = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });
  }

  if (usersToProcess.length === 0) {
    console.log('Tidak ada user aktif yang ditemukan untuk diproses.');
    return;
  }

  console.log(`Ditemukan ${usersToProcess.length} user aktif untuk diproses.\n`);

  const scraper = new AggregatorJobScraper();
  const overallSummary = [];

  for (const user of usersToProcess) {
    console.log('================================================================');
    console.log(`👤 MEMPROSES PROFIL: ${user.fullName}`);
    console.log(`   - Email        : ${user.email}`);
    console.log(`   - Target Roles : ${user.targetRoles}`);
    console.log(`   - Core Skills  : ${user.coreSkills}`);
    console.log('================================================================');

    // Tentukan query pencarian berdasarkan target role user
    const rolesList = user.targetRoles.split(',').map((r) => r.trim()).filter(Boolean);
    const searchKeyword = rolesList.length > 0 ? rolesList[0] : 'Software Engineer';

    console.log(`\n🔍 Menjalankan scraper untuk query: "${searchKeyword}" (Maks 5 lowongan)...`);

    // Jalankan Playwright Scraper (dibatasi 3-5 lowongan uji coba sesuai instruksi)
    const rawJobs = await scraper.scrape({
      userId: user.id,
      keywords: [searchKeyword, ...rolesList],
      limit: 5
    });

    console.log(`📥 Total lowongan berhasil ditarik: ${rawJobs.length}`);

    // Salurkan ke Pipeline Ingestion & Evaluator
    const ingestionResult = await ingestRawJobs(user.id, rawJobs);
    overallSummary.push({
      userName: user.fullName,
      result: ingestionResult
    });
  }

  // REKAPITULASI AKHIR
  console.log('================================================================');
  console.log('📊 REKAPITULASI JOB DISCOVERY & INGESTION');
  console.log('================================================================');

  for (const item of overallSummary) {
    console.log(`\n👤 User: ${item.userName}`);
    console.log(`   - Lowongan di-crawl  : ${item.result.totalReceived}`);
    console.log(`   - Lowongan baru (DB) : ${item.result.inserted}`);
    console.log(`   - Duplikat dilewati  : ${item.result.skippedDuplicates}`);
    console.log(`   - Lolos Evaluasi (✅): ${item.result.passedEvaluation}`);
    console.log(`   - Dibuang/Filtered (❌): ${item.result.filteredOut}`);

    if (item.result.details.length > 0) {
      console.log('\n   Detail Lowongan Baru:');
      for (const d of item.result.details) {
        console.log(`   * [${d.status}] ${d.title} @ ${d.companyName}`);
        console.log(`     Link: ${d.jobUrl}`);
        if (d.matchScore !== null) console.log(`     Match Score: ${d.matchScore.toFixed(2)}`);
        if (d.reason) console.log(`     Alasan: ${d.reason}`);
      }
    }
  }

  console.log('\n================================================================');
  console.log('🏁 RUNNER DISCOVERY SELESAI');
  console.log('================================================================\n');
}

main()
  .catch((err) => {
    console.error('❌ Error pada run-discovery runner:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
