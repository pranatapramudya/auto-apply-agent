import { config } from "./env";

export interface ApplicantConfig {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  linkedInUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  expectedSalary: string;
  noticePeriodDays: number;
  workAuthorization: string;
  targetRoles?: string[];
  skills: string[];
  resumePath: string;
}

export const applicant: ApplicantConfig = {
  // Data Pribadi
  fullName: config.applicant.fullName,
  email: config.applicant.email,
  phone: config.applicant.phone,
  city: config.applicant.city,
  linkedInUrl: config.applicant.linkedInUrl,
  githubUrl: config.applicant.githubUrl,
  portfolioUrl: config.applicant.portfolioUrl,

  // Preferensi
  expectedSalary: config.applicant.expectedSalary,
  noticePeriodDays: config.applicant.noticePeriodDays,
  workAuthorization: config.applicant.workAuthorization,

  // Core Skills
  skills: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Python"],

  // Path Resume Biner
  resumePath: "./assets/resume-pranata-pramudya-1789360365401.pdf",
};

export default applicant;
