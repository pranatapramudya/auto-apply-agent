import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage, NewMessageEvent } from "telegram/events";
import readline from "readline/promises";
import * as dotenv from "dotenv";
import * as http from "http";
import { evaluateAndAct } from "../services/agent";

// Memuat variabel .env
dotenv.config();

const apiId = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
const apiHash = process.env.TELEGRAM_API_HASH || "";
const sessionString = new StringSession(process.env.TELEGRAM_SESSION || "");

if (!apiId || !apiHash) {
  console.error("Error: TELEGRAM_API_ID and TELEGRAM_API_HASH are not set in .env");
  process.exit(1);
}

const client = new TelegramClient(sessionString, apiId, apiHash, {
  connectionRetries: 5,
});

async function startUserbot() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  await client.start({
    phoneNumber: async () => await rl.question("Please enter your number: "),
    password: async () => await rl.question("Please enter your password: "),
    phoneCode: async () => await rl.question("Please enter the code you received: "),
    onError: (err) => console.log(err),
  });

  rl.close();

  console.log("You should now be connected.");
  const savedSession = client.session.save() as unknown as string;
  if (savedSession) {
    console.log("\n=== SAVE THIS SESSION STRING TO YOUR .env AS TELEGRAM_SESSION ===");
    console.log(savedSession);
    console.log("=================================================================\n");
  }

  client.addEventHandler(async (event: NewMessageEvent) => {
    const message = event.message;
    
    // 1. Anti-Self Reply: Mencegah infinite loop dengan mengabaikan pesan keluar dari akun sendiri
    if (message.out) return;

    // Hanya memproses pesan dari Grup atau Channel
    if (message.isGroup || message.isChannel) {
      const text = message.text;
      const chatId = message.chatId?.toString();

      if (!text || !chatId) return;

      try {
        const sender = await message.getSender();
        // @ts-ignore
        const username = sender?.username || "Unknown";

        // 2. Observability: Mencatat pesan masuk
        console.log(`[USERBOT-LISTEN] Group: ${chatId} | User: ${username} | Text: ${text}`);

        // Evaluasi AI
        const responseText = await evaluateAndAct(
          text,
          "TELEGRAM",
          { chatId, username }
        );

        // Aksi: Balas langsung jika LLM merespons
        if (responseText) {
          await client.sendMessage(chatId, { message: responseText });
          console.log(`[USERBOT-ACTION] Sent response to ${chatId}`);
        }
      } catch (error) {
        console.error("[USERBOT-ERROR] Error handling message:", error);
      }
    }
  }, new NewMessage({}));
}

startUserbot();

// HTTP Server dummy untuk health check Uptime Robot (mencegah spin down di hosting gratis)
const PORT = Number(process.env.PORT) || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is alive!');
}).listen(PORT, () => {
  console.log(`Dummy HTTP server listening on port ${PORT}`);
});
