import prisma from "../lib/prisma";
import fs from "fs";
import path from "path";
import { config } from "../config/env";

async function main() {
  console.log(
    "================================================================",
  );
  console.log("MEMULAI SEEDING DATA USER MULTI-PROFIL KE NEON DB");
  console.log(
    "================================================================\n",
  );

  const assetsDir = path.resolve(process.cwd(), "assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const primaryResumePath = "./assets/resume-primary.pdf";
  const partnerResumePath = "./assets/resume-partner.pdf";

  // 1. Profil Utama (Pranata Pramudya - AKTIF)
  const primaryUserData = {
    fullName: config.applicant.fullName,
    email: config.applicant.email,
    phone: config.applicant.phone,
    city: config.applicant.city,
    linkedInUrl: config.applicant.linkedInUrl,
    githubUrl: config.applicant.githubUrl,
    portfolioUrl: config.applicant.portfolioUrl,
    resumeLocalPath: primaryResumePath,
    targetRoles:
      "Full-stack Developer, Next.js Developer, Backend Developer, Software Engineer",
    coreSkills:
      "Next.js, TypeScript, React, Prisma, PostgreSQL, Python, Node.js",
    expectedSalary: 15000000,
    isActive: true, // AKTIF UNTUK AUTO-APPLY
  };

  // 2. Profil Pasangan (Siti Fathonah - NON-AKTIF SEPERTI PERMINTAAN USER)
  const partnerUserData = {
    fullName: "Siti Fathonah",
    email: "partner.applicant@example.com",
    phone: "+6289876543210",
    city: "Sumedang / Bandung, Indonesia",
    linkedInUrl: "https://linkedin.com/in/siti-fathonah",
    githubUrl: "https://github.com/siti-fathonah",
    portfolioUrl: "https://partner.dev",
    resumeLocalPath: partnerResumePath,
    targetRoles:
      "Staff Administrasi Publik, Policy Analyst, General Affairs, Document Controller",
    coreSkills:
      "Administrasi Perkantoran, Manajemen Dokumen, Microsoft Excel, Kearsipan Digital",
    expectedSalary: 8500000,
    isActive: false, // NON-AKTIF: JANGAN DIJALANKAN DULU
  };

  console.log("Upserting Profil Utama (Pranata Pramudya)...");
  const primaryUser = await prisma.user.upsert({
    where: { email: primaryUserData.email },
    update: primaryUserData,
    create: primaryUserData,
  });

  console.log("Upserting Profil Pasangan (Siti Fathonah - INACTIVE)...");
  const partnerUser = await prisma.user.upsert({
    where: { email: partnerUserData.email },
    update: partnerUserData,
    create: partnerUserData,
  });

  console.log(
    "\n----------------------------------------------------------------",
  );
  console.log("SEEDING SELESAI:");
  console.log(
    "----------------------------------------------------------------",
  );
  console.log(`User 1 (Pranata Pramudya):`);
  console.log(`   - ID         : ${primaryUser.id}`);
  console.log(`   - Nama       : ${primaryUser.fullName}`);
  console.log(`   - Email      : ${primaryUser.email}`);
  console.log(
    `   - Status     : ${primaryUser.isActive ? "AKTIF (SIAP RUNNING)" : "NON-AKTIF"}`,
  );
  console.log("");
  console.log(`User 2 (Siti Fathonah):`);
  console.log(`   - ID         : ${partnerUser.id}`);
  console.log(`   - Nama       : ${partnerUser.fullName}`);
  console.log(`   - Email      : ${partnerUser.email}`);
  console.log(
    `   - Status     : ${partnerUser.isActive ? "AKTIF" : "NON-AKTIF (HOLD / DILEWATI)"}`,
  );
  console.log(
    "----------------------------------------------------------------\n",
  );
}

main()
  .catch((err) => {
    console.error("Terjadi error saat seeding users:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
