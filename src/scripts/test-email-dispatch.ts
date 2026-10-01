import prisma from '../lib/prisma';
import { generateCoverLetter } from '../services/email/cover-letter-generator';
import { dispatchApplicationEmail } from '../services/email/email-dispatcher';

async function main() {
  console.log('🧪 Memulai uji coba Modul Auto-Email Dispatcher...');

  // 1. Ambil User Pranata Pramudya
  const user = await prisma.user.findFirst({
    where: { fullName: { contains: 'Pranata' } }
  });

  if (!user) {
    throw new Error('User Pranata tidak ditemukan di DB');
  }

  console.log(`👤 User Ditemukan: ${user.fullName} (${user.city})`);

  // 2. Mock Lowongan Wilayah Sumedang / Bandung
  const mockJob = {
    title: 'Senior Web Developer (Next.js & TypeScript)',
    companyName: 'PT Teknologi Digital Bandung Raya',
    description: `Dibutuhkan segera Fullstack Web Developer untuk penempatan Bandung / Remote Jawa Barat.
Kualifikasi:
- Menguasai Next.js, React, TypeScript, Node.js, dan Prisma PostgreSQL.
- Berdomisili di Bandung, Sumedang, atau sekitarnya (WFO/Hybrid fleksibel).
- Mampu bekerja mandiri maupun dalam tim.
Kirimkan CV dan portofolio Anda ke email: hrd@teknologidigital.co.id dengan subjek: Posisi - Nama.`
  };

  // 3. Uji AI Cover Letter Generator
  console.log('\n📝 Menghasilkan Cover Letter via AI Groq...');
  const coverLetter = await generateCoverLetter({
    candidateName: user.fullName,
    candidateEmail: user.email,
    candidatePhone: user.phone,
    candidateCity: user.city,
    candidateRoles: user.targetRoles,
    candidateSkills: user.coreSkills,
    portfolioUrl: user.portfolioUrl,
    linkedInUrl: user.linkedInUrl,
    jobTitle: mockJob.title,
    companyName: mockJob.companyName,
    jobDescription: mockJob.description
  });

  console.log('✅ Subjek Email:', coverLetter.subject);
  console.log('✅ Cuplikan Isi Cover Letter:\n', coverLetter.body.slice(0, 300) + '...\n');

  // 4. Uji Dispatcher (Mode Simulasi / Dry-Run)
  console.log('🚀 Menjalankan Pengiriman Email (Mode Dry-Run)...');
  const result = await dispatchApplicationEmail({
    toEmail: 'hrd@teknologidigital.co.id',
    candidateName: user.fullName,
    candidateEmail: user.email,
    subject: coverLetter.subject,
    bodyText: coverLetter.body,
    bodyHtml: '',
    resumePdfPath: user.resumeLocalPath,
    isDryRun: true,
    companyName: mockJob.companyName,
    jobTitle: mockJob.title
  });

  console.log('✅ Hasil Dispatch:', result);
  console.log('\n🎉 Uji coba Modul Auto-Email Dispatcher berhasil 100%!');
}

main()
  .catch((e) => {
    console.error('❌ Uji coba gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
