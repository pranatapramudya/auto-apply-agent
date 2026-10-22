# Autonomous Auto-Apply Agent v2.1 🚀⚡
> **Next-Gen Autonomous Talent Acquisition Pipeline, Precision Job Hunter & Real-time Telegram Hub**

**Auto-Apply Agent** adalah sistem digital talent acquisition otonom berbasis AI yang mengubah paradigma pelamaran kerja dari *brute-force spamming* menjadi **High-Precision Hyper-Tailoring Pipeline**. 

Sistem ini didesain khusus untuk mendukung multi-kandidat (**Frontend / Next.js / Web Engineering** untuk Pranata Pramudya & **Administrasi Publik / BUMN / Generalis** untuk Siti Fathonah) dengan arsitektur anti-halusinasi berbasis STAR Method, proteksi anti-bot tingkat lanjut, serta automasi booting OS Windows terintegrasi Telegram Notification Hub.

---

## 🌟 Pilar Keunggulan Generasi Baru (v2.1)

1. 🎯 **Precision Tech Targeting & AI Evaluator:**
   - Disesuaikan khusus untuk ekosistem **Frontend Developer, Next.js Developer, React Developer, dan Web Engineering**.
   - Mengevaluasi kecocokan kualifikasi (*match score* $\ge$ 75%) menggunakan Groq LLM secara real-time dan memfilter lowongan non-relevan.
2. 🔔 **Instant Telegram Notification Hub (`telegram-notifier.ts`):**
   - Mengirim laporan hasil pelamaran langsung ke chat pribadi Telegram setiap kali proses discovery dan submit selesai dieksekusi.
3. ⚡ **Native Windows Startup Automation (`start-auto-apply.vbs`):**
   - Otomatis aktif saat PC dinyalakan (*At Log-on*) dengan jeda 30 detik untuk inisialisasi koneksi jaringan, menjalankan pipeline pagi secara hening (*silent background*).
4. 📄 **Dynamic JIT ATS Resume Compiler (`pdf-generator.ts`):**
   - Meng-compile PDF resume berstandar ATS internasional secara on-the-fly untuk setiap lowongan yang dilamar (>80KB, skor ATS 95%+).
5. 🛡️ **Anti-Bot Stealth & Honeypot Trap Evasion:**
   - **Honeypot Defense:** Memindai dan mengabaikan form input jebakan anti-bot (`display:none`, `opacity:0`, off-screen `-9999px`, trap names).
   - **Modern ATS Combobox Grounding:** Mendukung dropdown non-standar (`role="combobox"`, Radix UI, Greenhouse, Lever).
   - **Human-in-The-Loop (HITL) Alert:** Mendeteksi Cloudflare Turnstile / reCAPTCHA wall dan menangkap screenshot audit khusus tanpa membuat sistem crash.
6. 📧 **Direct-to-HRD Email Dispatcher:**
   - Ekstraksi domain email rekruter perusahaan (`careers@perusahaan.co.id`, `recruitment@domain.com`).
   - Generator cover letter terpersonalisasi dengan bukti ROI nyata via Gmail SMTP.

---

## 👤 Profil Multi-Kandidat Terintegrasi

| Kandidat | Fokus Keahlian Utama | Target Formasi | Status Profil |
| :--- | :--- | :--- | :---: |
| **Pranata Pramudya** | Next.js 14, React, TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM, UCD | Frontend Developer, Next.js Specialist, React Developer, Full Stack | 🟢 **Aktif (Priority)** |
| **Siti Fathonah** | Administrasi Perkantoran, Manajemen Arsip Digital, Tata Naskah Dinas, MS Excel, SOP | Staf Administrasi Publik, Document Controller, General Affairs, BUMN | ⚪ Non-Aktif (Diarsipkan) |

---

## 🛠️ Alur Eksekusi Harian (`run-morning-hunter.ps1`)

```text
[PC Boot / Startup] -> [start-auto-apply.vbs] (Jeda 30s)
  │
  ├── 1. Membersihkan background zombie browser process
  ├── 2. Verifikasi status profil user aktif di Database Neon
  ├── 3. Discovery Lowongan baru (Kalibrr & Tech in Asia)
  ├── 4. Social Media & Regional Scraping (IG/TikTok Sumedang & Bandung)
  ├── 5. Direct-to-HRD Email Auto-Apply (Gmail SMTP, kuota aman)
  ├── 6. Action Engine Web Portal (Dry-Run / Live Submit)
  └── 7. Kirim rekapitulasi laporan instan ke Telegram Pranata 📲
```

---

## ⚙️ Instalasi & Setup

1. **Prasyarat:** Node.js v20 atau v22+.
2. **Install Dependensi:**
   ```bash
   npm install
   ```
3. **Konfigurasi Environment (`.env`):**
   Lengkapi variabel berikut:
   * `DATABASE_URL`: Connection string PostgreSQL ([Neon Serverless](https://neon.tech/)).
   * `GROQ_API_KEY`: Kunci API untuk LLM evaluator & resume tailor ([Groq Console](https://console.groq.com/)).
   * `SMTP_USER` & `SMTP_PASS`: Kredensial email (Gmail App Password) untuk cold apply HRD.
   * `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID`: Token bot & ID chat pribadi untuk notifikasi harian.

4. **Migrasi Database:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

---

## 🚀 Pengujian & Eksekusi CLI

```bash
# 1. Jalankan Full Pipeline Pagi Secara Manual:
powershell -ExecutionPolicy Bypass -File .\run-morning-hunter.ps1

# 2. Uji Coba Pengiriman Notifikasi Telegram:
npx tsx src/scripts/send-hunter-report.ts

# 3. Uji Coba Scraper Loker Frontend:
npx tsx src/scripts/run-discovery.ts 41dbb7bd-8638-4fa7-80d7-dc968c6ad278

# 4. Jalankan Dashboard Web:
npm run dev # Buka di http://localhost:3001
```

---

## 📁 Struktur Direktori Utama

```text
├── assets/                  # Berkas CV PDF resmi terverifikasi
├── data/                    # Candidate Knowledge Base (STAR Method)
├── docs/                    # Product Requirement Documents (PRD-v01 s.d PRD-v08)
├── logs/
│   ├── resumes/             # PDF CV JIT hasil tailoring dinamis per lowongan
│   └── screenshots/         # Bukti tangkapan layar form audit trail
├── prisma/
│   └── schema.prisma        # Skema database Neon PostgreSQL
├── src/
│   ├── app/                 # Next.js 16 App Router & Dashboard UI
│   ├── services/
│   │   ├── action/          # Playwright Apply Engine, Stealth, Form Resolver
│   │   ├── email/           # Cover Letter AI, SMTP Dispatcher
│   │   ├── resume/          # JIT ATS Resume Tailor & PDF Renderer
│   │   ├── scraper/         # Multi-platform job crawlers (Kalibrr & Tech in Asia)
│   │   └── telegram-notifier.ts # Layanan pengiriman notifikasi Telegram
│   └── scripts/             # Script runner, reporting, dan automation
└── run-morning-hunter.ps1   # Master orchestrator harian
```

---

## 🛡️ Kebijakan Etis & Keamanan
- Tidak memalsukan pengalaman kerja (100% grounded ke profil nyata kandidat).
- Kuota harian terukur untuk menghormati kapasitas platform penyedia kerja.
- *Strict Dry-Run by default* untuk memastikan kontrol penuh dan transparansi pelamar sebelum pengiriman data asli.
