import dotenv from "dotenv";
dotenv.config();

export async function sendTelegramNotification(
  message: string,
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[TELEGRAM] Token atau Chat ID belum diset di .env");
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("[TELEGRAM] Gagal kirim notif:", data.description);
      return false;
    }
    console.log(
      "[TELEGRAM] ✅ Notifikasi berhasil terkirim ke Telegram Pranata!",
    );
    return true;
  } catch (err: any) {
    console.error("[TELEGRAM] Error network:", err?.message || err);
    return false;
  }
}

// Test direct execution
if (process.argv[1]?.endsWith("telegram-notifier.ts")) {
  sendTelegramNotification(
    `🚀 <b>[AUTO-APPLY AGENT CONNECTED]</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Halo Pranata! Bot notifikasi pelamar kerja otomatis berhasil tersambung.\n` +
      `Setiap kali script berburu loker & ngirim lamaran, laporannya bakal langsung masuk ke sini!`,
  );
}
