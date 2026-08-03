PERINTAH UPDATE FITUR: INTEGRASI AI NEGOTIATOR (LLM)

Konteks:
Strategi Handoff manual di awal dibatalkan. Bot "One Salesman" sekarang harus bisa membalas pesan masuk secara otomatis bertindak sebagai Customer Service / Sales representatif menggunakan LLM_API_KEY yang sudah ada di file .env.

Tugas Anda (AI Agent):
Tolong update file `src/whatsapp/client.ts` dengan mengimplementasikan fitur berikut:

1. INTEGRASI LLM SDK: 
Gunakan library yang relevan (seperti OpenAI SDK atau framework AI generik) untuk memproses pesan masuk menggunakan kunci dari `process.env.LLM_API_KEY`.

2. SYSTEM PROMPT (PERAN AI):
Buat sebuah system prompt yang kuat. AI harus berperan sebagai representatif agency IT lokal yang ramah dan profesional. 
Tujuan AI: Mengedukasi UMKM tentang pentingnya sistem kasir/website dan menjawab keraguan. Jika klien menolak karena biaya, tawarkan layanan SaaS (langganan bulanan) sebagai alternatif.

3. LOGIKA HANDOFF & PERUBAHAN STATUS:
Buat fungsi `handleIncomingMessage`:
- AI HANYA membalas pesan dari nomor yang statusnya `CONTACTED` di database.
- Tanamkan "Handoff Trigger": Jika sistem mendeteksi intensi "mau beli", "minta harga detail", "ngajak ketemuan", atau "pertanyaan teknis", AI harus merespons dengan: "Baik Kak, untuk detail teknis dan eksekusi akan langsung dibantu oleh Mas Pranata (Technical Lead kami). Sebentar ya Kak, saya teruskan."
- Segera setelah trigger ini terpanggil, UPDATE status prospek tersebut di database Prisma menjadi `HOT_LEAD`.
- AI dilarang keras merespons pesan apapun dari nomor yang statusnya sudah `HOT_LEAD` atau `CLOSED`.

Tolong berikan kode lengkap untuk diintegrasikan ke `src/whatsapp/client.ts` beserta rekomendasi library LLM apa yang harus saya `npm install`.