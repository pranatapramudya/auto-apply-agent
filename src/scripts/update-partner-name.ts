import prisma from '../lib/prisma';
import fs from 'fs';
import path from 'path';
import { generateTailoredResumeData } from '../services/resume/resume-tailor';
import { renderResumeToPdf } from '../services/resume/pdf-generator';

async function main() {
  console.log('================================================================');
  console.log('🌸 MEMPERBARUI NAMA PARTNER MENJADI: "Siti Fathonah"');
  console.log('================================================================\n');

  // 1. Cari user partner yang ada di DB
  const partnerUser = await prisma.user.findFirst({
    where: {
      OR: [
        { fullName: { contains: 'Partner', mode: 'insensitive' } },
        { fullName: { contains: 'Siti', mode: 'insensitive' } },
        { email: { contains: 'partner', mode: 'insensitive' } },
        { targetRoles: { contains: 'Administrasi', mode: 'insensitive' } }
      ]
    }
  });

  if (!partnerUser) {
    throw new Error('User partner tidak ditemukan di database!');
  }

  console.log(`Ditemukan user ID: ${partnerUser.id}`);
  console.log(`Nama sebelumnya : ${partnerUser.fullName}`);

  // 2. Perbarui ke nama asli Siti Fathonah
  const updatedUser = await prisma.user.update({
    where: { id: partnerUser.id },
    data: {
      fullName: 'Siti Fathonah',
      city: 'Sumedang / Bandung, Indonesia',
      resumeLocalPath: './assets/resume-partner.pdf'
    }
  });

  console.log(`✅ Nama berhasil diperbarui di database: "${updatedUser.fullName}"\n`);

  // 3. Render ulang berkas PDF resume resmi atas nama "Siti Fathonah"
  console.log('📄 Merender ulang berkas PDF CV ATS atas nama "Siti Fathonah"...');
  const tailoredResume = await generateTailoredResumeData({
    candidateName: updatedUser.fullName,
    candidateEmail: updatedUser.email,
    candidatePhone: updatedUser.phone,
    candidateCity: updatedUser.city,
    targetRoles: updatedUser.targetRoles,
    coreSkills: updatedUser.coreSkills,
    portfolioUrl: updatedUser.portfolioUrl,
    linkedInUrl: updatedUser.linkedInUrl,
    githubUrl: updatedUser.githubUrl,
    jobTitle: 'Staff Administrasi Publik & Tata Kelola Dokumen',
    companyName: 'PT Telkom Indonesia (Persero) Tbk',
    jobDescription: 'Dibutuhkan Staff Administrasi Publik yang menguasai tata naskah dinas kedinasan, SOP perkantoran, manajemen kearsipan digital, dan Microsoft Excel.'
  });

  const pdfResult = await renderResumeToPdf(tailoredResume, 'siti-fathonah-official');
  const srcPath = path.resolve(process.cwd(), pdfResult.pdfAbsolutePath);
  const destPath = path.resolve(process.cwd(), 'assets', 'resume-partner.pdf');

  fs.copyFileSync(srcPath, destPath);
  const stats = fs.statSync(destPath);

  console.log(`✅ Berkas "./assets/resume-partner.pdf" berhasil diperbarui:`);
  console.log(`   - Nama di CV     : ${tailoredResume.fullName}`);
  console.log(`   - Target Posisi  : ${tailoredResume.targetRole}`);
  console.log(`   - Ukuran Berkas  : ${(stats.size / 1024).toFixed(2)} KB\n`);

  console.log('🎉 SUKSES: Profil pasangan resmi menjadi "Siti Fathonah" di seluruh sistem!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
