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
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
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

