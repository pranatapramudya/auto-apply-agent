import prisma from '../lib/prisma';
import { scrapeSocialMediaJobs } from '../services/social-scraper/social-crawler';

async function testSocial() {
  console.log('📱 Menguji Modul Ekstraksi Loker Media Sosial (Instagram & TikTok)...');

  const user = await prisma.user.findFirst({
    where: { fullName: { contains: 'Pranata', mode: 'insensitive' } }
  });

  if (!user) {
    throw new Error('User Pranata tidak ditemukan');
  }

  const result = await scrapeSocialMediaJobs({
    userId: user.id,
    locationFilter: 'Sumedang'
  });

  console.log('✅ Hasil Ekstraksi:', {
    totalProcessed: result.totalProcessed,
    inserted: result.inserted,
    jobsExtracted: result.jobs.map((j) => ({
      title: j.title,
      company: j.companyName,
      location: j.location,
      email: j.hrdEmail,
      phone: j.hrdPhone,
      legit: j.isLegitimate,
      score: j.matchScore
    }))
  });

  await prisma.$disconnect();
}

testSocial().catch(console.error);
