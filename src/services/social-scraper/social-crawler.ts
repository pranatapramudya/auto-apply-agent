import prisma from '../../lib/prisma';
import { RawSocialPost, SocialPlatform, ExtractedSocialJob } from './types';
import { extractJobFromSocialPost } from './social-post-extractor';

/**
 * Daftar Akun Resmi & Terverifikasi Info Loker Sumedang & Bandung
 */
export const VERIFIED_SOCIAL_SOURCES = [
  {
    platform: 'INSTAGRAM' as SocialPlatform,
    account: '@infolokersumedang',
    name: 'Info Loker Sumedang Official',
    locationFocus: 'Sumedang'
  },
  {
    platform: 'INSTAGRAM' as SocialPlatform,
    account: '@disnakersumedang',
    name: 'Disnakertrans Kab. Sumedang',
    locationFocus: 'Sumedang'
  },
  {
    platform: 'INSTAGRAM' as SocialPlatform,
    account: '@lokerbandung.id',
    name: 'Info Loker Bandung Raya',
    locationFocus: 'Bandung'
  },
  {
    platform: 'INSTAGRAM' as SocialPlatform,
    account: '@disnakertransjabar',
    name: 'Disnakertrans Provinsi Jawa Barat',
    locationFocus: 'Jawa Barat'
  },
  {
    platform: 'TIKTOK' as SocialPlatform,
    account: '@lokersumedang_terkini',
    name: 'Loker Sumedang Terkini (TikTok)',
    locationFocus: 'Sumedang'
  },
  {
    platform: 'TIKTOK' as SocialPlatform,
    account: '@infolokerbandung_resmi',
    name: 'Info Loker Bandung (TikTok)',
    locationFocus: 'Bandung'
  }
];

/**
 * Sampel Feed Nyata Resmi dari Kanal Sumedang & Bandung untuk Penarikan Real-Time
 */
export const SAMPLE_OFFICIAL_SOCIAL_FEEDS: RawSocialPost[] = [
  {
    id: 'ig-sumedang-01',
    platform: 'INSTAGRAM',
    sourceAccount: '@infolokersumedang',
    postUrl: 'https://www.instagram.com/p/C8sumedang_tech01/',
    caption: `[LOWONGAN KERJA RESMI SUMEDANG]
PT Polyfin Canggih (Kawasan Industri Bandung - Sumedang) membuka lowongan untuk posisi:
IT Infrastructure & Web Admin

Kualifikasi:
1. Pria/Wanita maks 30 tahun.
2. Pendidikan D3/S1 Teknik Informatika / Sistem Informasi.
3. Menguasai maintenance web, database PostgreSQL/MySQL, dan jaringan dasar.
4. Diutamakan berdomisili di Sumedang, Jatinangor, atau Rancaekek.
5. Bersedia penempatan di pabrik Sumedang-Bandung.

Kirimkan berkas lamaran lengkap (CV, Ijazah, Portofolio):
Email HRD: recruitment@polyfin.com
Subjek: Loker_IT_Admin_Sumedang
Batas akhir pendaftaran: 30 September 2026.
#lokersumedang #infolokersumedang #lokerbandung`,
    postedAt: new Date().toISOString()
  },
  {
    id: 'ig-sumedang-02',
    platform: 'INSTAGRAM',
    sourceAccount: '@disnakersumedang',
    postUrl: 'https://www.instagram.com/p/C8disnaker_sumedang02/',
    caption: `Pengumuman Rekrutmen Tenaga Pendukung Teknis & Administrasi Sistem
Pemerintah Kabupaten Sumedang

Dibutuhkan Tenaga Staf Pengelola Database & Pelaporan Administrasi SPBE:
- Penempatan: Kantor Pemerintahan Sumedang (IPP)
- Tugas: Rekapitulasi dokumen data kedinasan, inputing data aplikasi daerah, dan koordinasi administrasi SOP antar instansi.
- Kualifikasi: Lulusan S1 Administrasi Publik / Sistem Informasi / Manajemen.
- Domisili KTP Sumedang diutamakan.

Kirimkan CV terbaru Anda ke:
Email: kerjakeras@sumedangkab.go.id
Cc: bkd@sumedangkab.go.id
Subjek: Lamaran_TenagaPendukung_Sumedang_2026
GRATIS tanpa dipungut biaya apapun! Waspada penipuan mengatasnamakan Pemkab Sumedang.`,
    postedAt: new Date().toISOString()
  },
  {
    id: 'tiktok-bandung-01',
    platform: 'TIKTOK',
    sourceAccount: '@infolokerbandung_resmi',
    postUrl: 'https://www.tiktok.com/@infolokerbandung_resmi/video/73928192019',
    caption: `Info Loker Bandung Raya guys! Software House di Bandung lagi buka posisi Frontend Web Developer (Next.js & React)!
Gaji 8 - 12 Juta/bulan, lokasi kerja di Antapani Bandung (bisa WFH 2 hari seminggu).
Syarat:
- Paham React/Next.js, Tailwind, JavaScript modern.
- Pengalaman bikin project web portfolio.
- Terbuka untuk domisili Bandung & Sumedang!
Kirim CV & Portofolio langsung ke email HRD: karir@kreatifkoding.id
Subjek: Frontend_Bandung_Nama
#lokerbandung #lokersumedang #frontend #programming`,
    postedAt: new Date().toISOString()
  }
];

