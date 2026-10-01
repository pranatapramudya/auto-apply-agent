import { config } from "../../config/env";
import "dotenv/config";
import Groq from "groq-sdk";

export interface FormQuestionContext {
  question: string;
  fieldType?: string;
  options?: string[];
  placeholder?: string;
  jobContext?: {
    title?: string;
    companyName?: string;
    description?: string;
  };
  user: {
    fullName: string;
    targetRoles: string;
    coreSkills: string;
    city?: string | null;
    portfolioUrl?: string | null;
    githubUrl?: string | null;
    linkedInUrl?: string | null;
    expectedSalary?: number | null;
  };
}

let groqClientInstance: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClientInstance) {
    const apiKey = config.ai.groqKey;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY tidak ditemukan di environment variables!");
    }
    groqClientInstance = new Groq({ apiKey });
  }
  return groqClientInstance;
}

const CANDIDATE_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "groq/compound",
];

/**
 * AI Applicant Persona Resolver:
 * Menyelesaikan pertanyaan kuesioner dinamis pada formulir lamaran kerja
 * dengan gaya profesional, singkat (1–3 kalimat), dan selaras dengan skill pelamar.
 */
export async function resolveFormQuestion(
  context: FormQuestionContext,
): Promise<string> {
  const { question, fieldType, options, placeholder, jobContext, user } =
    context;

  // 1. Fast-Path Heuristik untuk Pertanyaan Angka Pengalaman
  const numExperienceMatch =
    question.match(/(years?|lama|pengalaman).*(experience|pengalaman)/i) ||
    question.match(/how many years/i);
  if (
    numExperienceMatch &&
    (fieldType === "number" || !options || options.length === 0)
  ) {
    // Berikan angka pengalaman proporsional (3-4 tahun)
    return "4";
  }

  // 2. Fast-Path untuk Sponsorship / Otorisasi Kerja
  if (/authorized to work|hak kerja|ijin kerja/i.test(question)) {
    if (options && options.length > 0) {
      const yesOpt = options.find((o) =>
        /^yes|^ya|^authorized/i.test(o.trim()),
      );
      if (yesOpt) return yesOpt;
    }
    return "Yes";
  }

  if (/require.*sponsorship|butuh sponsor|visa sponsorship/i.test(question)) {
    if (options && options.length > 0) {
      const noOpt = options.find((o) =>
        /^no|^tidak|^not require/i.test(o.trim()),
      );
      if (noOpt) return noOpt;
    }
    return "No";
  }

  // 3. AI Resolver via Groq LLM untuk Pertanyaan Kompleks / Esai / Pilihan Ganda
  const groq = getGroqClient();

  const systemPrompt = `You are an AI Applicant Persona representing a software engineer filling out an online job application form.
Your goal is to answer the recruiter's screening question as the candidate.

Candidate Profile:
- Full Name: ${user.fullName}
- Target Roles: ${user.targetRoles}
- Core Skills: ${user.coreSkills}
- Location: ${user.city || "Jakarta, Indonesia"}
- Portfolio: ${user.portfolioUrl || "N/A"}
- GitHub: ${user.githubUrl || "N/A"}
- Expected Salary: ${user.expectedSalary ? `Rp ${user.expectedSalary.toLocaleString("id-ID")}` : "Market Rate"}

Instructions:
1. If the question asks for an open-ended explanation (e.g. why join, project experience, tech stack background), write a concise, impressive, and professional response in 1 to 3 sentences maximum. Emphasize actual hands-on engineering experience with ${user.coreSkills}.
2. If the question provides specific options (select/radio), pick and return EXACTLY one option string that best represents the candidate.
3. If the question asks for a number (like years of experience), return only the integer or short number.
4. Output MUST be valid JSON with the exact key "answer": { "answer": "..." }`;

  const userPrompt = `Job Title: ${jobContext?.title || "Software Engineer"}
Company: ${jobContext?.companyName || "Company"}
Screening Question: "${question}"
Field Type: ${fieldType || "text"}
Placeholder: ${placeholder || "None"}
Available Options: ${options && options.length > 0 ? JSON.stringify(options) : "None"}`;

  for (const model of CANDIDATE_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.answer && typeof parsed.answer === "string") {
          return parsed.answer.trim();
        }
      }
    } catch {
      // Coba model berikutnya jika ada error/rate limit
    }
  }

  // Fallback deterministik jika LLM gagal
  if (options && options.length > 0) {
    return options[0];
  }

  return `I have strong hands-on experience building scalable applications with ${user.coreSkills}, and I am eager to bring this expertise to the team.`;
}

export default resolveFormQuestion;
