# Product Requirement Document (PRD) - One-Sales-Man
## Version: 4.1 (Build Fix & Free Hosting Prep)

### 1. Tujuan
Memperbaiki error kompilasi TypeScript pada Vercel terkait `AgentContext` dan mempersiapkan codebase agar Stealth Userbot dapat di-hosting secara gratis menggunakan strategi Web Service (Render/Koyeb) + Uptime Robot.

### 2. Identifikasi Masalah
- Vercel gagal melakukan build karena tipe `tweetId` tidak ditemukan pada `AgentContext` di file `src/services/agent.ts`.
- Layanan hosting gratis (Web Service) mewajibkan aplikasi untuk me-listen pada suatu PORT HTTP. Jika tidak, proses deployment akan dianggap gagal (timeout).

### 3. Tugas Eksekusi Kritis
1. **Fix Type Error (`agent.ts`):** 
   - Buka `src/services/agent.ts`.
   - Tambahkan properti opsional `tweetId?: string;` ke dalam tipe data `AgentContext`.
2. **Setup Dummy HTTP Server (`userbot.ts`):**
   - Buka `src/bot/userbot.ts`.
   - Import modul `http` bawaan Node.js.
   - Buat server HTTP sederhana yang melakukan `listen` pada `process.env.PORT || 3000`.
   - Jika ada request masuk (misal `/ping`), kembalikan status 200 dengan pesan "Bot is alive!".
   - Jalankan server HTTP ini di bagian paling bawah atau bersamaan dengan inisialisasi `startUserbot()`.

### 4. Hasil Akhir yang Diharapkan
- Build Next.js di Vercel sukses tanpa Type Error.
- `userbot.ts` memiliki endpoint HTTP (Health Check) yang bisa diping oleh Uptime Robot setiap 5 menit agar hosting gratisan tidak tertidur (spin down).