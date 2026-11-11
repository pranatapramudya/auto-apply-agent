import prisma from "../lib/prisma";
import { sendTelegramNotification } from "../services/telegram-notifier";

export async function sendDailyHunterReport() {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formattedDate = now.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  try {
    // 1. Ambil user Pranata
    const user = await prisma.user.findFirst({
      where: { fullName: { contains: "Pranata", mode: "insensitive" } },
    });

    if (!user) {
      console.error("[REPORT] User Pranata tidak ditemukan.");
      return;
    }

    // 2. Metrik Real-time dari Database
    const appliedToday = await prisma.jobListing.findMany({
      where: {
        userId: user.id,
        appliedAt: { gte: today },
      },
      orderBy: { appliedAt: "desc" },
    });

    const totalAppliedToday = appliedToday.length;

    const totalDiscoveredToday = await prisma.jobListing.count({
      where: {
        userId: user.id,
        createdAt: { gte: today },
      },
    });

    const readyInQueue = await prisma.jobListing.findMany({
      where: {
        userId: user.id,
        status: { in: ["DISCOVERED", "QUEUED_FOR_APPLY"] },
        matchScore: { gte: 0.6 },
      },
      orderBy: { matchScore: "desc" },
      take: 5,
    });

    const totalReadyInQueue = await prisma.jobListing.count({
      where: {
        userId: user.id,
        status: { in: ["DISCOVERED", "QUEUED_FOR_APPLY"] },
        matchScore: { gte: 0.6 },
      },
    });

    const totalAllTimeApplied = await prisma.jobListing.count({
      where: {
        userId: user.id,
        status: "APPLIED",
      },
    });

    // 3. Susun daftar lowongan real-time (utamakan yang diaplikasikan hari ini, atau antrean relevan)
    let jobsListText = "";
    const displayJobs =
      totalAppliedToday > 0 ? appliedToday.slice(0, 5) : readyInQueue;

    if (displayJobs.length > 0) {
      displayJobs.forEach((job, idx) => {
        const scorePercent = job.matchScore
          ? Math.round(job.matchScore * 100)
          : null;
        const scoreText = scorePercent
          ? ` • Match: <b>${scorePercent}%</b>`
          : "";
        const statusBadge =
          job.status === "APPLIED" ? "✅ TERKIRIM" : `⏳ ${job.status}`;
        jobsListText += `${idx + 1}. <b>${job.title}</b>${scoreText}\n`;
        jobsListText += `   🏢 ${job.companyName} | [${job.platform}]\n`;
        if (job.jobUrl && job.jobUrl.startsWith("http")) {
          jobsListText += `   🔗 <a href="${job.jobUrl}">Lihat Lowongan</a> | ${statusBadge}\n\n`;
        } else {
          jobsListText += `   📌 Status: ${statusBadge}\n\n`;
        }
      });
    } else {
      jobsListText =
        "<i>Belum ada lowongan baru yang lolos kurasi AI hari ini.</i>\n\n";
    }

    const header =
      totalAppliedToday > 0
        ? `🚀 <b>[LAPORAN LAMARAN RESMI TERKIRIM]</b>`
        : `🎯 <b>[AUTO-APPLY AGENT REPORT]</b>`;

    const reportMsg =
      `${header}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📅 <b>Waktu:</b> ${formattedDate} • ${formattedTime} WIB\n` +
      `👤 <b>Kandidat:</b> ${user.fullName}\n\n` +
      `📊 <b>Ringkasan Real-Time:</b>\n` +
      `• Lamaran Terkirim Hari Ini: <b>${totalAppliedToday} Lowongan</b>\n` +
      `• Lowongan Masuk Hari Ini: <b>${totalDiscoveredToday} Lowongan</b>\n` +
      `• Antrean Siap Dilamar (Match ≥ 60%): <b>${totalReadyInQueue} Lowongan</b>\n` +
      `• Total Portofolio Terlamar (All-Time): <b>${totalAllTimeApplied} Perusahaan</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 <b>${totalAppliedToday > 0 ? "Lowongan Terkirim:" : "Lowongan Siap Dilamar (Top Match):"}</b>\n` +
      `${jobsListText}` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ <i>Data 100% Real-time dari Database Neon PostgreSQL</i>`;

    await sendTelegramNotification(reportMsg);
  } catch (e: any) {
    console.error("[REPORT] Gagal membuat laporan Telegram:", e?.message || e);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.endsWith("send-hunter-report.ts")) {
  sendDailyHunterReport();
}
