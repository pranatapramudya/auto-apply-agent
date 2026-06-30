# Product Requirement Document (PRD) - One-Sales-Man
## Version: 4.4 (Vercel Build Fix & X/Twitter Legacy Cleanup)

### 1. Tujuan
Menyelesaikan error kompilasi Next.js di Vercel (`Argument of type '"X"' is not assignable to parameter of type '"TELEGRAM"'`) dengan cara menghapus sisa rute API lama yang tidak lagi relevan dengan fokus sistem saat ini (Telegram Userbot).

### 2. Identifikasi Masalah
- File `src/app/api/sniper/route.ts` (dan kemungkinan rute simulasi/cron lainnya) masih menggunakan pemanggilan fungsi `evaluateAndAct` dengan argumen platform `'X'`.
- Definisi fungsi `evaluateAndAct` di `src/services/agent.ts` saat ini hanya menerima union type `'TELEGRAM'`.
- Karena operasional Twitter/X belum akan diluncurkan di fase ini, kode tersebut menjadi *dead code* yang memblokir proses deployment Vercel.

### 3. Tugas Eksekusi Kritis
1. **Hapus Folder Legacy API:**
   - Hapus folder `src/app/api/sniper` beserta seluruh isinya secara permanen.
   - Hapus folder `src/app/api/cron` (jika ada dan hanya berisi sisa cron job Twitter/X).
   - Hapus folder `src/app/api/simulate` (jika ada dan tidak relevan dengan arsitektur saat ini).
2. **Validasi Build Lokal:**
   - Pastikan tidak ada lagi file di dalam proyek yang memanggil `evaluateAndAct` dengan argumen `'X'`.

### 4. Hasil Akhir yang Diharapkan
- Vercel berhasil melakukan proses `npm run build` tanpa terhalang strict type error TypeScript.
- Codebase Next.js menjadi lebih ringan dan difokuskan murni sebagai fondasi UI dan manajemen Database Prisma.