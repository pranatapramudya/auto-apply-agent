import prisma from '../lib/prisma';

async function checkJobs() {
  const jobs = await prisma.jobListing.findMany({
    select: {
      id: true,
      title: true,
      companyName: true,
      location: true,
      status: true,
    }
  });

  console.log(`Total jobs in DB: ${jobs.length}`);
  const sumedang = jobs.filter(j => (j.location || '').toLowerCase().includes('sumedang'));
  const bandung = jobs.filter(j => (j.location || '').toLowerCase().includes('bandung'));
  const remote = jobs.filter(j => (j.location || '').toLowerCase().includes('remote'));
  
  console.log(`Sumedang jobs: ${sumedang.length}`);
  console.log(`Bandung jobs: ${bandung.length}`);
  console.log(`Remote jobs: ${remote.length}`);

  console.log('\nSample Bandung / Sumedang jobs:');
  [...sumedang, ...bandung].forEach(j => {
    console.log(`- [${j.companyName}] ${j.title} | ${j.location}`);
  });

  await prisma.$disconnect();
}

checkJobs().catch(console.error);
