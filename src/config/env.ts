import dotenv from "dotenv";
import path from "path";

// Load .env relative to project root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export interface ConfigShape {
  db: { url: string | undefined };
  ai: { groqKey: string | undefined };
  smtp: {
    host: string | undefined;
    user: string | undefined;
    pass: string | undefined;
    port: number;
    secure: boolean;
  };
  applicant: {
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
  };
  app: { allowLiveApply: boolean };
}

export const config: ConfigShape = {
  db: {
    url: process.env.DATABASE_URL?.trim(),
  },
  ai: {
    groqKey: process.env.GROQ_API_KEY?.trim(),
  },
  smtp: {
    host: process.env.SMTP_HOST?.trim(),
    user: process.env.SMTP_USER?.trim(),
    pass: process.env.SMTP_PASS?.trim(),
    port: Number(process.env.SMTP_PORT) || 587,
    secure:
      process.env.SMTP_SECURE === "true" ||
      Number(process.env.SMTP_PORT) === 465,
  },
  applicant: {
    fullName: process.env.APPLICANT_FULL_NAME?.trim() || "Pranata Pramudya",
    email: process.env.APPLICANT_EMAIL?.trim() || "pranatapramudya39@gmail.com",
    phone: process.env.APPLICANT_PHONE?.trim() || "+628****6427",
    city:
      process.env.APPLICANT_CITY?.trim() || "Sumedang (Bandung Raya / Remote)",
    linkedInUrl:
      process.env.APPLICANT_LINKEDIN_URL?.trim() ||
      "https://www.linkedin.com/in/pranata-pramudya-2a4427292/",
    githubUrl:
      process.env.APPLICANT_GITHUB_URL?.trim() ||
      "https://github.com/pranatapramudya",
    portfolioUrl:
      process.env.APPLICANT_PORTFOLIO_URL?.trim() ||
      "https://pranajayatech.online",
    expectedSalary:
      process.env.APPLICANT_EXPECTED_SALARY?.trim() ||
      "Rp 7.000.000 - Rp 15.000.000",
    noticePeriodDays: Number(process.env.APPLICANT_NOTICE_PERIOD_DAYS) || 0,
    workAuthorization:
      process.env.APPLICANT_WORK_AUTHORIZATION?.trim() ||
      "Authorized to work in Indonesia / Remote",
  },
  app: {
    allowLiveApply: process.env.ALLOW_LIVE_APPLY === "true",
  },
};

export function validateEnv() {
  if (!config.db.url) {
    console.error("❌ FATAL: DATABASE_URL is missing in .env");
    process.exit(1);
  }
  if (!config.ai.groqKey) {
    console.error("❌ FATAL: GROQ_API_KEY is missing in .env");
    process.exit(1);
  }
}

// Auto-validate on import
validateEnv();
