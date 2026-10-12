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

# 3. Discovery Lowongan baru (Khusus Pranata Pramudya)
"[$dateStr] Step 3: Menjalankan scraping & evaluasi lowongan baru untuk Pranata Pramudya..." | Out-File -FilePath $logFile -Append -Encoding utf8
npx tsx src/scripts/run-discovery.ts 41dbb7bd-8638-4fa7-80d7-dc968c6ad278 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

# 4. Action Engine Apply (Khusus Pranata Pramudya, kuota harian maksimal 5)
"[$dateStr] Step 4: Menjalankan proses pelamaran kerja untuk Pranata Pramudya..." | Out-File -FilePath $logFile -Append -Encoding utf8
npx tsx src/scripts/run-apply.ts --user=41dbb7bd-8638-4fa7-80d7-dc968c6ad278 --limit=5 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

$finishStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$finishStr] Selesai siklus pagi hari Auto-Apply Agent." | Out-File -FilePath $logFile -Append -Encoding utf8
"================================================================`n" | Out-File -FilePath $logFile -Append -Encoding utf8
