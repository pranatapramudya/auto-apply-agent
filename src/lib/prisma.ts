import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

// Gunakan native WebSocket bawaan runtime Node.js (22+) jika tersedia
// untuk menghindari bug bundling Next.js "TypeError: bufferUtil.mask is not a function"
if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
} else {
  neonConfig.webSocketConstructor = ws;
}

import { config } from "../config/env";

const connectionString = config.db.url;

if (!connectionString) {
  throw new Error("DATABASE_URL tidak ditemukan! Pastikan .env sudah diload.");
}

const adapter = new PrismaNeon({ connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
