import prisma from '../lib/prisma';
import { RawJobListing } from './scraper/types';
import { evaluateJob, JobEvaluationResult } from './job-evaluator';

export interface IngestedJobDetail {
  id: string;
  title: string;
  companyName: string;
  jobUrl: string;
  status: 'DISCOVERED' | 'FILTERED_OUT';
  isLegit: boolean;
  matchScore: number | null;
  reason?: string | null;
}

export interface IngestionSummary {
  userId: string;
  totalReceived: number;
  inserted: number;
  skippedDuplicates: number;
  passedEvaluation: number;
  filteredOut: number;
  details: IngestedJobDetail[];
}

/**
 * Pipeline Ingestion & Deduplikasi:
 * Memproses lowongan hasil scraping, mengecek duplikasi per user, menyimpannya ke database,
 * dan langsung mengevaluasinya melalui Dual-Layer Intelligence Filter.
 */
export async function ingestRawJobs(
  userId: string,
  rawJobs: RawJobListing[]
): Promise<IngestionSummary> {
  const summary: IngestionSummary = {
    userId,
    totalReceived: rawJobs.length,
    inserted: 0,
    skippedDuplicates: 0,
    passedEvaluation: 0,
    filteredOut: 0,
    details: []
  };

  console.log(`\n[INGESTION] Memulai ingestion ${rawJobs.length} lowongan untuk User ID: ${userId}`);

  for (const rawJob of rawJobs) {
    try {
      // 1. Cek Deduplikasi: Pastikan kombinasi userId dan jobUrl belum ada di DB
      const existing = await prisma.jobListing.findUnique({
        where: {
          userId_jobUrl: {
            userId,
            jobUrl: rawJob.jobUrl
          }
        }
      });

      if (existing) {
        console.log(`[INGESTION-SKIP] Duplikat ditemukan: "${rawJob.title}" @ ${rawJob.companyName}`);
        summary.skippedDuplicates++;
        continue;
      }

      // 2. Simpan Awal dengan status DISCOVERED
      const created = await prisma.jobListing.create({
        data: {
          userId,
          platform: rawJob.platform,
          externalId: rawJob.externalId,
          title: rawJob.title,
          companyName: rawJob.companyName,
          jobUrl: rawJob.jobUrl,
          location: rawJob.location,
          salaryRange: rawJob.salaryRange,
          description: rawJob.description,
          status: 'DISCOVERED'
        }
      });

      summary.inserted++;
      console.log(`[INGESTION-NEW] Tersimpan ke DB: "${created.title}" @ ${created.companyName} (ID: ${created.id})`);

      // 3. Trigger Filter Otomatis (Dual-Layer Filter)
      console.log(`[INGESTION-EVAL] Mengevaluasi ID: ${created.id}...`);
      const evalResult: JobEvaluationResult = await evaluateJob(created.id);

      if (evalResult.finalStatus === 'DISCOVERED') {
        summary.passedEvaluation++;
        console.log(`  -> ✅ LOLOS FILTER (Match: ${evalResult.matchScore?.toFixed(2)})`);
      } else {
        summary.filteredOut++;
        console.log(`  -> ❌ FILTERED OUT (${evalResult.scamReason || evalResult.failureReason || 'Mismatch'})`);
      }

      summary.details.push({
        id: created.id,
        title: created.title,
        companyName: created.companyName,
        jobUrl: created.jobUrl,
        status: evalResult.finalStatus,
        isLegit: evalResult.isLegit,
        matchScore: evalResult.matchScore ?? null,
        reason: evalResult.scamReason || evalResult.failureReason || null
      });
    } catch (err: any) {
      console.error(`[INGESTION-ERROR] Gagal memproses lowongan "${rawJob.title}":`, err.message);
    }
  }

  console.log(`[INGESTION] Selesai. Total: ${summary.totalReceived} | Masuk: ${summary.inserted} | Duplikat dilewati: ${summary.skippedDuplicates} | Lolos: ${summary.passedEvaluation} | Dibuang: ${summary.filteredOut}\n`);
  return summary;
}

export default ingestRawJobs;
