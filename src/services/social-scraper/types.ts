import { config } from "../../config/env";
export type SocialPlatform = "INSTAGRAM" | "TIKTOK";

export interface RawSocialPost {
  id: string;
  platform: SocialPlatform;
  sourceAccount: string;
  postUrl: string;
  caption: string;
  postedAt?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface ExtractedSocialJob {
  title: string;
  companyName: string;
  location: string;
  salaryRange?: string;
  hrdEmail?: string;
  hrdPhone?: string;
  applyUrl?: string;
  requirements: string[];
  isLegitimate: boolean;
  scamAnalysis?: string;
  matchScore: number;
}

export interface SocialScraperResult {
  post: RawSocialPost;
  extracted: ExtractedSocialJob;
}
