import prisma from '../lib/prisma';

async function seedRichJobs() {
  console.log('================================================================');
  console.log('🚀 SEEDING DATA LOWONGAN REALISTIS (TECH & ADMINISTRASI PUBLIK)');
  console.log('================================================================\n');

  // Ambil user yang ada
  const primaryUser = await prisma.user.findFirst({
    where: { email: 'pranataprp@gmail.com' }
  });

  const partnerUser = await prisma.user.findFirst({
    where: { email: 'partner.applicant@example.com' }
  });

  if (!primaryUser || !partnerUser) {
    throw new Error('User utama atau partner tidak ditemukan di database.');
  }

  // 1. Perbarui Profil Partner khusus Administrasi Publik
  console.log('Memperbarui profil Partner ke spesialisasi Administrasi Publik...');
  await prisma.user.update({
    where: { id: partnerUser.id },
    data: {
      fullName: 'Partner (Administrasi Publik)',
      city: 'Jakarta Selatan',
      targetRoles: 'Staff Administrasi Publik, Policy Analyst, General Affairs, Document Controller, Government Relations',
      coreSkills: 'Administrasi Perkantoran, Manajemen Dokumen & Kearsipan, Analisis Kebijakan Publik, Microsoft Excel & Office, Public Relations, Korespondensi Bisnis, Tata Kelola SOP',
      expectedSalary: 8500000
    }
  });

  console.log('✅ Profil partner berhasil diperbarui ke Administrasi Publik.\n');

  // 2. Daftar Loker Administrasi Publik (Partner)
  const partnerJobs = [
    {
      platform: 'JOBSTREET',
      title: 'Staff Administrasi Publik & Tata Kelola Dokumen',
      companyName: 'PT Telkom Indonesia (Persero) Tbk',
      jobUrl: 'https://www.jobstreet.co.id/job/telkom-admin-publik-78912',
      location: 'Jakarta Selatan (Telkom Landmark Tower)',
      salaryRange: 'Rp 8.000.000 - 11.000.000',
      matchScore: 0.94,
      status: 'DISCOVERED' as const,
      scamReason: 'Kualifikasi linear dengan lulusan S1 Administrasi Publik/Negara. Kebutuhan pada tata kelola SOP, pengarsipan digital, dan korespondensi kedinasan sangat cocok dengan profil.',
      description: `Tentang Pekerjaan:
Sebagai Staff Administrasi Publik & Tata Kelola Dokumen di PT Telkom Indonesia, Anda akan bertanggung jawab memastikan kelancaran administrasi divisi, audit tata kelola surat menyurat kedinasan, serta integrasi arsip digital perusahaan.

Tanggung Jawab:
• Mengelola alur administrasi kearsipan dinas, perizinan, dan dokumen legalitas operasional.
• Menyusun draft korespondensi resmi antar lembaga publik, kementerian, dan mitra BUMN.
• Memonitor kepatuhan administrasi terhadap standar SOP dan Good Corporate Governance (GCG).
• Mengoperasikan aplikasi e-office BUMN dan Microsoft Excel advanced untuk rekapitulasi data berkas.
• Berkoordinasi dengan divisi General Affairs dalam pengelolaan logistik dan administrasi kantor.

Kualifikasi:
• Pendidikan minimal S1 Jurusan Administrasi Publik, Administrasi Bisnis, atau Manajemen Kebijakan.
• IPK minimal 3.25 dari universitas terkemuka.
• Memiliki pengalaman 1-3 tahun di bidang administrasi perkantoran atau instansi/BUMN (Fresh Graduate dipersilakan melamar).
• Menguasai Microsoft Office (Word, Excel, PowerPoint) dengan sangat baik.
• Memiliki ketelitian tinggi, integritas, dan kemampuan komunikasi antar instansi yang santun.`
    },
    {
      platform: 'LINKEDIN',
      title: 'Government Relations & Public Policy Associate',
      companyName: 'GoTo Group',
      jobUrl: 'https://www.linkedin.com/jobs/view/goto-public-policy-associate-98213',
      location: 'Jakarta Selatan (Pasaraya Blok M - Hybrid)',
      salaryRange: 'Rp 10.000.000 - 14.500.000',
      matchScore: 0.92,
      status: 'QUEUED_FOR_APPLY' as const,
      scamReason: 'Posisi strategis untuk lulusan Administrasi Publik yang fokus pada kebijakan publik, advokasi regulasi platform digital, dan hubungan kelembagaan pemerintah.',
      description: `Role Overview:
The Government Relations & Public Policy Associate will assist the team in tracking legislative updates, policy research, and liaison with government agencies and municipal authorities.

Key Responsibilities:
• Conduct regulatory and policy monitoring regarding digital economy, transport, and fintech regulations in Indonesia.
• Draft policy briefs, executive summaries, and presentation decks for public hearings and stakeholder dialogues.
• Maintain effective working relationships with relevant ministries (Kemenko Perekonomian, Kemenhub, Kominfo).
• Support public administration initiatives and multi-stakeholder social impact projects.

Requirements:
• Bachelor’s degree in Public Administration, Public Policy, Political Science, or Law.
• 1-2 years of relevant experience in government relations, policy advocacy, or research institutions.
• Strong written and verbal communication in Bahasa Indonesia and English.
• Excellent analytical skills in deciphering government regulations and public consultation drafts.`
    },
    {
      platform: 'GLINTS',
      title: 'HR & General Affairs (Admin Operasional)',
      companyName: 'Shopee Indonesia',
      jobUrl: 'https://glints.com/id/opportunities/jobs/shopee-hr-ga-admin-87621',
      location: 'Jakarta Barat (Pacific Century Place)',
      salaryRange: 'Rp 7.500.000 - 9.500.000',
      matchScore: 0.89,
      status: 'DISCOVERED' as const,
      scamReason: 'Kecocokan tinggi untuk skill administrasi kantor, pengarsipan berkas personalia, dan operasional fasilitas.',
      description: `Job Descriptions:
• Mengelola berkas personalia karyawan, surat keterangan kerja, dan administrasi database internal.
• Menangani operasional harian General Affairs: inventaris aset kantor, perizinan gedung, dan vendor pengadaan.
• Memproses reimbursement, invoice, dan rekapitulasi data pengeluaran operasional divisi.
• Membantu pelaksanaan program kepatuhan ketenagakerjaan dan administrasi BPJS Ketenagakerjaan & Kesehatan.

Persyaratan:
• S1 Administrasi Publik, Administrasi Perkantoran, Manajemen SDM, atau jurusan relevan.
• Teliti dalam mengolah data spreadsheet dan dokumen formal.
• Mampu bekerja secara cekatan dalam lingkungan kerja startup yang dinamis.
• Berorientasi pada solusi dan memiliki tata krama komunikasi interpersonal yang profesional.`
    },
    {
      platform: 'KALIBRR',
      title: 'Program & Administrative Assistant',
      companyName: 'United Nations Development Programme (UNDP)',
      jobUrl: 'https://www.kalibrr.com/c/undp/jobs/admin-programme-assistant-901',
      location: 'Jakarta Pusat (Menara Thamrin)',
      salaryRange: 'Rp 11.000.000 - 15.000.000',
      matchScore: 0.95,
      status: 'DISCOVERED' as const,
      scamReason: 'Sangat linear dengan kajian Administrasi Publik dan tata kelola organisasi nirlaba internasional.',
      description: `Organizational Context:
UNDP Indonesia is looking for a proactive Program & Administrative Assistant to support governance reform and sustainable development projects.

Duties:
• Provide administrative and logistical support for project meetings, workshops, and high-level dialogues.
• Prepare project documentation, travel authorizations, vendor contracts, and formal correspondence.
• Maintain project filing systems (both hardcopy and cloud-based Google Workspace / SharePoint).
• Draft meeting minutes, briefing notes, and monitoring reports.

Qualifications:
• S1 degree in Public Administration, International Relations, or Development Studies.
• At least 1-2 years of administrative and project support experience.
• Fluency in English and Bahasa Indonesia is mandatory.
• Familiarity with UN administration procedures or multilateral agencies is an added advantage.`
    },
    {
      platform: 'JOBSTREET',
      title: 'Document Controller & Compliance Officer',
      companyName: 'PT Wijaya Karya (Persero) Tbk (WIKA)',
      jobUrl: 'https://www.jobstreet.co.id/job/wika-doc-controller-44912',
      location: 'Jakarta Timur (Kantor Pusat WIKA)',
      salaryRange: 'Rp 7.500.000 - 10.000.000',
      matchScore: 0.88,
      status: 'DISCOVERED' as const,
      scamReason: 'Pekerjaan berbasis tertib arsip, penomoran surat, kendali mutu SOP, dan kepatuhan dokumen proyek BUMN.',
      description: `Tugas & Tanggung Jawab:
• Mengatur sistem penerimaan, penomoran, distribusi, dan penyimpanan seluruh dokumen proyek.
• Memastikan seluruh dokumen teknis dan administratif terverifikasi sesuai standar ISO 9001:2015.
• Mengelola master list dokumen dan melakukan pengarsipan digital secara berkala.
• Menyiapkan berkas tender, berita acara serah terima, dan laporan pertanggungjawaban berkala.

Kualifikasi:
• Lulusan S1 Administrasi Negara / Publik, Manajemen Informasi, atau Kearsipan.
• Memahami konsep tata kelola dokumen (Document Management System / EDMS).
• Mampu bekerja mandiri, rapi, dan sistematis.`
    },
    {
      platform: 'GLINTS',
      title: 'Corporate Secretary & Public Relations Officer',
      companyName: 'Bank Central Asia (BCA)',
      jobUrl: 'https://glints.com/id/opportunities/jobs/bca-corsec-pr-7819',
      location: 'Jakarta Pusat (Menara BCA)',
      salaryRange: 'Rp 9.000.000 - 12.500.000',
      matchScore: 0.91,
      status: 'DISCOVERED' as const,
      scamReason: 'Cocok dengan kompetensi komunikasi publik, administrasi tata pamong, dan kepatuhan regulasi OJK/BI.',
      description: `Deskripsi Pekerjaan:
• Membantu penyusunan risalah rapat direksi, materi paparan publik, dan laporan tahunan perbankan.
• Mengelola administrasi perizinan dan hubungan korespondensi dengan Otoritas Jasa Keuangan (OJK) dan Bank Indonesia.
• Menyusun siaran pers, menyortir kliping media, dan mendukung koordinasi media gathering.
• Memastikan arsip risalah rapat dan dokumen korporasi tersimpan aman dan tersusun kronologis.

Kualifikasi:
• S1 Administrasi Publik, Ilmu Komunikasi, atau Hubungan Masyarakat.
• Kemampuan berbahasa Indonesia yang baku dan formal, serta fasih berbahasa Inggris.
• Memiliki etika kerja prima dan berpenampilan rapi.`
    },
    {
      platform: 'JOBSTREET',
      title: 'CSR & Stakeholder Engagement Officer',
      companyName: 'Danone Indonesia',
      jobUrl: 'https://www.jobstreet.co.id/job/danone-csr-stakeholder-6712',
      location: 'Jakarta Selatan (Cyber 2 Tower)',
      salaryRange: 'Rp 8.500.000 - 12.000.000',
      matchScore: 0.87,
      status: 'DISCOVERED' as const,
      scamReason: 'Program pemberdayaan masyarakat dan relasi pemerintah daerah sangat relevan dengan bidang Administrasi Publik.',
      description: `Job Summary:
Membantu pelaksanaan inisiatif program tanggung jawab sosial lingkungan (CSR) serta membina hubungan kemitraan dengan pemangku kepentingan publik di tingkat daerah dan kementerian.

Kualifikasi:
• S1 Administrasi Publik, Sosiologi, atau Pembangunan Sosial.
• Pengalaman dalam monitoring program sosial dan administrasi pelaporan hibah/CSR.
• Bersedia melakukan koordinasi lapangan ke sentra mitra pemberdayaan.`
    },
    {
      platform: 'TECH_IN_ASIA',
      title: 'Executive Assistant & Administration Specialist',
      companyName: 'Bukalapak',
      jobUrl: 'https://www.techinasia.com/jobs/bukalapak-exec-admin-spec-781',
      location: 'Jakarta Selatan (Cilandak KKO)',
      salaryRange: 'Rp 9.000.000 - 13.000.000',
      matchScore: 0.93,
      status: 'QUEUED_FOR_APPLY' as const,
      scamReason: 'Pengelolaan jadwal eksekutif, notulensi rapat dewan, dan administrasi operasional lintas divisi di industri teknologi.',
      description: `Responsibilities:
• Coordinate executive calendars, board agendas, and domestic/international travel itineraries.
• Take accurate minutes of leadership meetings and follow up on actionable deliverables across departments.
• Prepare executive reports, expense reconciliations, and confidential correspondence.
• Maintain seamless administrative alignment between operational and corporate affairs units.

Requirements:
• S1 in Public Administration, Business Administration, or Secretarial studies.
• Min. 2 years of experience assisting senior management in fast-paced corporate or tech environment.
• Highly discreet, organized, and proficient in Google Suite tools.`
    }
  ];

  // 3. Tambahan Loker Tech untuk User 1 (Pranata Pramudya)
  const primaryJobs = [
    {
      platform: 'TECH_IN_ASIA',
      title: 'Senior Fullstack Engineer (Next.js & PostgreSQL)',
      companyName: 'Traveloka',
      jobUrl: 'https://www.techinasia.com/jobs/traveloka-sr-fullstack-891',
      location: 'Tangerang / BSD City (Hybrid)',
      salaryRange: 'Rp 22.000.000 - 28.000.000',
      matchScore: 0.96,
      status: 'QUEUED_FOR_APPLY' as const,
      scamReason: 'Match score luar biasa (96%). Stack Next.js, TypeScript, PostgreSQL, dan Prisma sangat sesuai dengan keahlian inti pelamar.',
      description: `We are looking for a Senior Fullstack Engineer to lead consumer-facing feature rollouts on our Next.js App Router platforms.

Key Requirements:
• 4+ years shipping web applications with Next.js, React, and TypeScript.
• Proven backend mastery in Node.js, relational databases (PostgreSQL), and ORMs (Prisma).
• Experience with cloud deployments, microservices architectures, and high-concurrency caching.`
    },
    {
      platform: 'LINKEDIN',
      title: 'Backend Engineer (Node.js & Cloud Services)',
      companyName: 'Bibit.id (PT Bibit Tumbuh Bersama)',
      jobUrl: 'https://www.linkedin.com/jobs/view/bibit-backend-engineer-5612',
      location: 'Jakarta Selatan (SCBD)',
      salaryRange: 'Rp 19.000.000 - 25.000.000',
      matchScore: 0.93,
      status: 'DISCOVERED' as const,
      scamReason: 'Relevansi tinggi pada API automation, database PostgreSQL, dan integrasi backend fintech.',
      description: `Job Scope:
• Architect resilient transactional APIs for wealth management workflows.
• Ensure low latency DB queries on PostgreSQL databases.
• Implement automated end-to-end testing, CI/CD pipelines, and infrastructure observability.`
    },
    {
      platform: 'GLINTS',
      title: 'Frontend Engineer (React 19 & Tailwind CSS)',
      companyName: 'DANA Indonesia',
      jobUrl: 'https://glints.com/id/opportunities/jobs/dana-frontend-engineer-4512',
      location: 'Jakarta Selatan (Capital Place)',
      salaryRange: 'Rp 17.000.000 - 23.000.000',
      matchScore: 0.91,
      status: 'DISCOVERED' as const,
      scamReason: 'Fokus pada arsitektur UI modern, micro-frontend, dan responsive web performance.',
      description: `Requirements:
• Strong core skills in modern React, TypeScript, and clean UI engineering using TailwindCSS.
• Passion for sleek micro-interactions, responsive mobile web design, and fast Core Web Vitals.
• Solid collaboration in Agile Scrum development environment.`
    },
    {
      platform: 'TECH_IN_ASIA',
      title: 'Full Stack Web Developer (Autonomous Agent Systems)',
      companyName: 'Xendit',
      jobUrl: 'https://www.techinasia.com/jobs/xendit-fullstack-agent-992',
      location: 'Jakarta (Remote OK)',
      salaryRange: 'Rp 24.000.000 - 32.000.000',
      matchScore: 0.95,
      status: 'DISCOVERED' as const,
      scamReason: 'Sangat cocok untuk engineer yang berpengalaman membangun bot otomatisasi, Playwright automation, dan Next.js.',
      description: `Overview:
Join our Merchant Automation & Integration team building next-generation workflow agents and merchant dashboards.

Requirements:
• Experience in headless browser automation (Playwright/Puppeteer) and web scraping pipelines.
• Mastery of TypeScript, Next.js, and modern REST/GraphQL services.`
    }
  ];

  // Eksekusi upsert ke DB
  console.log(`Memasukkan ${partnerJobs.length} lowongan Administrasi Publik untuk Partner...`);
  for (const job of partnerJobs) {
    await prisma.jobListing.upsert({
      where: {
        userId_jobUrl: {
          userId: partnerUser.id,
          jobUrl: job.jobUrl
        }
      },
      update: {
        ...job,
        updatedAt: new Date()
      },
      create: {
        ...job,
        userId: partnerUser.id
      }
    });
  }

  console.log(`Memasukkan ${primaryJobs.length} lowongan Tech untuk User 1 (Pranata)...`);
  for (const job of primaryJobs) {
    await prisma.jobListing.upsert({
      where: {
        userId_jobUrl: {
          userId: primaryUser.id,
          jobUrl: job.jobUrl
        }
      },
      update: {
        ...job,
        updatedAt: new Date()
      },
      create: {
        ...job,
        userId: primaryUser.id
      }
    });
  }

  console.log('\n🎉 SEMUA LOWONGAN BERHASIL DISINKRONISASI KE NEON DB!');
}

seedRichJobs()
  .catch((err) => {
    console.error('Gagal seeding lowongan:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
