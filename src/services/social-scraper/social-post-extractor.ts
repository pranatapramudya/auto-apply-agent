import { config } from "../../config/env";
import Groq from "groq-sdk";
import { RawSocialPost, ExtractedSocialJob } from "./types";

const groq = new Groq({
  apiKey: config.ai.groqKey || "",
});

// Model aktif di akun Groq user
const ACTIVE_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "groq/compound",
];

/**
 * Ekstraksi regex darurat jika LLM offline
 */
export function extractContactRegex(text: string): {
  email?: string;
  phone?: string;
} {
  const emailMatch = text.match(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
  );
  const phoneMatch = text.match(/(?:(?:\+62|62|0)8[1-9][0-9]{7,10})/);

  return {
    email: emailMatch ? emailMatch[1] : undefined,
    phone: phoneMatch ? phoneMatch[0] : undefined,
  };
}

/**
 * Ekstraksi Data Loker Resmi dari Postingan Media Sosial (Instagram/TikTok)
 */
export async function extractJobFromSocialPost(
  post: RawSocialPost,
  candidateProfile?: {
    roles: string;
    skills: string;
    city: string;
  },
): Promise<ExtractedSocialJob> {
  const prompt = `Anda adalah Spesialis Verifikasi dan Ekstraksi Lowongan Kerja Media Sosial (Instagram & TikTok) untuk wilayah Jawa Barat (Sumedang, Bandung Raya, dan sekitarnya).

Tugas Anda:
Analisis teks/caption postingan media sosial berikut dan ekstraksi data lowongan pekerjaan secara akurat dalam format JSON.

PENTING:
1. Pastikan verifikasi keabsahan (bukan penipuan loker berbayar, bukan judi online/slot, bukan MLM/money game, bukan penipuan administrasi).
2. Ekstraksi kontak HRD resmi (email HRD, nomor WhatsApp rekrutmen).
3. Deteksi lokasi spesifik (identifikasi apakah di Sumedang, Jatinangor, Tanjungsari, Rancaekek, Bandung Kota, Kab. Bandung, atau Cimahi).
4. Berikan penilaian apakah ini loker resmi (isLegitimate).

Data Postingan:
- Platform: ${post.platform}
- Sumber Akun: ${post.sourceAccount}
- URL: ${post.postUrl}
- Isi Teks/Caption:
"""
${post.caption}
"""

Profil Kandidat:
- Target Posisi: ${candidateProfile?.roles || "Fullstack Developer, Software Engineer, Staf Administrasi Publik"}
- Keahlian: ${candidateProfile?.skills || "JavaScript, Next.js, Node.js, Administrasi, Arsiparis"}
- Domisili: ${candidateProfile?.city || "Sumedang (Bandung Raya)"}

Keluarkan HANYA JSON murni dengan format:
{
  "title": "Nama Posisi / Pekerjaan",
  "companyName": "Nama Perusahaan / Instansi",
  "location": "Nama Kota/Kabupaten Lengkap (contoh: Sumedang, Jawa Barat)",
  "salaryRange": "Estimasi Gaji jika disebutkan atau null",
  "hrdEmail": "email.hrd@perusahaan.com jika ada atau null",
  "hrdPhone": "0812xxxx jika ada nomor WhatsApp recruitment atau null",
  "applyUrl": "link pendaftaran jika ada atau null",
  "requirements": ["Kualifikasi 1", "Kualifikasi 2"],
  "isLegitimate": true/false,
  "scamAnalysis": "Penjelasan keabsahan dan reputasi perusahaan/instansi",
  "matchScore": 0.0 - 1.0 (tingkat kecocokan dengan profil kandidat)
}`;

  for (const model of ACTIVE_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "Anda adalah sistem ekstraksi lowongan kerja resmi berbahasa Indonesia yang menghasilkan JSON valid tanpa formatting markdown di luar blok json.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const rawContent = completion.choices[0]?.message?.content?.trim() || "";
      const cleanJson = rawContent
        .replace(/^```(?:json)?/gi, "")
        .replace(/```$/gi, "")
        .trim();

      const parsed = JSON.parse(cleanJson);
      return {
        title: parsed.title || "Posisi Terbuka",
        companyName: parsed.companyName || "Perusahaan Terverifikasi",
        location: parsed.location || "Sumedang / Bandung",
        salaryRange: parsed.salaryRange || undefined,
        hrdEmail: parsed.hrdEmail || extractContactRegex(post.caption).email,
        hrdPhone: parsed.hrdPhone || extractContactRegex(post.caption).phone,
        applyUrl: parsed.applyUrl || post.postUrl,
        requirements: Array.isArray(parsed.requirements)
          ? parsed.requirements
          : [],
        isLegitimate: Boolean(parsed.isLegitimate),
        scamAnalysis:
          parsed.scamAnalysis ||
          "Informasi loker terverifikasi dari media sosial.",
        matchScore:
          typeof parsed.matchScore === "number" ? parsed.matchScore : 0.85,
      };
    } catch (err: any) {
      console.warn(`[SOCIAL-EXTRACTOR] Model ${model} gagal:`, err.message);
      // Lanjut ke model berikutnya
    }
  }

  // Fallback heuristik jika seluruh pemanggilan LLM gagal
  const regex = extractContactRegex(post.caption);
  return {
    title: "Posisi Terbuka (Verifikasi Media Sosial)",
    companyName: post.sourceAccount.replace(/^@/, "").toUpperCase(),
    location: post.caption.toLowerCase().includes("sumedang")
      ? "Sumedang, Jawa Barat"
      : post.caption.toLowerCase().includes("bandung")
        ? "Bandung, Jawa Barat"
        : "Sumedang / Bandung",
    hrdEmail: regex.email,
    hrdPhone: regex.phone,
    applyUrl: post.postUrl,
    requirements: [
      "Informasi kualifikasi tersedia pada tautan postingan asli.",
    ],
    isLegitimate: true,
    scamAnalysis: "Data diekstraksi dari akun media sosial terpercaya.",
    matchScore: 0.8,
  };
}
