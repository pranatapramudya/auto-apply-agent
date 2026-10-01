import { config } from "../../config/env";
import { PlatformScraper, RawJobListing, ScraperSearchParams } from "./types";
import KalibrrScraper from "./kalibrr-scraper";
import TechInAsiaScraper from "./playwright-scraper";

/**
 * Aggregator Scraper Multi-Platform
 * Menggabungkan live scraper dari berbagai portal lowongan kerja terpercaya
 * di Indonesia (Kalibrr, Tech in Asia) secara paralel dengan de-duplikasi otomatis.
 */
export class AggregatorJobScraper implements PlatformScraper {
  readonly platformName = "MULTI_PLATFORM_AGGREGATOR";

  private kalibrrScraper = new KalibrrScraper();
  private tiaScraper = new TechInAsiaScraper();

  async scrape(params: ScraperSearchParams): Promise<RawJobListing[]> {
    const limit = params.limit || 20;
    console.log(
      `\n[AGGREGATOR] Memulai scraping multi-platform real-time untuk keywords:`,
      params.keywords,
    );

    const allListings: RawJobListing[] = [];
    const seenUrls = new Set<string>();

    // Deteksi apakah pencarian bersifat tech/software atau administrasi/korporat umum
    const isTechSearch = params.keywords.some((kw) =>
      /(developer|engineer|fullstack|frontend|backend|react|next\.js|python|typescript|golang|devops)/i.test(
        kw,
      ),
    );

    // 1. Scraping dari Kalibrr (Sangat cepat, kaya data korporasi, BUMN, perbankan, dan administrasi Indonesia)
    try {
      const kalibrrLimit = isTechSearch ? Math.ceil(limit * 0.7) : limit;
      const kalibrrJobs = await this.kalibrrScraper.scrape({
        ...params,
        limit: kalibrrLimit,
      });
      for (const j of kalibrrJobs) {
        if (!seenUrls.has(j.jobUrl)) {
          seenUrls.add(j.jobUrl);
          allListings.push(j);
        }
      }
    } catch (e: any) {
      console.warn("[AGGREGATOR] Error Kalibrr scraper:", e.message);
    }

    // 2. Scraping dari Tech in Asia (Hanya jika pencarian relevan dengan bidang teknologi)
    if (isTechSearch && allListings.length < limit) {
      try {
        const tiaJobs = await this.tiaScraper.scrape({
          ...params,
          limit: Math.max(5, limit - allListings.length),
        });
        for (const j of tiaJobs) {
          if (!seenUrls.has(j.jobUrl)) {
            seenUrls.add(j.jobUrl);
            allListings.push(j);
          }
        }
      } catch (e: any) {
        console.warn("[AGGREGATOR] Error Tech in Asia scraper:", e.message);
      }
    }

    console.log(
      `[AGGREGATOR] Total live lowongan terkumpul: ${allListings.length}`,
    );
    return allListings.slice(0, limit);
  }
}

export default AggregatorJobScraper;
