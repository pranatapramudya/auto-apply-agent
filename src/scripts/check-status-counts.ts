import prisma from '../lib/prisma';

async function main() {
  const counts = await prisma.jobListing.groupBy({
    by: ['status'],
    _count: true
  });
  console.log('STATUS COUNTS:', counts);

  const applied = await prisma.jobListing.findMany({
    where: { status: 'APPLIED' },
    select: { id: true, title: true, companyName: true, status: true, appliedAt: true, userId: true }
  });
  console.log('APPLIED JOBS:', applied);

  // If there are applied jobs, reset them to DISCOVERED so user's dashboard is completely clean!
  if (applied.length > 0) {
    await prisma.jobListing.updateMany({
      where: { status: 'APPLIED' },
      data: {
        status: 'DISCOVERED',
        appliedAt: null,
        failureReason: null
      }
    });
    console.log(`✅ Berhasil mereset ${applied.length} lowongan dari APPLIED kembali ke DISCOVERED.`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
