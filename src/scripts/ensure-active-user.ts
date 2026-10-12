import prisma from "../lib/prisma";

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

  // Pastikan Pranata Pramudya aktif
  await prisma.user.updateMany({
    where: {
      OR: [
        { fullName: { contains: "Pranata" } },
        { email: { contains: "pranata" } },
      ],
    },
    data: {
      fullName: "Pranata Pramudya",
      isActive: true,
      resumeLocalPath: "./assets/resume-primary.pdf",
    },
  });

  const users = await prisma.user.findMany();
  console.log(
    "================================================================",
  );
  console.log("STATUS PROFIL DATABASE:");
  console.log(
    "================================================================",
  );
  for (const u of users) {
    const jobCount = await prisma.jobListing.count({ where: { userId: u.id } });
    console.log(
      `- [${u.isActive ? "AKTIF" : "NON-AKTIF (OFF)"}] ${u.fullName} (${u.email})`,
    );
    console.log(`  ID: ${u.id}`);
    console.log(`  Resume: ${u.resumeLocalPath}`);
    console.log(`  Total Lowongan Terdaftar: ${jobCount}`);
    console.log("");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
