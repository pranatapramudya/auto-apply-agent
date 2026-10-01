export interface CoverLetterParams {
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string | null;
  candidateCity?: string | null;
  candidateRoles: string;
  candidateSkills: string;
  portfolioUrl?: string | null;
  linkedInUrl?: string | null;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
}

export interface CoverLetterResult {
  subject: string;
  body: string;
  candidateHighlights: string[];
}

export interface EmailDispatchParams {
  toEmail: string;
  candidateName: string;
  candidateEmail: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  resumePdfPath: string;
  isDryRun?: boolean;
  companyName?: string;
  jobTitle?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  mode: 'DRY_RUN' | 'LIVE_SEND';
  to: string;
  subject: string;
  sentAt: string;
  previewUrl?: string;
  error?: string;
}
