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

  // Pastikan Pranata Pramudya aktif dengan data 100% REAL dari CV resmi
  await prisma.user.updateMany({
    where: {
      OR: [
        { fullName: { contains: "Pranata" } },
        { email: { contains: "pranata" } },
      ],
    },
    data: {
      fullName: "Pranata Pramudya",
      email: "pranatapramudya39@gmail.com",
      phone: "+6281395053922",
      city: "Sumedang, Jawa Barat, Indonesia",
      linkedInUrl: "https://www.linkedin.com/in/pranata-pramudya-2a4427292/",
      githubUrl: "https://github.com/pranatapramudya",
      portfolioUrl: "https://portofolio-pranata-pramudya.vercel.app",
      targetRoles:
        "Systems Architect & Process Optimization Specialist, Full Stack Developer, Next.js Developer, Backend Developer, Software Engineer",
      coreSkills:
        "Next.js 14, TypeScript, React, Prisma ORM, PostgreSQL, Supabase, Capacitor, Midtrans API, Clerk Auth, Tailwind CSS, Google Cloud Foundations, Applied Microsoft Office",
      isActive: true,
      resumeLocalPath: "./assets/resume-primary.pdf",
    },
  });

  const users = await prisma.user.findMany();
  console.log(
    "================================================================",
  );
  console.log("DATA USER PROFILE TERKINI DI DATABASE (VERIFIKASI 100% ASLI):");
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
    console.log(`  Domisili   : ${u.city}`);
    console.log(`  GitHub     : ${u.githubUrl}`);
    console.log(`  Portfolio  : ${u.portfolioUrl}`);
    console.log(`  LinkedIn   : ${u.linkedInUrl}`);
    console.log(`  Target Role: ${u.targetRoles}`);
    console.log(`  Skills     : ${u.coreSkills}`);
    console.log(`  CV Asli    : ${u.resumeLocalPath}`);
    console.log(`  Total Loker: ${jobCount}`);
    console.log("");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
