# Autonomous Auto-Apply Agent v2.0 🤖💼
> **Next-Gen Autonomous Talent Acquisition Pipeline & Precision Job Hunter**

**Auto-Apply Agent** adalah sistem digital talent acquisition otonom berbasis AI yang mengubah paradigma pelamaran kerja dari *brute-force spamming* menjadi **High-Precision Hyper-Tailoring Pipeline**. 

Sistem ini didesain khusus untuk mendukung multi-kandidat (**Tech/Software Engineering** untuk Pranata Pramudya & **Administrasi Publik / BUMN / Generalis** untuk Siti Fathonah) dengan arsitektur anti-halusinasi berbasis STAR Method dan proteksi anti-bot tingkat lanjut.

---

## 🌟 Pilar Keunggulan Generasi Baru (v2.0)

1. 🧠 **Multi-Candidate Grounded Knowledge Base (`data/candidate-knowledge.json`):**
   - Repositori pengalaman kerja riil dengan metrik terukur berbasis **STAR** (*Situation, Task, Action, Result*).
   - **Zero-Hallucination:** AI ATS Resume Tailor dilarang mengarang perusahaan fiktif; sistem secara dinamis memilih dan menonjolkan pencapaian riil kandidat sesuai kata kunci Job Description (JD).
2. 📄 **Dynamic JIT ATS Resume Compiler (`pdf-generator.ts`):**
   - Meng-compile PDF resume berstandar ATS internasional secara on-the-fly untuk setiap lowongan yang dilamar (>80KB, skor ATS 95%+).
3. 🛡️ **Anti-Bot Stealth & Honeypot Trap Evasion:**
   - **Honeypot Defense:** Memindai dan mengabaikan form input jebakan anti-bot (`display:none`, `opacity:0`, off-screen `-9999px`, trap names).
   - **Modern ATS Combobox Grounding:** Mendukung pemilihan dropdown non-standar (`role="combobox"`, Radix UI, Greenhouse, Lever).
   - **Human-in-The-Loop (HITL) Alert:** Mendeteksi Cloudflare Turnstile / reCAPTCHA wall dan menangkap screenshot audit khusus tanpa membuat sistem crash.
4. 📬 **Outbound Recruiter Lead-Gen & Direct Dispatcher:**
   - Ekstraksi dan resolusi domain email rekruter perusahaan (`careers@perusahaan.co.id`, `recruitment@domain.com`).
   - Generator cover letter terpersonalisasi dengan bukti ROI nyata untuk dikirim langsung via SMTP (mendukung simulasi Dry-Run & Live Send).
5. 📊 **Strategic Talent Analytics & Dashboard UI:**
   - Command center responsif Next.js 16 (App Router + TailwindCSS v4) dengan panel *Strategic Talent & ATS Grounding*, analisis gap keahlian, dan preset pencarian instan.

---

## 👥 Profil Multi-Kandidat Terintegrasi

| Kandidat | Fokus Keahlian Utama | Target Formasi | Status CV ATS |
| :--- | :--- | :--- | :---: |
| **Pranata Pramudya** | Next.js, TypeScript, PostgreSQL, Prisma, Node.js, AI Agents, Playwright | Fullstack Developer, Backend Engineer, Next.js Specialist | ✅ **86.6 KB** (Aktif) |
| **Siti Fathonah** | Administrasi Perkantoran, Manajemen Arsip Digital, Tata Naskah Dinas, MS Excel, SOP, GCG | Staf Administrasi Publik, Document Controller, General Affairs, BUMN | ✅ **82.3 KB** (Aktif) |

---

## 📋 Fitur Utama Sistem

- 🔍 **Real-Time Live Job Aggregator:** Scraping data lowongan publik (LinkedIn, Jobstreet, Kalibrr, Tech in Asia) tanpa perlu kredensial login.
- 🛡️ **Dual-Layer Anti-Scam Filter:** Layer 1 (Heuristik indikasi travel fee/seragam) & Layer 2 (Groq LLM Evaluator).
- ⚡ **Autonomous Apply Action Runner:** Navigasi form multi-langkah dengan mode *Strict Dry-Run* (aman) atau *Live Submit*.
- 📸 **Visual Audit Trail Screenshot:** Menyimpan bukti tangkapan layar form yang terisi otomatis ke `logs/screenshots/`.
- 🤖 **AI Screening Answer Persona:** Menjawab kuesioner terbuka (gaji, pengalaman spesifik, motivasi) selaras dengan latar belakang kandidat aktif.
- 🔒 **Safety Daily Quota:** Pembatasan maksimal 10 lamaran/hari per profil untuk menjaga reputasi dan mencegah limit platform.

