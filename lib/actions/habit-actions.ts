"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export interface TrackedHabitData {
  id: string;
  name: string;
  category: string | null;
  createdAt: string;
}

// ─── reads ────────────────────────────────────────────────────────────────────

export async function actionGetTrackedHabits(): Promise<TrackedHabitData[]> {
  const userId = await requireUserId();
  const rows = await prisma.trackedHabit.findMany({
    where: { userId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function actionGetTrackedHabit(name: string): Promise<TrackedHabitData | null> {
  const userId = await requireUserId();
  const row = await prisma.trackedHabit.findUnique({
    where: { userId_name: { userId, name } },
  });
  return row
    ? { id: row.id, name: row.name, category: row.category, createdAt: row.createdAt.toISOString() }
    : null;
}

export async function actionGetTrackedHabitById(id: string): Promise<TrackedHabitData | null> {
  const userId = await requireUserId();
  const row = await prisma.trackedHabit.findUnique({
    where: { id, userId },
  });
  return row
    ? { id: row.id, name: row.name, category: row.category, createdAt: row.createdAt.toISOString() }
    : null;
}

// ─── writes ───────────────────────────────────────────────────────────────────

/** Ensures the habit exists; updates category only if provided. */
export async function actionUpsertTrackedHabit(
  name: string,
  category?: string | null,
): Promise<TrackedHabitData> {
  const userId = await requireUserId();
  const row = await prisma.trackedHabit.upsert({
    where: { userId_name: { userId, name } },
    create: { userId, name, category: category ?? null },
    update: { ...(category !== undefined ? { category } : {}), updatedAt: new Date() },
  });
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function actionUpdateHabitCategory(
  id: string,
  category: string | null,
): Promise<void> {
  const userId = await requireUserId();
  await prisma.trackedHabit.update({
    where: { id, userId },
    data: { category },
  });
}

export async function actionDeleteTrackedHabit(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.trackedHabit.delete({ where: { id, userId } });
}
