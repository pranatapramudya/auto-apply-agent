import prisma from "../lib/prisma";
import { config } from "../config/env";

async function main() {
  // Pastikan Siti Fathonah non-aktif
  await prisma.user.updateMany({
    where: {
      OR: [
        { fullName: { contains: "Siti" } },
        { fullName: { contains: "Partner" } },
        { email: { contains: "partner" } },
      ],
    },
    data: {
      fullName: "Siti Fathonah",
      isActive: false,
    },
  });

  // Pastikan Pranata Pramudya aktif dengan data terbaru dari config
  await prisma.user.updateMany({
    where: {
      OR: [
        { fullName: { contains: "Pranata" } },
        { email: { contains: "pranata" } },
      ],
    },
    data: {
      fullName: config.applicant.fullName,
      email: config.applicant.email,
      phone: config.applicant.phone,
      city: config.applicant.city,
      linkedInUrl: config.applicant.linkedInUrl,
      githubUrl: config.applicant.githubUrl,
      portfolioUrl: config.applicant.portfolioUrl,
      isActive: true,
      resumeLocalPath: "./assets/resume-primary.pdf",
    },
  });

  const users = await prisma.user.findMany();
  console.log(
    "================================================================",
  );
  console.log("DATA USER PROFILE TERKINI DI DATABASE:");
  console.log(
    "================================================================",
  );
  for (const u of users) {
    const jobCount = await prisma.jobListing.count({ where: { userId: u.id } });
    console.log(
      `- [${u.isActive ? "AKTIF" : "NON-AKTIF (OFF)"}] ${u.fullName}`,
    );
    console.log(`  ID         : ${u.id}`);
    console.log(`  Email      : ${u.email}`);
    console.log(`  Phone / WA : ${u.phone}`);
    console.log(`  GitHub     : ${u.githubUrl}`);
    console.log(`  LinkedIn   : ${u.linkedInUrl}`);
    console.log(`  Portfolio  : ${u.portfolioUrl}`);
    console.log(`  Resume     : ${u.resumeLocalPath}`);
    console.log(`  Total Loker: ${jobCount}`);
    console.log("");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
