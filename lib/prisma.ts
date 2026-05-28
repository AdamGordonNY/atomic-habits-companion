/**
 * Prisma client singleton — Prisma 7 + @prisma/adapter-pg (vercel-edge runtime)
 *
 * Prisma 7 with the `vercel-edge` runtime does not use @prisma/client directly.
 * The client is generated at app/generated/prisma and requires an adapter.
 *
 * Usage:
 *   import { prisma } from "@/lib/prisma";
 *   const notes = await prisma.note.findMany({ where: { userId } });
 */

import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  // Use the session-mode / direct URL for the pg adapter.
  // @prisma/adapter-pg manages its own connection pool; passing the
  // PgBouncer transaction-mode URL (DATABASE_URL with ?pgbouncer=true)
  // causes P1001 "Can't reach database server" because the two poolers
  // interfere.  DIRECT_URL (port 5432, no pgbouncer param) is correct here.
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Neither DIRECT_URL nor DATABASE_URL is set. " +
        "Add them to your .env file.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  } as ConstructorParameters<typeof PrismaClient>[0]);
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

