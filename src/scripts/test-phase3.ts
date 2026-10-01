import prisma from '../lib/prisma';
import { parseRecruitmentEmail } from '../services/email/email-tracker';

async function testPhase3() {
  console.log('================================================================');
  console.log('🧪 PENGUJIAN FASE 3: APPLICATION LIFECYCLE & EMAIL INGESTION TRACKER');
  console.log('================================================================\n');

  // 1. Skenario Uji A: Undangan Interview
  const interviewEmail = {
    from: 'hr-talent@bibit.id',
    subject: 'Undangan User Interview - Backend Engineer (Pranata Pramudya)',
    body: `Halo Pranata,
Terima kasih atas lamaran Anda untuk posisi Backend Engineer di Bibit.id.
Setelah meninjau profil dan CV Anda, kami ingin mengundang Anda untuk mengikuti sesi User Interview teknis secara virtual pada hari Rabu pukul 14:00 WIB via Google Meet.
Mohon konfirmasi ketersediaan Anda dengan membalas email ini.
Salam,
Tim Rekrutmen PT Bibit Tumbuh Bersama`
  };

  console.log('📬 [Test A] Memindai Email Undangan Wawancara...');
  const resultA = await parseRecruitmentEmail(interviewEmail);
  console.log(`   - Status Terdeteksi : ${resultA.lifecycleStatus}`);
  console.log(`   - Perusahaan        : ${resultA.companyName || 'Bibit.id'}`);
  console.log(`   - Keyakinan (Conf.) : ${(resultA.confidence * 100).toFixed(0)}%`);
  console.log(`   - Alasan AI         : ${resultA.reasoning}\n`);

  if (resultA.lifecycleStatus !== 'INTERVIEW') {
    throw new Error(`Deteksi status salah! Diharapkan INTERVIEW, tapi didapat ${resultA.lifecycleStatus}`);
  }

  // 2. Skenario Uji B: Surat Penolakan Formal
  const rejectionEmail = {
    from: 'no-reply@careers.tokopedia.com',
    subject: 'Update Mengenai Lamaran Anda - Senior Software Engineer',
    body: `Dear Pranata Pramudya,
Terima kasih atas minat dan waktu yang Anda luangkan untuk melamar posisi Senior Software Engineer di Tokopedia.
Setelah mempertimbangkan kualifikasi seluruh kandidat secara mendalam, kami memutuskan untuk belum dapat melanjutkan proses Anda ke tahap berikutnya saat ini.
Kami akan tetap menyimpan resume Anda di database kami untuk peluang mendatang.
Sukses selalu dalam perjalanan karier Anda.`
  };

  console.log('📬 [Test B] Memindai Email Penolakan Formal...');
  const resultB = await parseRecruitmentEmail(rejectionEmail);
  console.log(`   - Status Terdeteksi : ${resultB.lifecycleStatus}`);
  console.log(`   - Perusahaan        : ${resultB.companyName || 'Tokopedia'}`);
  console.log(`   - Keyakinan (Conf.) : ${(resultB.confidence * 100).toFixed(0)}%`);
  console.log(`   - Alasan AI         : ${resultB.reasoning}\n`);

  if (resultB.lifecycleStatus !== 'REJECTED') {
    throw new Error(`Deteksi status salah! Diharapkan REJECTED, tapi didapat ${resultB.lifecycleStatus}`);
  }

  console.log('🎉 PENGUJIAN FASE 3 SELESAI & SUKSES TANPA ERROR!\n');
}

testPhase3()
  .catch((e) => {
    console.error('❌ Pengujian Fase 3 Gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
