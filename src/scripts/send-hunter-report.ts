import prisma from "../lib/prisma";
import { sendTelegramNotification } from "../services/telegram-notifier";

export async function sendDailyHunterReport() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const recentJobs = await prisma.jobListing.findMany({
      where: {
        appliedAt: {
          gte: today,
        },
      },
      orderBy: {
        appliedAt: "desc",
      },
      take: 5,
    });

    const totalToday = await prisma.jobListing.count({
      where: { appliedAt: { gte: today } },
    });

    if (totalToday === 0) {
      await sendTelegramNotification(
        `🎯 <b>[AUTO-APPLY AGENT REPORT]</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📅 <i>${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</i>\n` +
          `ℹ️ Sesi berburu selesai. Belum ada email/portal yang dikirim hari ini (menunggu lowongan baru / kuota berikutnya).`,
      );
      return;
    }

    let listText = "";
    recentJobs.forEach((job, idx) => {
      const comp = job.companyName || "Perusahaan Rekanan";
      const title = job.title;
      const status = job.status;
      const platform = job.platform || "PORTAL";
      listText += `<b>${idx + 1}. ${title}</b>\n   🏢 ${comp} | [${platform}: ${status}]\n`;
    });

    const reportMsg =
      `🚀 <b>[LAPORAN LAMARAN KERJA TERKIRIM]</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Kandidat:</b> Pranata Pramudya\n` +
      `📊 <b>Total Terproses Hari Ini:</b> ${totalToday} Lamaran\n\n` +
      `📋 <b>Daftar Lowongan:</b>\n${listText}` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ Status: Data tersimpan aman di Database Neon PostgreSQL.`;

    await sendTelegramNotification(reportMsg);
  } catch (e: any) {
    console.error("Error generating report:", e?.message || e);
  }
}

if (process.argv[1]?.endsWith("send-hunter-report.ts")) {
  sendDailyHunterReport();
}
