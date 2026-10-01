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
  fullName: process.env.APPLICANT_FULL_NAME || "Pranata Pramudya",
  email: process.env.APPLICANT_EMAIL || "pranataprp@example.com",
  phone: process.env.APPLICANT_PHONE || "+6281234567890",
  city: process.env.APPLICANT_CITY || "Sumedang (Bandung Raya / Remote)",
  linkedInUrl: process.env.APPLICANT_LINKEDIN_URL || "https://linkedin.com/in/pranataprp",
  githubUrl: process.env.APPLICANT_GITHUB_URL || "https://github.com/pranataprp",
  portfolioUrl: process.env.APPLICANT_PORTFOLIO_URL || "https://pranata.dev",

  // Preferensi
  expectedSalary: process.env.APPLICANT_EXPECTED_SALARY || "Rp 15.000.000 - Rp 25.000.000",
  noticePeriodDays: Number(process.env.APPLICANT_NOTICE_PERIOD_DAYS) || 0,
  workAuthorization: process.env.APPLICANT_WORK_AUTHORIZATION || "Authorized to work in Indonesia / Remote",

  // Core Skills
  skills: [
    "Next.js",
    "TypeScript",
    "Prisma",
    "PostgreSQL",
    "Python"
  ],

  // Path Resume Biner
  resumePath: "./assets/resume.pdf"
};

export default applicant;
