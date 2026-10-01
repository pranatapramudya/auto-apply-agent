import prisma from '../lib/prisma';
import KalibrrScraper from '../services/scraper/kalibrr-scraper';
import { ingestRawJobs } from '../services/job-ingestion';

async function main() {
  console.log('🚀 CRAWLING LOKER REAL-TIME FOKUS: ADMINISTRASI PERKANTORAN & GENERAL AFFAIRS');
  
  const partnerUser = await prisma.user.findFirst({
    where: {
      OR: [
        { fullName: { contains: 'Partner', mode: 'insensitive' } },
        { targetRoles: { contains: 'Administrasi', mode: 'insensitive' } }
      ]
    }
  });

  if (!partnerUser) {
    console.error('Partner user tidak ditemukan.');
    return;
  }

  const targetedKeywords = [
    'admin perkantoran',
    'general affairs',
    'document controller',
    'public relations',
    'kebijakan publik'
  ];

  const scraper = new KalibrrScraper();
  const rawJobs = await scraper.scrape({
    userId: partnerUser.id,
    keywords: targetedKeywords,
    limit: 25
  });

  console.log(`Berhasil menarik ${rawJobs.length} lowongan spesifik dari Kalibrr.`);
  if (rawJobs.length > 0) {
    const summary = await ingestRawJobs(partnerUser.id, rawJobs);
    console.log(`Selesai! Lolos: ${summary.passedEvaluation}, Dibuang: ${summary.filteredOut}, Masuk DB: ${summary.inserted}`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