---

## 🛠 Instalasi & Setup

1. **Prasyarat:** Node.js v20 atau v22+.
2. **Install Dependensi:**
   ```bash
   npm install
   ```
3. **Konfigurasi Environment (`.env`):**
   Salin `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```
   Lengkapi variabel berikut:
   * `DATABASE_URL`: Connection string PostgreSQL ([Neon Serverless](https://neon.tech/) direkomendasikan).
   * `GROQ_API_KEY`: Kunci API untuk LLM evaluator & resume tailor ([Groq Console](https://console.groq.com/)).
   * `ALLOW_LIVE_APPLY`: `"false"` untuk mode aman (*Strict Dry-Run*) atau `"true"` jika ingin mengizinkan submit live.
   * `SMTP_USER` & `SMTP_PASS`: Kredensial email (Gmail App Password) jika ingin menggunakan fitur kirim cold email rekruter.

4. **Migrasi Database & Sinkronisasi:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

---

## 🚀 Menjalankan Dashboard

Jalankan dev server:
```bash
npm run dev
```

Buka di browser:
👉 **`http://localhost:3001`**

### Alur Penggunaan Dashboard:
1. **Pilih Profil Kandidat:** Pilih **Pranata Pramudya** atau **Siti Fathonah** di tombol switcher navbar atas.
2. **Eksplorasi & Filter Loker:** Telusuri lowongan terkurasi berdasarkan skor kecocokan AI (High-Match $\ge$ 75%).
3. **Antrekan Loker:** Klik *"Antrekan"* pada lowongan yang disetujui.
4. **Eksekusi Auto-Apply:** Klik tombol *"⚡ Jalankan Auto-Apply"* di header (pilih *Strict Dry-Run* untuk simulasi aman).
5. **Kirim Email Langsung (Opsional):** Klik tombol *"Kirim Email"* pada kartu lowongan untuk review cover letter AI dan mengirimkan CV PDF langsung ke tim rekruter.
6. **Inspeksi Bukti:** Lihat foto tangkapan layar audit pengisian form pada tab detail lowongan.

---

## 💻 Pengujian & Eksekusi via Terminal (CLI)

```bash
# 1. Uji Coba Kompiler ATS Resume & Candidate Knowledge Base
npx tsx src/scripts/test-phase1.ts

# 2. Uji Coba Resilient Stealth & Dry-Run Apply Engine
npx tsx src/scripts/test-phase2.ts

# 3. Uji Coba Modul Auto-Email Dispatcher & Cover Letter
npx tsx src/scripts/test-email-dispatch.ts

# 4. Eksekusi Pelamaran CLI (Strict Dry-Run - Bawaan):
npx tsx src/scripts/run-apply.ts --limit=1

# 5. Eksekusi Pelamaran CLI (Live Submit Asli):
npx tsx src/scripts/run-apply.ts --production-submit --limit=1
```

---

## 📁 Struktur Direktori Utama

```text
├── assets/                  # Berkas CV PDF resmi terverifikasi (resume-primary & partner)
├── data/
│   └── candidate-knowledge.json  # Candidate Knowledge Base (Pranata & Siti Fathonah)
├── logs/
│   ├── resumes/             # PDF CV JIT hasil tailoring dinamis per lowongan
│   └── screenshots/         # Bukti tangkapan layar form audit trail (dry-run/applied/hitl)
├── prisma/
│   └── schema.prisma        # Skema database PostgreSQL
├── src/
│   ├── app/                 # Next.js 16 App Router & API Endpoints
│   ├── components/          # Command Center UI (JobHunterDashboard.tsx)
│   ├── services/
│   │   ├── action/          # Playwright Apply Engine, Stealth, Field Matcher, Form Resolver
│   │   ├── email/           # Cover Letter AI, SMTP Dispatcher, Lifecycle Tracker
│   │   ├── resume/          # JIT ATS Resume Tailor & Playwright PDF Renderer
│   │   ├── scraper/         # Multi-platform job crawlers (LinkedIn, Jobstreet, Kalibrr)
│   │   └── social-scraper/  # Social media job leads scraper (IG & TikTok)
│   └── scripts/             # Script automasi, pengujian bertahap, dan seeding
```

---

## 🛡️ Kebijakan Etis & Keamanan
Sistem ini mematuhi prinsip *Ethical AI Automation*:
- Tidak memalsukan pengalaman kerja (100% grounded ke profil nyata kandidat).
- Kuota harian terukur untuk menghormati kapasitas server platform penyedia kerja.
- *Strict Dry-Run by default* untuk memastikan kontrol penuh dan transparansi pelamar sebelum pengiriman data asli.