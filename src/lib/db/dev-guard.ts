import { Prisma } from "@prisma/client";
import { getSanitizedDatabaseTarget } from "@/lib/db/env-sanitize";

const DEV_DB_COMMANDS = [
  "npm run db:doctor",
  "npm run dev:local",
  "npm run db:push:local",
  "npm run db:seed:local",
] as const;

export function isMissingTableError(error: unknown, tableName: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021" &&
    error.message.includes(tableName)
  );
}

export function formatDevMissingTableError(tableName: string): Error {
  const target = getSanitizedDatabaseTarget();
  const lines = [
    `[dev db] Table "${tableName}" is missing on ${target.host}${target.pathname}.`,
    "The app is connected to a database without your schema/data.",
    "",
    "Sanitized target:",
    `  ${target.redacted}`,
    target.isPooler ? "  (pooled host — expected for DATABASE_URL on serverless)" : "",
    "",
    "Recommended:",
    ...DEV_DB_COMMANDS.map((command) => `  ${command}`),
    "",
    "Also check .env.local for duplicate DATABASE_URL lines — the last value wins.",
  ].filter(Boolean);

  return new Error(lines.join("\n"));
}

export function rethrowDevMissingTableError(error: unknown, tableName: string): never {
  if (process.env.NODE_ENV === "development" && isMissingTableError(error, tableName)) {
    throw formatDevMissingTableError(tableName);
  }
  throw error;
}
