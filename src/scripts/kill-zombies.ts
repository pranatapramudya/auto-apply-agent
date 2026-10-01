import { spawnSync } from 'child_process';
import os from 'os';

interface ProcessInfo {
  pid: number;
  name: string;
  path?: string;
}

/**
 * Utility Script: Kill Zombie Chromium / Playwright Processes
 * Membersihkan proses zombie Chromium/Playwright yang tersisa di background
 * untuk mencegah memory leak dan freeze PC tanpa mengganggu browser utama user.
 */
export async function cleanupZombieProcesses(options: { killAllChrome?: boolean } = {}) {
  const isWindows = process.platform === 'win32';
  console.log('====================================================');
  console.log('🛡️  PLAYWRIGHT & CHROMIUM ZOMBIE CLEANUP GUARD');
  console.log('====================================================');
  console.log(`OS Platform: ${process.platform} (${os.release()})`);
  console.log(`Filter Mode: ${options.killAllChrome ? 'FORCE ALL CHROME/CHROMIUM' : 'SMART (Target Playwright / ms-playwright only)'}\n`);

  const zombies: ProcessInfo[] = [];

  if (isWindows) {
    try {
      // Query proses chrome/chromium menggunakan spawnSync (menghindari quoting issue cmd.exe)
      const script = `
        $procs = Get-Process | Where-Object { $_.ProcessName -match 'chrome|chromium|headless_shell' }
        if ($procs) {
          $procs | ForEach-Object {
            $p = ''
            try { $p = $_.Path } catch {}
            [PSCustomObject]@{
              pid = $_.Id
              name = $_.ProcessName
              path = $p
            }
          } | ConvertTo-Json -Compress
        }
      `;

      const res = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
        encoding: 'utf-8',
        timeout: 10000
      });

      const stdout = (res.stdout || '').trim();
      if (stdout) {
        let parsed: any;
        try {
          parsed = JSON.parse(stdout);
        } catch {
          parsed = null;
        }

        const list = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];

        for (const item of list) {
          const pid = Number(item.pid);
          const name = String(item.name || '');
          const execPath = String(item.path || '').toLowerCase();

          // Deteksi apakah proses berasal dari Playwright:
          // 1. Path berada di folder ms-playwright
          // 2. Atau jika mode killAllChrome diaktifkan
          const isPlaywright = execPath.includes('ms-playwright') || name.includes('headless');

          if (options.killAllChrome || isPlaywright) {
            zombies.push({
              pid,
              name,
              path: item.path
            });
          }
        }
      }
    } catch (e: any) {
      console.warn('⚠️ Gagal mendeteksi proses di Windows:', e.message);
    }
  } else {
    // Linux / macOS
    try {
      const res = spawnSync('pgrep', ['-f', 'ms-playwright|playwright'], {
        encoding: 'utf-8',
        timeout: 5000
      });

      const pids = (res.stdout || '')
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean)
        .map(Number);

      for (const pid of pids) {
        if (pid !== process.pid) {
          zombies.push({ pid, name: 'chromium/playwright' });
        }
      }
    } catch {
      // ignore
    }
  }

  if (zombies.length === 0) {
    console.log('✅ Tidak ada proses zombie Chromium/Playwright yang terdeteksi di memori.');
    console.log('   Sistem dalam kondisi bersih dan optimal.\n');
    return;
  }

  console.log(`⚠️ Terdeteksi ${zombies.length} proses Playwright/Chromium yang masih aktif:`);
  let killedCount = 0;

  for (const proc of zombies) {
    console.log(`   - PID: ${proc.pid} | ${proc.name} ${proc.path ? `(${proc.path})` : ''}`);
    try {
      if (isWindows) {
        spawnSync('taskkill.exe', ['/F', '/PID', String(proc.pid)], { timeout: 5000 });
      } else {
        process.kill(proc.pid, 'SIGKILL');
      }
      killedCount++;
      console.log(`     -> ✅ Berhasil dihentikan.`);
    } catch (err: any) {
      console.warn(`     -> ❌ Gagal menghentikan PID ${proc.pid}: ${err.message}`);
    }
  }

  console.log(`\n🎉 Pembersihan selesai: ${killedCount} dari ${zombies.length} proses berhasil dimatikan.\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const killAll = args.includes('--all') || args.includes('-a');
  await cleanupZombieProcesses({ killAllChrome: killAll });
}

main().catch((err) => {
  console.error('Fatal error during zombie cleanup:', err);
  process.exit(1);
});
