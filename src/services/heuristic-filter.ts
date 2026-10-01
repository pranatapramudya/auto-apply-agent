/**
 * Layer 1: Heuristic Filter (Deterministic / Fast-Path)
 * Menangkap red-flag scam instan menggunakan Regex tanpa membuang kuota token LLM.
 */

export interface HeuristicFilterResult {
  passed: boolean;
  reason?: string;
}

export interface JobContentInput {
  title?: string;
  companyName?: string;
  description?: string;
}

// Red flags untuk pungutan biaya penipuan lowongan kerja di Indonesia
// Catatan: Harus berhati-hati agar tidak menandai disclaimer resmi perusahaan
// seperti "tidak dipungut biaya" atau job description seperti "biaya administrasi kantor".
const RED_FLAG_FEE_PATTERNS: RegExp[] = [
  /(membayar|memungut|dikenakan|transfer|menyetor)\s+biaya\s+(tiket|pelatihan|administrasi|akomodasi|transportasi|tes|formulir|pendaftaran|seragam)/i,
  /biaya\s+(pendaftaran|tes|formulir|seragam)\s+sebesar\s+(rp|idr|\d+)/i,
  /uang\s+(jaminan|muka|pangkal)\s+sebesar/i,
  /reimbursement\s+(tiket|akomodasi|hotel)\s+(setelah|saat)\s+interview/i,
  /(wajib|harus)\s+menggunakan\s+travel\s+agent/i,
  /membeli\s+tiket\s+(melalui|lewat|pada)\s+(agen|travel)/i,
  /menanggung\s+biaya\s+akomodasi\s+sendiri\s+melalui/i,
  /reservasi\s+tiket\s+melalui\s+agen/i,
];

const RED_FLAG_CONTACT_PATTERNS: RegExp[] = [
  /(https?:\/\/)?t\.me\/[a-zA-Z0-9_]+/i,
  /telegram\s*:\s*@[a-zA-Z0-9_]+/i,
  /hubungi\s+(via\s+)?telegram/i,
  /chat\s+(via\s+)?telegram/i,
  /(https?:\/\/)?wa\.me\/[0-9]+/i,
  /hubungi\s+(no|nomor|kontak)?\s*wa(\.|\:|\s)/i,
  /whatsapp\s+blast/i,
];

/**
 * Memfilter konten pekerjaan secara heuristik.
 * @param job Objek pekerjaan minimal berisi description
 */
export function filterJobHeuristic(job: JobContentInput): HeuristicFilterResult {
  const desc = (job.description || "").trim();

  // 1. Validasi panjang deskripsi (minimal 100 karakter)
  if (desc.length < 100) {
    return {
      passed: false,
      reason: `Deskripsi lowongan terlalu pendek (${desc.length} karakter, minimal 100 karakter).`,
    };
  }

  const combinedText = `${job.title || ""} ${job.companyName || ""} ${desc}`;

  // 2. Deteksi indikasi pungutan biaya / reimbursement tiket travel
  for (const pattern of RED_FLAG_FEE_PATTERNS) {
    if (pattern.test(combinedText)) {
      return {
        passed: false,
        reason: `Terdeteksi indikasi penipuan pungutan biaya/tiket travel: cocok dengan pola "${pattern.source}".`,
      };
    }
  }

  // 3. Deteksi kontak tidak resmi (personal Telegram / WA mencurigakan di job tech)
  for (const pattern of RED_FLAG_CONTACT_PATTERNS) {
    if (pattern.test(combinedText)) {
      return {
        passed: false,
        reason: `Terdeteksi kontak tidak resmi (Telegram/WhatsApp mencurigakan): cocok dengan pola "${pattern.source}".`,
      };
    }
  }

  return { passed: true };
}
