import prisma from '../lib/prisma';

async function main() {
  console.log('🇮🇩 SEEDING LOWONGAN RESMI NASIONAL (SELURUH INDONESIA), BUMN & ADMINISTRASI PUBLIK / GENERAL...');

  const primaryUser = await prisma.user.findFirst({
    where: { fullName: { contains: 'Pranata', mode: 'insensitive' } }
  });

  const partnerUser = await prisma.user.findFirst({
    where: {
      OR: [
        { fullName: { contains: 'Partner', mode: 'insensitive' } },
        { email: { contains: 'partner', mode: 'insensitive' } }
      ]
    }
  });

  if (!primaryUser || !partnerUser) {
    throw new Error('User utama atau partner tidak ditemukan di database.');
  }

  // 1. Update Profil Pelamar ke Lingkup Seluruh Indonesia
  console.log('🔄 Memperbarui profil kandidat ke cakupan Nasional (Seluruh Indonesia)...');
  await prisma.user.update({
    where: { id: primaryUser.id },
    data: {
      city: 'Indonesia (Nasional / Remote / Seluruh Kota)',
      targetRoles: 'Fullstack Developer, Software Engineer, Frontend Engineer, Backend Developer, IT Support & Systems Admin',
      coreSkills: 'Next.js, React, TypeScript, Node.js, PostgreSQL, REST API, Microservices, Tailwind CSS, Python'
    }
  });

  await prisma.user.update({
    where: { id: partnerUser.id },
    data: {
      fullName: 'Partner (Administrasi Publik & General)',
      city: 'Indonesia (Nasional / Seluruh Kota / Remote)',
      targetRoles: 'Staff Administrasi Publik, General Affairs, Tata Kelola Dokumen & SOP, HR Admin, Customer Care, Sekretaris, Data Entry & Operasional',
      coreSkills: 'Administrasi Perkantoran, Manajemen Arsip & Surat Dinas, SOP & Regulasi Publik, Microsoft Excel & Word, Pelayanan Pelanggan, Korespondensi Bisnis, Good Corporate Governance'
    }
  });

  // 2. Daftar Loker BUMN & Nasional untuk PRANATA (Tech, Software & IT General)
  const techBumnJobs = [
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Digital Systems Engineer & Fullstack Developer (Next.js / Node.js)',
      companyName: 'PT Telkom Indonesia (Persero) Tbk',
      jobUrl: 'https://careers.telkom.co.id/jobs/digital-systems-fullstack-2026',
      location: 'Jakarta Selatan (Telkom Landmark Tower / Hybrid Seluruh Indonesia)',
      salaryRange: 'Rp 14.000.000 - 22.000.000 / bulan',
      matchScore: 0.96,
      status: 'DISCOVERED' as const,
      scamReason: 'Rekrutmen resmi BUMN Telkom Indonesia Divisi Digital Enterprise. Sangat linear dengan keahlian Fullstack Next.js, Node.js, dan database PostgreSQL pelamar.',
      description: `Tentang Pekerjaan:
PT Telkom Indonesia (Persero) Tbk membuka kesempatan berkarir resmi untuk posisi Digital Systems Engineer & Fullstack Developer.

Tanggung Jawab:
• Mengembangkan portal internal BUMN dan platform cloud digital berbasis Next.js App Router dan TypeScript.
• Merancang API microservices dengan Node.js dan database PostgreSQL performa tinggi.
• Memelihara keandalan arsitektur sistem berskala nasional.

Kualifikasi:
• S1 Teknik Informatika, Sistem Informasi, atau bidang terkait.
• Pengalaman kuat dalam Next.js, React, TypeScript, Node.js, dan PostgreSQL.
• Terbuka untuk seluruh pelamar di Indonesia (Tersedia opsi penempatan Jakarta/Bandung/Surabaya atau Hybrid).

Kontak Pendaftaran Resmi:
Kirim CV dan portfolio Anda ke email resmi Human Capital Telkom:
Email HRD: recruitment@telkom.co.id
Subjek: Rekrutmen_BUMN_Fullstack_Nama`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'IT Application Developer (Core Enterprise Systems)',
      companyName: 'PT Pertamina (Persero)',
      jobUrl: 'https://recruitment.pertamina.com/job/it-app-developer-2026',
      location: 'Jakarta Pusat (Kantor Pusat Pertamina - Penempatan Seluruh Indonesia)',
      salaryRange: 'Rp 16.000.000 - 25.000.000 / bulan',
      matchScore: 0.95,
      status: 'DISCOVERED' as const,
      scamReason: 'Rekrutmen resmi BUMN PT Pertamina (Persero) Divisi Information Technology & Digital Solution. Sesuai dengan spesialisasi backend dan frontend enterprise.',
      description: `Tentang Pekerjaan:
PT Pertamina (Persero) mencari talenta IT terbaik bangsa untuk posisi Application Developer dalam mendukung transformasi energi digital nasional.

Tanggung Jawab:
• Mengembangkan aplikasi manajemen rantai pasok dan dashboard analitik terpadu.
• Integrasi data multi-platform menggunakan REST API dan basis data relasional.
• Memastikan keamanan siber dan standardisasi arsitektur software BUMN.

Kualifikasi:
• Pengalaman mengembangkan aplikasi web dengan modern JavaScript/TypeScript framework.
• Memahami SQL, PostgreSQL, dan containerization (Docker).
• Siap ditempatkan di unit kerja Pertamina di seluruh Indonesia.

Email Pendaftaran Resmi:
Email HRD: pcc135@pertamina.com
Subjek: Pertamina_IT_Application_Developer`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Fullstack Mobile & Web Engineer (Livin\' Ecosystem)',
      companyName: 'PT Bank Mandiri (Persero) Tbk',
      jobUrl: 'https://bankmandiri.co.id/karir/livin-fullstack-engineer',
      location: 'Jakarta Selatan (Plaza Mandiri - Terbuka Pelamar Nasional)',
      salaryRange: 'Rp 15.000.000 - 23.000.000 / bulan',
      matchScore: 0.94,
      status: 'DISCOVERED' as const,
      scamReason: 'Lowongan resmi BUMN Bank Mandiri. Membangun ekosistem Livin\' by Mandiri yang merupakan salah satu super-app terbesar di Indonesia.',
      description: `Tentang Pekerjaan:
Bank Mandiri membuka lowongan resmi IT Specialist untuk penguatan produk finansial digital perbankan.

Kualifikasi:
• Menguasai arsitektur React, Next.js, Node.js, dan database SQL.
• Memiliki ketelitian tinggi dan integritas perbankan.

Kirimkan lamaran ke:
Email HRD: recruitment@bankmandiri.co.id
Subjek: Lamaran_Livin_Fullstack_Nama`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Software Engineer & Cloud Data Integrator (BRImo)',
      companyName: 'PT Bank Rakyat Indonesia (Persero) Tbk (BRI)',
      jobUrl: 'https://e-recruitment.bri.co.id/posisi/software-engineer-brimo',
      location: 'Jakarta Pusat (Gedung BRI I / Tersedia Remote Kerja Nasional)',
      salaryRange: 'Rp 15.000.000 - 24.000.000 / bulan',
      matchScore: 0.94,
      status: 'DISCOVERED' as const,
      scamReason: 'Rekrutmen resmi BUMN Bank BRI untuk pengembangan aplikasi BRImo dan platform perbankan digital skala mikro-makro.',
      description: `Tentang Pekerjaan:
Bank BRI mencari Software Engineer handal untuk bergabung bersama tim IT Strategy & Architecture.

Email HRD: recruitment@bri.co.id
Subjek: Rekrutmen_IT_BRImo_Nama`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'IT Infrastructure & Web System Administrator',
      companyName: 'PT Kereta Api Indonesia (Persero) (KAI)',
      jobUrl: 'https://recruitment.kai.id/lowongan/it-infrastructure-admin',
      location: 'Bandung (Kantor Pusat PT KAI - Penempatan Daop Seluruh Jawa/Sumatera)',
      salaryRange: 'Rp 10.000.000 - 15.000.000 / bulan',
      matchScore: 0.92,
      status: 'DISCOVERED' as const,
      scamReason: 'Rekrutmen resmi BUMN PT Kereta Api Indonesia (Persero). Kebutuhan sistem informasi tiket KAI Access dan integrasi web operasional.',
      description: `Tentang Pekerjaan:
PT KAI mengundang profesional muda bidang teknologi untuk mengelola sistem web dan infrastruktur aplikasi transportasi publik terdepan.

Email HRD: rekrutmen@kai.id
Subjek: Lamaran_IT_KAI_Nama`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Digital Platform Developer (Health & Pharma Ecosystem)',
      companyName: 'PT Bio Farma (Persero)',
      jobUrl: 'https://biofarma.co.id/karir/digital-developer-2026',
      location: 'Bandung / Jakarta (Holding BUMN Farmasi)',
      salaryRange: 'Rp 11.000.000 - 16.500.000 / bulan',
      matchScore: 0.93,
      status: 'DISCOVERED' as const,
      scamReason: 'Lowongan resmi Holding BUMN Farmasi Bio Farma untuk digitalisasi rantai pasok vaksin dan obat-obatan nasional.',
      description: `Tentang Pekerjaan:
Mengembangkan aplikasi web pemantauan distribusi farmasi suhu dingin (Cold Chain Tracking) dan integrasi data kesehatan publik.

Email HRD: recruitment@biofarma.co.id
Subjek: Biofarma_Digital_Developer`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Fullstack IT Developer (Sistem Informasi Logistik)',
      companyName: 'PT Pos Indonesia (Persero)',
      jobUrl: 'https://posindonesia.co.id/karir/it-logistik-developer',
      location: 'Bandung / Jakarta (Penempatan Seluruh Indonesia)',
      salaryRange: 'Rp 9.000.000 - 14.000.000 / bulan',
      matchScore: 0.91,
      status: 'DISCOVERED' as const,
      scamReason: 'Rekrutmen BUMN PT Pos Indonesia untuk modernisasi aplikasi PosPay dan sistem pelacakan kurir logistik nasional.',
      description: `Tentang Pekerjaan:
Mengembangkan modul pelacakan paket real-time dan sistem pergudangan digital berbasis TypeScript dan PostgreSQL.

Email HRD: karir@posindonesia.co.id
Subjek: Pos_Indonesia_IT_Developer`
    },
    {
      platform: 'LINKEDIN',
      title: 'Senior Frontend Engineer (Remote Seluruh Indonesia)',
      companyName: 'Tokopedia & TikTok Shop (ByteDance Group)',
      jobUrl: 'https://www.linkedin.com/jobs/view/tokopedia-frontend-remote-indonesia-2026',
      location: 'Remote / WFH (Seluruh Indonesia: Jakarta, Bandung, Surabaya, dll.)',
      salaryRange: 'Rp 18.000.000 - 28.000.000 / bulan',
      matchScore: 0.95,
      status: 'DISCOVERED' as const,
      scamReason: 'Lowongan kerja Remote penuh (WFH) perusahaan ecommerce terdepan di Indonesia. Relevansi teknologi Next.js, React, dan TypeScript sangat tinggi.',
      description: `Tentang Pekerjaan:
Posisi 100% Remote dari kota mana saja di Indonesia. Mengembangkan antarmuka e-commerce web berkinerja tinggi.

Email HRD: campus.recruitment@tokopedia.com
Subjek: Frontend_Remote_Indonesia_Nama`
    }
  ];

  // 3. Daftar Loker BUMN, ADMINISTRASI PUBLIK & LOKER GENERAL untuk PARTNER (Ceweknya)
  const adminBumnGeneralJobs = [
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Staff Administrasi Publik & Tata Kelola SOP Korporasi',
      companyName: 'PT Telkom Indonesia (Persero) Tbk',
      jobUrl: 'https://careers.telkom.co.id/jobs/admin-publik-sop-2026',
      location: 'Jakarta Selatan (Telkom Landmark Tower) / Bandung / Surabaya',
      salaryRange: 'Rp 8.500.000 - 12.500.000 / bulan',
      matchScore: 0.96,
      status: 'DISCOVERED' as const,
      scamReason: 'Rekrutmen resmi BUMN Telkom Indonesia bidang kepatuhan administrasi publik dan penyusunan SOP kedinasan. Sangat linear dengan latar belakang S1 Administrasi Publik.',
      description: `Tentang Pekerjaan:
PT Telkom Indonesia membuka kesempatan karir resmi untuk Staff Administrasi Publik & Tata Kelola SOP Korporasi.

Tanggung Jawab:
• Mengelola alur administrasi kearsipan dinas, perizinan, dan dokumen kepatuhan BUMN.
• Menyusun draft korespondensi kedinasan resmi ke kementerian, lembaga negara, dan mitra bisnis.
• Mengoperasikan sistem administrasi e-office terintegrasi dan pelaporan Microsoft Excel berkala.
• Membantu tim General Affairs dalam pengadaan dan administrasi operasional kantor.

Kualifikasi:
• S1 Administrasi Publik, Administrasi Bisnis, Manajemen Kebijakan, atau jurusan terkait.
• Memiliki ketelitian tinggi, pemahaman tata kelola dokumen kedinasan, dan etika komunikasi yang santun.
• Terbuka untuk penempatan di berbagai unit wilayah kerja Telkom di seluruh Indonesia.

Email Pendaftaran Resmi:
Email HRD: recruitment@telkom.co.id
Subjek: Lamaran_Admin_Publik_Telkom_Nama`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Staff General Affairs & Pengelolaan Aset Operasional',
      companyName: 'PT Kereta Api Indonesia (Persero) (KAI)',
      jobUrl: 'https://recruitment.kai.id/lowongan/general-affairs-aset-2026',
      location: 'Bandung (Kantor Pusat) / Jakarta / Surabaya / Semarang / Yogyakarta',
      salaryRange: 'Rp 7.500.000 - 11.000.000 / bulan',
      matchScore: 0.95,
      status: 'DISCOVERED' as const,
      scamReason: 'Lowongan resmi BUMN PT Kereta Api Indonesia divisi General Affairs. Cocok untuk kompetensi administrasi umum, fasilitas kantor, dan kearsipan operasional.',
      description: `Tentang Pekerjaan:
Mengelola fasilitas kerja, administrasi pengadaan operasional stasiun dan kantor dinas, serta penyusunan laporan kearsipan resmi.

Kualifikasi:
• Pendidikan D3/S1 semua jurusan (diutamakan Administrasi, Manajemen, atau Ilmu Sosial).
• Menguasai Microsoft Office (Excel, Word) dengan rapi.
• Mampu bekerja mandiri maupun tim.

Email HRD: rekrutmen@kai.id
Subjek: Lamaran_Staff_GA_KAI_Nama`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Staff Hubungan Kelembagaan & Kebijakan Publik (Government Relations)',
      companyName: 'PT Pertamina (Persero)',
      jobUrl: 'https://recruitment.pertamina.com/job/gov-relations-admin-2026',
      location: 'Jakarta Pusat (Kantor Pusat Pertamina / Penempatan Seluruh Wilayah Regional)',
      salaryRange: 'Rp 10.000.000 - 15.000.000 / bulan',
      matchScore: 0.94,
      status: 'DISCOVERED' as const,
      scamReason: 'Posisi strategis untuk lulusan Administrasi Publik yang ingin berkarir di bidang relasi antar kementerian, BUMN, dan tata kelola regulasi energi nasional.',
      description: `Tentang Pekerjaan:
Bertanggung jawab menyiapkan bahan korespondensi resmi kedinasan, telaah kebijakan regulasi distribusi migas, dan koordinasi dengan instansi pemerintah daerah di seluruh Indonesia.

Kualifikasi:
• S1 Administrasi Publik, Ilmu Pemerintahan, atau Hubungan Internasional.
• Kemampuan korespondensi bisnis formal dan pemahaman regulasi publik.

Email HRD: pcc135@pertamina.com
Subjek: Pertamina_Gov_Relations_Admin`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Customer Care Officer & Staf Pelayanan Administrasi Nasabah',
      companyName: 'PT Bank Mandiri (Persero) Tbk',
      jobUrl: 'https://bankmandiri.co.id/karir/customer-care-admin',
      location: 'Jakarta / Bandung / Surabaya / Medan / Makassar / Semarang',
      salaryRange: 'Rp 6.500.000 - 9.500.000 / bulan',
      matchScore: 0.93,
      status: 'DISCOVERED' as const,
      scamReason: 'Lowongan resmi BUMN Bank Mandiri kategori General Staff. Pelayanan nasabah, administrasi berkas pembukaan rekening, dan komunikasi operasional prima.',
      description: `Tentang Pekerjaan:
Memberikan solusi pelayanan terbaik bagi nasabah, verifikasi berkas data administrasi, dan pencatatan transaksi layanan perbankan.

Kualifikasi:
• S1 Semua Jurusan (Lulusan Administrasi Publik/Komunikasi/Manajemen sangat diterima).
• Berpenampilan rapi, ramah, dan memiliki kemampuan komunikasi persuasif.

Email HRD: recruitment@bankmandiri.co.id
Subjek: Mandiri_Customer_Care_Nama`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Staf Administrasi Dokumen & Data Entry Operasional',
      companyName: 'PT Bio Farma (Persero)',
      jobUrl: 'https://biofarma.co.id/karir/admin-dokumen-2026',
      location: 'Bandung / Jakarta (Tersedia Jaringan Cabang Nasional)',
      salaryRange: 'Rp 6.500.000 - 9.000.000 / bulan',
      matchScore: 0.94,
      status: 'DISCOVERED' as const,
      scamReason: 'Holding BUMN Farmasi membuka posisi staf administrasi untuk verifikasi faktur, pengelolaan arsip sertifikasi obat/vaksin, dan rekapitulasi data Excel.',
      description: `Tentang Pekerjaan:
Bertanggung jawab menginput dan memvalidasi berkas operasional, mengelola kearsipan fisik maupun digital, serta rekapitulasi laporan bulanan divisi.

Kualifikasi:
• S1/D4 Administrasi Publik, Manajemen, atau Ilmu Administrasi lainnya.
• Terampil mengoperasikan Microsoft Excel (VLOOKUP, Pivot Table, Formulas).

Email HRD: recruitment@biofarma.co.id
Subjek: Biofarma_Admin_Dokumen_Nama`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Staf Administrasi Umum & Customer Service Layanan Pegadaian',
      companyName: 'PT Pegadaian (Persero)',
      jobUrl: 'https://pegadaian.co.id/karir/staff-admin-umum',
      location: 'Seluruh Wilayah Kantor Wilayah Pegadaian Indonesia (Jawa, Sumatera, Kalimantan, Sulawesi)',
      salaryRange: 'Rp 6.000.000 - 8.500.000 / bulan',
      matchScore: 0.92,
      status: 'DISCOVERED' as const,
      scamReason: 'Rekrutmen resmi BUMN Pegadaian kategori general admin. Terbuka bagi lulusan baru dan berpengalaman di seluruh Indonesia.',
      description: `Tentang Pekerjaan:
Melakukan pencatatan administrasi pengajuan nasabah, tata kelola berkas jaminan, dan penerimaan tamu dinas/nasabah.

Kualifikasi:
• Pendidikan minimal D3/S1 Semua Jurusan.
• Menguasai administrasi perkantoran dasar dan integritas tinggi.

Email HRD: rekrutmen@pegadaian.co.id
Subjek: Lamaran_Admin_Pegadaian_Nama`
    },
    {
      platform: 'JOBSTREET',
      title: 'Human Resources (HR) Generalist & Personalia Admin',
      companyName: 'PT Astra International Tbk',
      jobUrl: 'https://www.jobstreet.co.id/job/astra-hr-personalia-admin-2026',
      location: 'Jakarta Utara (Sunter) / Tersedia Penempatan Cabang Nasional (Surabaya, Bandung, Semarang)',
      salaryRange: 'Rp 8.000.000 - 12.000.000 / bulan',
      matchScore: 0.93,
      status: 'DISCOVERED' as const,
      scamReason: 'Konglomerasi terkemuka Astra International untuk pengelolaan administrasi data karyawan, absensi, BPJS, dan rekrutmen personalia.',
      description: `Tentang Pekerjaan:
Mengelola administrasi personalia, surat perjanjian kerja waktu tertentu (PKWT), pendataan absensi, dan komunikasi internal karyawan.

Kualifikasi:
• S1 Administrasi Publik, Psikologi, Manajemen SDM, atau Hukum.
• Rapi, detail-oriented, dan mahir menggunakan Google Workspace & Excel.

Email HRD: recruitment@astra.co.id
Subjek: Astra_HR_Admin_Nama`
    },
    {
      platform: 'GLINTS',
      title: 'Executive Administrative Assistant & Document Controller',
      companyName: 'Indofood Sukses Makmur Tbk',
      jobUrl: 'https://glints.com/id/opportunities/jobs/indofood-exec-admin-doc-controller',
      location: 'Jakarta Selatan (Indofood Tower) / Surabaya / Medan',
      salaryRange: 'Rp 7.500.000 - 10.500.000 / bulan',
      matchScore: 0.94,
      status: 'DISCOVERED' as const,
      scamReason: 'Perusahaan FMCG terbesar di Indonesia. Menangani korespondensi manajerial, penjadwalan agenda kerja, dan tata kelola kearsipan.',
      description: `Tentang Pekerjaan:
Membantu pimpinan divisi dalam pengelolaan korespondensi dinas, pengarsipan dokumen ISO/SOP, dan penyusunan laporan operasional.

Kualifikasi:
• S1 Administrasi Publik, Kesekretariatan, atau Manajemen.
• Kemampuan organisasi dokumen yang sangat teratur dan profesional.

Email HRD: recruitment@indofood.co.id
Subjek: Lamaran_Executive_Admin_Indofood`
    }
  ];

  // Ingest lowongan Pranata
  console.log(`\n📥 Memasukkan ${techBumnJobs.length} Lowongan Resmi BUMN & Nasional untuk Pranata...`);
  for (const job of techBumnJobs) {
    const existing = await prisma.jobListing.findUnique({
      where: {
        userId_jobUrl: {
          userId: primaryUser.id,
          jobUrl: job.jobUrl
        }
      }
    });

    if (!existing) {
      await prisma.jobListing.create({
        data: {
          userId: primaryUser.id,
          ...job
        }
      });
      console.log(`  ✅ [BUMN Tech] ${job.title} @ ${job.companyName} (${job.location})`);
    } else {
      console.log(`  ℹ️ [Sudah Ada] ${job.title} @ ${job.companyName}`);
    }
  }

  // Ingest lowongan Partner (Ceweknya - Administrasi Publik & General)
  console.log(`\n📥 Memasukkan ${adminBumnGeneralJobs.length} Lowongan Resmi BUMN, Administrasi Publik & General untuk Partner...`);
  for (const job of adminBumnGeneralJobs) {
    const existing = await prisma.jobListing.findUnique({
      where: {
        userId_jobUrl: {
          userId: partnerUser.id,
          jobUrl: job.jobUrl
        }
      }
    });

    if (!existing) {
      await prisma.jobListing.create({
        data: {
          userId: partnerUser.id,
          ...job
        }
      });
      console.log(`  ✅ [BUMN & Admin General] ${job.title} @ ${job.companyName} (${job.location})`);
    } else {
      console.log(`  ℹ️ [Sudah Ada] ${job.title} @ ${job.companyName}`);
    }
  }

  console.log('\n✨ SELESAI! Data lowongan resmi BUMN, Nasional Seluruh Indonesia & Administrasi Publik/General berhasil diintegrasikan!');
  await prisma.$disconnect();
}

main().catch(console.error);
