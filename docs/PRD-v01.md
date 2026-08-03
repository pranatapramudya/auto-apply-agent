# Product Requirements Document (PRD) - One Salesman v2.0
**Status:** Active (Pivot dari Telegram/Crypto bot)
**Target Pengguna:** UMKM Lokal Indonesia (Bengkel, Coffee Shop, Klinik, Toko Retail, dll)

## 1. Visi & Konteks Bisnis
Sistem "One Salesman" telah dipivot secara total dari bot Telegram menjadi mesin **Lead Generation & Cold Outreach Otomatis**. Bot bertugas mencari data UMKM dari Google Maps dan mengirimkan pesan penawaran via WhatsApp.

**Model Bisnis (Hybrid B2B):**
1. **Tier 1 (Utama):** Jasa pembuatan aplikasi/website Custom (Jual Putus / Instalasi Sekali Bayar).
2. **Tier 2 (Fallback/Down-sell):** Layanan SaaS (Software as a Service) berlangganan. Ini ditawarkan HANYA JIKA prospek keberatan dengan biaya modal di awal (CAPEX). Kami akan menggunakan arsitektur SaaS yang sudah ada untuk mengakomodasi klien ini.

Tujuan utama sistem ini adalah menembus *gatekeeper* (admin/kasir) agar pesan penawaran diteruskan ke Owner/Manager UMKM untuk penjadwalan *meeting* tatap muka.

## 2. Arsitektur & Tech Stack
Sistem dibangun menggunakan Node.js dan TypeScript, dengan komponen utama:
- **Database:** PostgreSQL (NeonDB) menggunakan Prisma ORM.
- **Scraper Engine:** `playwright` (Chromium Headless) untuk scraping data dari Google Maps secara natural.
- **Outreach Engine:** `whatsapp-web.js` untuk otomatisasi pengiriman pesan WhatsApp.
- **Environment:** Menggunakan `dotenv` untuk manajemen credentials.

## 3. Skema Database (Prisma)
Sistem menggunakan dua model utama:
1. `Prospect`: Menyimpan data target (businessName, category, whatsappNumber, rating, status).
2. `OutreachMessage`: Menyimpan log pesan yang telah dikirim ke prospek.

**Siklus Status Prospek (LeadStatus):**
- `PENDING` -> Target baru di-scrape, belum dihubungi.
- `CONTACTED` -> Pesan pertama telah berhasil dikirim via WhatsApp.
- `HOT_LEAD` -> Prospek membalas dan menunjukkan ketertarikan (diambil alih manual oleh tim manusia).
- `CLOSED` -> Deal berhasil dilakukan.

## 4. Alur Kerja Sistem (Pipeline Runner)
File eksekusi utama berada di `src/pipeline/runner.ts`. Alur kerjanya:
1. **Scraping:** Playwright mencari keyword tertentu di Google Maps, mengekstrak Nama, Kategori, dan Nomor HP, lalu menyimpannya ke database dengan status `PENDING`. Nomor HP otomatis diformat ke standar internasional (+62).
2. **Messaging:** Sistem mengambil data `PENDING` dari database, menyusun template pesan (pendekatan *Anti-Gatekeeper*), dan mengirimkannya via WhatsApp Client.
3. **Delay & Humanize:** Setiap pengiriman pesan WA WAJIB menggunakan "Random Delay" (jeda acak 5-15 detik) untuk menghindari pemblokiran oleh sistem anti-spam Meta.
4. **Update State:** Setelah pesan terkirim, status prospek diubah menjadi `CONTACTED`.

## 5. Instruksi Khusus untuk AI Agent (Antigravity & Copilot)
Setiap kali Anda (AI) membaca file ini untuk memberikan saran, Anda WAJIB mematuhi aturan berikut:
- **DUKUNGAN HYBRID MODEL:** Jika diminta membuat copywriting atau merancang fitur, pertimbangkan bahwa kami memiliki dua skema penawaran (Custom Jual Putus vs. SaaS Langganan). Selalu prioritaskan penawaran *Custom* terlebih dahulu sebagai pancingan awal.
- **TIDAK ADA TELEGRAM/TWITTER:** Jangan menyisipkan atau mengembalikan library GramJS, Twitter API, atau dependensi bot kripto lama.
- **FOKUS PADA KEAMANAN NOMOR:** Setiap modifikasi pada modul WhatsApp harus memprioritaskan keamanan nomor dari *banned* (pertahankan random delay, jangan gunakan interval yang statis).
- **BAHASA LOKAL:** Semua template pesan dan log konsol harus menggunakan bahasa Indonesia yang rapi dan profesional namun santai (menggunakan sapaan "Kak", "Mas", "Pak", "Bu").