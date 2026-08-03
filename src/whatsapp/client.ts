import 'dotenv/config';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import Groq from 'groq-sdk';
import prisma from '../lib/prisma';

// Initialize Groq Client
const groq = new Groq({
    apiKey: process.env.LLM_API_KEY,
});

// Initialize the WhatsApp Client
export const whatsappClient = new Client({
    authStrategy: new LocalAuth(), // Saves session locally
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

whatsappClient.on('qr', (qr) => {
    console.log('QR Code Received. Scan it with your WhatsApp:');
    qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
    console.log('WhatsApp Client is ready! AI Negotiator is listening for incoming messages...');
});

whatsappClient.on('disconnected', (reason) => {
    console.log('WhatsApp Client disconnected. Reason:', reason);
});

// AI NEGOTIATOR LOGIC
const HANDOFF_TEXT = "Baik Kak, untuk detail teknis dan eksekusi akan langsung dibantu oleh Mas Pranata (Technical Lead kami). Sebentar ya Kak, saya teruskan.";

whatsappClient.on('message', async (msg) => {
    // Abaikan pesan dari grup atau status broadcast
    if (msg.from.includes('@g.us') || msg.from === 'status@broadcast') return;

    try {
        // Normalisasi nomor pengirim dari "628xxx@c.us" menjadi "+628xxx"
        const senderNumber = '+' + msg.from.replace('@c.us', '');
        
        // Cari status prospek di database
        const prospect = await prisma.prospect.findUnique({
            where: { whatsappNumber: senderNumber }
        });

        // RULES: AI HANYA membalas jika status prospek adalah CONTACTED
        if (!prospect || prospect.status !== 'CONTACTED') {
            return; // Abaikan pesan (misal status sudah HOT_LEAD atau CLOSED)
        }

        console.log(`\n[AI Negotiator] Memproses pesan dari ${prospect.businessName} (${senderNumber})`);
        console.log(`[User] : ${msg.body}`);

        const systemPrompt = `Anda adalah representatif Customer Service & Sales dari sebuah IT Agency lokal. Anda ramah, santai, dan sangat profesional.
Tugas Anda adalah membalas pesan dari pemilik UMKM (seperti bengkel, coffee shop, klinik, retail) yang merespons penawaran kita.
Gunakan bahasa Indonesia yang rapi namun terkesan natural dan santai (sapa mereka dengan "Kak", "Mas", "Pak", atau "Bu").

Model Bisnis Kita (Hybrid):
1. Tier 1 (Utama): Tawarkan pembuatan aplikasi kasir / website custom (jual putus / instalasi sekali bayar). Edukasi mereka soal efisiensi.
2. Tier 2 (Fallback): Jika klien keberatan dengan biaya modal di awal (CAPEX) untuk jasa custom, JANGAN gunakan istilah teknis seperti 'SaaS' atau menyebut nama produk. Sebagai gantinya, tawarkan solusi: 'Sewa langganan aplikasi bulanan yang fiturnya bisa disesuaikan dengan kebutuhan bisnis Kakak'. Jelaskan dengan bahasa santai bahwa opsi sewa ini jauh lebih ringan karena tinggal pakai dan bayar per bulan.

ATURAN HANDOFF SANGAT PENTING:
Jika klien menunjukkan intensi berikut:
- Mau beli / berminat
- Minta rincian harga detail
- Mengajak ketemuan (meeting offline/online)
- Bertanya pertanyaan teknis yang rumit
Maka Anda WAJIB membalas HANYA dengan persis kalimat di bawah ini:
"${HANDOFF_TEXT}"
Jangan pernah tambahkan kalimat lain jika kondisi ini terpenuhi!`;

        // Panggil Groq API dengan Llama3
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: msg.body }
            ],
            model: 'llama3-70b-8192', // Menggunakan model besar agar reasoning Handoff lebih tajam
            temperature: 0.6,
            max_tokens: 500
        });

        const aiResponse = chatCompletion.choices[0]?.message?.content?.trim() || "Maaf Kak, sistem kami sedang ada gangguan sebentar.";

        // Random delay sebelum membalas (Anti-ban: 5s hingga 10s)
        const delay = Math.floor(Math.random() * 5000) + 5000;
        console.log(`[AI Negotiator] Menunggu ${delay / 1000} detik sebelum membalas...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Balas pesan
        await msg.reply(aiResponse);
        console.log(`[AI] : ${aiResponse}`);

        // Cek jika AI merespons dengan Handoff Trigger
        if (aiResponse.includes("dibantu oleh Mas Pranata")) {
            console.log(`[🔥 HANDOFF] Trigger terdeteksi! Mengubah status ${prospect.businessName} menjadi HOT_LEAD.`);
            await prisma.prospect.update({
                where: { id: prospect.id },
                data: { status: 'HOT_LEAD' }
            });
        }

        // Catat percakapan ke database untuk log
        await prisma.outreachMessage.create({
            data: {
                prospectId: prospect.id,
                messageText: `[User]: ${msg.body}\n[AI]: ${aiResponse}`
            }
        });

    } catch (error) {
        console.error('[AI Negotiator] Terjadi error:', error);
    }
});


// Helper function to send initial cold messages with a random human-like delay
export async function sendColdMessage(number: string, text: string, mediaPath?: string): Promise<boolean> {
    try {
        let formattedNumber = number;
        if (!formattedNumber.endsWith('@c.us')) {
            formattedNumber = formattedNumber.replace('+', '') + '@c.us';
        }

        // Random delay between 5s and 15s
        const delay = Math.floor(Math.random() * 10000) + 5000;
        console.log(`Waiting ${delay / 1000} seconds before sending cold message to ${formattedNumber}...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));

        if (mediaPath) {
            const media = MessageMedia.fromFilePath(mediaPath);
            await whatsappClient.sendMessage(formattedNumber, media, { caption: text });
        } else {
            await whatsappClient.sendMessage(formattedNumber, text);
        }

        console.log(`Cold message sent successfully to ${formattedNumber}`);
        return true;
    } catch (error) {
        console.error(`Failed to send message to ${number}:`, error);
        return false;
    }
}
