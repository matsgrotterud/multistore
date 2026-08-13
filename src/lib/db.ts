import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadEnvConfig } from "@next/env";

if (typeof window === "undefined") {
  // Match Next.js development env resolution when Prisma is imported outside
  // the Next runtime (scripts, tests, early server imports).
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
}

// Reuse a single Prisma client across hot reloads in development to avoid
// exhausting database connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
