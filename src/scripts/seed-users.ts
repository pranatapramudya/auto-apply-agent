import prisma from "../lib/prisma";
import fs from "fs";
import path from "path";

import { config } from "../config/env";

async function main() {
  console.log(
    "================================================================",
  );
  console.log("🌱 MEMULAI SEEDING DATA USER MULTI-PROFIL KE NEON DB");
  console.log(
    "================================================================\n",
  );

  // Pastikan folder assets dan file resume placeholder tersedia
  const assetsDir = path.resolve(process.cwd(), "assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const primaryResumePath = "./assets/resume-primary.pdf";
  const partnerResumePath = "./assets/resume-partner.pdf";

  if (!fs.existsSync(path.resolve(process.cwd(), primaryResumePath))) {
    fs.writeFileSync(
      path.resolve(process.cwd(), primaryResumePath),
      "%PDF-1.4\n%EOF",
    );
  }

  if (!fs.existsSync(path.resolve(process.cwd(), partnerResumePath))) {
    fs.writeFileSync(
      path.resolve(process.cwd(), partnerResumePath),
      "%PDF-1.4\n%EOF",
    );
  }

  // 1. Profil Utama (Pranata Pramudya)
  const primaryUserData = {
    fullName: config.applicant.fullName,
    email: config.applicant.email,
    phone: config.applicant.phone,
    city: config.applicant.city,
    linkedInUrl: config.applicant.linkedInUrl,
    githubUrl: config.applicant.githubUrl,
    portfolioUrl: config.applicant.portfolioUrl,
    resumeLocalPath: primaryResumePath,
    targetRoles: "Full-stack Developer, Next.js Developer, Backend Developer",
    coreSkills: "Next.js, TypeScript, Prisma, PostgreSQL, Python",
    expectedSalary: 20000000,
    isActive: true,
  };

  // 2. Profil Pasangan (Placeholder yang mudah dikustomisasi)
  const partnerUserData = {
    fullName: "Partner Profile (Placeholder)",
    email: "partner.applicant@example.com",
    phone: "+6289876543210",
    city: "Jakarta",
    linkedInUrl: "https://linkedin.com/in/partner-placeholder",
    githubUrl: "https://github.com/partner-placeholder",
    portfolioUrl: "https://partner.dev",
    resumeLocalPath: partnerResumePath,
    targetRoles: "Frontend Developer, UI/UX Engineer, Web Developer",
    coreSkills: "React, TypeScript, CSS, TailwindCSS, Next.js, Figma",
    expectedSalary: 15000000,
    isActive: true,
  };

  console.log("Upserting Profil Utama...");
  const primaryUser = await prisma.user.upsert({
    where: { email: primaryUserData.email },
    update: primaryUserData,
    create: primaryUserData,
  });

  console.log("Upserting Profil Pasangan...");
  const partnerUser = await prisma.user.upsert({
    where: { email: partnerUserData.email },
    update: partnerUserData,
    create: partnerUserData,
  });

  console.log(
    "\n----------------------------------------------------------------",
  );
  console.log("✅ SEEDING BERHASIL! DETAIL PROFIL AKTIF:");
  console.log(
    "----------------------------------------------------------------",
  );
  console.log(`👤 User 1 (Profil Utama):`);
  console.log(`   - ID         : ${primaryUser.id}`);
  console.log(`   - Nama       : ${primaryUser.fullName}`);
  console.log(`   - Email      : ${primaryUser.email}`);
  console.log(`   - Roles      : ${primaryUser.targetRoles}`);
  console.log(`   - Skills     : ${primaryUser.coreSkills}`);
  console.log(`   - Resume     : ${primaryUser.resumeLocalPath}`);
  console.log(`   - Aktif      : ${primaryUser.isActive}`);
  console.log("");
  console.log(`👤 User 2 (Profil Pasangan):`);
  console.log(`   - ID         : ${partnerUser.id}`);
  console.log(`   - Nama       : ${partnerUser.fullName}`);
  console.log(`   - Email      : ${partnerUser.email}`);
  console.log(`   - Roles      : ${partnerUser.targetRoles}`);
  console.log(`   - Skills     : ${partnerUser.coreSkills}`);
  console.log(`   - Resume     : ${partnerUser.resumeLocalPath}`);
  console.log(`   - Aktif      : ${partnerUser.isActive}`);
  console.log(
    "----------------------------------------------------------------\n",
  );
}

main()
  .catch((err) => {
    console.error("❌ Terjadi error saat seeding users:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
