import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';

interface ProfileUpdatePayload {
  fullName?: string;
  email?: string;
  phone?: string;
  city?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  expectedSalary?: number;
  targetRoles?: string;
  coreSkills?: string;
}

function checkResumeFile(relativePath: string): { exists: boolean; sizeBytes: number; isReady: boolean } {
  const fullPath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(fullPath)) {
    return { exists: false, sizeBytes: 0, isReady: false };
  }
  const stats = fs.statSync(fullPath);
  const isReady = stats.size >= 10 * 1024; // Minimal 10KB untuk CV asli
  return { exists: true, sizeBytes: stats.size, isReady };
}

async function main() {
  console.log('================================================================');
  console.log('📝 PROFILE DATA UPDATE & CV VERIFICATION INTERFACE');
  console.log('================================================================\n');

  // Ambil user dari database
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' }
  });

  if (users.length === 0) {
    console.log('Tidak ada user yang terdaftar di database.');
    return;
  }

  // Cek argumen CLI (misal: npx tsx src/scripts/update-profile.ts --user=1 --salary=25000000 --phone="+628111111111")
  const userIndexArg = process.argv.find((a) => a.startsWith('--user='))?.split('=')[1] || '1';
  const targetUserIndex = parseInt(userIndexArg, 10) - 1;

  const selectedUser = users[targetUserIndex] || users[0];

  console.log(`👤 Profil Terpilih: [User ${targetUserIndex + 1}] ${selectedUser.fullName}`);
  console.log(`   - ID Database : ${selectedUser.id}`);
  console.log(`   - Email       : ${selectedUser.email}`);
  console.log(`   - No. HP/WA   : ${selectedUser.phone || 'Belum diisi'}`);
  console.log(`   - Kota        : ${selectedUser.city || 'Belum diisi'}`);
  console.log(`   - LinkedIn    : ${selectedUser.linkedInUrl || 'Belum diisi'}`);
  console.log(`   - GitHub      : ${selectedUser.githubUrl || 'Belum diisi'}`);
  console.log(`   - Portofolio  : ${selectedUser.portfolioUrl || 'Belum diisi'}`);
  console.log(`   - Gaji Ekspek : Rp ${(selectedUser.expectedSalary || 0).toLocaleString('id-ID')}`);
  console.log(`   - Target Roles: ${selectedUser.targetRoles}`);
  console.log(`   - Core Skills : ${selectedUser.coreSkills}`);
  console.log(`   - File Resume : ${selectedUser.resumeLocalPath}\n`);

  // Parse argumen pembaruan jika ada
  const updateData: ProfileUpdatePayload = {};

  const nameArg = process.argv.find((a) => a.startsWith('--name='))?.split('=')[1];
  if (nameArg) updateData.fullName = nameArg;

  const emailArg = process.argv.find((a) => a.startsWith('--email='))?.split('=')[1];
  if (emailArg) updateData.email = emailArg;

  const phoneArg = process.argv.find((a) => a.startsWith('--phone='))?.split('=')[1];
  if (phoneArg) updateData.phone = phoneArg;

  const cityArg = process.argv.find((a) => a.startsWith('--city='))?.split('=')[1];
  if (cityArg) updateData.city = cityArg;

  const linkedinArg = process.argv.find((a) => a.startsWith('--linkedin='))?.split('=')[1];
  if (linkedinArg) updateData.linkedInUrl = linkedinArg;

  const githubArg = process.argv.find((a) => a.startsWith('--github='))?.split('=')[1];
  if (githubArg) updateData.githubUrl = githubArg;

  const portfolioArg = process.argv.find((a) => a.startsWith('--portfolio='))?.split('=')[1];
  if (portfolioArg) updateData.portfolioUrl = portfolioArg;

  const salaryArg = process.argv.find((a) => a.startsWith('--salary='))?.split('=')[1];
  if (salaryArg) updateData.expectedSalary = parseInt(salaryArg, 10);

  const rolesArg = process.argv.find((a) => a.startsWith('--roles='))?.split('=')[1];
  if (rolesArg) updateData.targetRoles = rolesArg;

  const skillsArg = process.argv.find((a) => a.startsWith('--skills='))?.split('=')[1];
  if (skillsArg) updateData.coreSkills = skillsArg;

  // Lakukan pembaruan ke Neon DB jika ada field yang diberikan
  if (Object.keys(updateData).length > 0) {
    console.log('Memperbarui data di Neon PostgreSQL...');
    const updated = await prisma.user.update({
      where: { id: selectedUser.id },
      data: updateData
    });
    console.log(`✅ Data profil ${updated.fullName} berhasil diperbarui di Neon DB!\n`);
  } else {
    console.log('ℹ️ Tidak ada argumen perubahan data yang diberikan.');
    console.log('   Contoh cara update via CLI:');
    console.log('   npx tsx src/scripts/update-profile.ts --user=1 --phone="+628123456789" --salary=25000000 --city="Jakarta"\n');
  }

  // ----------------------------------------------------------------
  // AUDIT STATUS FILE RESUME (CV PDF)
  // ----------------------------------------------------------------
  console.log('================================================================');
  console.log('📄 STATUS BERKAS RESUME (CV PDF) LOKAL');
  console.log('================================================================');

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const resumeCheck = checkResumeFile(u.resumeLocalPath);

    console.log(`\n[User ${i + 1}] ${u.fullName}:`);
    console.log(`  * File Path : ${u.resumeLocalPath}`);
    console.log(`  * Ukuran    : ${(resumeCheck.sizeBytes / 1024).toFixed(2)} KB (${resumeCheck.sizeBytes} bytes)`);

    if (!resumeCheck.exists) {
      console.log(`  * Status    : ❌ FILE TIDAK DITEMUKAN!`);
    } else if (!resumeCheck.isReady) {
      console.log(`  * Status    : ⚠️ DUMMY / PLACEHOLDER (Ukuran < 10KB). Belum siap untuk live apply.`);
    } else {
      console.log(`  * Status    : ✅ SIAP (CV Asli terdeteksi > 10KB).`);
    }
  }

  console.log('\n----------------------------------------------------------------');
  console.log('💡 INSTRUKSI UNTUK USER:');
  console.log('----------------------------------------------------------------');
  console.log('Sebelum menjalankan bot secara LIVE (`--production-submit`):');
  console.log('1. Timpa file resume dummy dengan PDF CV asli:');
  console.log('   - User 1 (Pranata) : Salin CV PDF Anda ke "./assets/resume-primary.pdf"');
  console.log('   - User 2 (Partner) : Salin CV PDF Pasangan ke "./assets/resume-partner.pdf"');
  console.log('2. Pastikan file berukuran > 10KB (CV PDF biasa umumnya 50KB - 2MB).');
  console.log('3. Set `ALLOW_LIVE_APPLY=true` di file `.env` jika sudah siap submit otomatis.');
  console.log('================================================================\n');
}

main()
  .catch((err) => {
    console.error('Error pada update-profile:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
