import { config } from "../../config/env";
import { chromium, Browser, BrowserContext, Page } from "playwright";
import fs from "fs";
import path from "path";
import {
  identifyFieldType,
  getStandardFieldValue,
  isHoneypotField,
  FieldElementInfo,
} from "./field-matcher";
import { resolveFormQuestion } from "./form-resolver";
import { applyStealthEvasions, humanTypeIntoField } from "./stealth";
import { generateTailoredResumeData } from "../resume/resume-tailor";
import { renderResumeToPdf } from "../resume/pdf-generator";

export interface ApplyEngineOptions {
  dryRun?: boolean;
  headless?: boolean;
  useTailoredResume?: boolean;
}

export interface ApplyResult {
  success: boolean;
  dryRun: boolean;
  jobListingId: string;
  jobUrl: string;
  appliedAt?: Date;
  screenshotPath?: string;
  fieldsFilled: number;
  resumeUsed?: string;
  error?: string;
  details?: string;
  hitlRequired?: boolean;
}

export interface JobToApply {
  id: string;
  title: string;
  companyName: string;
  jobUrl: string;
  description: string;
}

export interface UserToApply {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  linkedInUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  expectedSalary?: number | null;
  targetRoles: string;
  coreSkills: string;
  resumeLocalPath: string;
}

/**
 * Playwright Action Engine:
 * Menavigasi lowongan kerja, mengidentifikasi formulir pelamaran, menginjeksi biodata,
 * mengunggah CV, dan menjawab pertanyaan kuesioner screening.
 */
export class PlaywrightApplyEngine {
  private ensureDirectories() {
    const screenshotDir = path.resolve(process.cwd(), "logs", "screenshots");
    const errorDir = path.resolve(process.cwd(), "logs", "errors");
    if (!fs.existsSync(screenshotDir))
      fs.mkdirSync(screenshotDir, { recursive: true });
    if (!fs.existsSync(errorDir)) fs.mkdirSync(errorDir, { recursive: true });
  }

