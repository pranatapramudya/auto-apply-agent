# PRD-v08: Autonomous Morning Hunter, Windows Startup Automation & Real-time Telegram Report Hub

## 1. Overview
Modul pembaruan **PRD-v08** menambahkan lapisan eksekusi otomatis tanpa intervensi manual untuk pipeline pencarian kerja harian kandidat, integrasi pelaporan instan melalui Telegram Bot, serta penajaman kata kunci profil pencarian kerja khusus **Frontend & Next.js Developer**.

---

## 2. Fitur Baru & Peningkatan Arsitektur

### 2.1. Native Windows Startup Automation (`start-auto-apply.vbs`)
- **Lokasi:** `C:\Users\Pranata Pramudya\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\start-auto-apply.vbs`
- **Mekanisme:**
  - Dieksekusi secara otomatis saat user login ke sistem operasi Windows.
  - Terdapat jeda inisialisasi jaringan (30 detik) agar adapter WiFi/Ethernet tersambung stabil.
  - Memanggil `run-morning-hunter.ps1` secara *silent/hidden* di background tanpa mengganggu produktivitas desktop.

### 2.2. Instant Telegram Notification Hub (`src/services/telegram-notifier.ts`)
- **Teknologi:** Telegram Bot API (HTML Parse Mode, direct HTTPS payload).
- **Target Chat:** Chat pribadi kandidat (`2079693450`).
- **Kredensial:** Disimpan aman di `.env` (`TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID`).
- **Fungsi:** Mengirim laporan rekapitulasi harian (`src/scripts/send-hunter-report.ts`) yang merangkum jumlah lowongan baru, status submit, platform asal, dan skor evaluasi kecocokan kandidat.

### 2.3. Precision Tech Targeting (Profile Update)
- **Target Roles Diperbarui:**
  `Frontend Developer, Next.js Developer, React Developer, Web Developer, Full Stack Developer, Software Engineer`
- **Core Skills:**
  `Next.js 14, React, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL, REST API, HTML5/CSS3, Git, User-Centered Design (UCD)`
- **Dampak Evaluasi:**
  - Mengeliminasi *false-positive* lowongan non-teknis (misal: pengajar/tutor atau staf GA).
  - Menghasilkan tingkat relevansi tinggi (95%+ match score) pada portal lowongan teknologi modern (seperti Tech in Asia & Kalibrr).

---

## 3. Alur Eksekusi Harian (`run-morning-hunter.ps1`)
1. **Pembersihan Zombie Process:** Menghilangkan instance browser gantung.
2. **Verifikasi Profil Kandidat Aktif:** Memastikan kandidat aktif tervalidasi di Neon DB.
3. **Multi-Platform Job Discovery:** Scraping lowongan real-time via Kalibrr & Tech in Asia.
4. **Social Scraper:** Pengecekan lowongan regional & kontak direct HRD.
5. **Direct-to-HRD Email Dispatcher:** Pengiriman lamaran terkurasi via Gmail SMTP.
6. **Web Portal Action Engine:** Dry-Run / Live Submit form lowongan.
7. **Telegram Broadcast:** Pengiriman ringkasan hasil ke HP kandidat.

---

## 4. Status Integrasi
- [x] Auto-Start VBS terpasang di folder Startup.
- [x] Modul Telegram Notifier teruji dan aktif.
- [x] Script rekap harian `send-hunter-report.ts` terhubung ke Neon PostgreSQL.
- [x] Script `run-morning-hunter.ps1` Step 1-7 terverifikasi lancar.
