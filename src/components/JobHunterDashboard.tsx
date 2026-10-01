'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  X,
  ExternalLink,
  Search,
  User as UserIcon,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  RotateCw,
  SlidersHorizontal,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Check,
  Layers,
  Send,
  Ban,
  Sparkles,
  ArrowUpRight,
  Filter,
  CheckCheck,
  Zap,
  Camera,
  Maximize2,
  Eye,
  Play,
  Terminal,
  CheckSquare,
  Square,
  Trash2,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Globe,
  FileUp,
  Info,
  Share2,
  Smartphone,
  MessageCircle
} from 'lucide-react';

export interface ResumeStats {
  fileName: string;
  sizeBytes: number;
  isDummy: boolean;
  localPath: string;
}

export interface UserItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  linkedInUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  targetRoles: string;
  coreSkills: string;
  expectedSalary?: number | null;
  resumeLocalPath: string;
  isActive: boolean;
  createdAt: string;
  _count?: { listings: number };
  resumeStats?: ResumeStats;
}

export interface JobItem {
  id: string;
  userId: string;
  platform: string;
  title: string;
  companyName: string;
  jobUrl: string;
  location?: string | null;
  salaryRange?: string | null;
  description: string;
  isLegit: boolean;
  scamReason?: string | null;
  matchScore?: number | null;
  status:
    | 'DISCOVERED'
    | 'FILTERED_OUT'
    | 'QUEUED_FOR_APPLY'
    | 'APPLYING'
    | 'APPLIED'
    | 'UNDER_REVIEW'
    | 'INTERVIEW'
    | 'REJECTED'
    | 'FAILED';
  failureReason?: string | null;
  appliedAt?: string | null;
  createdAt: string;
}

interface Props {
  initialUsers: UserItem[];
  initialJobs: JobItem[];
}

