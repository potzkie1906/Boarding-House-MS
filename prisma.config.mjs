// Configuration for the Prisma command-line tool (prisma generate, prisma migrate, ...).
// Prisma 7 does not read .env files on its own, so we load them with dotenv first.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // The command `npx prisma db seed` (or `npm run db:seed`) runs.
    seed: "node prisma/seed.mjs",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
