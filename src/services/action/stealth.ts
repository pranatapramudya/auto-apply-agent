import { Page } from 'playwright';

/**
 * Modul Anti-Bot Stealth Evasion & Human-like Actions:
 * Menghilangkan jejak otomasi Playwright / Chromium standar untuk meminimalkan
 * deteksi oleh Cloudflare Turnstile, Datadome, reCAPTCHA v3, dan Akamai.
 */

export async function applyStealthEvasions(page: Page): Promise<void> {
  // 1. Injeksi script bypass sebelum halaman termuat
  await page.addInitScript(() => {
    // A. Hapus navigator.webdriver flag
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });

    // B. Emulasi objek window.chrome
    (window as any).chrome = {
      app: {
        isInstalled: false,
        InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
        RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
      },
      runtime: {
        OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install', SHARED_MODULE_UPDATE: 'shared_module_update', UPDATE: 'update' },
        OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' },
        PlatformArch: { ARM: 'arm', ARM64: 'arm64', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
        PlatformNaclArch: { ARM: 'arm', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
        PlatformOs: { ANDROID: 'android', CROS: 'cros', LINUX: 'linux', MAC: 'mac', OPENBSD: 'openbsd', WIN: 'win' },
        RequestUpdateCheckStatus: { NO_UPDATE: 'no_update', THROTTLED: 'throttled', UPDATE_AVAILABLE: 'update_available' }
      }
    };

    // C. Emulasi languages dan plugins realistis
    Object.defineProperty(navigator, 'languages', {
      get: () => ['id-ID', 'id', 'en-US', 'en']
    });

    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        {
          0: { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' },
          description: 'Portable Document Format',
          filename: 'internal-pdf-viewer',
          length: 1,
          name: 'Chrome PDF Plugin'
        },
        {
          0: { type: 'application/pdf', suffixes: 'pdf', description: '' },
          description: '',
          filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
          length: 1,
          name: 'Chrome PDF Viewer'
        }
      ]
    });

    // D. Normalisasi permissions query (Notification)
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: any) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
        : originalQuery(parameters);
  });
}

/**
 * Human-like mouse movement menggunakan kurva interpolasi natural (Bézier simulation)
 */
export async function humanMoveMouse(page: Page, targetX: number, targetY: number): Promise<void> {
  // Posisi awal acak di area viewport jika belum ada
  const startX = Math.floor(Math.random() * 200) + 100;
  const startY = Math.floor(Math.random() * 200) + 100;

  const steps = 8 + Math.floor(Math.random() * 6);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // Cubic bezier ease-in-out approximation
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const currentX = startX + (targetX - startX) * ease + (Math.random() * 4 - 2);
    const currentY = startY + (targetY - startY) * ease + (Math.random() * 4 - 2);
    await page.mouse.move(currentX, currentY);
    await page.waitForTimeout(10 + Math.floor(Math.random() * 15));
  }
}

/**
 * Pengetikan yang menyerupai ritme pengetikan manusia dengan variasi jeda per karakter
 */
export async function humanTypeIntoField(page: Page, selector: string, text: string): Promise<void> {
  const element = await page.$(selector);
  if (!element) return;

  const box = await element.boundingBox();
  if (box) {
    await humanMoveMouse(page, box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  } else {
    await page.focus(selector);
  }

  // Bersihkan field jika sudah ada teks
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');

  for (const char of text) {
    await page.keyboard.type(char, {
      delay: Math.floor(Math.random() * 50) + 35
    });
    // Kadang ada jeda singkat seperti manusia sedang berpikir
    if (Math.random() < 0.08) {
      await page.waitForTimeout(Math.floor(Math.random() * 150) + 80);
    }
  }

  await page.waitForTimeout(Math.floor(Math.random() * 200) + 100);
}
