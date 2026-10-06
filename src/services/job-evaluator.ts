import { config } from "../config/env";
import prisma from "../lib/prisma";
import { filterJobHeuristic } from "./heuristic-filter";
import { evaluateJobWithLLM, LLMEvaluationResult } from "./llm-evaluator";
import applicant, { ApplicantConfig } from "../config/applicant";

export interface JobEvaluationResult {
  jobListingId?: string;
  passedHeuristic: boolean;
  heuristicReason?: string;
  llmResult?: LLMEvaluationResult;
  finalStatus: "DISCOVERED" | "FILTERED_OUT";
  isLegit: boolean;
  matchScore?: number | null;
  scamReason?: string | null;
  failureReason?: string | null;
}

export interface DirectJobInput {
  id?: string;
  title: string;
  companyName: string;
  description: string;
}

/**
 * Mengevaluasi konten lowongan secara in-memory melalui Layer 1 dan Layer 2.
 */
export async function evaluateJobContent(
  job: DirectJobInput,
  applicantProfile: ApplicantConfig = applicant,
): Promise<JobEvaluationResult> {
  // 1. Layer 1: Heuristic Filter (Deterministic / Fast-Path)
  const heuristic = filterJobHeuristic({
    title: job.title,
    companyName: job.companyName,
    description: job.description,
  });

  if (!heuristic.passed) {
    return {
      jobListingId: job.id,
      passedHeuristic: false,
      heuristicReason: heuristic.reason,
      finalStatus: "FILTERED_OUT",
      isLegit: false,
      matchScore: 0.0,
      scamReason: heuristic.reason,
      failureReason: heuristic.reason,
    };
  }

  // 2. Layer 2: LLM Evaluator via Groq SDK
  const llmResult = await evaluateJobWithLLM(
    {
      title: job.title,
      companyName: job.companyName,
      description: job.description,
    },
    applicantProfile,
  );

  // Jika terindikasi scam dari evaluasi LLM
  if (!llmResult.isLegit || llmResult.scamRiskScore > 0.4) {
    return {
      jobListingId: job.id,
      passedHeuristic: true,
      llmResult,
      finalStatus: "FILTERED_OUT",
      isLegit: false,
      matchScore: llmResult.matchScore,
      scamReason: `Terdeteksi scam oleh AI: ${llmResult.reasoning}`,
      failureReason: `Scam risk tinggi (${llmResult.scamRiskScore.toFixed(2)}): ${llmResult.reasoning}`,
    };
  }

  // Jika lolos dan relevan (matchScore >= 0.6)
  if (llmResult.matchScore >= 0.6) {
    return {
      jobListingId: job.id,
      passedHeuristic: true,
      llmResult,
      finalStatus: "DISCOVERED", // Siap untuk tahap APPLYING
      isLegit: true,
      matchScore: llmResult.matchScore,
      scamReason: null,
      failureReason: null,
    };
  }

  // Jika lolos scam tapi skor kecocokan skill di bawah ambang batas (matchScore < 0.6)
  return {
    jobListingId: job.id,
    passedHeuristic: true,
    llmResult,
    finalStatus: "FILTERED_OUT",
    isLegit: true,
    matchScore: llmResult.matchScore,
    scamReason: null,
    failureReason: `Skor relevansi skill (${llmResult.matchScore.toFixed(2)}) di bawah ambang batas minimum 0.6. ${llmResult.reasoning}`,
  };
}

/**
 * Orchestrator Utama: Mengevaluasi record JobListing berdasarkan ID dari database,
 * dan langsung memperbarui record tersebut di Prisma.
 */
export async function evaluateJob(
  jobListingId: string,
): Promise<JobEvaluationResult> {
  const job = await prisma.jobListing.findUnique({
    where: { id: jobListingId },
    include: { user: true },
  });

  if (!job) {
    throw new Error(`JobListing dengan ID "${jobListingId}" tidak ditemukan.`);
  }

  let applicantProfile = applicant;
  if (job.user) {
    const targetRoles = job.user.targetRoles
      ? job.user.targetRoles
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean)
      : undefined;

    applicantProfile = {
      fullName: job.user.fullName,
      email: job.user.email,
      phone: job.user.phone || applicant.phone,
      city: job.user.city || applicant.city,
      linkedInUrl: job.user.linkedInUrl || applicant.linkedInUrl,
      githubUrl: job.user.githubUrl || applicant.githubUrl,
      portfolioUrl: job.user.portfolioUrl || applicant.portfolioUrl,
      expectedSalary: job.user.expectedSalary
        ? `Rp ${job.user.expectedSalary.toLocaleString("id-ID")}`
        : applicant.expectedSalary,
      noticePeriodDays: applicant.noticePeriodDays,
      workAuthorization: applicant.workAuthorization,
      targetRoles,
      skills: job.user.coreSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      resumePath: job.user.resumeLocalPath || applicant.resumePath,
    };
  }

  const result = await evaluateJobContent(
    {
      id: job.id,
      title: job.title,
      companyName: job.companyName,
      description: job.description,
    },
    applicantProfile,
  );

  // Perbarui status dan metrik pada database Prisma
  await prisma.jobListing.update({
    where: { id: jobListingId },
    data: {
      status: result.finalStatus,
      isLegit: result.isLegit,
      matchScore: result.matchScore,
      scamReason: result.scamReason,
      failureReason: result.failureReason,
    },
  });

  return result;
}

export default {
  evaluateJob,
  evaluateJobContent,
};
