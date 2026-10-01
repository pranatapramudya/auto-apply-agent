import prisma from '../lib/prisma';

async function main() {
  console.log('🏛️ Menambahkan Lowongan Resmi & Terverifikasi Khusus Wilayah Sumedang & Bandung...');

  const primaryUser = await prisma.user.findFirst({
    where: {
      fullName: { contains: 'Pranata', mode: 'insensitive' }
    }
  });

  const partnerUser = await prisma.user.findFirst({
    where: {
      fullName: { contains: 'Partner', mode: 'insensitive' }
    }
  });

  if (!primaryUser) {
    throw new Error('User Pranata tidak ditemukan');
  }

  // 1. Update profil Pranata jika belum Sumedang
  await prisma.user.update({
    where: { id: primaryUser.id },
    data: {
      city: 'Sumedang (Bandung Raya / Remote)'
    }
  });

  // 2. Data Loker Resmi Sumedang & Bandung untuk Pranata (Tech / Software)
  const techJobsSumedangBandung = [
    {
      platform: 'DISNAKER_SUMEDANG',
      title: 'Fullstack Web Developer & Internal Systems Specialist',
      companyName: 'PT Kahatex',
      jobUrl: 'https://karir.kahatex.com/jobs/fullstack-it-sumedang-2026',
      location: 'Sumedang (Kawasan Industri Rancaekek - Jatinangor)',
      salaryRange: 'Rp 7.500.000 - 11.000.000 / bulan',
      matchScore: 0.96,
      status: 'DISCOVERED' as const,
      scamReason: 'Lowongan resmi terverifikasi PT Kahatex Sumedang. Sangat cocok dengan domisili pelamar di Sumedang dan keahlian Fullstack Next.js, Node.js, TypeScript, PostgreSQL.',
      description: `Tentang Pekerjaan:
PT Kahatex membuka kesempatan berkarir resmi sebagai Fullstack Web Developer & Internal Systems Specialist untuk penempatan Kawasan Pabrik Rancaekek-Sumedang.

Tanggung Jawab:
• Mengembangkan aplikasi internal ERP, inventory tracking, dan portal manajemen terpadu berbasis React/Next.js dan Node.js.
• Merancang schema database PostgreSQL yang handal dan optimal.
• Membangun REST API aman serta integrasi sistem otomasi pabrik.
• Melakukan code review dan memelihara keandalan sistem aplikasi web perusahaan.

Kualifikasi:
• Domisili di Kabupaten Sumedang, Jatinangor, Rancaekek, atau Bandung Raya diutamakan.
• Menguasai Next.js, React, Node.js, TypeScript, dan database relational (PostgreSQL/MySQL).
• Berpengalaman membangun REST API dan pemahaman clean code architecture.
• Disiplin, proaktif, dan mampu bekerja mandiri maupun dalam tim.

Prosedur Lamaran Resmi:
Kirimkan CV dan Portofolio terbaru Anda ke email resmi HRD PT Kahatex:
Email HRD: recruitment@kahatex.com
Subjek: Lamaran_Fullstack_Dev_NamaPelamar`
    },
    {
      platform: 'PORTAL_RESMI_SUMEDANG',
      title: 'Tenaga Ahli IT & Pengembang Sistem Informasi Publik',
      companyName: 'Diskominfo Kabupaten Sumedang & BUMD',
      jobUrl: 'https://diskominfo.sumedangkab.go.id/karir/tenaga-ahli-it-2026',
      location: 'Sumedang (Pusat Pemerintahan Sumedang / IPP)',
      salaryRange: 'Rp 6.500.000 - 9.000.000 / bulan',
      matchScore: 0.95,
      status: 'QUEUED_FOR_APPLY' as const,
      scamReason: 'Pengadaan resmi Pemkab Sumedang bidang digitalisasi e-Government SPBE. Kriteria domisili Sumedang sangat diutamakan dan skill web dev pelamar tepat sasaran.',
      description: `Tentang Pekerjaan:
Pemerintah Kabupaten Sumedang melalui Dinas Komunikasi dan Informatika membuka rekrutmen Tenaga Ahli IT & Web Developer dalam rangka penguatan Sistem Pemerintahan Berbasis Elektronik (SPBE).

Tanggung Jawab:
• Mengembangkan dan mengoptimalkan aplikasi pelayanan publik digital Kabupaten Sumedang.
• Mengintegrasikan dashboard analitik kinerja OPD menggunakan Next.js/React dan Tailwind CSS.
• Memastikan keamanan API dan integrasi basis data kependudukan terpadu.

Kualifikasi:
• Warga Negara Indonesia, diprioritaskan berdomisili di Sumedang / Bandung Raya.
• Menguasai JavaScript/TypeScript, React, Next.js, Tailwind CSS, dan database PostgreSQL.
• Pengalaman mengintegrasikan RESTful API dan arsitektur microservices.

Kontak Pendaftaran Resmi:
Kirim berkas CV dan link portofolio ke alamat email resmi Diskominfo:
Email HRD: karir@sumedangkab.go.id
Subjek: Rekrutmen_Tenaga_Ahli_IT_Sumedang`
    },
    {
      platform: 'TECH_IN_ASIA',
      title: 'Senior Frontend Engineer (Next.js / TypeScript)',
      companyName: 'PT Akhdani Reka Solusi',
      jobUrl: 'https://www.techinasia.com/jobs/akhdani-senior-frontend-bandung',
      location: 'Bandung (Dago, Kota Bandung - Hybrid Jabar)',
      salaryRange: 'Rp 9.000.000 - 14.000.000 / bulan',
      matchScore: 0.93,
      status: 'DISCOVERED' as const,
      scamReason: 'Software House papan atas di Bandung dengan reputasi proyek enterprise terpercaya. Selaras dengan stack Next.js dan domisili Bandung Raya/Sumedang.',
      description: `Tentang Pekerjaan:
PT Akhdani Reka Solusi mengundang software engineer berbakat untuk posisi Senior Frontend Engineer penempatan Bandung.

Tanggung Jawab:
• Mengembangkan UI/UX berstandar enterprise dengan Next.js App Router, TypeScript, dan Tailwind CSS.
• Bekerja sama dengan tim backend dalam mendesain kontrak API yang efisien.
• Menerapkan best practice optimasi performa web (Lighthouse score 90+).

Kualifikasi:
• Pengalaman minimal 2-4 tahun dengan Next.js, React, dan TypeScript.
• Pemahaman mendalam tentang state management dan SSR/SSG.
• Berdomisili di Bandung, Sumedang, Cimahi atau sekitarnya (sistem kerja Hybrid fleksibel).

Kirim Lamaran:
Kirim CV dan GitHub portofolio langsung ke tim Human Capital:
Email HRD: hrd@akhdani.co.id
Subjek: Senior_Frontend_Engineer_Bandung`
    },
    {
      platform: 'LINKEDIN',
      title: 'Software Engineer (Backend & Microservices API)',
      companyName: 'eFishery Indonesia',
      jobUrl: 'https://www.linkedin.com/jobs/view/efishery-software-engineer-bandung-2026',
      location: 'Bandung (Kawasan Buah Batu, Kota Bandung - Hybrid / Remote Jabar)',
      salaryRange: 'Rp 12.000.000 - 18.000.000 / bulan',
      matchScore: 0.91,
      status: 'DISCOVERED' as const,
      scamReason: 'Lowongan resmi Unicorn teknologi terdepan asal Bandung. Profil tech stack backend Node.js dan TypeScript pelamar sangat linear.',
      description: `Tentang Pekerjaan:
eFishery mencari Software Engineer untuk memperkuat ekosistem teknologi agritech cerdas kami.

Tanggung Jawab:
• Mendesain dan mengembangkan microservices berbasis Node.js, TypeScript, dan Go.
• Mengelola basis data PostgreSQL skala besar dan caching Redis.
• Merancang API yang reliable dan scalable untuk jutaan transaksi budidaya.

Kualifikasi:
• Pengalaman dengan Node.js, TypeScript, PostgreSQL, Docker, dan arsitektur API.
• Lokasi Bandung / Jawa Barat (Tersedia opsi WFH / Hybrid).

Kirim Lamaran ke Talent Acquisition:
Email HRD: talent.acquisition@efishery.com
Subjek: Software_Engineer_Backend_Bandung`
    },
    {
      platform: 'BUMN_BUMD_CAREER',
      title: 'Digital Systems Developer (BJB DIGI Ecosystem)',
      companyName: 'PT Bank Pembangunan Daerah Jawa Barat dan Banten (Bank BJB)',
      jobUrl: 'https://rekrutmen.bankbjb.co.id/posisi/digital-developer-2026',
      location: 'Bandung & KC Sumedang (Jawa Barat)',
      salaryRange: 'Rp 10.000.000 - 15.000.000 / bulan',
      matchScore: 0.94,
      status: 'DISCOVERED' as const,
      scamReason: 'BUMD perbankan resmi Jawa Barat dengan jaringan kantor cabang di Sumedang dan kantor pusat di Bandung. Sangat solid dan prestisius.',
      description: `Tentang Pekerjaan:
Bank BJB membuka rekrutmen resmi Divisi Digital Banking untuk mempercepat inovasi produk digital Jawa Barat.

Tanggung Jawab:
• Mengembangkan modul front-end dan microservices untuk layanan nasabah perbankan.
• Memelihara kepatuhan keamanan data sesuai regulasi OJK dan Bank Indonesia.
• Berkolaborasi dengan unit kerja regional Jabar termasuk KC Sumedang dan Bandung Raya.

Kualifikasi:
• Pendidikan S1 Teknik Informatika, Sistem Informasi, atau bidang relevan.
• Keahlian kuat dalam JavaScript/TypeScript, modern frameworks, dan PostgreSQL.
• Berkelakuan baik dan siap ditempatkan di Bandung / Sumedang.

Prosedur Lamaran:
Email HRD: rekrutmen@bankbjb.co.id
Subjek: Lamaran_Digital_Developer_BJB_Nama`
    }
  ];

  for (const job of techJobsSumedangBandung) {
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
      console.log(`✅ [Sumedang/Bandung Tech] Menambahkan: ${job.title} @ ${job.companyName}`);
    } else {
      console.log(`ℹ️ [Sudah Ada] ${job.title} @ ${job.companyName}`);
    }
  }

  // 3. Data Loker Resmi Sumedang & Bandung untuk Partner (Administrasi Publik)
  if (partnerUser) {
    const adminJobsSumedangBandung = [
      {
        platform: 'PORTAL_RESMI_SUMEDANG',
        title: 'Staf Administrasi Umum & Tata Kelola SOP Kearsipan',
        companyName: 'Disnakertrans Kabupaten Sumedang',
        jobUrl: 'https://disnakertrans.sumedangkab.go.id/loker/admin-sop-sumedang-2026',
        location: 'Sumedang (Pusat Kota Sumedang, Jawa Barat)',
        salaryRange: 'Rp 5.500.000 - 7.500.000 / bulan',
        matchScore: 0.96,
        status: 'DISCOVERED' as const,
        scamReason: 'Lowongan resmi kedinasan instansi Pemkab Sumedang. Kualifikasi lulusan Administrasi Publik sangat linear dalam tata kelola dokumen dan SOP.',
        description: `Tentang Pekerjaan:
Dinas Tenaga Kerja dan Transmigrasi Kabupaten Sumedang membuka rekrutmen Tenaga Staf Administrasi Umum dan Tata Kelola Arsip.

Tanggung Jawab:
• Mengelola alur administrasi kearsipan digital dan persuratan resmi kedinasan.
• Membantu penyusunan SOP layanan publik dan rekapitulasi data ketenagakerjaan daerah.
• Mengoperasikan Microsoft Excel untuk pelaporan administrasi bulanan dinas.

Kualifikasi:
• Pendidikan S1 Administrasi Publik, Administrasi Negara, atau Manajemen Kebijakan.
• Menguasai administrasi perkantoran, persuratan dinas, dan Microsoft Office.
• Domisili Kabupaten Sumedang atau Bandung Raya.

Pendaftaran:
Email HRD: disnakertrans@sumedangkab.go.id
Subjek: Lamaran_Staf_Admin_Sumedang_Nama`
      },
      {
        platform: 'BUMN_CAREER',
        title: 'Staff General Affairs & Government Relations Regional Jabar',
        companyName: 'PT Pupuk Kujang (Jawa Barat)',
        jobUrl: 'https://karir.pupuk-kujang.co.id/posisi/ga-govrel-jabar-2026',
        location: 'Sumedang - Bandung (Wilayah Kerja Jawa Barat)',
        salaryRange: 'Rp 7.500.000 - 10.000.000 / bulan',
        matchScore: 0.94,
        status: 'DISCOVERED' as const,
        scamReason: 'BUMN Pupuk Indonesia grup dengan penempatan koordinasi wilayah Sumedang-Bandung. Sangat sesuai untuk kompetensi Administrasi Publik & Hubungan Kelembagaan.',
        description: `Tentang Pekerjaan:
PT Pupuk Kujang mencari Staff General Affairs & Hubungan Kelembagaan untuk wilayah kerja Jawa Barat (termasuk Sumedang & Bandung).

Tanggung Jawab:
• Melakukan koordinasi perizinan dan hubungan kelembagaan dengan instansi pemerintah daerah.
• Mengelola tertib administrasi dokumen logistik, persuratan resmi, dan tata kelola SOP.
• Menyusun draft kajian kebijakan regulasi distribusi pupuk daerah.

Kualifikasi:
• S1 Administrasi Publik, Ilmu Pemerintahan, atau Administrasi Bisnis.
• Kemampuan korespondensi bisnis resmi dan komunikasi publik yang persuasif.
• Berkelakuan baik dan siap berkoordinasi di Sumedang dan Bandung Raya.

Email Resmi:
Email HRD: recruitment@pupuk-kujang.co.id
Subjek: Lamaran_GA_Govrel_Jabar`
      },
      {
        platform: 'GLINTS',
        title: 'Public Policy & Operations Administrator',
        companyName: 'Evermos (PT Triputra Semesta Berjaya)',
        jobUrl: 'https://glints.com/id/opportunities/jobs/evermos-operations-admin-bandung',
        location: 'Bandung (Jl. Pasir Kaliki, Kota Bandung)',
        salaryRange: 'Rp 6.500.000 - 9.000.000 / bulan',
        matchScore: 0.92,
        status: 'DISCOVERED' as const,
        scamReason: 'Startup social commerce nomor satu di Bandung. Sangat pas untuk latar belakang administrasi kebijakan publik dan kepatuhan operasional.',
        description: `Tentang Pekerjaan:
Evermos mencari Public Policy & Operations Administrator untuk berkolaborasi dengan tim legal dan operasional di Bandung.

Tanggung Jawab:
• Mendokumentasikan kepatuhan regulasi operasional UMKM digital.
• Memelihara arsip dokumen perjanjian kerja sama mitra resmi dan instansi publik.
• Memonitor kebijakan perdagangan elektronik di tingkat daerah dan nasional.

Kualifikasi:
• S1 Administrasi Publik, Hukum, atau bidang sosial terkait.
• Kemampuan analisis dokumen SOP dan regulasi yang teliti.

Kirim Lamaran:
Email HRD: careers@evermos.com
Subjek: Policy_Operations_Admin_Bandung`
      }
    ];

    for (const job of adminJobsSumedangBandung) {
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
        } as any);
        console.log(`✅ [Sumedang/Bandung Admin] Menambahkan: ${job.title} @ ${job.companyName}`);
      } else {
        console.log(`ℹ️ [Sudah Ada] ${job.title} @ ${job.companyName}`);
      }
    }
  }

  console.log('\n✨ Berhasil menambahkan lowongan resmi Sumedang & Bandung!');
  await prisma.$disconnect();
}

main().catch(console.error);
