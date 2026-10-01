import { config } from "../../config/env";
import { PlatformScraper, RawJobListing, ScraperSearchParams } from "./types";

/**
 * Utility untuk membersihkan tag HTML dari teks deskripsi pekerjaan
 */
export function cleanHtmlDescription(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

/**
 * Kalibrr Indonesia Scraper
 * Menarik lowongan kerja real-time dari platform Kalibrr Indonesia
 * untuk berbagai bidang termasuk Administrasi Publik, Korporat BUMN/Swasta, dan Teknologi.
 */
export class KalibrrScraper implements PlatformScraper {
  readonly platformName = "KALIBRR";

  async scrape(params: ScraperSearchParams): Promise<RawJobListing[]> {
    const limit = params.limit || 25;
    const keywords =
      params.keywords.length > 0
        ? params.keywords
        : ["administrasi", "general affairs"];
    const results: RawJobListing[] = [];
    const seenUrls = new Set<string>();

    // Hitung target kuota lowongan per kata kunci agar variasi bidang merata
    const targetPerKeyword = Math.max(
      3,
      Math.ceil(limit / Math.max(1, keywords.length)),
    );

    for (const keyword of keywords) {
      if (results.length >= limit) break;
      let countForThisKeyword = 0;

      // Coba page offset 0 dan 15 untuk setiap keyword
      const offsets = [0, 15];
      for (const offset of offsets) {
        if (results.length >= limit || countForThisKeyword >= targetPerKeyword)
          break;

        try {
          // Kalibrr API menggunakan parameter 'text' dan 'country'
          const targetUrl = `https://www.kalibrr.com/api/job_board/search?text=${encodeURIComponent(keyword)}&country=Indonesia&limit=15&offset=${offset}`;
          console.log(
            `[SCRAPER-KALIBRR] Mengambil lowongan real-time: "${keyword}" (offset: ${offset})...`,
          );

          const res = await fetch(targetUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              Accept: "application/json, text/plain, */*",
            },
          });

          if (!res.ok) {
            console.warn(
              `[SCRAPER-KALIBRR] Request status ${res.status} untuk query "${keyword}"`,
            );
            break;
          }

          const data: any = await res.json();
          const jobs = data.jobs || [];

          if (jobs.length === 0) break; // Sudah tidak ada lowongan lagi untuk offset ini

          for (const j of jobs) {
            if (results.length >= limit) break;

            const companyCode = j.company?.code || "company";
            const jobUrl = `https://www.kalibrr.com/c/${companyCode}/jobs/${j.id}/${j.slug}`;

            if (seenUrls.has(jobUrl)) continue;
            seenUrls.add(jobUrl);

            // Format gaji
            let salaryRange: string | undefined;
            if (j.base_salary && Number(j.base_salary) > 0) {
              salaryRange = `Rp ${Number(j.base_salary).toLocaleString("id-ID")} / ${j.salary_interval === "month" ? "bulan" : j.salary_interval || "bulan"}`;
            }

            // Format lokasi
            let location = "Indonesia";
            if (j.google_location?.address_components?.city) {
              const city = j.google_location.address_components.city;
              const prov = j.google_location.address_components.province;
              location =
                prov && prov !== city
                  ? `${city}, ${prov}`
                  : `${city}, Indonesia`;
            } else if (j.google_location?.address_components?.province) {
              location = `${j.google_location.address_components.province}, Indonesia`;
            } else if (j.is_work_from_home) {
              location = "Remote / WFH (Indonesia)";
            }

            // Gabungkan deskripsi dan kualifikasi
            const fullRawHtml = `${j.description || ""}\n\n<h3>Kualifikasi & Persyaratan:</h3>\n${j.qualifications || ""}`;
            const cleanedDesc = cleanHtmlDescription(fullRawHtml);

            results.push({
              platform: "KALIBRR",
              externalId: String(j.id),
              title: j.name || "Posisi Rekrutmen",
              companyName: j.company?.name || "Perusahaan Indonesia",
              jobUrl,
              location,
              salaryRange,
              description:
                cleanedDesc ||
                "Silakan tinjau detail lengkap dan persyaratan kerja pada tautan portal resmi.",
            });

            countForThisKeyword++;
            if (countForThisKeyword >= targetPerKeyword) break;
          }
        } catch (err: any) {
          console.warn(
            `[SCRAPER-KALIBRR] Gagal mengambil data keyword "${keyword}":`,
            err.message,
          );
          break;
        }
      }
    }

    console.log(
      `[SCRAPER-KALIBRR] Selesai. Berhasil mengumpulkan ${results.length} lowongan real-time Indonesia dari Kalibrr.`,
    );
    return results.slice(0, limit);
  }
}

export default KalibrrScraper;
