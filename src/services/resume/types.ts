import { config } from "../../config/env";
export interface TailoredResumeData {
  fullName: string;
  targetRole: string;
  email: string;
  phone: string;
  city: string;
  portfolioUrl?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  professionalSummary: string;
  matchedKeywords: string[];
  coreCompetencies: string[];
  workExperience: Array<{
    position: string;
    company: string;
    period: string;
    bulletPoints: string[];
  }>;
  projects: Array<{
    name: string;
    technologies: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
}

export interface TailorResumeParams {
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string | null;
  candidateCity?: string | null;
  targetRoles: string;
  coreSkills: string;
  portfolioUrl?: string | null;
  linkedInUrl?: string | null;
  githubUrl?: string | null;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
}

export interface GeneratedPdfResult {
  pdfRelativePath: string;
  pdfAbsolutePath: string;
  fileSizeBytes: number;
  atsScoreEstimate: number;
  matchedKeywords: string[];
}
