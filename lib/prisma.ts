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
import { Pool } from "pg";

const DEFAULT_POOL_MAX = process.env.NODE_ENV === "production" ? 5 : 2;

function parsePoolMax(): number {
  const raw = process.env.PG_POOL_MAX;
  if (!raw) return DEFAULT_POOL_MAX;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_POOL_MAX;
  return Math.floor(parsed);
}

function createPgPool() {
  // Use the session-mode / direct URL for the pg adapter.
  // @prisma/adapter-pg manages its own connection pool; passing the
  // PgBouncer transaction-mode URL (DATABASE_URL with ?pgbouncer=true)
  // causes P1001 "Can't reach database server" because the two poolers
  // interfere.  DIRECT_URL (port 5432, no pgbouncer param) is correct here.
  const raw = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      "Neither DIRECT_URL nor DATABASE_URL is set. " +
        "Add them to your .env file.",
    );
  }

  // Strip Prisma-only query params (?pgbouncer=true, ?connection_limit=…)
  // before handing the URL to the pg driver — pg ignores them but they can
  // confuse connection-string parsers and cause host resolution failures.
  let connectionString = raw;
  try {
    const url = new URL(raw);
    url.searchParams.delete("pgbouncer");
    url.searchParams.delete("connection_limit");
    url.searchParams.delete("pool_timeout");
    connectionString = url.toString();
  } catch {
    throw new Error(
      `DIRECT_URL / DATABASE_URL is not a valid URL. ` +
        `Check your environment variables. Received: "${raw.slice(0, 30)}…"`,
    );
  }

  // Use a bounded shared pool to avoid exhausting DB connection slots when
  // many server actions run concurrently in dev/prod.
  return new Pool({
    connectionString,
    max: parsePoolMax(),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

function createPrismaClient(pool: Pool) {
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  } as ConstructorParameters<typeof PrismaClient>[0]);
}

const globalForPrisma = globalThis as unknown as {
  pgPool: Pool | undefined;
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

const pool = globalForPrisma.pgPool ?? createPgPool();
export const prisma = globalForPrisma.prisma ?? createPrismaClient(pool);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pgPool = pool;
  globalForPrisma.prisma = prisma;
}

