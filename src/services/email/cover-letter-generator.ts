import { config } from "../../config/env";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { CoverLetterParams, CoverLetterResult } from "./types";

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

const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "groq/compound",
];

/**
 * Generator Surat Lamaran & Subjek Email Berbasis AI
 * Menghasilkan surat lamaran bahasa Indonesia yang sopan, formal, dan dipersonalisasi
 * secara presisi berdasarkan kualifikasi lowongan dan profil kandidat.
 */
export async function generateCoverLetter(
  params: CoverLetterParams,
): Promise<CoverLetterResult> {
  const defaultSubject = `Lamaran Pekerjaan: ${params.jobTitle} - ${params.candidateName}`;

  try {
    const groq = getGroqClient();

    const systemPrompt = `Anda adalah asisten karier profesional dan copywriter rekrutmen tingkat atas di Indonesia.
Tugas Anda adalah membuat email lamaran pekerjaan (Cover Letter) resmi bahasa Indonesia untuk dikirimkan langsung ke HRD / Hiring Manager perusahaan.

Pedoman Penulisan:
1. Bahasa Indonesia baku, formal, santun, dan percaya diri (hindari kesan kaku seperti template jadul, buat mengalir alami).
2. Panjang email ringkas dan padat (200 - 280 kata), karena HRD hanya punya waktu 30 detik untuk membaca email masuk.
3. Struktur email:
   - Salam pembuka resmi: "Yth. Tim Rekrutmen ${params.companyName || "Bapak/Ibu HRD"},"
   - Paragraf 1: Maksud mengirimkan lamaran untuk posisi ${params.jobTitle}.
   - Paragraf 2: Mengaitkan keahlian kandidat (${params.candidateSkills}) dengan kebutuhan posisi secara meyakinkan. Sebutkan domisili kandidat (${params.candidateCity || "Indonesia"}) jika relevan.
   - Paragraf 3: Kesiapan untuk wawancara dan penjelasan bahwa berkas CV PDF terlampir.
   - Penutup profesional dengan nama lengkap, nomor telepon (${params.candidatePhone || "-"}), email, serta tautan portofolio/LinkedIn jika tersedia.
4. Output WAJIB berupa format JSON murni tanpa markdown fence atau backticks:
{
  "subject": "Lamaran Pekerjaan: ${params.jobTitle} - ${params.candidateName}",
  "body": "Isi lengkap surat lamaran...",
  "candidateHighlights": ["Poin 1...", "Poin 2...", "Poin 3..."]
}`;

    const candidateKnowledge = (() => {
      try {
        const p = path.resolve(
          process.cwd(),
          "data",
          "candidate-knowledge.json",
        );
        if (fs.existsSync(p)) {
          const parsed = JSON.parse(fs.readFileSync(p, "utf-8"));
          if (parsed.candidates) {
            const combined =
              `${params.candidateEmail || ""} ${params.candidateName || ""} ${params.candidateRoles || ""}`.toLowerCase();
            if (
              combined.includes("partner") ||
              combined.includes("siti") ||
              combined.includes("fathonah") ||
              combined.includes("administrasi") ||
              combined.includes("publik")
            ) {
              return (
                parsed.candidates.partner || parsed.candidates.primary || null
              );
            }
            return (
              parsed.candidates.primary || parsed.candidates.partner || null
            );
          }
          return parsed.candidate || null;
        }
      } catch {}
      return null;
    })();

    const keyMetricsSnippet = candidateKnowledge?.workExperience
      ? candidateKnowledge.workExperience
          .map(
            (w: any) =>
              `- ${w.company} (${w.position}): ${w.bulletPoints?.[0] || ""}`,
          )
          .join("\n")
      : "- Berpengalaman dalam tata kelola administrasi dan operasional perkantoran profesional";

    const userPrompt = `Data Kandidat:
- Nama: ${params.candidateName}
- Email: ${params.candidateEmail}
- Telepon: ${params.candidatePhone || "-"}
- Domisili: ${params.candidateCity || "Sumedang / Bandung Raya"}
- Spesialisasi: ${params.candidateRoles}
- Keahlian Utama: ${params.candidateSkills}
- Portofolio: ${params.portfolioUrl || "-"}
- LinkedIn: ${params.linkedInUrl || "-"}

Pencapaian Riil Terverifikasi (Dapat disinggung ringkas untuk membuktikan ROI):
${keyMetricsSnippet}

Data Lowongan Kerja:
- Posisi: ${params.jobTitle}
- Perusahaan: ${params.companyName}
- Ringkasan Deskripsi:
${params.jobDescription ? params.jobDescription.slice(0, 1500) : "Tidak ada deskripsi detail"}`;

    for (const model of GROQ_MODELS) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model,
          temperature: 0.4,
          response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.body) {
            return {
              subject: parsed.subject || defaultSubject,
              body: parsed.body,
              candidateHighlights: Array.isArray(parsed.candidateHighlights)
                ? parsed.candidateHighlights
                : [],
            };
          }
        }
      } catch (e: any) {
        console.warn(`[AI-COVER-LETTER] Model ${model} gagal:`, e.message);
      }
    }
  } catch (error: any) {
    console.warn(
      "[AI-COVER-LETTER] Error LLM, menggunakan fallback template:",
      error.message,
    );
  }

  // Fallback Template Berkualitas Tinggi jika LLM tidak tersedia
  return generateFallbackCoverLetter(params, defaultSubject);
}

function generateFallbackCoverLetter(
  params: CoverLetterParams,
  subject: string,
): CoverLetterResult {
  const body = `Yth. Tim Rekrutmen ${params.companyName || "Bapak/Ibu HRD"},

Sehubungan dengan informasi lowongan pekerjaan untuk posisi ${params.jobTitle} di ${params.companyName || "perusahaan Bapak/Ibu"}, saya bermaksud untuk mengajukan diri guna mengisi posisi tersebut.

Saya ${params.candidateName}, seorang ${params.candidateRoles || "profesional"} yang berdomisili di ${params.candidateCity || "Sumedang / Bandung Raya"}. Saya memiliki pengalaman dan keahlian yang relevan di bidang ${params.candidateSkills || "pengembangan perangkat lunak dan teknologi"}. Saya meyakini bahwa latar belakang serta komitmen kerja yang saya miliki dapat memberikan kontribusi nyata bagi perkembangan tim di ${params.companyName}.

Sebagai bahan pertimbangan Bapak/Ibu, bersama surat ini saya melampirkan berkas Curriculum Vitae (CV) terbaru. Saya sangat terbuka untuk mendiskusikan kualifikasi saya lebih lanjut dalam tahap wawancara.

Atas perhatian dan kesempatan yang Bapak/Ibu berikan, saya ucapkan terima kasih.

Hormat saya,
${params.candidateName}
Email: ${params.candidateEmail}
Telepon/WhatsApp: ${params.candidatePhone || "-"}
${params.portfolioUrl ? `Portofolio: ${params.portfolioUrl}` : ""}
${params.linkedInUrl ? `LinkedIn: ${params.linkedInUrl}` : ""}`.trim();

  return {
    subject,
    body,
    candidateHighlights: [
      `Keahlian utama: ${params.candidateSkills}`,
      `Domisili: ${params.candidateCity || "Sumedang / Bandung Raya"}`,
      `Posisi yang dilamar: ${params.jobTitle}`,
    ],
  };
}
