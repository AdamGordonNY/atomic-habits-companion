import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserData {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

// ─── Create ──────────────────────────────────────────────────────────────────

/**
 * Creates a new DB user row from Clerk data.
 * Uses upsert so webhook retries and race conditions are idempotent.
 */
export async function createUser(data: UserData): Promise<void> {
  await prisma.user.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      email: data.email,
      name: data.name,
      image: data.image,
      emailVerified: null,
    },
    update: {}, // already exists — nothing to overwrite
  });
}

// ─── Update ──────────────────────────────────────────────────────────────────

/**
 * Updates an existing DB user row with the latest Clerk data.
 * Uses upsert so that an update event arriving before the create event
 * (rare but possible with webhooks) still produces a valid row.
 */
export async function updateUser(data: UserData): Promise<void> {
  await prisma.user.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      email: data.email,
      name: data.name,
      image: data.image,
      emailVerified: null,
    },
    update: {
      email: data.email,
      name: data.name,
      image: data.image,
    },
  });
}

// ─── Delete ──────────────────────────────────────────────────────────────────

/**
 * Removes a user from the DB.
 * Uses deleteMany so that a missing row (user never synced) is a no-op
 * rather than a thrown error. Cascade deletes on the schema remove all
 * child records automatically.
 */
export async function deleteUser(id: string): Promise<void> {
  await prisma.user.deleteMany({ where: { id } });
}
