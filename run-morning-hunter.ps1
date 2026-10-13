# run-morning-hunter.ps1
# Runner Otomatis Lowongan Kerja Pagi Hari (Khusus Pranata Pramudya)

$ErrorActionPreference = "Continue"
$projectDir = "D:\Coding\auto-apply-agent"
Set-Location $projectDir

$logFile = "$projectDir\logs\morning-hunter.log"
if (!(Test-Path "$projectDir\logs")) {
    New-Item -ItemType Directory -Path "$projectDir\logs" -Force | Out-Null
}

$dateStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"================================================================" | Out-File -FilePath $logFile -Append -Encoding utf8
"[$dateStr] MEMULAI AUTO-APPLY AGENT PAGI HARI" | Out-File -FilePath $logFile -Append -Encoding utf8
"TARGET: Khusus Pranata Pramudya (Siti Fathonah DILEWATI)" | Out-File -FilePath $logFile -Append -Encoding utf8
"================================================================" | Out-File -FilePath $logFile -Append -Encoding utf8

# 1. Bersihkan zombie process
"[$dateStr] Step 1: Membersihkan background zombie process..." | Out-File -FilePath $logFile -Append -Encoding utf8
npx tsx src/scripts/kill-zombies.ts 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

# 2. Verifikasi status user (Pranata: AKTIF, Siti: NON-AKTIF)
"[$dateStr] Step 2: Verifikasi status profil user..." | Out-File -FilePath $logFile -Append -Encoding utf8
npx tsx src/scripts/ensure-active-user.ts 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

# 3. Discovery Lowongan baru (Portal Kalibrr & Aggregator)
"[$dateStr] Step 3: Menjalankan scraping & evaluasi lowongan baru portal..." | Out-File -FilePath $logFile -Append -Encoding utf8
npx tsx src/scripts/run-discovery.ts 41dbb7bd-8638-4fa7-80d7-dc968c6ad278 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

# 4. Social Media & Regional Scraping (Instagram/TikTok Loker Sumedang & Bandung)
"[$dateStr] Step 4: Menjalankan ekstraksi loker media sosial & kontak HRD..." | Out-File -FilePath $logFile -Append -Encoding utf8
npx tsx src/scripts/test-social-scrape.ts 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

# 5. Direct-to-HRD Email Auto-Apply (Pengiriman Resmi via Gmail SMTP, kuota aman 3/hari)
"[$dateStr] Step 5: Mengirimkan email lamaran kerja resmi ke HRD terverifikasi..." | Out-File -FilePath $logFile -Append -Encoding utf8
npx tsx src/scripts/run-email-apply.ts --user=41dbb7bd-8638-4fa7-80d7-dc968c6ad278 --limit=3 --live 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

# 6. Action Engine Web Portal (Dry-Run / Safe Queue)
"[$dateStr] Step 6: Evaluasi antrean portal web..." | Out-File -FilePath $logFile -Append -Encoding utf8
npx tsx src/scripts/run-apply.ts --user=41dbb7bd-8638-4fa7-80d7-dc968c6ad278 --limit=5 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

$finishStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$finishStr] Selesai siklus pagi hari Auto-Apply Agent." | Out-File -FilePath $logFile -Append -Encoding utf8
"================================================================`n" | Out-File -FilePath $logFile -Append -Encoding utf8
