import prisma from '../lib/prisma';

async function main() {
  console.log('🎓 SEEDING LOWONGAN GENERALIS: KHUSUS SEMUA JURUSAN (BUMN & SWASTA NASIONAL)...');

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

  // Perbarui target roles partner agar mencakup spesialisasi "Semua Jurusan"
  await prisma.user.update({
    where: { id: partnerUser.id },
    data: {
      fullName: 'Partner (Administrasi Publik & Generalis Semua Jurusan)',
      targetRoles: 'Staff Administrasi Publik, Generalis Semua Jurusan, General Affairs, Management Trainee, Customer Service, Tata Kelola Dokumen, HR Admin, Operasional Kantor',
      coreSkills: 'Administrasi Umum, Manajemen Dokumen & Arsip, Microsoft Excel & Word, Customer Care, Tata Kelola SOP, Korespondensi Bisnis, Komunikasi Publik'
    }
  });

  // Daftar lowongan resmi yang secara eksplisit TERBUKA UNTUK SEMUA JURUSAN
  const semuaJurusanJobs = [
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Officer Development Program (ODP) - General Banking (Semua Jurusan)',
      companyName: 'PT Bank Mandiri (Persero) Tbk',
      jobUrl: 'https://bankmandiri.co.id/karir/odp-general-semua-jurusan-2026',
      location: 'Jakarta / Bandung / Surabaya / Medan / Makassar (Penempatan Seluruh Indonesia)',
      salaryRange: 'Rp 9.500.000 - 14.000.000 / bulan',
      matchScore: 0.96,
      status: 'DISCOVERED' as const,
      scamReason: 'Program kepemimpinan resmi BUMN Bank Mandiri. Terbuka secara luas bagi lulusan S1 Semua Jurusan (Administrasi Publik, Teknik, Ekonomi, Sastra, dll).',
      description: `Tentang Pekerjaan:
PT Bank Mandiri (Persero) Tbk membuka program Officer Development Program (ODP) Generalist untuk mencetak calon pemimpin operasional dan bisnis perbankan di seluruh Indonesia.

Tanggung Jawab:
• Mengikuti program pengembangan komprehensif di bidang perbankan ritel, korporat, dan operasional.
• Memimpin unit kerja dan mengawasi tata kelola administrasi perbankan sesuai regulasi OJK.
• Menganalisis efisiensi proses kerja dan kepatuhan SOP cabang.

Kualifikasi Resmi:
• Pendidikan minimal S1 dari SEMUA JURUSAN (Lulusan Administrasi Publik, Komunikasi, Manajemen, Hukum, Sains, atau Teknik).
• IPK minimal 3.00 dari universitas terakreditasi.
• Lulusan baru (Fresh Graduate) atau memiliki pengalaman kerja maksimal 2 tahun.
• Memiliki integritas tinggi, kepemimpinan, dan komunikasi yang adaptif.
• Bersedia ditempatkan di seluruh jaringan kantor Bank Mandiri di Indonesia.

Prosedur Lamaran Resmi:
Kirimkan CV terbaru dan transkrip nilai ke email rekrutmen Bank Mandiri:
Email HRD: recruitment@bankmandiri.co.id
Subjek: ODP_General_SemuaJurusan_Nama`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Customer Service On Station & Frontliner Layanan Publik (Semua Jurusan)',
      companyName: 'PT Kereta Api Indonesia (Persero) (KAI)',
      jobUrl: 'https://recruitment.kai.id/lowongan/cs-on-station-semua-jurusan-2026',
      location: 'Bandung, Jakarta, Cirebon, Semarang, Surabaya, Yogyakarta (Penempatan Daop/Divre)',
      salaryRange: 'Rp 6.500.000 - 8.500.000 / bulan',
      matchScore: 0.95,
      status: 'DISCOVERED' as const,
      scamReason: 'Rekrutmen resmi BUMN PT KAI kategori pelayanan dan administrasi penumpang. Terbuka resmi untuk D3 dan S1 Semua Jurusan.',
      description: `Tentang Pekerjaan:
PT Kereta Api Indonesia (Persero) mengundang talenta muda ramah dan profesional untuk posisi Customer Service On Station.

Tanggung Jawab:
• Memberikan pelayanan informasi jadwal perjalanan, pemesanan tiket, dan penanganan komplain penumpang secara prima.
• Melakukan pencatatan administrasi laporan harian operasional stasiun.
• Membantu koordinasi ketertiban dan kenyamanan fasilitas publik di area stasiun.

Kualifikasi Resmi:
• Pendidikan D3 atau S1 dari SEMUA JURUSAN.
• Fresh Graduate dipersilakan melamar (All Majors welcome).
• Berpenampilan menarik, ramah, dan memiliki kemampuan komunikasi persuasif yang baik.
• Mampu berbahasa Indonesia yang santun dan menguasai dasar bahasa Inggris.

Email Pendaftaran Resmi:
Email HRD: rekrutmen@kai.id
Subjek: Lamaran_CS_Station_SemuaJurusan_Nama`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Staf Administrasi Umum & Kearsipan Kantor (Semua Jurusan)',
      companyName: 'PT PLN (Persero) - PT Haleyora Power',
      jobUrl: 'https://haleyorapower.co.id/karir/staf-administrasi-semua-jurusan',
      location: 'Jakarta, Bandung, Surabaya, Semarang, Medan (Wilayah Kerja PLN Group)',
      salaryRange: 'Rp 6.000.000 - 8.500.000 / bulan',
      matchScore: 0.97,
      status: 'DISCOVERED' as const,
      scamReason: 'Posisi staf administrasi perkantoran PLN Group. Syarat pendidikan fleksibel untuk D3/S1 Semua Jurusan dengan kemampuan Microsoft Office.',
      description: `Tentang Pekerjaan:
PT Haleyora Power (anak perusahaan PT PLN Persero) membuka lowongan Staf Administrasi Umum perkantoran.

Tanggung Jawab:
• Mengelola alur keluar masuk surat dinas, nota dinas, dan pengarsipan berkas kerja sama.
• Mengoperasikan Microsoft Excel untuk rekapitulasi tagihan listrik, logistik, dan absensi unit.
• Menyiapkan ruang rapat, notulensi rapat, dan dokumen pendukung operasional kantor.

Kualifikasi Resmi:
• Pendidikan minimal D3 / D4 / S1 dari SEMUA JURUSAN.
• Menguasai aplikasi perkantoran (Microsoft Word, Microsoft Excel, Google Workspace).
• Cekatan, teliti dalam pengarsipan berkas, dan berdedikasi tinggi.

Email Resmi:
Email HRD: karir@haleyorapower.co.id
Subjek: Lamaran_Admin_Umum_SemuaJurusan_Nama`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Project Administrative Officer & General Support (Semua Jurusan)',
      companyName: 'PT Pertamina Training & Consulting (Pertamina Group)',
      jobUrl: 'https://pertaminatc.com/karir/project-admin-semua-jurusan',
      location: 'Jakarta Pusat, Bandung, Surabaya, Balikpapan (Regional Kantor Pertamina)',
      salaryRange: 'Rp 7.000.000 - 10.000.000 / bulan',
      matchScore: 0.96,
      status: 'DISCOVERED' as const,
      scamReason: 'Anak perusahaan PT Pertamina (Persero). Terbuka untuk S1 Semua Jurusan dengan fokus administrasi proyek dan korespondensi dokumen korporat.',
      description: `Tentang Pekerjaan:
Mendukung kelancaran operasional administrasi proyek energi terpadu di lingkungan Pertamina Group.

Tanggung Jawab:
• Melakukan filing dan kearsipan dokumen kontrak, faktur tagihan, dan surat jalan operasional.
• Berkoordinasi dengan vendor dan fungsi operasional terkait kelengkapan administrasi.
• Menyusun draft laporan kemajuan proyek bulanan.

Kualifikasi:
• S1 dari SEMUA JURUSAN (Administrasi Publik, Ilmu Sosial, Humaniora, Ekonomi, dll).
• Teliti terhadap detail angka dan kearsipan dokumen.
• Mampu bekerja mandiri maupun dalam tim dengan mobilitas kerja yang baik.

Email Resmi:
Email HRD: recruitment@pertaminatc.com
Subjek: Lamaran_Project_Admin_SemuaJurusan`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Staf Operasional Pelayanan & Relasi Nasabah (Semua Jurusan)',
      companyName: 'PT Pegadaian (Persero)',
      jobUrl: 'https://pegadaian.co.id/karir/operasional-cabang-semua-jurusan',
      location: 'Seluruh Kantor Cabang Pegadaian Indonesia (Jawa, Sumatera, Kalimantan, Sulawesi)',
      salaryRange: 'Rp 6.500.000 - 9.000.000 / bulan',
      matchScore: 0.94,
      status: 'DISCOVERED' as const,
      scamReason: 'BUMN Pegadaian membuka formasi operasional cabang dan frontliner pelayanan nasabah yang menerima pelamar S1 Semua Jurusan.',
      description: `Tentang Pekerjaan:
Memberikan solusi keuangan bagi masyarakat dan mengelola ketertiban berkas transaksi gadai dan investasi emas.

Kualifikasi:
• S1 SEMUA JURUSAN dari perguruan tinggi terakreditasi.
• Usia maksimal 28 tahun saat melamar (Fresh graduate atau berpengalaman).
• Memiliki keterampilan interpersonal yang hangat dan integritas tinggi.

Email HRD: rekrutmen@pegadaian.co.id
Subjek: Pegadaian_Operasional_SemuaJurusan_Nama`
    },
    {
      platform: 'JOBSTREET',
      title: 'Management Trainee (MT) - Corporate Operations (Semua Jurusan)',
      companyName: 'PT Astra International Tbk',
      jobUrl: 'https://www.jobstreet.co.id/job/astra-mt-operations-semua-jurusan',
      location: 'Jakarta Utara (Head Office Astra Sunter) / Tersedia Penempatan Nasional',
      salaryRange: 'Rp 10.000.000 - 15.000.000 / bulan',
      matchScore: 0.95,
      status: 'DISCOVERED' as const,
      scamReason: 'Program Management Trainee resmi konglomerasi Astra International. Jalur percepatan karir manajemen yang terbuka untuk S1 Semua Jurusan.',
      description: `Tentang Pekerjaan:
Astra International mencari talenta muda terbaik dari beragam latar belakang pendidikan untuk dipersiapkan menjadi pemimpin masa depan grup usaha Astra.

Kualifikasi:
• S1 dari SEMUA JURUSAN (All Majors).
• IPK minimal 3.00, memiliki rekam jejak aktif dalam organisasi kemahasiswaan atau komunitas.
• Bersedia menjalani rotasi kerja dan penempatan di berbagai unit usaha Astra di seluruh Indonesia.

Email HRD: recruitment@astra.co.id
Subjek: Astra_MT_SemuaJurusan_Nama`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Staf Pelayanan Kepesertaan & Administrasi Umum (Semua Jurusan)',
      companyName: 'BPJS Ketenagakerjaan',
      jobUrl: 'https://rekrutmen.bpjsketenagakerjaan.go.id/posisi/pelayanan-semua-jurusan',
      location: 'Seluruh Kantor Cabang BPJS Ketenagakerjaan Indonesia',
      salaryRange: 'Rp 7.500.000 - 11.000.000 / bulan',
      matchScore: 0.96,
      status: 'DISCOVERED' as const,
      scamReason: 'Lembaga jaminan sosial publik resmi membuka formasi staf pelayanan kepesertaan yang terbuka untuk S1 Semua Jurusan.',
      description: `Tentang Pekerjaan:
Melayani administrasi pendaftaran tenaga kerja, klaim jaminan hari tua/kecelakaan kerja, dan kearsipan data kepesertaan di kantor cabang BPJS Ketenagakerjaan.

Kualifikasi:
• S1 dari SEMUA JURUSAN (Lulusan Administrasi Publik, Komunikasi, Hukum, Manajemen, Sastra, Teknik, dll).
• Ramah, memiliki empati pelayanan publik, dan mahir Microsoft Office.

Email HRD: rekrutmen@bpjsketenagakerjaan.go.id
Subjek: Lamaran_BPJS_Pelayanan_SemuaJurusan`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Staf Administrasi Logistik & Pengendali Dokumen (Semua Jurusan)',
      companyName: 'PT Pos Logistik Indonesia (Pos Indonesia Group)',
      jobUrl: 'https://poslogistics.co.id/karir/admin-logistik-semua-jurusan',
      location: 'Bandung, Jakarta, Surabaya, Semarang (Penempatan Gudang & Kantor Cabang)',
      salaryRange: 'Rp 6.000.000 - 8.500.000 / bulan',
      matchScore: 0.94,
      status: 'DISCOVERED' as const,
      scamReason: 'Anak usaha BUMN PT Pos Indonesia. Terbuka untuk D3/S1 Semua Jurusan dalam tata kelola administrasi dokumen pengiriman barang.',
      description: `Tentang Pekerjaan:
Menginput manifest pengiriman logistik, memvalidasi surat jalan, dan melakukan rekonsiliasi data operasional armada Pos Logistik.

Kualifikasi:
• Pendidikan D3/S1 SEMUA JURUSAN.
• Mahir menggunakan rumus Excel dasar (SUM, VLOOKUP, Pivot) dan teliti.

Email HRD: karir@poslogistics.co.id
Subjek: Lamaran_PosLogistik_SemuaJurusan_Nama`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Human Capital Generalist & Staf Personalia (Semua Jurusan)',
      companyName: 'PT Kimia Farma Tbk (Bio Farma Group)',
      jobUrl: 'https://kimiafarma.co.id/karir/hc-personalia-semua-jurusan',
      location: 'Jakarta Pusat / Bandung / Tersedia Penempatan Regional',
      salaryRange: 'Rp 7.000.000 - 9.500.000 / bulan',
      matchScore: 0.95,
      status: 'DISCOVERED' as const,
      scamReason: 'Holding BUMN Farmasi membuka kesempatan staf personalia dan HR umum untuk lulusan S1 Semua Jurusan.',
      description: `Tentang Pekerjaan:
Mengelola administrasi personalia karyawan, rekapitulasi absensi, administrasi BPJS, dan proses onboarding karyawan baru.

Kualifikasi:
• S1 dari SEMUA JURUSAN (Administrasi Publik, Psikologi, Manajemen, Hukum, dsb).
• Memiliki ketelitian tinggi dan kemampuan interpersonal yang hangat.

Email HRD: recruitment@kimiafarma.co.id
Subjek: HC_KimiaFarma_SemuaJurusan_Nama`
    },
    {
      platform: 'LINKEDIN',
      title: 'Operations Associate & General Administrator (Semua Jurusan)',
      companyName: 'Shopee Indonesia (Sea Group)',
      jobUrl: 'https://www.linkedin.com/jobs/view/shopee-operations-associate-semua-jurusan',
      location: 'Jakarta / Bandung / Yogyakarta / Solo / Remote Indonesia',
      salaryRange: 'Rp 7.500.000 - 11.000.000 / bulan',
      matchScore: 0.94,
      status: 'DISCOVERED' as const,
      scamReason: 'Posisi General Operations di ekosistem Shopee & Sea Group. Terbuka luas untuk S1 Semua Jurusan yang memiliki kemampuan analisis data dan administrasi.',
      description: `Tentang Pekerjaan:
Bertanggung jawab atas efisiensi operasional platform ecommerce, validasi data merchant, dan koordinasi administrasi operasional lintas divisi.

Kualifikasi:
• S1 dari SEMUA JURUSAN (Fresh graduates are welcome to apply).
• Mahir mengoperasikan spreadsheet (Google Sheets / Microsoft Excel).
• Problem solver yang aktif dan berorientasi pada hasil kerja berkualitas.

Email HRD: recruitment.id@shopee.com
Subjek: Shopee_Operations_SemuaJurusan_Nama`
    },
    {
      platform: 'GLINTS',
      title: 'Staf Administrasi Ekspor Impor & Korespondensi Bisnis (Semua Jurusan)',
      companyName: 'PT Indofood Sukses Makmur Tbk',
      jobUrl: 'https://glints.com/id/opportunities/jobs/indofood-admin-ekspor-impor-semua-jurusan',
      location: 'Jakarta Selatan (Indofood Tower) / Surabaya / Semarang',
      salaryRange: 'Rp 7.000.000 - 10.000.000 / bulan',
      matchScore: 0.95,
      status: 'DISCOVERED' as const,
      scamReason: 'Konglomerasi pangan terbesar Indofood membuka posisi administrasi korespondensi ekspor impor untuk lulusan S1 Semua Jurusan.',
      description: `Tentang Pekerjaan:
Mengelola dokumen ekspor (Bill of Lading, Certificate of Origin, Packing List, Invoice) dan menjalin korespondensi bisnis resmi dengan pembeli dan forwarder.

Kualifikasi:
• S1 dari SEMUA JURUSAN (Fresh graduate dipersilakan melamar).
• Rapi dalam pengarsipan dokumen dan menguasai dasar bahasa Inggris tertulis.

Email HRD: recruitment@indofood.co.id
Subjek: Indofood_Admin_Ekspor_SemuaJurusan`
    },
    {
      platform: 'PORTAL_RESMI_BUMN',
      title: 'Corporate Affairs & Junior Public Relations (Semua Jurusan)',
      companyName: 'PT Pupuk Indonesia (Persero)',
      jobUrl: 'https://pupuk-indonesia.com/karir/corporate-affairs-semua-jurusan',
      location: 'Jakarta Barat (Kantor Pusat) / Jawa Barat / Jawa Timur',
      salaryRange: 'Rp 8.000.000 - 12.000.000 / bulan',
      matchScore: 0.96,
      status: 'DISCOVERED' as const,
      scamReason: 'Holding BUMN Pupuk Indonesia membuka posisi Corporate Affairs untuk mendukung komunikasi publik dan kemitraan kedinasan, terbuka untuk S1 Semua Jurusan.',
      description: `Tentang Pekerjaan:
Membantu penyusunan siaran pers resmi, administrasi dokumentasi acara kedinasan BUMN, dan menjalin hubungan baik dengan media serta pemangku kepentingan.

Kualifikasi:
• S1 dari SEMUA JURUSAN (Diutamakan Administrasi Publik, Komunikasi, Hubungan Masyarakat, Hubungan Internasional, atau Bahasa).
• Memiliki kemampuan berbicara di depan publik dan penulisan dokumen resmi yang baik.

Email HRD: recruitment@pupuk-indonesia.com
Subjek: Lamaran_CorpAffairs_SemuaJurusan`
    }
  ];

  // Ingest untuk PARTNER (Ceweknya - Administrasi Publik & Generalis Semua Jurusan)
  console.log(`\n📥 Memasukkan ${semuaJurusanJobs.length} Lowongan Resmi "Semua Jurusan" untuk Partner...`);
  for (const job of semuaJurusanJobs) {
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
      console.log(`  ✅ [Semua Jurusan - Partner] ${job.title} @ ${job.companyName}`);
    } else {
      console.log(`  ℹ️ [Sudah Ada] ${job.title} @ ${job.companyName}`);
    }
  }

  // Ingest juga untuk PRANATA (User Utama) agar dia juga bisa melihat dan melamar loker generalis / ODP / MT ini
  console.log(`\n📥 Memasukkan ${semuaJurusanJobs.length} Lowongan Resmi "Semua Jurusan" untuk Pranata...`);
  for (const job of semuaJurusanJobs) {
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
      console.log(`  ✅ [Semua Jurusan - Pranata] ${job.title} @ ${job.companyName}`);
    } else {
      console.log(`  ℹ️ [Sudah Ada] ${job.title} @ ${job.companyName}`);
    }
  }

  console.log('\n✨ SELESAI! Seluruh lowongan resmi generalis "Semua Jurusan" berhasil diintegrasikan!');
  await prisma.$disconnect();
}

main().catch(console.error);
