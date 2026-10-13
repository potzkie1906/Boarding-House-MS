// One shared Prisma Client for the whole app.
// Import it anywhere on the server with:  import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  // Prisma 7 talks to PostgreSQL through a "driver adapter" built on the `pg` library.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// In development, Next.js re-runs our files every time we save. Without this trick,
// each save would create a brand-new PrismaClient with its own database connections,
// and PostgreSQL would eventually refuse with "too many connections".
// Keeping the client on `globalThis` lets every reload reuse the same one.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
