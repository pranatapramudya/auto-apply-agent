import prisma from '../lib/prisma';

async function main() {
  console.log('🔄 Memperbarui domisili Pranata Pramudya ke Sumedang di database Neon...');

  const updated = await prisma.user.updateMany({
    where: {
      fullName: {
        contains: 'Pranata',
        mode: 'insensitive'
      }
    },
    data: {
      city: 'Sumedang (Bandung Raya / Remote)'
    }
  });

  console.log(`✅ Berhasil memperbarui ${updated.count} data profil user ke Sumedang!`);
}

main()
  .catch((e) => {
    console.error('❌ Gagal update:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
