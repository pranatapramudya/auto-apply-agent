import prisma from "../lib/prisma";
import { config } from "../config/env";
import { generateCoverLetter } from "../services/email/cover-letter-generator";
import { dispatchApplicationEmail } from "../services/email/email-dispatcher";
import { extractContactRegex } from "../services/social-scraper/social-post-extractor";
import path from "path";

interface RunEmailApplyOptions {
  userId?: string;
  limit?: number;
  isLive?: boolean;
}

export async function runEmailApply(options: RunEmailApplyOptions = {}) {
  console.log(
    "================================================================",
  );
  console.log("⚡ DIRECT-TO-HRD EMAIL AUTO-APPLY ENGINE");
  console.log(
    "================================================================\n",
  );

  const isLive =
    options.isLive ??
    (config.app.allowLiveApply ||
      process.argv.includes("--live") ||
      process.argv.includes("--production-submit"));
  const limit = options.limit ?? 5;

  console.log(
    `- Mode Eksekusi : ${isLive ? "🚀 LIVE SEND (Email Dikirim Nyata via Gmail)" : "🛡️ DRY-RUN (Simulasi Tanpa Kirim)"}`,
  );
  console.log(`- Maksimal Email: ${limit} lowongan per siklus\n`);

  // 1. Tentukan user target
  const targetUserId =
    options.userId ||
    process.argv.find((a) => a.startsWith("--user="))?.split("=")[1] ||
    "41dbb7bd-8638-4fa7-80d7-dc968c6ad278";

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user) {
    throw new Error(`User ID ${targetUserId} tidak ditemukan di database.`);
  }

  if (!user.isActive) {
    console.log(
      `User ${user.fullName} berstatus NON-AKTIF. Pengiriman dibatalkan.`,
    );
    return;
  }

  console.log(`👤 Pelamar: ${user.fullName} (${user.email})`);
  console.log(`   - Kontak: ${user.phone}`);
  console.log(`   - Portofolio: ${user.portfolioUrl}`);
  console.log(`   - Resume PDF: ./assets/resume-primary.pdf\n`);

  // 2. Cari lowongan yang memiliki kontak email HRD dan belum pernah di-apply
  const candidateJobs = await prisma.jobListing.findMany({
    where: {
      userId: user.id,
      status: { in: ["DISCOVERED", "QUEUED_FOR_APPLY"] },
      matchScore: { gte: 0.6 },
    },
    orderBy: { matchScore: "desc" },
    take: 20,
  });

  const jobsWithEmail: Array<{
    job: (typeof candidateJobs)[0];
    hrdEmail: string;
  }> = [];

  for (const job of candidateJobs) {
    let targetEmail: string | undefined;

    const emailPrefixMatch = job.description?.match(
      /Email HRD:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    );
    if (emailPrefixMatch) {
      targetEmail = emailPrefixMatch[1];
    } else if (job.description) {
      const regexRes = extractContactRegex(job.description);
      targetEmail = regexRes.email;
    }

    if (
      targetEmail &&
      !targetEmail.includes("example.com") &&
      !targetEmail.includes("undefined")
    ) {
      jobsWithEmail.push({ job, hrdEmail: targetEmail });
    }
  }

  console.log(
    `🎯 Ditemukan ${jobsWithEmail.length} lowongan bereputasi valid dengan email HRD.`,
  );

  if (jobsWithEmail.length === 0) {
    console.log(
      "Tidak ada antrean email HRD baru yang memenuhi syarat. Siklus selesai.",
    );
    return;
  }

  const toProcess = jobsWithEmail.slice(0, limit);
  let processedCount = 0;
  let successCount = 0;

  for (const { job, hrdEmail } of toProcess) {
    processedCount++;
    console.log(
      `\n----------------------------------------------------------------`,
    );
    console.log(
      `[${processedCount}/${toProcess.length}] Memproses: ${job.title} @ ${job.companyName}`,
    );
    console.log(`- Email HRD : ${hrdEmail}`);
    console.log(`- Skor Match: ${job.matchScore}`);
    console.log(`- Lokasi    : ${job.location || "Indonesia"}`);

    try {
      // Generate Cover Letter AI personal
      console.log("🤖 Menyusun Surat Lamaran AI personal via Groq...");
      const coverLetter = await generateCoverLetter({
        candidateName: user.fullName,
        candidateEmail: user.email,
        candidatePhone: user.phone || "+6281395053922",
        candidateCity: user.city || "Sumedang, Jawa Barat",
        candidateRoles: user.targetRoles,
        candidateSkills: user.coreSkills,
        portfolioUrl:
          user.portfolioUrl || "https://portofolio-pranata-pramudya.vercel.app",
        linkedInUrl:
          user.linkedInUrl ||
          "https://www.linkedin.com/in/pranata-pramudya-2a4427292/",
        jobTitle: job.title,
        companyName: job.companyName,
        jobDescription: job.description || "",
      });

      console.log(`✅ Subjek: ${coverLetter.subject}`);

      // Dispatch Email (Fix: coverLetter.body is the actual text)
      const result = await dispatchApplicationEmail({
        toEmail: hrdEmail,
        candidateName: user.fullName,
        candidateEmail: user.email,
        subject: coverLetter.subject,
        bodyText: coverLetter.body,
        resumePdfPath: path.resolve(process.cwd(), "assets/resume-primary.pdf"),
        companyName: job.companyName,
        isDryRun: !isLive,
      });

      if (result.success) {
        successCount++;
        if (isLive) {
          await prisma.jobListing.update({
            where: { id: job.id },
            data: {
              status: "APPLIED",
              updatedAt: new Date(),
            },
          });
          console.log(
            `🎉 [SUKSES TERKIRIM] Status di Database diperbarui ke: APPLIED`,
          );
        } else {
          console.log(
            `🛡️ [DRY-RUN] Simulasi berhasil. Status di DB dipertahankan.`,
          );
        }
      }
    } catch (err: any) {
      console.error(`❌ Gagal memproses lowongan ${job.title}:`, err.message);
    }
  }

  console.log(
    "\n================================================================",
  );
  console.log("📊 REKAPITULASI DIRECT EMAIL APPLIER");
  console.log(`- Total Diproses : ${processedCount}`);
  console.log(`- Sukses         : ${successCount}`);
  console.log(`- Mode           : ${isLive ? "LIVE SEND" : "DRY RUN"}`);
  console.log(
    "================================================================\n",
  );
}

// Auto-run jika dipanggil via CLI
if (require.main === module) {
  runEmailApply()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
