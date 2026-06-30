import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const prismaClientSingleton = () => {
  let connectionString = process.env.DATABASE_URL;

  // CRITICAL FIX PRD 1.8: Jangan biarkan connectionString undefined
  if (!connectionString) {
    console.error("❌ CRITICAL ERROR: DATABASE_URL tidak ditemukan di environment variables!");
    
    // Fallback hardcode sementara untuk debugging jika proses .env gagal dimuat oleh Next.js
    // Hapus baris fallback ini jika sudah masuk environment production!
    const fallbackUrl = "postgresql://neondb_owner:npg_J8Yv4WmQlFMw@ep-dry-firefly-aomtt1m7-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    
    console.warn("⚠️ Menggunakan HARDCODE Fallback DATABASE_URL sementara!");
    connectionString = fallbackUrl;
    
    // Jika tidak ada fallback, sistem WAJIB mati agar kita sadar ada yang salah:
    // throw new Error("DATABASE_URL is strictly required. Please restart your Next.js dev server.");
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool as any)
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
