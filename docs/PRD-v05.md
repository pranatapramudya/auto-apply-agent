# Product Requirements Document (PRD) v05
## One Salesman - B2B Outreach Auto-Pilot

---

## 1. NAMA PROYEK & VISI
**Nama Proyek:** One Salesman
**Visi:** Membangun sistem Bot B2B Otomatis (Scraper Google Maps + WhatsApp Blaster + AI Negotiator) yang mampu melakukan akuisisi klien UMKM lokal secara mandiri. Sistem ini dirancang menggunakan pendekatan **Zero-Cost Architecture** dengan mengkombinasikan komputasi lokal (Localhost) dan layanan gratis (Vercel + Neon Serverless), sehingga tidak memerlukan biaya sewa VPS bulanan.

---

## 2. DAFTAR CELAH (LOOPHOLES) & CARA MENUTUPNYA (FITUR BARU)
Pada iterasi versi 5 ini, sistem difokuskan untuk menutup celah teknis dan operasional demi keamanan serta kenyamanan penggunaan:

- **Fitur 1: Auto-Mute AI (Handoff Protocol)**
  *Masalah:* AI terus membalas percakapan bahkan setelah klien setuju (Deal/Meeting), sehingga berisiko merusak negosiasi akhir.
  *Solusi:* Sistem secara otomatis melakukan *bypass* di level `client.ts`. Jika status prospect berubah menjadi `HOT_LEAD` atau AI mendeteksi niat pembelian/meeting, AI otomatis **diam (mute)** untuk nomor tersebut. Manusia dapat langsung mengambil alih percakapan di aplikasi WhatsApp tanpa perlu mematikan terminal bot.

- **Fitur 2: Dynamic Human Delay**
  *Masalah:* Pengiriman pesan massal dan scraping terlalu cepat dapat memicu blokir/banned dari WhatsApp (Meta) dan Google.
  *Solusi:* Implementasi jeda waktu acak (30 detik hingga 2 menit) pada setiap eksekusi pengiriman pesan baru dan proses perpindahan target di scraper. Ini akan meniru perilaku manusia secara natural (human-like behavior).

- **Fitur 3: Minimalist Vercel Dashboard**
  *Masalah:* User (Sales/Manusia) kesulitan memantau metrik, riwayat, dan memanipulasi status prospek karena hanya bisa melihat terminal.
  *Solusi:* Membangun satu halaman Next.js (Server Components) sederhana yang akan di-deploy ke Vercel. Dashboard ini hanya berfungsi menampilkan tabel data dari Prisma (berdasarkan status: `PENDING`, `CONTACTED`, `HOT_LEAD`) dan dilengkapi tombol untuk mengubah status prospek secara real-time.

---

## 3. ARSITEKTUR INFRASTRUKTUR SAAT INI
Sistem tetap mempertahankan model hibrida *Zero-Cost* agar bebas biaya server operasional:

1. **Localhost (Node.js di Laptop/PC)**
   - **Scraper (Playwright):** Berjalan di mesin lokal untuk menghindari blokir IP dari perlindungan Anti-Bot Google.
   - **WhatsApp Bot (whatsapp-web.js):** Berjalan secara lokal agar memori Puppeteer tidak membebani limitasi fungsi serverless, dan session tersimpan aman di direktori lokal.
   
2. **AI Negotiator (Local API Call)**
   - Logika AI dieksekusi dari localhost namun memanggil **Groq API** secara remote (menggunakan Llama-3) untuk menghasilkan balasan instan tanpa biaya mahal.

3. **Database (NeonDB Serverless)**
   - Menggunakan **PostgreSQL** di layanan NeonDB yang dihubungkan melalui Prisma ORM. Ini menjadi *Single Source of Truth* untuk Dashboard dan Local Bot.

4. **Frontend (Vercel)**
   - Aplikasi UI **Next.js** di-deploy secara gratis di Vercel. Dashboard ini murni bertindak sebagai viewer/editor status database dan *tidak* mengeksekusi long-running process (seperti bot atau scraper).

---

## 4. PROTOKOL PENAWARAN (PITCHING)
Karena target utama sistem adalah pengusaha UMKM lokal yang tidak familiar dengan jargon teknologi, komunikasi AI Negotiator dibatasi dengan protokol khusus:

- **Bahasa Natural & Awam:** AI dilarang keras menggunakan istilah teknis seperti "SaaS", "CAPEX", "Cloud", atau menyebut nama produk internal (seperti "LumeStack").
- **Tiering Penawaran:** 
  - *Utama:* Menawarkan jasa pembuatan sistem/website custom sekali bayar.
  - *Fallback:* Jika prospek mengeluhkan biaya awal yang berat, AI akan menawarkan opsi "Sewa langganan aplikasi bulanan yang fiturnya bisa disesuaikan dengan kebutuhan bisnis Kakak." AI akan menjelaskan bahwa opsi ini sangat ringan karena tinggal pakai dan bayar bulanan secara santai dan sopan.