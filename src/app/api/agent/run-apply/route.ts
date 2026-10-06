import { config } from "../../../../config/env";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import PlaywrightApplyEngine from "@/services/action/apply-engine";

export const dynamic = "force-dynamic";
// Tingkatkan timeout maksimum route handler untuk otomasi Playwright
export const maxDuration = 120;

const DAILY_QUOTA_CAP = 10;
const MIN_RESUME_SIZE = 10 * 1024; // 10KB

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, jobListingId, limit = 1, dryRun = true } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Parameter userId wajib disertakan." },
        { status: 400 },
      );
    }

    // 1. Ambil Data User
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User tidak ditemukan di database." },
        { status: 404 },
      );
    }

    // 2. Pre-flight Check File Resume
    const absoluteResumePath = path.resolve(
      /*turbopackIgnore: true*/ process.cwd(),
      user.resumeLocalPath,
    );
    const resumeExists = fs.existsSync(absoluteResumePath);
    const resumeSize = resumeExists ? fs.statSync(absoluteResumePath).size : 0;

    const requestedLive = dryRun === false;
    const envAllowsLive = config.app.allowLiveApply;
    const isStrictDryRun = !(requestedLive && envAllowsLive);

    if ((!resumeExists || resumeSize < MIN_RESUME_SIZE) && !isStrictDryRun) {
      return NextResponse.json(
        {
          success: false,
          error:
            `[VERIFIKASI CV GAGAL] Berkas resume (${user.resumeLocalPath}) berukuran ${resumeSize} bytes (minimal 10KB). ` +
            `Ukuran berkas terlalu kecil atau belum lengkap. Harap unggah berkas CV PDF resmi Anda sebelum mengirim lamaran langsung.`,
        },
        { status: 400 },
      );
    }

    // 3. Verifikasi Batas Kuota Harian
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const appliedTodayCount = await prisma.jobListing.count({
      where: {
        userId: user.id,
        status: "APPLIED",
        appliedAt: { gte: startOfDay },
      },
    });

    if (appliedTodayCount >= DAILY_QUOTA_CAP && !isStrictDryRun) {
      return NextResponse.json(
        {
          success: false,
          error: `Batas kuota harian aman (${DAILY_QUOTA_CAP} lamaran/hari) untuk ${user.fullName} telah terpenuhi hari ini.`,
        },
        { status: 429 },
      );
    }

    // 4. Ambil Lowongan Target
    let candidateJobs = [];

    if (jobListingId) {
      const singleJob = await prisma.jobListing.findUnique({
        where: { id: jobListingId },
      });
      if (!singleJob || singleJob.userId !== user.id) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Lowongan spesifik tidak ditemukan atau bukan milik user ini.",
          },
          { status: 404 },
        );
      }
      candidateJobs = [singleJob];
    } else {
      const remainingQuota = isStrictDryRun
        ? Number(limit)
        : Math.min(Number(limit), DAILY_QUOTA_CAP - appliedTodayCount);

      // Utamakan yang ada di antrean (QUEUED_FOR_APPLY)
      candidateJobs = await prisma.jobListing.findMany({
        where: {
          userId: user.id,
          status: "QUEUED_FOR_APPLY",
        },
        orderBy: [{ matchScore: "desc" }, { createdAt: "desc" }],
        take: Math.max(1, remainingQuota),
      });

      // Jika tidak ada di antrean dan bukan live submit, ambil yang statusnya DISCOVERED
      if (candidateJobs.length === 0 && isStrictDryRun) {
        candidateJobs = await prisma.jobListing.findMany({
          where: {
            userId: user.id,
            status: "DISCOVERED",
          },
          orderBy: [{ matchScore: "desc" }, { createdAt: "desc" }],
          take: Math.max(1, remainingQuota),
        });
      }
    }

    if (candidateJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tidak ada lowongan dalam antrean yang siap diproses.",
        results: [],
        processedCount: 0,
      });
    }

    // 5. Inisialisasi Playwright Apply Engine
    const engine = new PlaywrightApplyEngine();
    const executionResults = [];

    for (const job of candidateJobs) {
      console.log(
        `\n[API /api/agent/run-apply] Memproses: "${job.title}" @ ${job.companyName}`,
      );

      // Tandai status sementara: APPLYING
      await prisma.jobListing
        .update({
          where: { id: job.id },
          data: { status: "APPLYING" },
        })
        .catch(() => {});

      const result = await engine.applyToJob(
        {
          id: job.id,
          title: job.title,
          companyName: job.companyName,
          jobUrl: job.jobUrl,
          description: job.description,
        },
        {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          city: user.city,
          linkedInUrl: user.linkedInUrl,
          githubUrl: user.githubUrl,
          portfolioUrl: user.portfolioUrl,
          expectedSalary: user.expectedSalary,
          targetRoles: user.targetRoles,
          coreSkills: user.coreSkills,
          resumeLocalPath: user.resumeLocalPath,
        },
        {
          dryRun: isStrictDryRun,
          headless: true,
        },
      );

      // Perbarui status database sesuai hasil
      if (result.success) {
        if (!isStrictDryRun) {
          await prisma.jobListing.update({
            where: { id: job.id },
            data: {
              status: "APPLIED",
              appliedAt: new Date(),
              failureReason: null,
            },
          });
        } else {
          // Tetap QUEUED_FOR_APPLY jika sebelumnya memang antre, atau kembalikan ke DISCOVERED
          const finalStatus =
            job.status === "QUEUED_FOR_APPLY"
              ? "QUEUED_FOR_APPLY"
              : "DISCOVERED";
          await prisma.jobListing.update({
            where: { id: job.id },
            data: {
              status: finalStatus,
              failureReason: `[Simulasi Dry-Run Berhasil] Terisi ${result.fieldsFilled} field & CV terinjeksi.`,
            },
          });
        }
      } else {
        await prisma.jobListing.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            failureReason:
              result.error || "Gagal mengeksekusi automasi pelamaran.",
          },
        });
      }

      // Ambil nama file screenshot murni jika ada
      const screenshotFilename = result.screenshotPath
        ? path.basename(result.screenshotPath)
        : null;

      executionResults.push({
        jobListingId: job.id,
        title: job.title,
        companyName: job.companyName,
        jobUrl: job.jobUrl,
        success: result.success,
        dryRun: result.dryRun,
        fieldsFilled: result.fieldsFilled,
        screenshotFilename,
        screenshotUrl: screenshotFilename
          ? `/api/screenshots/${screenshotFilename}`
          : null,
        error: result.error,
        details: result.details,
      });
    }

    const successCount = executionResults.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      message: isStrictDryRun
        ? `Simulasi Dry-Run selesai: ${successCount} dari ${executionResults.length} lowongan berhasil diisi formnya.`
        : `Eksekusi Live Apply selesai: ${successCount} dari ${executionResults.length} lowongan berhasil dikirim.`,
      mode: isStrictDryRun ? "DRY_RUN" : "LIVE_SUBMIT",
      processedCount: executionResults.length,
      results: executionResults,
    });
  } catch (error: any) {
    console.error("[API /api/agent/run-apply] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Terjadi kesalahan internal server saat menjalankan agent.",
      },
      { status: 500 },
    );
  }
}