  async applyToJob(
    job: JobToApply,
    user: UserToApply,
    options: ApplyEngineOptions = { dryRun: true, headless: true },
  ): Promise<ApplyResult> {
    this.ensureDirectories();

    const timestamp = Date.now();

    // 1. SAFETY KILLSWITCH & DRY-RUN ENFORCEMENT
    // Dry-run selalu AKTIF secara default, kecuali jika opsi dryRun: false DAN ALLOW_LIVE_APPLY=true di .env
    const requestedLive = options.dryRun === false;
    const envAllowsLive = config.app.allowLiveApply;

    let isDryRun = true;
    if (requestedLive) {
      if (envAllowsLive) {
        isDryRun = false;
      } else {
        console.warn(
          '⚠️ [SAFETY-KILLSWITCH] Permintaan submit live DITOLAK karena ALLOW_LIVE_APPLY != "true" di .env!',
        );
        console.warn(
          "   Sistem secara otomatis mengalihkan ke mode aman (DRY-RUN).",
        );
        isDryRun = true;
      }
    }

    // 2. ATS DYNAMIC RESUME GENERATION & PRE-FLIGHT CHECK
    let effectiveResumePath = user.resumeLocalPath;

    // Jika opsi useTailoredResume aktif (default: true), buat CV PDF yang disesuaikan ATS secara on-the-fly
    if (options.useTailoredResume !== false) {
      try {
        console.log(
          `[APPLY-ENGINE] 🤖 Menghasilkan dynamic ATS-tailored resume untuk: "${job.title}"...`,
        );
        const tailoredData = await generateTailoredResumeData({
          candidateName: user.fullName,
          candidateEmail: user.email,
          candidatePhone: user.phone,
          candidateCity: user.city,
          targetRoles: user.targetRoles,
          coreSkills: user.coreSkills,
          portfolioUrl: user.portfolioUrl,
          linkedInUrl: user.linkedInUrl,
          githubUrl: user.githubUrl,
          jobTitle: job.title,
          companyName: job.companyName,
          jobDescription: job.description,
        });
        const tailoredPdf = await renderResumeToPdf(tailoredData, job.id);
        effectiveResumePath = tailoredPdf.pdfRelativePath;
        console.log(
          `[APPLY-ENGINE] ✅ ATS-tailored resume siap: ${effectiveResumePath} (${(tailoredPdf.fileSizeBytes / 1024).toFixed(1)} KB)`,
        );
      } catch (err: any) {
        console.warn(
          `[APPLY-ENGINE] Peringatan: Gagal generate tailored resume, fallback ke resume statis:`,
          err.message,
        );
      }
    }

    const absoluteResumePath = path.resolve(process.cwd(), effectiveResumePath);
    const resumeExists = fs.existsSync(absoluteResumePath);
    const resumeStats = resumeExists ? fs.statSync(absoluteResumePath) : null;
    const resumeSize = resumeStats ? resumeStats.size : 0;
    const MIN_RESUME_SIZE = 10 * 1024; // 10KB

    if (!resumeExists || resumeSize < MIN_RESUME_SIZE) {
      if (!isDryRun) {
        throw new Error(
          `[VERIFIKASI CV GAGAL] Berkas resume (${effectiveResumePath}) berukuran ${resumeSize} bytes (minimal 10KB). ` +
            `Ukuran berkas terlalu kecil atau belum lengkap. Harap perbarui berkas "${effectiveResumePath}" dengan PDF CV resmi Anda sebelum mengirim lamaran langsung.`,
        );
      } else {
        console.warn(
          `⚠️ [VERIFIKASI CV] Ukuran berkas resume (${resumeSize} bytes) < 10KB. Melanjutkan simulasi pengisian formulir.`,
        );
      }
    }

    const result: ApplyResult = {
      success: false,
      dryRun: isDryRun,
      jobListingId: job.id,
      jobUrl: job.jobUrl,
      resumeUsed: effectiveResumePath,
      fieldsFilled: 0,
    };

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;

    console.log(
      `\n[APPLY-ENGINE] Memulai aplikasi untuk: "${job.title}" @ ${job.companyName}`,
    );
    console.log(
      `[APPLY-ENGINE] Mode: ${isDryRun ? "DRY-RUN (Aman, Tanpa Submit Akhir)" : "🚨 LIVE (SUBMIT AKTIF)"}`,
    );
    console.log(`[APPLY-ENGINE] Pelamar: ${user.fullName} (${user.email})`);
    console.log(
      `[APPLY-ENGINE] Resume : ${effectiveResumePath} (${(resumeSize / 1024).toFixed(1)} KB)`,
    );

    try {
      browser = await chromium.launch({
        headless: options.headless !== false,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-blink-features=AutomationControlled",
        ],
      });

      context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 800 },
        locale: "id-ID",
      });

      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      page.setDefaultNavigationTimeout(45000);

      // Injeksi Anti-Detection Stealth Evasions
      await applyStealthEvasions(page);

      // Navigasi ke URL lowongan
      console.log(`[APPLY-ENGINE] Navigasi ke: ${job.jobUrl}`);
      await page.goto(job.jobUrl, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await page.waitForTimeout(2000);

      // Deteksi dini Bot Barrier / CAPTCHA (Cloudflare Turnstile, reCAPTCHA, hCaptcha, Arkose)
      const captchaChallenge = await page.$(
        'iframe[src*="cloudflare"], iframe[src*="recaptcha"], iframe[src*="turnstile"], iframe[src*="hcaptcha"], div[class*="cf-turnstile"], div[id*="recaptcha"], div[class*="g-recaptcha"]',
      );
      if (captchaChallenge) {
        const isChallengeVisible = await captchaChallenge
          .isVisible()
          .catch(() => false);
        if (isChallengeVisible) {
          console.warn(
            "⚠️ [HITL-ALERT] Bot Challenge / CAPTCHA terdeteksi di portal lowongan!",
          );
          result.hitlRequired = true;
          result.details =
            "Bot Challenge / CAPTCHA terdeteksi. Memerlukan intervensi Human-in-The-Loop.";
        }
      }

      // 1. Cek tombol pemicu form (misal tombol "Apply", "Apply Now", "Lamar Pekerjaan")
      const applyButtonSelector = [
        'button:has-text("Apply")',
        'a:has-text("Apply")',
        'button:has-text("Lamar")',
        'a:has-text("Lamar")',
        'button:has-text("Apply for job")',
        'a:has-text("Apply for job")',
      ].join(", ");

      const applyButton = await page.$(applyButtonSelector);
      if (applyButton) {
        const isVisible = await applyButton.isVisible().catch(() => false);
        if (isVisible) {
          const buttonText = await applyButton.textContent();
          console.log(
            `[APPLY-ENGINE] Menemukan tombol pemicu aplikasi: "${buttonText?.trim()}". Mengklik...`,
          );

          // Cek jika link eksternal
          const href = await applyButton.getAttribute("href");
          if (href && (href.startsWith("http") || href.startsWith("/"))) {
            const targetUrl = href.startsWith("http")
              ? href
              : new URL(href, page.url()).toString();
            // Jika link mengarah ke auth/login platform, tangani secara graceful
            if (targetUrl.includes("/auth") || targetUrl.includes("/login")) {
              console.log(
                `[APPLY-ENGINE] Peringatan: Halaman pelamaran membutuhkan otentikasi/login platform (${targetUrl}).`,
              );
            }
          }

          await applyButton.click().catch(() => {});
          await page.waitForTimeout(2500);
        }
      }

      // 2. MULTI-STEP FORM WIZARD LOOP (Maksimal 5 langkah navigasi form)
      const MAX_FORM_STEPS = 5;
      let currentStep = 1;

      while (currentStep <= MAX_FORM_STEPS) {
        console.log(
          `\n[APPLY-ENGINE] --- Memproses Form Langkah ${currentStep} ---`,
        );

        // A. Upload File Resume jika ada di langkah ini
        const resolvedResumePath = path.resolve(
          process.cwd(),
          effectiveResumePath,
        );
        const fileInputs = await page.$$('input[type="file"]');
        if (fileInputs.length > 0 && fs.existsSync(resolvedResumePath)) {
          console.log(
            `[APPLY-ENGINE] Mengunggah file resume (${effectiveResumePath})...`,
          );
          for (const fileInput of fileInputs) {
            const isVis = await fileInput.isVisible().catch(() => true);
            if (isVis) {
              await fileInput.setInputFiles(resolvedResumePath).catch(() => {});
              result.fieldsFilled++;
              console.log(
                "  -> ✅ File resume berhasil diinjeksi ke input file.",
              );
            }
          }
        }

        // B. Deteksi form inputs pada langkah aktif
        const formInputs = await page.$$(
          'input:not([type="hidden"]), textarea, select',
        );
        console.log(
          `[APPLY-ENGINE] Terdeteksi ${formInputs.length} elemen input/textarea/select pada langkah ${currentStep}.`,
        );

        for (const inputEl of formInputs) {
          const isVisible = await inputEl.isVisible().catch(() => false);
          if (!isVisible) continue;

          const tagName = await inputEl.evaluate((el) =>
            el.tagName.toLowerCase(),
          );
          const inputType =
            (await inputEl.getAttribute("type")) ||
            (tagName === "textarea" ? "textarea" : "text");

          if (
            inputType === "file" ||
            inputType === "submit" ||
            inputType === "button"
          )
            continue;

          // Ekstraksi info field, label, computed style, dan koordinat bounding box
          const fieldInfo: FieldElementInfo = await inputEl.evaluate((el) => {
            const id = el.id;
            const name = el.getAttribute("name") || "";
            const placeholder = el.getAttribute("placeholder") || "";
            const ariaLabel = el.getAttribute("aria-label") || "";
            const autocomplete = el.getAttribute("autocomplete") || "";
            const role = el.getAttribute("role") || "";
            const tabindex = el.getAttribute("tabindex") || "";

            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            const isOffscreen = rect.left < -50 || rect.top < -50;

            let labelText = "";
            if (id) {
              const labelEl = document.querySelector(`label[for="${id}"]`);
              if (labelEl) labelText = labelEl.textContent || "";
            }
            if (!labelText) {
              const closestLabel = el.closest("label");
              if (closestLabel) labelText = closestLabel.textContent || "";
            }

            return {
              tag: el.tagName,
              type: (el as HTMLInputElement).type || "",
              name,
              id,
              placeholder,
              ariaLabel,
              labelText: labelText.trim(),
              autocomplete,
              role,
              tabindex,
              isOffscreen,
              computedDisplay: style.display,
              computedVisibility: style.visibility,
              computedOpacity: style.opacity,
              width: rect.width,
              height: rect.height,
            };
          });

          // 🛡️ ANTI-BOT HONEYPOT DEFENSE: Abaikan field jebakan jika terdeteksi
          if (isHoneypotField(fieldInfo)) {
            console.log(
              `  -> 🛡️ [ANTI-BOT] Mengabaikan Honeypot Trap field: "${fieldInfo.name || fieldInfo.id || "decoy"}"`,
            );
            continue;
          }

          const standardType = identifyFieldType(fieldInfo);
          if (standardType === "HONEYPOT_TRAP") {
            console.log(
              `  -> 🛡️ [ANTI-BOT] Mengabaikan Honeypot Trap field (StandardType match)`,
            );
            continue;
          }

          // Jika cocok dengan field standar biodata
          if (standardType !== "UNKNOWN") {
            const value = getStandardFieldValue(standardType, user);
            if (value) {
              const selector = fieldInfo.id
                ? `#${fieldInfo.id}`
                : fieldInfo.name
                  ? `[name="${fieldInfo.name}"]`
                  : null;
              if (selector) {
                await humanTypeIntoField(page, selector, value);
                result.fieldsFilled++;
                console.log(`  -> ✍️ Field terisi [${standardType}]: ${value}`);
              }
            }
          } else {
            // Field Kuesioner / Pertanyaan Screening Kustom -> Selesaikan via AI Persona
            const questionText =
              fieldInfo.labelText ||
              fieldInfo.placeholder ||
              fieldInfo.ariaLabel ||
              fieldInfo.name;
            if (questionText && questionText.length > 3) {
              console.log(
                `  -> 🤖 Menyelesaikan pertanyaan screening AI: "${questionText}"...`,
              );

              let optionsList: string[] = [];
              if (tagName === "select") {
                optionsList = await inputEl.$$eval("option", (opts) =>
                  opts.map((o) => o.textContent?.trim() || "").filter(Boolean),
                );
              }

              const aiAnswer = await resolveFormQuestion({
                question: questionText,
                fieldType: inputType,
                options: optionsList,
                placeholder: fieldInfo.placeholder,
                jobContext: {
                  title: job.title,
                  companyName: job.companyName,
                  description: job.description,
                },
                user: {
                  fullName: user.fullName,
                  targetRoles: user.targetRoles,
                  coreSkills: user.coreSkills,
                  city: user.city,
                  portfolioUrl: user.portfolioUrl,
                  githubUrl: user.githubUrl,
                  linkedInUrl: user.linkedInUrl,
                  expectedSalary: user.expectedSalary,
                },
              });

              const selector = fieldInfo.id
                ? `#${fieldInfo.id}`
                : fieldInfo.name
                  ? `[name="${fieldInfo.name}"]`
                  : null;
              if (selector) {
                if (tagName === "select") {
                  await inputEl
                    .selectOption({ label: aiAnswer })
                    .catch(() => inputEl.selectOption({ index: 1 }));
                } else {
                  await humanTypeIntoField(page, selector, aiAnswer);
                }
                result.fieldsFilled++;
                console.log(`     Jawaban AI: "${aiAnswer.slice(0, 80)}..."`);
              }
            }
          }
        }

        // C. Modern ATS Combobox / Custom Select Dropdown Support (Greenhouse, Lever, Ashby, Radix UI)
        try {
          const customCombos = await page.$$('[role="combobox"]:not(input)');
          for (const combo of customCombos) {
            const isComboVisible = await combo.isVisible().catch(() => false);
            if (!isComboVisible) continue;

            const comboLabel =
              (await combo.getAttribute("aria-label")) ||
              (await combo.textContent()) ||
              "";
            if (comboLabel && !comboLabel.includes("Terpilih")) {
              console.log(
                `  -> 🎯 Menangani Modern ATS Combobox: "${comboLabel.trim().slice(0, 40)}"`,
              );
              await combo.click().catch(() => {});
              await page.waitForTimeout(500);

              // Cari opsi pertama yang valid di popup listbox
              const firstOption = await page.$(
                '[role="option"]:not([aria-disabled="true"])',
              );
              if (firstOption) {
                const optText = (await firstOption.textContent())?.trim() || "";
                await firstOption.click().catch(() => {});
                result.fieldsFilled++;
                console.log(`     -> Opsi terpilih: "${optText}"`);
              }
            }
          }
        } catch (comboErr: any) {
          // Non-blocking graceful fallback
        }

        // D. Cek apakah ada tombol "Next / Selanjutnya / Continue / Lanjut" (Bukan tombol Submit Akhir)
        const nextButtonSelector = [
          'button:has-text("Next")',
          'button:has-text("Lanjut")',
          'button:has-text("Selanjutnya")',
          'button:has-text("Continue")',
          'button:has-text("Save & Continue")',
          'button:has-text("Step ")',
          'a:has-text("Next")',
          'a:has-text("Lanjut")',
        ].join(", ");

        const nextButton = await page.$(nextButtonSelector);
        let navigatedToNextStep = false;

        if (nextButton) {
          const isNextVisible = await nextButton.isVisible().catch(() => false);
          const nextText =
            (await nextButton.textContent().catch(() => ""))
              ?.trim()
              .toLowerCase() || "";

          // Pastikan bukan tombol submit akhir
          const isFinalSubmit =
            nextText.includes("submit") ||
            nextText.includes("kirim") ||
            nextText.includes("apply");

          if (isNextVisible && !isFinalSubmit) {
            console.log(
              `[APPLY-ENGINE] Menemukan tombol langkah berikutnya: "${nextText}". Menavigasi...`,
            );
            await nextButton.click().catch(() => {});
            await page.waitForTimeout(3000);
            navigatedToNextStep = true;
          }
        }

        if (!navigatedToNextStep) {
          console.log(
            "[APPLY-ENGINE] Tidak ada langkah bertahap berikutnya. Telah mencapai langkah formulir akhir.",
          );
          break;
        }

        currentStep++;
      }

      // 5. Tangkap Bukti Screenshot (Terutama pada mode DRY-RUN atau saat terdeteksi tantangan HITL)
      const screenshotPrefix = result.hitlRequired
        ? "hitl-challenge"
        : isDryRun
          ? "dry-run"
          : "applied";
      const screenshotFilename = `${screenshotPrefix}-${job.id}-${timestamp}.png`;
      const screenshotRelativePath = `logs/screenshots/${screenshotFilename}`;
      const screenshotFullPath = path.resolve(
        process.cwd(),
        screenshotRelativePath,
      );

      await page.screenshot({ path: screenshotFullPath, fullPage: true });
      result.screenshotPath = screenshotRelativePath;
      console.log(
        `[APPLY-ENGINE] Screenshot bukti form disimpan ke: ${screenshotRelativePath}`,
      );

      // 6. Submit Akhir (Hanya jika BUKAN mode Dry-Run dan Lolos Safety Killswitch)
      if (!isDryRun) {
        console.log("[APPLY-ENGINE] Melakukan submit akhir...");
        const submitButtonSelector = [
          'button[type="submit"]',
          'input[type="submit"]',
          'button:has-text("Submit")',
          'button:has-text("Kirim Lamaran")',
          'button:has-text("Submit Application")',
        ].join(", ");

        const submitBtn = await page.$(submitButtonSelector);
        if (submitBtn) {
          await submitBtn.click();
          await page.waitForTimeout(5000);
          console.log("[APPLY-ENGINE] ✅ Form berhasil di-submit.");
          result.appliedAt = new Date();
          result.success = true;
        } else {
          result.details =
            "Form terisi namun tombol submit akhir tidak ditemukan.";
          result.success = true; // Dianggap berhasil mengisi
        }
      } else {
        console.log(
          "[APPLY-ENGINE] 🛑 MODE DRY-RUN: Berhenti sebelum klik submit akhir.",
        );
        result.success = true;
        result.details = `Dry-run berhasil mengisi ${result.fieldsFilled} field dan mengunggah CV.`;
      }

      return result;
    } catch (err: any) {
      console.error(`[APPLY-ENGINE] ❌ Gagal mengeksekusi apply:`, err.message);

      // Tangkap screenshot error untuk audit
      const errorScreenshotPath = `logs/errors/error-${job.id}-${timestamp}.png`;
      if (context) {
        const pages = context.pages();
        if (pages.length > 0) {
          await pages[0]
            .screenshot({
              path: path.resolve(process.cwd(), errorScreenshotPath),
            })
            .catch(() => {});
        }
      }

      result.success = false;
      result.error = err.message;
      result.screenshotPath = errorScreenshotPath;
      return result;
    } finally {
      // Pastikan context dan browser selalu ditutup untuk mencegah zombie process / memory leak
      if (context) {
        try {
          await context.close();
        } catch (closeContextErr: any) {
          console.warn(
            "[APPLY-ENGINE] Peringatan saat menutup BrowserContext:",
            closeContextErr?.message,
          );
        }
      }
      if (browser) {
        try {
          await browser.close();
        } catch (closeBrowserErr: any) {
          console.warn(
            "[APPLY-ENGINE] Peringatan saat menutup Browser:",
            closeBrowserErr?.message,
          );
        }
      }
    }
  }
}

export default PlaywrightApplyEngine;
