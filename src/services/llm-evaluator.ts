import 'dotenv/config';
import Groq from 'groq-sdk';
import applicant, { ApplicantConfig } from '../config/applicant';

export interface LLMEvaluationResult {
  isLegit: boolean;
  scamRiskScore: number; // 0.0 to 1.0
  matchScore: number;    // 0.0 to 1.0
  reasoning: string;     // Ringkasan 1-2 kalimat
  recommendation: 'APPLY' | 'REJECT';
}

export interface JobToEvaluate {
  title: string;
  companyName: string;
  description: string;
}

let groqClientInstance: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClientInstance) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY tidak ditemukan di environment variables!');
    }
    groqClientInstance = new Groq({ apiKey });
  }
  return groqClientInstance;
}

const CANDIDATE_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'groq/compound'
];

function buildSystemPrompt(applicantProfile: ApplicantConfig): string {
  const targetRoles = applicantProfile.targetRoles && applicantProfile.targetRoles.length > 0
    ? applicantProfile.targetRoles.join(', ')
    : 'Professional Roles';

  return `You are an expert Talent Acquisition & Anti-Scam Intelligence Evaluator for professional job listings in Indonesia.
Your task is to analyze a job listing for an applicant and determine:
1. Legitimacy: Is this a genuine, legitimate job opening, or is it a scam/anomaly (e.g. fake recruitment, asking candidates for illegal fees/tickets/hotel reservations, MLM, predatory training)?
2. Qualification & Skill Match: Calculate the matchScore (0.0 to 1.0) based on how well the job requirements match the applicant's target roles and core skills.

Applicant Profile:
- Full Name: ${applicantProfile.fullName}
- Target Roles: ${targetRoles}
- Core Skills: ${applicantProfile.skills.join(', ')}
- Location: ${applicantProfile.city}

Evaluation Rules:
- scamRiskScore: 0.0 (clean & legitimate) to 1.0 (definite scam/fake).
- isLegit: true if scamRiskScore < 0.4 and job description is genuine; false otherwise.
- matchScore: 0.0 (no match) to 1.0 (excellent match).
  * Give higher scores (>=0.7) if the job title, responsibilities, and required qualifications align with the applicant's target roles (${targetRoles}) or core skills.
  * Give moderate scores (0.5 - 0.69) for adjacent/transferable roles in the same field.
  * Give lower scores (<0.5) only if it belongs to a completely unrelated field.
- recommendation: 'APPLY' if isLegit is true AND matchScore >= 0.55; otherwise 'REJECT'.
- reasoning: Provide 1-2 concise sentences in Indonesian summarizing why the job is or isn't a good match.

You MUST respond ONLY in valid JSON matching this exact structure:
{
  "isLegit": boolean,
  "scamRiskScore": number,
  "matchScore": number,
  "reasoning": string,
  "recommendation": "APPLY" | "REJECT"
}`;
}

async function callGroqWithModel(
  groq: Groq,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error(`Empty response returned from model ${model}`);
  }
  return content;
}

/**
 * Layer 2: Mengevaluasi lowongan menggunakan LLM via Groq SDK.
 */
export async function evaluateJobWithLLM(
  job: JobToEvaluate,
  applicantProfile: ApplicantConfig = applicant
): Promise<LLMEvaluationResult> {
  const groq = getGroqClient();
  const systemPrompt = buildSystemPrompt(applicantProfile);
  const userPrompt = `Job Title: ${job.title}
Company: ${job.companyName}
Job Description:
${job.description.slice(0, 4000)}`;

  let rawJson: string | null = null;
  let lastError: Error | null = null;

  // Coba model kandidat secara waterfall (utamakan llama-3.3-70b-versatile & llama-3.1-8b-instant)
  for (const model of CANDIDATE_MODELS) {
    try {
      rawJson = await callGroqWithModel(groq, model, systemPrompt, userPrompt);
      if (rawJson) {
        break;
      }
    } catch (err: any) {
      lastError = err;
      // Jangan log jika sekadar model tidak tersedia/decommissioned, lanjutkan ke model berikutnya
    }
  }

  if (!rawJson) {
    console.error('[LLM-EVALUATOR] Seluruh model kandidat gagal:', lastError?.message);
    return {
      isLegit: true,
      scamRiskScore: 0.2,
      matchScore: 0.5,
      reasoning: `LLM evaluation API error (${lastError?.message || 'Unknown'}). Fallback default applied.`,
      recommendation: 'REJECT'
    };
  }

  try {
    const parsed = JSON.parse(rawJson);
    const scamRiskScore = typeof parsed.scamRiskScore === 'number' ? Math.max(0, Math.min(1, parsed.scamRiskScore)) : 0.0;
    const matchScore = typeof parsed.matchScore === 'number' ? Math.max(0, Math.min(1, parsed.matchScore)) : 0.0;
    const isLegit = typeof parsed.isLegit === 'boolean' ? parsed.isLegit : scamRiskScore < 0.4;
    const recommendation = (parsed.recommendation === 'APPLY' || parsed.recommendation === 'REJECT')
      ? parsed.recommendation
      : (isLegit && matchScore >= 0.6 ? 'APPLY' : 'REJECT');

    return {
      isLegit,
      scamRiskScore,
      matchScore,
      reasoning: parsed.reasoning || 'Evaluasi berhasil diproses oleh model LLM.',
      recommendation
    };
  } catch (parseError: any) {
    console.warn('[LLM-EVALUATOR] Gagal parse JSON hasil output LLM:', rawJson);
    return {
      isLegit: true,
      scamRiskScore: 0.3,
      matchScore: 0.5,
      reasoning: 'Gagal mengurai respons JSON dari model LLM.',
      recommendation: 'REJECT'
    };
  }
}