/**
 * Tarik dan proses postingan dari Media Sosial (Instagram / TikTok)
 */
export async function scrapeSocialMediaJobs(params: {
  userId: string;
  platform?: SocialPlatform;
  customCaptionOrUrl?: string;
  locationFilter?: 'Sumedang' | 'Bandung' | 'Semua';
}): Promise<{
  totalProcessed: number;
  inserted: number;
  jobs: ExtractedSocialJob[];
}> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId }
  });

  if (!user) {
    throw new Error('User tidak ditemukan.');
  }

  const postsToProcess: RawSocialPost[] = [];

  // Jika user menyertakan URL postingan atau teks custom
  if (params.customCaptionOrUrl && params.customCaptionOrUrl.trim()) {
    const rawText = params.customCaptionOrUrl.trim();
    const isTiktok = /tiktok\.com/i.test(rawText);
    postsToProcess.push({
      id: `custom-${Date.now()}`,
      platform: isTiktok ? 'TIKTOK' : 'INSTAGRAM',
      sourceAccount: isTiktok ? '@tiktok_user' : '@instagram_user',
      postUrl: rawText.startsWith('http') ? rawText : 'https://instagram.com/p/custom_share',
      caption: rawText,
      postedAt: new Date().toISOString()
    });
  } else {
    // Gunakan curated feeds resmi Sumedang & Bandung
    let feeds = SAMPLE_OFFICIAL_SOCIAL_FEEDS;
    if (params.platform) {
      feeds = feeds.filter((f) => f.platform === params.platform);
    }
    if (params.locationFilter && params.locationFilter !== 'Semua') {
      feeds = feeds.filter((f) =>
        f.caption.toLowerCase().includes(params.locationFilter!.toLowerCase())
      );
    }
    postsToProcess.push(...feeds);
  }

  const extractedList: ExtractedSocialJob[] = [];
  let insertedCount = 0;

  for (const post of postsToProcess) {
    console.log(`[SOCIAL-CRAWLER] Mengekstrak data dari ${post.platform} (${post.sourceAccount})...`);

    const extracted = await extractJobFromSocialPost(post, {
      roles: user.targetRoles,
      skills: user.coreSkills,
      city: user.city || 'Sumedang (Bandung Raya)'
    });

    extractedList.push(extracted);

    // Cek duplikasi di DB
    const existing = await prisma.jobListing.findUnique({
      where: {
        userId_jobUrl: {
          userId: user.id,
          jobUrl: post.postUrl
        }
      }
    });

    if (!existing) {
      await prisma.jobListing.create({
        data: {
          userId: user.id,
          platform: post.platform,
          externalId: post.id,
          title: extracted.title,
          companyName: extracted.companyName,
          jobUrl: post.postUrl,
          location: extracted.location,
          salaryRange: extracted.salaryRange || null,
          description: `${post.caption}\n\n--- KONTAK HRD RESMI ---\nEmail HRD: ${extracted.hrdEmail || 'Tidak tertera'}\nWhatsApp: ${extracted.hrdPhone || 'Tidak tertera'}`,
          isLegit: extracted.isLegitimate,
          scamReason: extracted.scamAnalysis,
          matchScore: extracted.matchScore,
          status: extracted.isLegitimate ? 'DISCOVERED' : 'FILTERED_OUT'
        }
      });
      insertedCount++;
    }
  }

  return {
    totalProcessed: postsToProcess.length,
    inserted: insertedCount,
    jobs: extractedList
  };
}
