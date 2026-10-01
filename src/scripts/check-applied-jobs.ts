import prisma from '../lib/prisma';

async function main() {
  const appliedJobs = await prisma.jobListing.findMany({
    where: { status: 'APPLIED' },
    select: {
      id: true,
      title: true,
      companyName: true,
      status: true,
      appliedAt: true,
      failureReason: true,
      user: {
        select: {
          fullName: true,
          email: true
        }
      }
    }
  });

  console.log('Applied jobs in DB:', appliedJobs);
  await prisma.$disconnect();
}

main().catch(console.error);
