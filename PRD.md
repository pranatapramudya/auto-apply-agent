# Product Requirement Document (PRD) - One-Sales-Man
## Version: 4.0 (Pre-Deployment & Code Audit)

### 1. Tujuan
Melakukan audit menyeluruh pada *codebase* sebelum proyek di-push ke GitHub dan di-deploy. Fokus utama adalah keamanan kredensial, kebersihan kode, optimasi build Next.js + Prisma, dan standarisasi dokumentasi.

### 2. Area Audit & Standarisasi
1. **Keamanan Kredensial (Environment Variables):**
   - Pastikan file `.env` sudah masuk ke dalam `.gitignore`.
   - Buat file `.env.example` yang berisi daftar variabel tanpa *value* asli agar aman di-push ke GitHub.
2. **Kesiapan Build (Vercel & Next.js):**
   - Periksa `package.json`. Pastikan script `build` menjalankan `prisma generate` sebelum proses `next build` agar tidak terjadi *crash* saat deployment di Vercel.
   - Hapus *unused imports* dan *console.log* yang tidak krusial untuk *production*.
3. **Standarisasi Bahasa:**
   - Seluruh komentar teknis dalam kode, instruksi UI (jika ada dasbor Next.js), dan dokumentasi HARUS menggunakan Bahasa Indonesia untuk mempermudah pemahaman personal dan relevansi lokal.
4. **Pemisahan Arsitektur:**
   - Berikan catatan atau peringatan di `README.md` (jika dibuat) bahwa `src/bot/userbot.ts` adalah *long-running process* yang harus dijalankan terpisah dari arsitektur *serverless* Vercel.

### 3. Hasil Akhir yang Diharapkan
- File `.env.example` tersedia.
- `.gitignore` terkonfigurasi dengan benar (mengabaikan `.env`, `node_modules`, `.next`).
- Kode bersih dari sisa-sisa eksperimen sebelumnya dan siap di-push ke *repository* utama.