function isToday(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatIDR(num?: number | null): string {
  if (!num) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getCompanyInitials(name: string): string {
  const clean = name.replace(/^(PT|CV|Ltd|Inc)\.?\s+/i, '').trim();
  const words = clean.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'JB';
}

const AVATAR_GRADIENTS = [
  'from-indigo-600 to-blue-600',
  'from-blue-600 to-cyan-600',
  'from-teal-600 to-emerald-600',
  'from-rose-600 to-pink-600',
  'from-amber-600 to-orange-600',
  'from-purple-600 to-indigo-600',
  'from-slate-700 to-slate-900'
];

function getCompanyGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

function isPartnerUser(user?: { fullName?: string | null; targetRoles?: string | null }): boolean {
  if (!user) return false;
  const combined = `${user.fullName || ''} ${user.targetRoles || ''}`.toLowerCase();
  return (
    combined.includes('siti') ||
    combined.includes('fathonah') ||
    combined.includes('partner') ||
    combined.includes('administrasi') ||
    combined.includes('publik')
  );
}

export default function JobHunterDashboard({ initialUsers, initialJobs }: Props) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUsers[0]?.id || '');
  const [jobs, setJobs] = useState<JobItem[]>(initialJobs);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(60);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedJobDetail, setSelectedJobDetail] = useState<JobItem | null>(null);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    city: '',
    linkedInUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    expectedSalary: '',
    targetRoles: '',
    coreSkills: ''
  });
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<'cv' | 'biodata' | 'career'>('cv');
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isScrapingLive, setIsScrapingLive] = useState(false);
  const [customScrapeInput, setCustomScrapeInput] = useState('');

  // Auto-Apply Agent Runner State
  const [isRunApplyModalOpen, setIsRunApplyModalOpen] = useState(false);
  const [isRunningApply, setIsRunningApply] = useState(false);
  const [runApplyMode, setRunApplyMode] = useState<'DRY_RUN' | 'LIVE'>('DRY_RUN');
  const [runApplyLimit, setRunApplyLimit] = useState<number>(1);
  const [runApplyProgressMsg, setRunApplyProgressMsg] = useState('');
  const [jobScreenshots, setJobScreenshots] = useState<Record<string, Array<{ filename: string; url: string; type: string; timestamp: number }>>>({});
  const [isLoadingScreenshot, setIsLoadingScreenshot] = useState(false);
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);

  // Auto-Email Dispatcher Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTargetJob, setEmailTargetJob] = useState<JobItem | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailIsDryRun, setEmailIsDryRun] = useState(true);
  const [emailHighlights, setEmailHighlights] = useState<string[]>([]);

  // Social Media Scraper Modal State (Tahap 2: IG & TikTok)
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [isScrapingSocial, setIsScrapingSocial] = useState(false);
  const [socialCustomInput, setSocialCustomInput] = useState('');
  const [socialLocationFilter, setSocialLocationFilter] = useState<'Sumedang' | 'Bandung' | 'Semua'>('Sumedang');
  const [socialScrapedResults, setSocialScrapedResults] = useState<any[]>([]);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Multi-select & Batch Actions State
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

  // Live Activity Console State
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<Array<{ id: string; time: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>>([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString('id-ID'),
      message: 'Autonomous Auto-Apply Agent v2.0 (Precision Talent Engine) aktif & siap beroperasi.',
      type: 'info'
    }
  ]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('id-ID');
    const newLog = { id: `${Date.now()}-${Math.random()}`, time, message, type };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  const toggleSelectJob = (id: string) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedJobIds.size === filteredJobs.length && filteredJobs.length > 0) {
      setSelectedJobIds(new Set());
    } else {
      setSelectedJobIds(new Set(filteredJobs.map((j) => j.id)));
    }
  };

  const handleBatchUpdate = async (status: JobItem['status']) => {
    if (selectedJobIds.size === 0 || isBatchUpdating) return;
    setIsBatchUpdating(true);
    const count = selectedJobIds.size;
    const label = status === 'QUEUED_FOR_APPLY' ? 'mengantrekan' : status === 'FILTERED_OUT' ? 'mengabaikan' : 'mengubah';
    showToast(`Sedang ${label} ${count} lowongan terpilih...`);
    addLog(`Memproses tindakan massal (${status}) untuk ${count} lowongan...`, 'info');

    try {
      const res = await fetch('/api/jobs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: Array.from(selectedJobIds),
          status
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || `Berhasil memperbarui ${count} lowongan.`);
        addLog(`✅ Berhasil memperbarui ${count} lowongan ke status ${status}.`, 'success');
        setJobs((prev) =>
          prev.map((j) => (selectedJobIds.has(j.id) ? { ...j, status } : j))
        );
        setSelectedJobIds(new Set());
      } else {
        showToast(json.error || 'Gagal memperbarui lowongan massal', true);
        addLog(`❌ Gagal update massal: ${json.error}`, 'error');
      }
    } catch (e: any) {
      showToast('Terjadi kesalahan: ' + e.message, true);
      addLog(`❌ Error koneksi batch: ${e.message}`, 'error');
    } finally {
      setIsBatchUpdating(false);
    }
  };

  // Fetch screenshots whenever selected job changes
  useEffect(() => {
    if (selectedJobDetail?.id) {
      setIsLoadingScreenshot(true);
      fetch(`/api/screenshots?jobId=${selectedJobDetail.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setJobScreenshots((prev) => ({ ...prev, [selectedJobDetail.id]: data.data }));
          }
        })
        .catch(() => { })
        .finally(() => setIsLoadingScreenshot(false));
    }
  }, [selectedJobDetail?.id]);

  // Single Job Dry-Run Test Action
  const handleSingleTestApply = async (jobId: string) => {
    if (!activeUser || isRunningApply) return;
    setIsRunningApply(true);
    showToast('Memulai simulasi pengisian form Playwright (Dry-Run)...');
    try {
      const res = await fetch('/api/agent/run-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser.id,
          jobListingId: jobId,
          dryRun: true
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Simulasi form berhasil diselesaikan.');
        await fetchJobs(activeUser.id);
        const scRes = await fetch(`/api/screenshots?jobId=${jobId}`);
        const scJson = await scRes.json();
        if (scJson.success && scJson.data) {
          setJobScreenshots((prev) => ({ ...prev, [jobId]: scJson.data }));
        }
      } else {
        showToast(json.error || 'Gagal menjalankan simulasi form.', true);
      }
    } catch (err: any) {
      showToast('Koneksi agent terganggu: ' + err.message, true);
    } finally {
      setIsRunningApply(false);
    }
  };

  // Buka Modal & Hasilkan Cover Letter AI untuk Email HRD
  const handleOpenEmailModal = async (job: JobItem) => {
    setEmailTargetJob(job);
    setIsEmailModalOpen(true);
    setIsGeneratingEmail(true);
    setEmailRecipient('');
    setEmailSubject('');
    setEmailBody('');
    setEmailHighlights([]);

    addLog(`Menghasilkan Cover Letter AI untuk ${job.companyName}...`, 'info');

    try {
      const res = await fetch('/api/agent/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          jobId: job.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setEmailRecipient(data.recipientEmail || '');
        setEmailSubject(data.coverLetter.subject || '');
        setEmailBody(data.coverLetter.body || '');
        setEmailHighlights(data.coverLetter.candidateHighlights || []);
        addLog(`✅ Cover letter AI siap untuk posisi ${job.title}.`, 'success');
      } else {
        showToast(data.error || 'Gagal menghasilkan cover letter', true);
        addLog(`❌ Gagal generate cover letter: ${data.error}`, 'error');
      }
    } catch (e: any) {
      showToast('Gagal memuat cover letter: ' + e.message, true);
      addLog(`❌ Error koneksi cover letter: ${e.message}`, 'error');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  // Eksekusi Kirim Email Lamaran (Dry-Run atau Live Send)
  const handleSendApplicationEmail = async () => {
    if (!emailTargetJob || !emailRecipient.trim() || !emailSubject.trim() || !emailBody.trim()) {
      showToast('Harap lengkapi email penerima, subjek, dan isi surat lamaran', true);
      return;
    }

    setIsSendingEmail(true);
    const modeLabel = emailIsDryRun ? 'Simulasi' : 'Kirim Langsung';
    addLog(`Memproses pengiriman email (${modeLabel}) ke ${emailRecipient}...`, 'info');

    try {
      const res = await fetch('/api/agent/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          jobId: emailTargetJob.id,
          toEmail: emailRecipient.trim(),
          subject: emailSubject.trim(),
          bodyText: emailBody.trim(),
          isDryRun: emailIsDryRun
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Lamaran sukses ${emailIsDryRun ? 'disimulasikan' : 'dikirim'} ke ${emailRecipient}!`);
        addLog(`✅ Email lamaran ${emailIsDryRun ? '(Simulasi)' : '(Terkirim)'} untuk ${emailTargetJob.title} berhasil diproses.`, 'success');

        // Update job status in state to APPLIED
        setJobs((prev) =>
          prev.map((j) => (j.id === emailTargetJob.id ? { ...j, status: 'APPLIED', appliedAt: new Date().toISOString() } : j))
        );
        setIsEmailModalOpen(false);
      } else {
        showToast(data.error || 'Gagal mengirim email lamaran', true);
        addLog(`❌ Gagal kirim email: ${data.error}`, 'error');
      }
    } catch (e: any) {
      showToast('Terjadi kesalahan pengiriman: ' + e.message, true);
      addLog(`❌ Error koneksi email: ${e.message}`, 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Queue / Batch Runner Action
  const handleRunAgentQueue = async () => {
    if (!activeUser || isRunningApply) return;
    setIsRunningApply(true);
    const isDry = runApplyMode === 'DRY_RUN';
    setRunApplyProgressMsg(isDry ? 'Playwright sedang menginjeksi biodata & unggah CV (Dry-Run)...' : '🚨 Memproses submit live lamaran...');
    try {
      const res = await fetch('/api/agent/run-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser.id,
          limit: runApplyLimit,
          dryRun: isDry
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Eksekusi agent selesai.');
        await fetchJobs(activeUser.id);
        setIsRunApplyModalOpen(false);
      } else {
        showToast(json.error || 'Gagal menjalankan eksekusi agent.', true);
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan eksekusi: ' + err.message, true);
    } finally {
      setIsRunningApply(false);
      setRunApplyProgressMsg('');
    }
  };

  const handleTriggerLiveScrape = async (queryToScrape?: string) => {
    if (!activeUser || isScrapingLive) return;
    setIsScrapingLive(true);
    const targetQ = typeof queryToScrape === 'string' && queryToScrape.trim()
      ? queryToScrape.trim()
      : (customScrapeInput.trim() || undefined);

    showToast(`Memulai crawling real-time lowongan kerja di Indonesia${targetQ ? ` untuk "${targetQ}"` : ''}...`);
    try {
      const res = await fetch('/api/scrape-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser.id, customQuery: targetQ })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Berhasil menarik lowongan baru.');
        await fetchJobs(activeUser.id);
        setCustomScrapeInput('');
      } else {
        showToast(json.error || 'Gagal menjalankan live scraper.', true);
      }
    } catch (e: any) {
      showToast('Koneksi scraper terganggu: ' + e.message, true);
    } finally {
      setIsScrapingLive(false);
    }
  };

  // Tahap 2: Ekstraksi Loker Media Sosial (Instagram & TikTok)
  const handleScrapeSocial = async (targetTextOrUrl?: string) => {
    if (!activeUser || isScrapingSocial) return;
    setIsScrapingSocial(true);
    showToast('Memulai crawling AI info loker media sosial (Instagram & TikTok)...');
    addLog(`Memulai crawling media sosial (Instagram & TikTok) untuk wilayah ${socialLocationFilter}...`, 'info');

    try {
      const res = await fetch('/api/agent/scrape-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser.id,
          customCaptionOrUrl: targetTextOrUrl || socialCustomInput,
          locationFilter: socialLocationFilter
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Ekstraksi media sosial berhasil.');
        addLog(`✅ Berhasil menarik ${json.data.totalProcessed} info loker IG/TikTok (${json.data.inserted} disimpan ke database).`, 'success');
        setSocialScrapedResults(json.data.jobs || []);
        await fetchJobs(activeUser.id);
      } else {
        showToast(json.error || 'Gagal mengekstrak postingan media sosial.', true);
        addLog(`❌ Gagal scraping media sosial: ${json.error}`, 'error');
      }
    } catch (err: any) {
      showToast('Koneksi scraper media sosial terganggu: ' + err.message, true);
    } finally {
      setIsScrapingSocial(false);
    }
  };

  const activeUser = useMemo(() => {
    return users.find((u) => u.id === selectedUserId) || users[0];
  }, [users, selectedUserId]);

  const presetTags = useMemo(() => {
    if (!activeUser) return [];
    const isPartner = isPartnerUser(activeUser);
    if (isPartner) {
      return [
        'Semua',
        'Semua Jurusan',
        'BUMN',
        'Staff Administrasi',
        'General Affairs',
        'Tata Kelola Dokumen',
        'Customer Care',
        'HR Admin',
        'Jakarta',
        'Bandung',
        'Surabaya',
        'Remote'
      ];
    }
    return [
      'Semua',
      'Semua Jurusan',
      'BUMN',
      'Fullstack',
      'Frontend',
      'Backend',
      'Software Engineer',
      'IT Support',
      'Jakarta',
      'Bandung',
      'Surabaya',
      'Remote'
    ];
  }, [activeUser]);

  // Sync profile form when activeUser changes
  useEffect(() => {
    if (activeUser) {
      setProfileForm({
        fullName: activeUser.fullName || '',
        phone: activeUser.phone || '',
        city: activeUser.city || '',
        linkedInUrl: activeUser.linkedInUrl || '',
        githubUrl: activeUser.githubUrl || '',
        portfolioUrl: activeUser.portfolioUrl || '',
        expectedSalary: activeUser.expectedSalary ? String(activeUser.expectedSalary) : '',
        targetRoles: activeUser.targetRoles || '',
        coreSkills: activeUser.coreSkills || ''
      });
      setSelectedResumeFile(null);
    }
  }, [activeUser]);

  // Fetch jobs when switching user
  const fetchJobs = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs?userId=${userId}`);
      const json = await res.json();
      if (json.success) {
        setJobs(json.data);
      }
    } catch (e: any) {
      showToast('Gagal memuat data lowongan: ' + e.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    if (userId !== selectedUserId) {
      setSelectedUserId(userId);
      fetchJobs(userId);
    }
  };

  // Metrics per active user
  const metrics = useMemo(() => {
    const userJobs = jobs.filter((j) => j.userId === selectedUserId);
    const appliedToday = userJobs.filter(
      (j) => j.status === 'APPLIED' && isToday(j.appliedAt)
    ).length;

    return {
      TOTAL: userJobs.length,
      DISCOVERED: userJobs.filter((j) => j.status === 'DISCOVERED').length,
      QUEUED: userJobs.filter((j) => j.status === 'QUEUED_FOR_APPLY').length,
      APPLIED: userJobs.filter((j) => j.status === 'APPLIED').length,
      FILTERED: userJobs.filter((j) => j.status === 'FILTERED_OUT' || j.status === 'FAILED').length,
      APPLIED_TODAY: appliedToday
    };
  }, [jobs, selectedUserId]);

  // Quota dynamic progress status
  const quotaInfo = useMemo(() => {
    const count = metrics.APPLIED_TODAY;
    const targetCap = 10;
    const percentage = Math.min(100, Math.round((count / targetCap) * 100));

    if (count >= 10) {
      return {
        label: 'Target Penuh (10/10)',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
        barGradient: 'from-amber-500 to-orange-500',
        percentage
      };
    }
    if (count >= 5) {
      return {
        label: 'Target Optimal (5-10)',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
        barGradient: 'from-emerald-500 to-teal-500',
        percentage
      };
    }
    if (count > 0) {
      return {
        label: `Berjalan (${count}/10)`,
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
        barGradient: 'from-indigo-500 to-violet-500',
        percentage
      };
    }
    return {
      label: 'Mulai Hari Ini (0/10)',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      barGradient: 'from-slate-700 to-slate-900',
      percentage
    };
  }, [metrics.APPLIED_TODAY]);

  // Strategic Talent Analytics (Reverse ATS & Skill Gaps)
  const talentAnalytics = useMemo(() => {
    const userJobs = jobs.filter((j) => j.userId === selectedUserId);
    const validScores = userJobs
      .map((j) => j.matchScore)
      .filter((s): s is number => typeof s === 'number' && s > 0)
      .map((s) => (s <= 1.0 ? Math.round(s * 100) : Math.round(s)));

    const avgScore = validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 84;

    const highMatchCount = validScores.filter((s) => s >= 75).length;

    // Common in-demand tech stacks
    const techStacks = ['TypeScript', 'Next.js', 'PostgreSQL', 'Python', 'React', 'Node.js', 'Docker', 'REST API', 'Playwright'];
    const detectedInJobs = techStacks.filter((tech) =>
      userJobs.some((j) => j.description?.toLowerCase().includes(tech.toLowerCase()))
    );

    const userSkillsLower = (activeUser?.coreSkills || '').toLowerCase();
    const recommendedGaps = ['Docker', 'GraphQL', 'CI/CD', 'Microservices'].filter(
      (skill) => !userSkillsLower.includes(skill.toLowerCase()) &&
        userJobs.some((j) => j.description?.toLowerCase().includes(skill.toLowerCase()))
    );

    return {
      avgScore,
      highMatchCount,
      topSkills: detectedInJobs.slice(0, 5),
      gapSkills: recommendedGaps.slice(0, 3)
    };
  }, [jobs, selectedUserId, activeUser]);

  // Update Status Lowongan (Antrekan / Abaikan)
  const handleUpdateStatus = async (
    jobId: string,
    newStatus: JobItem['status']
  ) => {
    setActionLoadingId(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
        );
        if (selectedJobDetail?.id === jobId) {
          setSelectedJobDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
        }

        const statusLabelMap: Record<string, string> = {
          QUEUED_FOR_APPLY: 'Lowongan berhasil dimasukkan ke antrean.',
          FILTERED_OUT: 'Lowongan telah diabaikan.',
          DISCOVERED: 'Status lowongan dikembalikan ke Siap Antre.'
        };
        showToast(statusLabelMap[newStatus] || 'Status lowongan berhasil diperbarui.');
      } else {
        showToast(json.error || 'Gagal mengubah status', true);
      }
    } catch (e: any) {
      showToast('Gagal menghubungi server: ' + e.message, true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Profile & Resume Upload Submit
  const handleSaveProfileAndResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;

    setIsUploadingProfile(true);
    try {
      const formData = new FormData();
      formData.append('userId', activeUser.id);
      if (profileForm.phone) formData.append('phone', profileForm.phone);
      if (profileForm.city) formData.append('city', profileForm.city);
      if (profileForm.linkedInUrl) formData.append('linkedInUrl', profileForm.linkedInUrl);
      if (profileForm.githubUrl) formData.append('githubUrl', profileForm.githubUrl);
      if (profileForm.portfolioUrl) formData.append('portfolioUrl', profileForm.portfolioUrl);
      if (profileForm.expectedSalary) formData.append('expectedSalary', profileForm.expectedSalary);
      if (profileForm.targetRoles) formData.append('targetRoles', profileForm.targetRoles);
      if (profileForm.coreSkills) formData.append('coreSkills', profileForm.coreSkills);

      if (selectedResumeFile) {
        formData.append('resume', selectedResumeFile);
      }

      const res = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();

      if (json.success) {
        showToast('Profil dan berkas CV berhasil disimpan.');
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id === activeUser.id) {
              return {
                ...u,
                ...json.data.user,
                resumeStats: json.data.resumeInfo
              };
            }
            return u;
          })
        );
        setIsProfileModalOpen(false);
      } else {
        showToast(json.error || 'Gagal menyimpan profil', true);
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan: ' + err.message, true);
    } finally {
      setIsUploadingProfile(false);
    }
  };

  // Filtered Job Listings
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (j.userId !== selectedUserId) return false;

      // Status Filter
      if (selectedStatus === 'DISCOVERED' && j.status !== 'DISCOVERED') return false;
      if (selectedStatus === 'QUEUED_FOR_APPLY' && j.status !== 'QUEUED_FOR_APPLY') return false;
      if (selectedStatus === 'APPLIED' && j.status !== 'APPLIED') return false;
      if (selectedStatus === 'FILTERED_OUT' && (j.status !== 'FILTERED_OUT' && j.status !== 'FAILED')) return false;

      // Score Filter
      const scorePercent = Math.round((j.matchScore ?? 0) * 100);
      if (scorePercent < minScoreFilter) return false;

      // Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = j.title.toLowerCase().includes(query);
        const inCompany = j.companyName.toLowerCase().includes(query);
        const inLocation = (j.location || '').toLowerCase().includes(query);
        const inDesc = j.description.toLowerCase().includes(query);
        if (!inTitle && !inCompany && !inLocation && !inDesc) return false;
      }

      return true;
    });
  }, [jobs, selectedUserId, selectedStatus, minScoreFilter, searchQuery]);

  // Reset halaman saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUserId, selectedStatus, minScoreFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedJobs = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredJobs.slice(startIndex, startIndex + pageSize);
  }, [filteredJobs, safeCurrentPage, pageSize]);

  // Initials for Active User Avatar
  const userInitials = useMemo(() => {
    if (!activeUser?.fullName) return 'U';
    const parts = activeUser.fullName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return activeUser.fullName.slice(0, 2).toUpperCase();
  }, [activeUser]);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 pb-24 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full px-4 animate-fade-in">
          <div
            className={`p-4 rounded-xl border shadow-xl flex items-center justify-between gap-3 backdrop-blur-md ${toastMessage.isError
                ? 'bg-rose-50/95 border-rose-200 text-rose-900'
                : 'bg-slate-900/95 border-slate-800 text-white'
              }`}
          >
            <div className="flex items-center gap-2.5 text-sm font-medium">
              {toastMessage.isError ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. STICKY TOP HEADER & PROFILE SWITCHER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Brand Logo & Tagline */}
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 flex items-center justify-center text-white shadow-md shadow-indigo-950/20 ring-2 ring-indigo-500/20 flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                    AutoApply <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Agent</span>
                  </h1>
                  <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 uppercase tracking-wide">
                    v2.0 Otomatis
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Agen Siaga
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Asisten Agen Pencari & Pelamar Lowongan Kerja Otomatis Indonesia
                </p>
              </div>
            </div>

            {/* User Profile Switcher Segmented Control */}
            <div className="flex items-center gap-2.5">
              <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-1">
                <span>Profil Pelamar:</span>
              </div>
              <div className="p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 flex items-center gap-1 overflow-x-auto max-w-full">
                {users.map((user) => {
                  const isSelected = user.id === selectedUserId;
                  const isPartner = isPartnerUser(user);
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 min-h-[38px] cursor-pointer active:scale-[0.98] ${isSelected
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-extrabold ring-1 ring-slate-900/5'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-transparent'
                        }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${isSelected ? (isPartner ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.6)]') : 'bg-slate-400'
                          }`}
                      />
                      <span>{user.fullName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        {/* 2. ACTIVE USER HERO PROFILE BANNER */}
        {activeUser && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.05)] relative overflow-hidden">
            {/* Subtle ambient accent gradient in top corner */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-50/50 via-slate-50/10 to-transparent rounded-full -mr-28 -mt-28 pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                {/* User Avatar Badge with Dynamic Gradient */}
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-black shadow-lg flex-shrink-0 ring-4 ring-slate-50 ${isPartnerUser(activeUser)
                      ? 'bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 shadow-rose-500/25'
                      : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-700 shadow-indigo-500/25'
                    }`}
                >
                  {userInitials}
                </div>

                {/* Profile Details */}
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {activeUser.fullName}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Aktif
                    </span>

                    {/* Resume status badge */}
                    {activeUser.resumeStats?.isDummy ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>CV Standar Sistem (Perlu Unggah PDF Baru)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>CV Terpasang ({formatBytes(activeUser.resumeStats?.sizeBytes)})</span>
                      </span>
                    )}
                  </div>

                  {/* Target Roles Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                      Spesialisasi:
                    </span>
                    {activeUser.targetRoles.split(',').map((role, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100/90 text-slate-800 border border-slate-200/80 shadow-2xs"
                      >
                        {role.trim()}
                      </span>
                    ))}
                  </div>

                  {/* Metadata Chips Strip */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium pt-0.5">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {activeUser.email}
                    </span>
                    {activeUser.phone && (
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {activeUser.phone}
                      </span>
                    )}
                    {activeUser.city && (
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {activeUser.city}
                      </span>
                    )}
                    {activeUser.expectedSalary && (
                      <span className="flex items-center gap-1.5 font-bold text-slate-900 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                        <DollarSign className="w-3 h-3" />
                        Gaji Target: {formatIDR(activeUser.expectedSalary)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0 w-full lg:w-auto">
                {/* ⚡ Tombol Eksekusi Autonomous Agent */}
                <button
                  disabled={isRunningApply || isScrapingLive}
                  onClick={() => {
                    setRunApplyLimit(Math.min(3, Math.max(1, metrics.QUEUED || 1)));
                    setIsRunApplyModalOpen(true);
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md border border-slate-700/80 ring-1 ring-inset ring-white/10 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 min-h-[44px] disabled:opacity-50 disabled:pointer-events-none cursor-pointer group"
                >
                  {isRunningApply ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Eksekusi Agen...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400 group-hover:scale-110 transition-transform" />
                      <span>Jalankan Auto-Apply ({metrics.QUEUED} Siap)</span>
                    </>
                  )}
                </button>

                <button
                  disabled={isScrapingLive || isRunningApply}
                  onClick={() => handleTriggerLiveScrape()}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm border border-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 min-h-[44px] disabled:opacity-50 disabled:pointer-events-none cursor-pointer group"
                >
                  {isScrapingLive ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-white" />
                      <span>Crawling Loker...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                      </span>
                      <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                      <span>Cari Loker Real-Time</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 min-h-[44px] cursor-pointer group"
                >
                  <Upload className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                  <span>Kelola Profil & CV</span>
                </button>

                <button
                  onClick={() => setIsSocialModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 hover:from-pink-500/20 hover:to-indigo-500/20 text-purple-950 border border-purple-200/80 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 min-h-[44px] cursor-pointer group"
                  title="Tarik info lowongan kerja resmi dari Instagram & TikTok untuk BUMN dan seluruh kota Indonesia"
                >
                  <Share2 className="w-4 h-4 text-pink-600 group-hover:scale-110 transition-transform" />
                  <span>Tarik dari IG & TikTok</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-pink-100 text-pink-800 border border-pink-200">
                    BUMN & Nasional
                  </span>
                </button>
              </div>
            </div>

            {/* Custom Query Real-Time Crawler Bar */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Ketik posisi kerja spesifik untuk di-crawl langsung (mis: ${isPartnerUser(activeUser)
                      ? 'Staf Administrasi, General Affairs, Kompas, Prodia'
                      : 'Frontend Developer, Next.js, React, Fullstack'
                    })...`}
                  value={customScrapeInput}
                  onChange={(e) => setCustomScrapeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTriggerLiveScrape(customScrapeInput);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                />
              </div>
              <button
                disabled={isScrapingLive || !customScrapeInput.trim()}
                onClick={() => handleTriggerLiveScrape(customScrapeInput)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 shadow-sm border border-slate-700/80 ring-1 ring-inset ring-white/10 hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap min-h-[42px] cursor-pointer"
              >
                {isScrapingLive ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                )}
                <span>Crawl Loker Ini</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. DAILY QUOTA TRACKER & STATS METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Card 1: Daily Quota Progress Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Target Harian
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap flex-shrink-0 ${quotaInfo.badgeClass}`}
                >
                  {quotaInfo.label}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {metrics.APPLIED_TODAY}
                </span>
                <span className="text-xs font-semibold text-slate-500">/ 10 Lamaran</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                Batas aman harian otomatisasi bot untuk mencegah limit platform.
              </p>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-100">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200/80">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${quotaInfo.barGradient} transition-all duration-500 shadow-sm`}
                  style={{ width: `${quotaInfo.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1.5">
                <span>0</span>
                <span className="font-semibold text-slate-600">5 optimal</span>
                <span>10 maks cap</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Loker */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Loker</span>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {metrics.TOTAL}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Tersimpan di DB</span>
            </div>
          </div>

          {/* Card 3: Siap Antre */}
          <div className="bg-white border border-blue-200/70 rounded-2xl p-4 sm:p-5 shadow-2xs bg-gradient-to-b from-blue-50/20 to-white flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Siap Antre</span>
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
                {metrics.DISCOVERED}
              </div>
              <span className="text-[11px] text-blue-600 font-medium">Perlu review pelamar</span>
            </div>
          </div>

          {/* Card 4: Dalam Antrean */}
          <div className="bg-white border border-amber-200/70 rounded-2xl p-4 sm:p-5 shadow-2xs bg-gradient-to-b from-amber-50/20 to-white flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Dalam Antrean</span>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-amber-900 tracking-tight">
                {metrics.QUEUED}
              </div>
              <span className="text-[11px] text-amber-700 font-medium">Siap kirim bot</span>
            </div>
          </div>

          {/* Card 5: Sukses Melamar */}
          <div className="bg-white border border-emerald-200/70 rounded-2xl p-4 sm:p-5 shadow-2xs bg-gradient-to-b from-emerald-50/20 to-white flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Sukses Melamar</span>
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-emerald-900 tracking-tight">
                {metrics.APPLIED}
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Total terkirim</span>
            </div>
          </div>
        </div>

        {/* 3B. STRATEGIC TALENT & REVERSE ATS ANALYTICS */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold tracking-tight text-white">Strategic Talent & ATS Grounding</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Knowledge Base Terhubung
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Zero-Hallucination Mode
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Kandidat: <span className="text-white font-semibold">{activeUser?.fullName}</span> | Rata-rata Skor Keselarasan ATS: <span className="text-indigo-400 font-bold">{talentAnalytics.avgScore}%</span> ({talentAnalytics.highMatchCount} lowongan high-match &ge; 75%)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Stack Dominan Loker:</div>
              {talentAnalytics.topSkills.map((skill) => (
                <span key={skill} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800/80 text-slate-200 border border-slate-700/60">
                  {skill}
                </span>
              ))}
              {talentAnalytics.gapSkills.length > 0 && (
                <div className="flex items-center gap-1.5 ml-1">
                  <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Rekomendasi Boost:
                  </span>
                  {talentAnalytics.gapSkills.map((gap) => (
                    <span key={gap} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      +{gap}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. FILTER BAR & SEARCH CONTROLS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari lowongan, nama perusahaan, skill atau kota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-slate-50/50 hover:bg-white placeholder-slate-400 transition-all"
              />
            </div>

            {/* Score Filter Selector */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 whitespace-nowrap">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Min Skor:</span>
              </div>
              <div className="p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 flex items-center gap-1">
                {[0, 60, 75, 85].map((score) => (
                  <button
                    key={score}
                    onClick={() => setMinScoreFilter(score)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${minScoreFilter === score
                        ? 'bg-slate-900 text-white shadow-[0_2px_8px_rgba(15,23,42,0.2)] font-extrabold border border-slate-800 ring-1 ring-inset ring-white/10'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-medium'
                      }`}
                  >
                    {score === 0 ? 'Semua' : `${score}%+`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Preset Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap mr-1">
              Kategori Populer:
            </span>
            {presetTags.map((tag) => {
              const isAll = tag === 'Semua';
              const active = isAll ? !searchQuery.trim() : searchQuery.toLowerCase().includes(tag.toLowerCase());
              return (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(isAll ? '' : tag)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${active
                      ? 'bg-slate-900 text-white shadow-sm font-bold border border-slate-800 ring-1 ring-inset ring-white/10'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200/60'
                    }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Status Tab Pills with Live Counts */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-100">
            {[
              { key: 'ALL', label: 'Semua Lowongan', count: metrics.TOTAL },
              { key: 'DISCOVERED', label: 'Siap Antre', count: metrics.DISCOVERED },
              { key: 'QUEUED_FOR_APPLY', label: 'Dalam Antrean Bot', count: metrics.QUEUED },
              { key: 'APPLIED', label: 'Berhasil Dilamar', count: metrics.APPLIED },
              { key: 'FILTERED_OUT', label: 'Diabaikan / Gagal', count: metrics.FILTERED }
            ].map((tab) => {
              const active = selectedStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedStatus(tab.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap border transition-all duration-200 min-h-[38px] cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${active
                      ? 'bg-slate-900 text-white border-slate-900 shadow-[0_3px_12px_rgba(15,23,42,0.2)] font-bold ring-1 ring-inset ring-white/10'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-2xs'
                    }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. JOB FEED (MOBILE-FIRST MODERN CARDS) */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs font-bold text-slate-600 px-1">
            <div className="flex items-center gap-3">
              {filteredJobs.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs hover:shadow-xs transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  {selectedJobIds.size === filteredJobs.length && filteredJobs.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>
                    {selectedJobIds.size === filteredJobs.length && filteredJobs.length > 0
                      ? 'Batal Pilih Semua'
                      : `Pilih Semua (${filteredJobs.length})`}
                  </span>
                </button>
              )}

              <span>
                Menampilkan <span className="text-slate-900 font-extrabold">{filteredJobs.length}</span> lowongan
                untuk {activeUser?.fullName}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Toggle Live Console Button */}
              <button
                type="button"
                onClick={() => setIsConsoleOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-2xs ${isConsoleOpen
                    ? 'bg-slate-950 text-emerald-400 border-emerald-500/50 shadow-[0_2px_12px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/30 font-extrabold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                <span>Konsol Agen</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              {loading && (
                <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Memuat data terkini...
                </span>
              )}
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Tidak ada lowongan yang sesuai kriteria</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                Silakan turunkan ambang batas skor kecocokan AI, pilih tab status lowongan yang lain, atau ubah kata kunci pencarian Anda.
              </p>
            </div>
          ) : (
            <>
            <div className="space-y-3.5">
              {paginatedJobs.map((job) => {
                const matchPercent = Math.round((job.matchScore ?? 0) * 100);
                const isProcessing = actionLoadingId === job.id;
                const companyInitials = getCompanyInitials(job.companyName);
                const avatarGradient = getCompanyGradient(job.companyName);

                // Status badge config with colored dot
                let statusBadge: { label: string; class: string; dotColor: string } = {
                  label: String(job.status),
                  class: 'bg-slate-100 text-slate-800 border-slate-300',
                  dotColor: 'bg-slate-400'
                };
                if (job.status === 'DISCOVERED') {
                  statusBadge = {
                    label: 'Siap Antre',
                    class: 'bg-blue-50 text-blue-700 border-blue-200/80',
                    dotColor: 'bg-blue-500'
                  };
                } else if (job.status === 'QUEUED_FOR_APPLY') {
                  statusBadge = {
                    label: 'Dalam Antrean',
                    class: 'bg-amber-50 text-amber-800 border-amber-200/80',
                    dotColor: 'bg-amber-500'
                  };
                } else if (job.status === 'APPLIED') {
                  statusBadge = {
                    label: 'Berhasil Dilamar',
                    class: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
                    dotColor: 'bg-emerald-500'
                  };
                } else if (job.status === 'FILTERED_OUT') {
                  statusBadge = {
                    label: 'Diabaikan',
                    class: 'bg-rose-50 text-rose-700 border-rose-200/80',
                    dotColor: 'bg-rose-400'
                  };
                } else if (job.status === 'FAILED') {
                  statusBadge = {
                    label: 'Gagal Eksekusi',
                    class: 'bg-rose-50 text-rose-700 border-rose-200/80',
                    dotColor: 'bg-rose-500'
                  };
                }

                // Match score styling
                let scoreBadgeClass = 'bg-slate-100 text-slate-800 border-slate-200';
                let scoreDot = 'bg-slate-400';
                if (matchPercent >= 80) {
                  scoreBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
                  scoreDot = 'bg-emerald-500';
                } else if (matchPercent >= 60) {
                  scoreBadgeClass = 'bg-blue-50 text-blue-800 border-blue-200/80';
                  scoreDot = 'bg-blue-500';
                }

                return (
                  <div
                    key={job.id}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_28px_-4px_rgba(15,23,42,0.08)] hover:border-slate-300 transition-all duration-300 flex flex-col gap-4 group"
                  >
                    {/* Header: Company Avatar + Title + Badges */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <input
                          type="checkbox"
                          checked={selectedJobIds.has(job.id)}
                          onChange={() => toggleSelectJob(job.id)}
                          className="mt-1.5 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div
                          className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-extrabold text-sm shadow-sm flex-shrink-0 tracking-wider`}
                        >
                          {companyInitials}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                              {job.platform}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.class}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor}`} />
                              {statusBadge.label}
                            </span>
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                            {job.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600 font-medium">
                            <span className="flex items-center gap-1.5 font-bold text-slate-900">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {job.companyName}
                            </span>
                            {job.location && (
                              <span className="flex items-center gap-1 text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {job.location}
                              </span>
                            )}
                            {job.salaryRange && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                                <DollarSign className="w-3 h-3" />
                                {job.salaryRange}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${scoreBadgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${scoreDot}`} />
                          <span>{matchPercent}% Cocok</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Evaluation Summary Callout */}
                    <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed">
                      <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Analisis AI Persona:</span>
                      </div>
                      <p className="line-clamp-2">
                        {job.scamReason ||
                          (matchPercent >= 75
                            ? `Kualifikasi posisi ${job.title} di ${job.companyName} sangat sejalan dengan pengalaman dan keahlian pelamar (${matchPercent}% match score).`
                            : `Lowongan ini memenuhi beberapa aspek keterampilan kunci dengan skor relevansi ${matchPercent}%. Disarankan memeriksa deskripsi kualifikasi sebelum melamar.`)}
                      </p>
                      {job.failureReason && (
                        <div className="mt-2 text-rose-700 font-semibold flex items-center gap-1.5 bg-rose-50 p-2 rounded-lg border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Kendala Eksekusi: {job.failureReason}</span>
                        </div>
                      )}
                    </div>

                    {/* Modern High-Clarity Action Buttons Toolbar */}
                    <div className="pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Detail Info & Direct Platform Link & Email HRD */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedJobDetail(job)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 min-h-[44px] cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span>Rincian Lowongan</span>
                        </button>

                        <a
                          href={job.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 bg-slate-50 hover:bg-white hover:text-indigo-600 border border-slate-200 hover:border-slate-300 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 min-h-[44px] cursor-pointer"
                        >
                          <span>Platform Asli</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleOpenEmailModal(job)}
                          className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 min-h-[44px] cursor-pointer"
                          title="Buat Cover Letter AI dan kirim lamaran langsung ke email HRD (Winrate Tertinggi)"
                        >
                          <Mail className="w-4 h-4 text-indigo-600" />
                          <span>Kirim Email HRD</span>
                        </button>
                      </div>

                      {/* Right: State-Specific Primary Actions */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        {/* 1. DISCOVERED: Can Queue or Ignore */}
                        {job.status === 'DISCOVERED' && (
                          <>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(job.id, 'FILTERED_OUT')}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 min-h-[44px] cursor-pointer"
                              title="Abaikan lowongan ini dari daftar aktif"
                            >
                              <Ban className="w-4 h-4 text-slate-400" />
                              <span>Abaikan</span>
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(job.id, 'QUEUED_FOR_APPLY')}
                              className="flex-2 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-slate-900 hover:bg-indigo-600 shadow-md hover:shadow-lg hover:shadow-indigo-500/20 border border-slate-800 ring-1 ring-inset ring-white/10 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 min-h-[44px] cursor-pointer group"
                              title="Siapkan lowongan ini agar otomatis dilamar oleh Bot"
                            >
                              {isProcessing ? (
                                <RotateCw className="w-4 h-4 animate-spin text-white" />
                              ) : (
                                <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400 group-hover:scale-110 transition-transform" />
                              )}
                              <span>⚡ Masukkan Antrean Bot</span>
                            </button>
                          </>
                        )}

                        {/* 2. QUEUED_FOR_APPLY: Cancel or View Status */}
                        {job.status === 'QUEUED_FOR_APPLY' && (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Siap Dilamar Bot</span>
                            </span>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(job.id, 'DISCOVERED')}
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-amber-900 bg-amber-100/70 hover:bg-amber-100 border border-amber-300 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 min-h-[44px] cursor-pointer"
                              title="Batalkan antrean dan kembalikan ke daftar siap antre"
                            >
                              <RotateCw className="w-4 h-4 text-amber-700" />
                              <span>Batal Antre</span>
                            </button>
                          </>
                        )}

                        {/* 3. FILTERED_OUT / FAILED: Re-queue */}
                        {(job.status === 'FILTERED_OUT' || job.status === 'FAILED') && (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <Ban className="w-3.5 h-3.5 text-slate-400" />
                              <span>{job.status === 'FAILED' ? 'Gagal Melamar' : 'Dilewati'}</span>
                            </span>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(job.id, 'DISCOVERED')}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 min-h-[44px] cursor-pointer"
                            >
                              <RotateCw className="w-4 h-4 text-slate-500" />
                              <span>Pulihkan Loker</span>
                            </button>
                          </>
                        )}

                        {/* 4. APPLIED: Proof & Success Status */}
                        {job.status === 'APPLIED' && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs">
                              <CheckCheck className="w-4 h-4 text-emerald-600" />
                              <span>Lamaran Berhasil Terkirim</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedJobDetail(job)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-2xs min-h-[38px] cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Bukti Foto</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION BAR (PAGINASI PER 10 LOKER) */}
            {totalPages > 1 && (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm mt-4">
                <div className="text-xs font-medium text-slate-500">
                  Menampilkan <span className="font-bold text-slate-900">{(safeCurrentPage - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-900">{Math.min(safeCurrentPage * pageSize, filteredJobs.length)}</span> dari <span className="font-bold text-slate-900">{filteredJobs.length}</span> lowongan (Hal. {safeCurrentPage} dari {totalPages})
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Prev Button */}
                  <button
                    type="button"
                    disabled={safeCurrentPage === 1}
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= safeCurrentPage - 1 && pageNum <= safeCurrentPage + 1)
                      ) {
                        const isActive = pageNum === safeCurrentPage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => {
                              setCurrentPage(pageNum);
                              window.scrollTo({ top: 350, behavior: 'smooth' });
                            }}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (
                        (pageNum === safeCurrentPage - 2 && pageNum > 1) ||
                        (pageNum === safeCurrentPage + 2 && pageNum < totalPages)
                      ) {
                        return (
                          <span key={pageNum} className="px-1 text-slate-400 text-xs">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </main>

      {/* 6. MODAL DETAIL INFO LOKER (JOB READER) */}
      {selectedJobDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200/80 flex items-start justify-between gap-4 bg-slate-50/70">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">
                    {Math.round((selectedJobDetail.matchScore ?? 0) * 100)}% Cocok
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700">
                    {selectedJobDetail.platform}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {selectedJobDetail.title}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2">
                  <span>{selectedJobDetail.companyName}</span>
                  {selectedJobDetail.location && (
                    <span className="font-normal text-slate-500">• {selectedJobDetail.location}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelectedJobDetail(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scrollable Details */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-800 leading-relaxed">
              {/* External URL Action Bar */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs font-medium text-indigo-950">
                <span className="font-semibold">Halaman Resmi Sumber Lowongan</span>
                <a
                  href={selectedJobDetail.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-indigo-700 hover:text-indigo-900 underline underline-offset-2"
                >
                  <span>Buka di {selectedJobDetail.platform}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>

              {/* Job Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <div>
                  <span className="text-slate-500 font-medium block">Status Pipeline</span>
                  <strong className="text-slate-900 font-bold">{selectedJobDetail.status}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Estimasi Gaji</span>
                  <strong className="text-slate-900 font-bold">
                    {selectedJobDetail.salaryRange || 'Tidak dipublikasikan'}
                  </strong>
                </div>
              </div>

              {/* Full Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Deskripsi & Kualifikasi Lengkap
                </h4>
                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl whitespace-pre-line text-xs sm:text-sm font-sans text-slate-700 max-h-80 overflow-y-auto leading-relaxed">
                  {selectedJobDetail.description}
                </div>
              </div>

              {/* Audit Trail: Screenshot Bukti Form Playwright */}
              <div className="pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Bukti Formulir (Tangkapan Layar)</span>
                  </h4>
                  {jobScreenshots[selectedJobDetail.id]?.length > 0 && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      {jobScreenshots[selectedJobDetail.id].length} Foto Tersimpan
                    </span>
                  )}
                </div>

                {isLoadingScreenshot ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-500">
                    <RotateCw className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Memeriksa berkas bukti formulir...</span>
                  </div>
                ) : jobScreenshots[selectedJobDetail.id]?.length > 0 ? (
                  <div className="space-y-3">
                    {jobScreenshots[selectedJobDetail.id].map((sc, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${sc.type === 'applied'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : sc.type === 'error'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                            {sc.type === 'applied' ? '✅ SUDAH DILAMAR' : sc.type === 'error' ? '❌ KENDALA FORM' : '🛡️ SIMULASI FORM'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {sc.timestamp ? new Date(sc.timestamp).toLocaleString('id-ID') : 'Tersimpan'}
                          </span>
                        </div>
                        <div
                          onClick={() => setPreviewScreenshotUrl(sc.url)}
                          className="relative rounded-lg overflow-hidden border border-slate-300 bg-black/5 cursor-pointer group max-h-48 flex items-center justify-center"
                        >
                          <img
                            src={sc.url}
                            alt={`Bukti formulir ${selectedJobDetail.title}`}
                            className="w-full h-auto object-cover object-top transition-transform duration-200 group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                            <Maximize2 className="w-4 h-4" />
                            <span>Perbesar Foto Bukti</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <a
                            href={sc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            <span>Buka Foto Penuh di Tab Baru</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <p className="leading-relaxed">
                      Belum ada foto bukti formulir untuk lowongan ini. Anda dapat melakukan simulasi pengisian sekarang untuk melihat pratinjau formulir.
                    </p>
                    <button
                      disabled={isRunningApply}
                      onClick={() => handleSingleTestApply(selectedJobDetail.id)}
                      className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow-indigo-500/25 border border-indigo-400/30 ring-1 ring-inset ring-white/20 active:scale-95 transition-all duration-150 whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {isRunningApply ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      <span>Tes Form Sekarang</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedJobDetail(null)}
                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-95 min-h-[44px] cursor-pointer shadow-2xs"
                >
                  Tutup
                </button>
                <button
                  disabled={isRunningApply}
                  onClick={() => handleSingleTestApply(selectedJobDetail.id)}
                  className="px-4 py-2.5 bg-indigo-50/80 border border-indigo-200 text-indigo-700 hover:bg-indigo-100/80 hover:border-indigo-300 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-95 min-h-[44px] inline-flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  {isRunningApply ? (
                    <RotateCw className="w-4 h-4 animate-spin text-indigo-600" />
                  ) : (
                    <Zap className="w-4 h-4 text-indigo-600" />
                  )}
                  <span>Tes Form (Dry-Run)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedJobDetail.status === 'DISCOVERED' && (
                  <>
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedJobDetail.id, 'FILTERED_OUT');
                        setSelectedJobDetail(null);
                      }}
                      className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50/80 hover:border-rose-200 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-95 min-h-[44px] cursor-pointer shadow-2xs"
                    >
                      ✕ Abaikan Loker
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedJobDetail.id, 'QUEUED_FOR_APPLY');
                        setSelectedJobDetail(null);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg hover:shadow-indigo-500/20 border border-slate-800 ring-1 ring-inset ring-white/10 transition-all duration-150 hover:-translate-y-0.5 active:scale-95 min-h-[44px] cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                      <span>⚡ Masukkan Antrean Bot</span>
                    </button>
                  </>
                )}
                {selectedJobDetail.status === 'QUEUED_FOR_APPLY' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedJobDetail.id, 'DISCOVERED');
                      setSelectedJobDetail(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-50/90 border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-95 min-h-[44px] cursor-pointer shadow-2xs"
                  >
                    <RotateCw className="w-4 h-4 text-amber-700" />
                    <span>↩ Batal Antre</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL AUTONOMOUS AGENT RUNNER */}
      {isRunApplyModalOpen && activeUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center">
                  <Zap className="w-5 h-5 fill-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Eksekusi Auto-Apply Agent
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Pelamar: <strong className="text-slate-700">{activeUser.fullName}</strong>
                  </p>
                </div>
              </div>
              <button
                disabled={isRunningApply}
                onClick={() => setIsRunApplyModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Antrean Info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block font-medium">Lowongan Siap Eksekusi</span>
                  <span className="text-lg font-black text-slate-900">
                    {metrics.QUEUED > 0 ? `${metrics.QUEUED} dalam antrean` : `${metrics.DISCOVERED} lowongan siap antre`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block font-medium">Kapasitas Hari Ini</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {metrics.APPLIED_TODAY} / 10 Terpakai
                  </span>
                </div>
              </div>

              {/* Pilihan Mode Keamanan */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Mode Eksekusi Playwright
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRunApplyMode('DRY_RUN')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${runApplyMode === 'DRY_RUN'
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                  >
                    <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5 mb-1">
                      <span>🛡️ Simulasi Aman (Dry-Run)</span>
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Mengisi biodata, melampirkan CV, menjawab kuesioner AI & mengambil foto bukti tanpa mengirim lamaran akhir.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRunApplyMode('LIVE')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${runApplyMode === 'LIVE'
                        ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                  >
                    <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5 mb-1">
                      <span>🚨 Kirim Lamaran Langsung</span>
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Mengisi formulir dan langsung mengirimkan lamaran ke portal kerja secara resmi.
                    </p>
                  </button>
                </div>
              </div>

              {/* Batas Pemrosesan (Limit) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700">Jumlah Lowongan Diproses</label>
                  <span className="font-bold text-indigo-600">{runApplyLimit} Lowongan</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={runApplyLimit}
                  onChange={(e) => setRunApplyLimit(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>

              {/* Status Berjalan */}
              {isRunningApply && (
                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-center gap-3">
                  <RotateCw className="w-5 h-5 animate-spin text-indigo-600 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-indigo-900">Playwright Automation Aktif</p>
                    <p className="text-indigo-700 mt-0.5">{runApplyProgressMsg || 'Menghubungkan browser headless...'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isRunningApply}
                onClick={() => setIsRunApplyModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-95 min-h-[44px] cursor-pointer shadow-2xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isRunningApply}
                onClick={handleRunAgentQueue}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-400 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-[0_4px_16px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_24px_rgba(16,185,129,0.5)] border border-emerald-400/40 ring-1 ring-inset ring-white/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 min-h-[44px] inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRunningApply ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-white" />
                    <span>Sedang Memproses...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Mulai Eksekusi Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL LIGHTBOX PREVIEW SCREENSHOT */}
      {previewScreenshotUrl && (
        <div
          onClick={() => setPreviewScreenshotUrl(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">Bukti Tangkapan Layar Formulir (Audit Trail)</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewScreenshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-2xs"
                >
                  <span>Buka Resolusi Penuh</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setPreviewScreenshotUrl(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-950 max-h-[82vh]">
              <img
                src={previewScreenshotUrl}
                alt="Audit Trail Full"
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. MODUL KELOLA PROFIL & CV (MODAL) */}
      {isProfileModalOpen && activeUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200/90 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200/80 flex items-center justify-between bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-black shadow-md flex-shrink-0 ${isPartnerUser(activeUser)
                      ? 'bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 shadow-rose-500/20'
                      : 'bg-gradient-to-br from-slate-900 via-indigo-900 to-indigo-700 shadow-indigo-500/20'
                    }`}
                >
                  {userInitials}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Kelola Profil & Dokumen CV</span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-bold text-slate-800">{activeUser.fullName}</span>
                    <span>•</span>
                    <span className="text-slate-600 font-medium truncate max-w-[200px] sm:max-w-[280px]">
                      {activeUser.targetRoles}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Segmented Navigation Tabs */}
            <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setProfileActiveTab('cv')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap min-h-[40px] ${profileActiveTab === 'cv'
                    ? 'bg-slate-900 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
              >
                <FileUp className="w-4 h-4 text-emerald-400" />
                <span>Berkas CV PDF</span>
                {activeUser.resumeStats?.isDummy && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setProfileActiveTab('biodata')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap min-h-[40px] ${profileActiveTab === 'biodata'
                    ? 'bg-slate-900 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
              >
                <UserIcon className="w-4 h-4 text-indigo-400" />
                <span>Biodata & Kontak</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileActiveTab('career')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap min-h-[40px] ${profileActiveTab === 'career'
                    ? 'bg-slate-900 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
              >
                <Briefcase className="w-4 h-4 text-violet-400" />
                <span>Karier & Keahlian</span>
              </button>
            </div>

            {/* Form Content Area */}
            <form onSubmit={handleSaveProfileAndResume} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* TAB 1: BERKAS CV & DOKUMEN */}
              {profileActiveTab === 'cv' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Status Berkas CV Saat Ini */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/90 to-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>Dokumen CV Aktif Saat Ini</span>
                      </span>
                      {activeUser.resumeStats?.isDummy ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Perlu Diperbarui</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>CV Siap Melamar</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                      <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {activeUser.resumeStats?.fileName || activeUser.resumeLocalPath}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                          <span>Ukuran: {formatBytes(activeUser.resumeStats?.sizeBytes)}</span>
                          <span>•</span>
                          <span>Format PDF</span>
                        </div>
                      </div>
                    </div>

                    {activeUser.resumeStats?.isDummy && (
                      <p className="text-xs text-amber-800 bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 leading-relaxed font-medium">
                        Ukuran berkas CV saat ini masih berupa format bawaan (&lt; 10KB). Silakan unggah dokumen PDF resmi Anda di bawah agar bot Playwright melampirkan berkas asli yang tepat.
                      </p>
                    )}
                  </div>

                  {/* Modern Interactive Drag-and-Drop / Upload Area */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Unggah Berkas PDF Baru
                    </label>
                    <label
                      htmlFor="resume-upload-input"
                      className="relative border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-gradient-to-b from-indigo-50/30 via-white to-slate-50/30 hover:from-indigo-50/60 rounded-3xl p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer block group shadow-2xs hover:shadow-md"
                    >
                      <input
                        id="resume-upload-input"
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSelectedResumeFile(e.target.files[0]);
                          }
                        }}
                        className="sr-only"
                      />
                      <div className="w-14 h-14 rounded-2xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-inner">
                        <FileUp className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Pilih Berkas CV Baru (.PDF)
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Klik di sini atau seret berkas langsung dari perangkat Anda
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 border border-slate-200">
                        <span>Format Dokumen: PDF</span>
                        <span>•</span>
                        <span>Maksimal 10 MB</span>
                      </div>
                    </label>

                    {/* Highlight Kartu File Terpilih */}
                    {selectedResumeFile && (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3 animate-scale-in">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                            <FileCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-950 truncate max-w-[240px] sm:max-w-[320px]">
                              {selectedResumeFile.name}
                            </p>
                            <p className="text-[11px] text-emerald-700 font-medium">
                              {formatBytes(selectedResumeFile.size)} • Siap disimpan ke server
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedResumeFile(null)}
                          className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </div>

                  {/* AI Tip Callout */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
                    <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Dokumen ini secara otomatis disematkan oleh <strong>Auto-Apply Agent</strong> pada setiap portal kerja saat memenuhi kriteria lowongan yang Anda setujui.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: BIODATA & KONTAK */}
              {profileActiveTab === 'biodata' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nama Lengkap */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nama Lengkap
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={profileForm.fullName}
                          onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                          placeholder="Nama Lengkap Anda"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                        />
                      </div>
                    </div>

                    {/* Nomor Telepon / WhatsApp */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nomor Telepon / WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="+62 812-3456-7890"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Digunakan bot saat mengisi formulir kontak pelamar
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Kota Domisili */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Kota Domisili
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={profileForm.city}
                          onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                          placeholder="mis. Jakarta Selatan, Bandung"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                        />
                      </div>
                    </div>

                    {/* Ekspektasi Gaji Bulanan */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Ekspektasi Gaji Bulanan (IDR)
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={profileForm.expectedSalary}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, expectedSalary: e.target.value })
                          }
                          placeholder="mis. 8500000"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                        />
                      </div>
                      {profileForm.expectedSalary && !isNaN(Number(profileForm.expectedSalary)) && (
                        <span className="text-[11px] font-bold text-emerald-600 block mt-1">
                          Pratinjau: {formatIDR(Number(profileForm.expectedSalary))} / bulan
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Profil LinkedIn URL */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Profil LinkedIn URL
                      </label>
                      <div className="relative">
                        <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          value={profileForm.linkedInUrl}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, linkedInUrl: e.target.value })
                          }
                          placeholder="https://linkedin.com/in/..."
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                        />
                      </div>
                    </div>

                    {/* Portofolio / Tautan Web URL */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Portofolio / Tautan Pendukung URL
                      </label>
                      <div className="relative">
                        <ExternalLink className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          value={profileForm.portfolioUrl}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, portfolioUrl: e.target.value })
                          }
                          placeholder="https://portfolio-anda.com"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TARGET KARIER & KEAHLIAN */}
              {profileActiveTab === 'career' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Target Posisi / Roles */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                        <span>Target Posisi / Roles</span>
                      </label>
                      <span className="text-[11px] text-slate-400">Pisahkan dengan koma</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={profileForm.targetRoles}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, targetRoles: e.target.value })
                        }
                        placeholder="Contoh: Frontend Developer, Fullstack Engineer, React Specialist"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                      />
                    </div>

                    {/* Rekomendasi Cepat Roles */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">
                        Saran Posisi:
                      </span>
                      {(isPartnerUser(activeUser)
                        ? ['Staf Administrasi', 'General Affairs', 'Document Controller', 'Sekretaris', 'Operasional']
                        : ['Frontend Developer', 'Fullstack Engineer', 'React Developer', 'Next.js Specialist', 'TypeScript Developer']
                      ).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            if (!profileForm.targetRoles.toLowerCase().includes(role.toLowerCase())) {
                              setProfileForm({
                                ...profileForm,
                                targetRoles: profileForm.targetRoles
                                  ? `${profileForm.targetRoles}, ${role}`
                                  : role
                              });
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200/80 transition-all cursor-pointer active:scale-95"
                        >
                          + {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Core Skills & Keahlian Utama */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Core Skills & Keahlian Utama</span>
                      </label>
                      <span className="text-[11px] text-slate-400">Digunakan untuk scoring kecocokan</span>
                    </div>
                    <textarea
                      rows={3}
                      value={profileForm.coreSkills}
                      onChange={(e) => setProfileForm({ ...profileForm, coreSkills: e.target.value })}
                      placeholder="Tuliskan keahlian teknis dan non-teknis Anda (contoh: Administrasi Perkantoran, Microsoft Excel, Manajemen Arsip...)"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium resize-none"
                    />

                    {/* Rekomendasi Cepat Skills */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">
                        Tambah Cepat Skill:
                      </span>
                      {(isPartnerUser(activeUser)
                        ? ['Administrasi Perkantoran', 'Microsoft Excel', 'Manajemen Arsip', 'Sistem ERP', 'Surat Menyurat', 'Public Relations']
                        : ['Next.js', 'React.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'REST API', 'PostgreSQL']
                      ).map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => {
                            if (!profileForm.coreSkills.toLowerCase().includes(skill.toLowerCase())) {
                              setProfileForm({
                                ...profileForm,
                                coreSkills: profileForm.coreSkills
                                  ? `${profileForm.coreSkills}, ${skill}`
                                  : skill
                              });
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200/80 transition-all cursor-pointer active:scale-95"
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Persona Notice */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-3 text-xs text-indigo-950">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Daftar keahlian ini dievaluasi langsung oleh AI persona saat menghitung persentase kecocokan lowongan kerja dan menjawab pertanyaan formulir esai otomatis.
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5">
                {/* Step / Navigation helper on left */}
                <div className="flex items-center gap-1.5">
                  {profileActiveTab === 'cv' && (
                    <button
                      type="button"
                      onClick={() => setProfileActiveTab('biodata')}
                      className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <span>Ke Biodata & Kontak</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  )}
                  {profileActiveTab === 'biodata' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setProfileActiveTab('cv')}
                        className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-all cursor-pointer"
                      >
                        ← Berkas CV
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileActiveTab('career')}
                        className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1"
                      >
                        <span>Ke Karier</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    </div>
                  )}
                  {profileActiveTab === 'career' && (
                    <button
                      type="button"
                      onClick={() => setProfileActiveTab('biodata')}
                      className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      ← Kembali ke Kontak
                    </button>
                  )}
                </div>

                {/* Primary Actions on right */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-4 sm:px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-xs sm:text-sm font-bold min-h-[44px] transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-2xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingProfile}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-indigo-600 hover:to-violet-600 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-[0_4px_12px_rgba(15,23,42,0.2)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.35)] border border-slate-700/60 ring-1 ring-inset ring-white/10 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 min-h-[44px] cursor-pointer"
                  >
                    {isUploadingProfile ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin text-white" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Simpan Perubahan & CV</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 9B. MODAL REVIEW & KIRIM EMAIL LAMARAN (HRD DIRECT) */}
      {isEmailModalOpen && emailTargetJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200/80 bg-slate-50/80 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      Kirim Lamaran Langsung ke HRD
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Winrate Tertinggi
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {emailTargetJob.title} • <span className="font-bold text-slate-700">{emailTargetJob.companyName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {isGeneratingEmail ? (
                <div className="py-14 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                    <RotateCw className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Menyusun Surat Lamaran Resmi via AI Groq...</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    AI sedang mengaitkan keahlian Anda ({activeUser?.coreSkills}) dengan posisi {emailTargetJob.title} di {emailTargetJob.companyName}.
                  </p>
                </div>
              ) : (
                <>
                  {/* Email Penerima HRD */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Alamat Email HRD / Rekrutmen:</span>
                      </label>
                      <span className="text-[10px] text-slate-400">Dapat diedit jika memiliki kontak khusus</span>
                    </div>
                    <input
                      type="email"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      placeholder="contoh: hrd@perusahaan.co.id atau recruitment@company.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Subjek Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Subjek Email Lamaran:
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Lamaran Pekerjaan: Posisi - Nama Lengkap"
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Surat Lamaran (Cover Letter Textarea) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Isi Surat Lamaran (Cover Letter Bahasa Indonesia):</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenEmailModal(emailTargetJob)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Buat Ulang via AI</span>
                      </button>
                    </div>
                    <textarea
                      rows={8}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all whitespace-pre-line"
                    />
                  </div>

                  {/* Lampiran Dokumen CV */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Lampiran Dokumen:</span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold text-[11px]">
                            Otomatis Terlampir
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {activeUser?.resumeStats?.fileName || 'Curriculum Vitae (PDF)'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">PDF Terverifikasi</span>
                  </div>

                  {/* Mode Pengiriman: Simulasi vs Live */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/70 space-y-2">
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
                      Opsi Eksekusi Pengiriman:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEmailIsDryRun(true)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          emailIsDryRun
                            ? 'bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-600'
                            : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>🛡️ Mode Simulasi (Dry-Run)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          Uji coba aman, mencatat log pengiriman & draf email tanpa kirim email sungguhan.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEmailIsDryRun(false)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          !emailIsDryRun
                            ? 'bg-white border-emerald-600 shadow-sm ring-1 ring-emerald-600'
                            : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>🚀 Kirim Asli ke HRD (Live Send)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          Mengirimkan email resmi langsung ke inbox HRD menggunakan kredensial SMTP.
                        </p>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] cursor-pointer shadow-2xs"
              >
                Tutup
              </button>

              <button
                type="button"
                disabled={isGeneratingEmail || isSendingEmail || !emailRecipient.trim()}
                onClick={handleSendApplicationEmail}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition-all min-h-[44px] cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-95 group"
              >
                {isSendingEmail ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-white" />
                    <span>Memproses Pengiriman...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                    <span>
                      {emailIsDryRun ? 'Simulasikan Kirim Lamaran' : 'Kirim Lamaran Sekarang'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9C. MODAL TARIK LOKER MEDIA SOSIAL (INSTAGRAM & TIKTOK) */}
      {isSocialModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200/80 bg-gradient-to-r from-pink-50/70 via-purple-50/50 to-indigo-50/40 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20 flex-shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      Tarik Loker Media Sosial
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-100 text-pink-800 border border-pink-200 uppercase">
                      Instagram & TikTok
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Ekstraksi otomatis kontak HRD resmi <span className="font-bold text-slate-900">BUMN & Seluruh Kota Indonesia</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSocialModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
              {/* Opsi Filter Wilayah */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Fokus Wilayah / Kategori Penarikan:</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {(['BUMN & Nasional', 'Jakarta', 'Bandung', 'Surabaya', 'Remote', 'Semua'] as const).map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setSocialLocationFilter(loc as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        socialLocationFilter === (loc as any)
                          ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-800'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rekomendasi Akun Resmi Terverifikasi */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Kanal Resmi Info Loker BUMN & Nasional Terverifikasi:</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Bebas Penipuan
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                      BUMN
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">@fhcibumn</p>
                      <p className="text-[10px] text-slate-500">Forum Human Capital BUMN</p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                      BUMN
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">@bumninfo</p>
                      <p className="text-[10px] text-slate-500">Rekrutmen Resmi BUMN</p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-[11px]">
                      IG
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">@loker_indonesia</p>
                      <p className="text-[10px] text-slate-500">Lowongan Kerja Seluruh Indonesia</p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
                      TT
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">@infolokerbandung_resmi</p>
                      <p className="text-[10px] text-slate-500">Loker TikTok Nasional</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isScrapingSocial}
                  onClick={() => handleScrapeSocial()}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isScrapingSocial ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-white" />
                      <span>Sedang Menarik & Mengekstrak dengan AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Tarik Otomatis dari Kanal Resmi ({socialLocationFilter})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Input Tempel Tautan / Teks Custom */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-pink-600" />
                  <span>Atau Tempel Tautan Postingan / Teks Caption Loker:</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Tempel link postingan Instagram/TikTok atau salin seluruh teks caption lowongan kerja di sini..."
                  value={socialCustomInput}
                  onChange={(e) => setSocialCustomInput(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 font-sans leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={isScrapingSocial || !socialCustomInput.trim()}
                    onClick={() => handleScrapeSocial(socialCustomInput)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 cursor-pointer"
                  >
                    {isScrapingSocial ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>Ekstraksi Teks Ini dengan AI</span>
                  </button>
                </div>
              </div>

              {/* Hasil Ekstraksi Terbaru */}
              {socialScrapedResults.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100 animate-fade-in">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    <span>Hasil Ekstraksi AI Terbaru ({socialScrapedResults.length}):</span>
                  </h4>
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {socialScrapedResults.map((res, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2 hover:border-indigo-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="font-black text-sm text-slate-900">{res.title}</h5>
                            <p className="text-xs font-bold text-slate-600">
                              {res.companyName} • <span className="text-slate-500 font-medium">{res.location}</span>
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {Math.round((res.matchScore || 0.8) * 100)}% Cocok
                          </span>
                        </div>
                        {res.hrdEmail && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                            <Mail className="w-3.5 h-3.5" />
                            <span>Email HRD: {res.hrdEmail}</span>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {res.scamAnalysis || 'Informasi loker terverifikasi resmi.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Lowongan otomatis tersimpan ke database & siap dilamar via email.
              </span>
              <button
                type="button"
                onClick={() => setIsSocialModalOpen(false)}
                className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all ml-auto cursor-pointer"
              >
                Selesai & Lihat Lowongan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. FLOATING BULK ACTION BAR */}
      {selectedJobIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950/90 text-white px-5 py-3 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.45)] border border-slate-700/80 backdrop-blur-xl flex items-center gap-3.5 animate-scale-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-xs font-bold text-slate-200 whitespace-nowrap">
              {selectedJobIds.size} Lowongan Dipilih
            </span>
          </div>
          <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2">
            <button
              disabled={isBatchUpdating}
              onClick={() => handleBatchUpdate('QUEUED_FOR_APPLY')}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/25 border border-emerald-400/30 ring-1 ring-inset ring-white/20 flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Antrekan ({selectedJobIds.size})</span>
            </button>
            <button
              disabled={isBatchUpdating}
              onClick={() => handleBatchUpdate('FILTERED_OUT')}
              className="px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/25 border border-rose-400/30 ring-1 ring-inset ring-white/15 flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Abaikan</span>
            </button>
            <button
              disabled={isBatchUpdating}
              onClick={() => setSelectedJobIds(new Set())}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 font-bold hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* 11. LIVE AGENT ACTIVITY CONSOLE DRAWER */}
      <div className="fixed bottom-4 right-4 z-40">
        {!isConsoleOpen ? (
          <button
            onClick={() => setIsConsoleOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-950/95 hover:bg-slate-900 text-white rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] border border-slate-700/80 backdrop-blur-xl text-xs font-extrabold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer group"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <Terminal className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Konsol Agen</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 font-mono">
              {activityLogs.length}
            </span>
          </button>
        ) : (
          <div className="w-[340px] sm:w-[460px] max-h-[380px] bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden animate-scale-in">
            {/* Console Header */}
            <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="h-3 w-[1px] bg-slate-700 mx-1" />
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-200">Konsol Aktivitas Agen</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActivityLogs([])}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Bersihkan Log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsConsoleOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Tutup Console"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Console Logs Body */}
            <div className="p-3.5 overflow-y-auto space-y-2 max-h-[300px] font-mono text-[11px] leading-relaxed">
              {activityLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <span>Tidak ada rekaman log baru.</span>
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 border-b border-slate-900/80 pb-1.5">
                    <span className="text-slate-500 flex-shrink-0 text-[10px]">[{log.time}]</span>
                    <span
                      className={`flex-1 break-words ${log.type === 'success'
                          ? 'text-emerald-400'
                          : log.type === 'error'
                            ? 'text-rose-400 font-bold'
                            : log.type === 'warning'
                              ? 'text-amber-400'
                              : 'text-slate-300'
                        }`}
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
