import Groq from 'groq-sdk';

export type DetectedEmailLifecycle = 'INTERVIEW' | 'REJECTED' | 'UNDER_REVIEW' | 'UNKNOWN';

export interface EmailScanResult {
  lifecycleStatus: DetectedEmailLifecycle;
  companyName?: string;
  roleTitle?: string;
  confidence: number;
  reasoning: string;
  nextSteps?: string;
}

export interface IncomingEmailInput {
  from: string;
  subject: string;
  body: string;
  receivedAt?: Date;
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

const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'groq/compound'
];

/**
 * AI Email Lifecycle Parser:
 * Menganalisis respon email dari HRD/perusahaan untuk mendeteksi apakah pelamar
 * mendapatkan panggilan wawancara, penolakan, atau konfirmasi berkas sedang ditinjau.
 */
export async function parseRecruitmentEmail(email: IncomingEmailInput): Promise<EmailScanResult> {
  const combinedText = `${email.subject}\n${email.body}`.toLowerCase();

  // 1. Fast heuristic path
  const isInterview = /(invitation|interview|undangan\s*wawancara|user\s*interview|hr\s*interview|jadwal\s*interview|technical\s*test|tes\s*teknis)/i.test(combinedText);
  const isRejection = /(regret|unfortunately|not\s*moving\s*forward|belum\s*dapat\s*melanjutkan|posisi\s*lain|terima\s*kasih\s*atas\s*partisipasi)/i.test(combinedText);
  const isReview = /(application\s*received|lamaran\s*diterima|berkas\s*diterima|sedang\s*ditinjau|under\s*review)/i.test(combinedText);

  // 2. Groq LLM Classifier untuk ketepatan konteks tinggi
  try {
    const groq = getGroqClient();

    const systemPrompt = `Anda adalah sistem AI Classifier untuk Application Lifecycle Tracking.
Tugas Anda: Menganalisis email rekrutmen dari HRD dan menentukan status tahapan lamaran:
1. "INTERVIEW": Jika kandidat diundang wawancara, tes teknis, atau jadwal meeting.
2. "REJECTED": Jika kandidat ditolak / belum berhasil lanjut ke tahap berikutnya.
3. "UNDER_REVIEW": Jika email sekadar konfirmasi bahwa lamaran diterima dan sedang di-review.
4. "UNKNOWN": Jika bukan email terkait progres rekrutmen.

Output WAJIB berupa format JSON murni:
{
  "lifecycleStatus": "INTERVIEW" | "REJECTED" | "UNDER_REVIEW" | "UNKNOWN",
  "companyName": "Nama perusahaan pengirim jika terdeteksi",
  "roleTitle": "Posisi yang dimaksud jika terdeteksi",
  "confidence": 0.95,
  "reasoning": "Penjelasan singkat keputusan",
  "nextSteps": "Langkah selanjutnya yang diminta HRD jika ada"
}`;

    const userPrompt = `Dari: ${email.from}
Subjek: ${email.subject}
Isi Email:
${email.body.slice(0, 2000)}`;

    for (const model of GROQ_MODELS) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model,
          temperature: 0.1,
          response_format: { type: 'json_object' }
        });

        const content = completion.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.lifecycleStatus) {
            return {
              lifecycleStatus: parsed.lifecycleStatus,
              companyName: parsed.companyName,
              roleTitle: parsed.roleTitle,
              confidence: parsed.confidence || 0.9,
              reasoning: parsed.reasoning || '',
              nextSteps: parsed.nextSteps
            };
          }
        }
      } catch (err: any) {
        console.warn(`[EMAIL-TRACKER] Percobaan model ${model} gagal:`, err.message);
      }
    }
  } catch (err: any) {
    console.warn('[EMAIL-TRACKER] Fallback ke heuristik regex:', err.message);
  }

  // Fallback Heuristik
  if (isInterview) {
    return {
      lifecycleStatus: 'INTERVIEW',
      confidence: 0.85,
      reasoning: 'Terdeteksi kata kunci undangan wawancara atau tes teknis dalam subjek/isi email.'
    };
  }
  if (isRejection) {
    return {
      lifecycleStatus: 'REJECTED',
      confidence: 0.85,
      reasoning: 'Terdeteksi kata kunci penolakan formal atau penyampaian belum dapat melanjutkan.'
    };
  }
  if (isReview) {
    return {
      lifecycleStatus: 'UNDER_REVIEW',
      confidence: 0.8,
      reasoning: 'Konfirmasi penerimaan berkas lamaran.'
    };
  }

  return {
    lifecycleStatus: 'UNKNOWN',
    confidence: 0.5,
    reasoning: 'Email tidak mencantumkan status kelanjutan rekrutmen yang spesifik.'
  };
}
