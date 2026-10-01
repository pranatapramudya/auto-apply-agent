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
  email: process.env.APPLICANT_EMAIL || "pranatapramudya39@gmail.com",
  phone: process.env.APPLICANT_PHONE || "+6285723256427",
  city: process.env.APPLICANT_CITY || "Sumedang (Bandung Raya / Remote)",
  linkedInUrl: process.env.APPLICANT_LINKEDIN_URL || "https://www.linkedin.com/in/pranata-pramudya-2a4427292/",
  githubUrl: process.env.APPLICANT_GITHUB_URL || "https://github.com/pranatapramudya",
  portfolioUrl: process.env.APPLICANT_PORTFOLIO_URL || "https://pranajayatech.online",

  // Preferensi
  expectedSalary: process.env.APPLICANT_EXPECTED_SALARY || "Rp 7.000.000 - Rp 15.000.000",
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
  resumePath: "./assets/resume-pranata-pramudya-1789360365401.pdf"
};

export default applicant;
