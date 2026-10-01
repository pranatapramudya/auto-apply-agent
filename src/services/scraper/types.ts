import { config } from "../../config/env";
/**
 * Definisi Tipe dan Interface untuk Scraper Engine
 */

export interface ScraperSearchParams {
  keywords: string[];
  location?: string;
  limit?: number;
  userId: string;
}

export interface RawJobListing {
  platform: string; // e.g. "TECH_IN_ASIA", "LINKEDIN", "GREENHOUSE", "LEVER"
  externalId?: string;
  title: string;
  companyName: string;
  jobUrl: string;
  location?: string;
  salaryRange?: string;
  description: string;
}

export interface PlatformScraper {
  readonly platformName: string;
  scrape(params: ScraperSearchParams): Promise<RawJobListing[]>;
}
