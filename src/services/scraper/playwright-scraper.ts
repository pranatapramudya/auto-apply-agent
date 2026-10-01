import { chromium, Browser, BrowserContext } from 'playwright';
import { PlatformScraper, RawJobListing, ScraperSearchParams } from './types';

/**
 * Utility untuk membersihkan tag HTML dari teks deskripsi pekerjaan
 */
export function cleanHtmlDescription(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

export class TechInAsiaScraper implements PlatformScraper {
  readonly platformName = 'TECH_IN_ASIA';

  async scrape(params: ScraperSearchParams): Promise<RawJobListing[]> {
    const limit = params.limit || 10;
    const keywords = params.keywords.length > 0 ? params.keywords : ['developer'];
    const query = keywords[0]; // Ambil keyword utama

    console.log(`[SCRAPER-TIA] Memulai scraper Tech in Asia untuk query: "${query}" (Limit: ${limit})`);

    const rawListings: RawJobListing[] = [];
    const seenUrls = new Set<string>();

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;

    try {
      browser = await chromium.launch({
        headless: true
      });

      context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        locale: 'id-ID'
      });

      const page = await context.newPage();

      // Tangkap payload JSON langsung dari pencarian Algolia yang digunakan Tech in Asia
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('algolia.net') || url.includes('/queries')) {
          try {
            const data = await response.json();
            const hits = data.results?.[0]?.hits || [];

            for (const hit of hits) {
              if (rawListings.length >= limit) break;

              const jobId = hit.id || hit.objectID;
              const jobUrl = hit.external_link && hit.external_link.startsWith('http')
                ? hit.external_link
                : `https://www.techinasia.com/jobs/${jobId}`;

              if (seenUrls.has(jobUrl)) continue;
              seenUrls.add(jobUrl);

              // Ekstraksi gaji jika tersedia
              let salaryRange: string | undefined;
              if (hit.salary_min && hit.salary_max) {
                const currency = hit.currency?.currency_symbol || 'Rp';
                salaryRange = `${currency} ${Number(hit.salary_min).toLocaleString('id-ID')} - ${Number(hit.salary_max).toLocaleString('id-ID')}`;
              }

              // Ekstraksi lokasi
              let location = 'Indonesia / Remote';
              if (hit.city?.name) {
                location = `${hit.city.name}, ${hit.city.work_country_name || 'Indonesia'}`;
              } else if (hit.work_arrangement) {
                location = hit.work_arrangement;
              }

              const cleanDescription = cleanHtmlDescription(hit.description || '');

              rawListings.push({
                platform: 'TECH_IN_ASIA',
                externalId: jobId,
                title: hit.title || 'Untitled Role',
                companyName: hit.company?.name || 'Unknown Company',
                jobUrl,
                location,
                salaryRange,
                description: cleanDescription
              });
            }
          } catch {
            // Abaikan parsing response non-json atau response error
          }
        }
      });

      const targetUrl = `https://www.techinasia.com/jobs/search?query=${encodeURIComponent(query)}`;
      console.log(`[SCRAPER-TIA] Navigasi ke: ${targetUrl}`);

      await page.goto(targetUrl, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Tunggu sebentar untuk memastikan network responses Algolia telah selesai diproses
      await page.waitForTimeout(2500);

      // Jika dari network intercept belum mencukupi limit, lakukan fallback ekstraksi DOM
      if (rawListings.length < limit) {
        console.log(`[SCRAPER-TIA] Menjalankan fallback ekstraksi DOM (terkumpul ${rawListings.length}/${limit})...`);
        const domJobLinks = await page.$$eval('a[href*="/jobs/"]', (anchors) => {
          return anchors
            .map((a) => a.getAttribute('href'))
            .filter((href): href is string => Boolean(href && href.match(/\/jobs\/[a-f0-9-]{36}/i)));
        });

        for (const relativeUrl of domJobLinks) {
          if (rawListings.length >= limit) break;
          const fullUrl = relativeUrl.startsWith('http')
            ? relativeUrl
            : `https://www.techinasia.com${relativeUrl}`;

          if (seenUrls.has(fullUrl)) continue;
          seenUrls.add(fullUrl);

          try {
            const detailPage = await context.newPage();
            await detailPage.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

            const title = await detailPage.$eval('h1', (el) => el.textContent?.trim() || 'Untitled Role').catch(() => 'Untitled Role');
            const companyName = await detailPage.$eval('h2, [class*="company-name"]', (el) => el.textContent?.trim() || 'Tech Company').catch(() => 'Tech Company');
            const description = await detailPage.$eval('[class*="description"], article, main', (el) => el.textContent?.trim() || '').catch(() => '');

            if (description.length >= 80) {
              rawListings.push({
                platform: 'TECH_IN_ASIA',
                externalId: fullUrl.split('/').pop(),
                title,
                companyName,
                jobUrl: fullUrl,
                location: 'Indonesia',
                description: cleanHtmlDescription(description)
              });
            }
            await detailPage.close();
          } catch {
            // Lanjutkan jika satu detail halaman gagal
          }
        }
      }

      console.log(`[SCRAPER-TIA] Berhasil mengumpulkan ${rawListings.length} lowongan dari Tech in Asia.`);
      return rawListings.slice(0, limit);
    } catch (error: any) {
      console.error(`[SCRAPER-TIA] Error saat scraping:`, error.message);
      return rawListings;
    } finally {
      if (context) await context.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
    }
  }
}

export default TechInAsiaScraper;
