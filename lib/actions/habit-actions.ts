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
  goalEntryId?: string | null;
  createdAt: string;
}

export interface HabitCueData {
  id: string;
  habitId: string;
  behavior: string;
  time: string;
  location: string;
  isBreaking: boolean;
  reflection: string;
  createdAt: string;
  updatedAt: string;
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
    goalEntryId: r.goalEntryId,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function actionGetTrackedHabit(name: string): Promise<TrackedHabitData | null> {
  const userId = await requireUserId();
  const row = await prisma.trackedHabit.findUnique({
    where: { userId_name: { userId, name } },
  });
  return row
    ? { id: row.id, name: row.name, category: row.category, goalEntryId: row.goalEntryId, createdAt: row.createdAt.toISOString() }
    : null;
}

export async function actionGetTrackedHabitById(id: string): Promise<TrackedHabitData | null> {
  const userId = await requireUserId();
  const row = await prisma.trackedHabit.findUnique({
    where: { id, userId },
  });
  return row
    ? { id: row.id, name: row.name, category: row.category, goalEntryId: row.goalEntryId, createdAt: row.createdAt.toISOString() }
    : null;
}

export async function actionGetOrCreateHabitsForGoal(goalId: string): Promise<TrackedHabitData[]> {
  const userId = await requireUserId();

  const goal = await prisma.nextStepGoalEntry.findFirst({
    where: { id: goalId, nextStep: { userId } },
    select: { id: true, componentHabits: true },
  });

  if (!goal) return [];

  const names = [...new Set(goal.componentHabits.map((h) => h.trim()).filter(Boolean))];
  if (names.length > 0) {
    await prisma.trackedHabit.createMany({
      data: names.map((name) => ({ userId, name, goalEntryId: goal.id })),
      skipDuplicates: true,
    });
  }

  if (names.length > 0) {
    await prisma.trackedHabit.updateMany({
      where: { userId, name: { in: names } },
      data: { goalEntryId: goal.id },
    });
  }

  const rows = await prisma.trackedHabit.findMany({
    where: { userId, goalEntryId: goal.id },
    orderBy: { name: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    goalEntryId: r.goalEntryId,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function actionAddHabitToGoal(
  goalId: string,
  name: string,
  category?: string | null,
): Promise<TrackedHabitData> {
  const userId = await requireUserId();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Habit name is required");

  const goal = await prisma.nextStepGoalEntry.findFirst({
    where: { id: goalId, nextStep: { userId } },
    select: { id: true },
  });
  if (!goal) throw new Error("Goal not found");

  const existing = await prisma.trackedHabit.findUnique({
    where: { userId_name: { userId, name: trimmedName } },
  });

  const row = existing
    ? await prisma.trackedHabit.update({
      where: { id: existing.id, userId },
      data: {
        goalEntryId: goal.id,
        ...(category !== undefined ? { category } : {}),
        updatedAt: new Date(),
      },
    })
    : await prisma.trackedHabit.create({
      data: {
        userId,
        name: trimmedName,
        goalEntryId: goal.id,
        category: category ?? null,
      },
    });

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    goalEntryId: row.goalEntryId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function actionUpdateGoalHabit(
  habitId: string,
  data: { name?: string; category?: string | null },
): Promise<TrackedHabitData> {
  const userId = await requireUserId();

  const current = await prisma.trackedHabit.findUnique({
    where: { id: habitId, userId },
  });
  if (!current) throw new Error("Habit not found");

  const nextName = data.name?.trim();
  if (nextName !== undefined && !nextName) throw new Error("Habit name is required");

  if (nextName && nextName !== current.name) {
    const dupe = await prisma.trackedHabit.findUnique({
      where: { userId_name: { userId, name: nextName } },
      select: { id: true },
    });
    if (dupe && dupe.id !== habitId) {
      throw new Error("A habit with this name already exists.");
    }
  }

  const row = await prisma.trackedHabit.update({
    where: { id: habitId, userId },
    data: {
      ...(nextName !== undefined ? { name: nextName } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      updatedAt: new Date(),
    },
  });

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    goalEntryId: row.goalEntryId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function actionGetHabitCues(habitId: string): Promise<HabitCueData[]> {
  const userId = await requireUserId();
  const rows = await prisma.habitCue.findMany({
    where: { habitId, habit: { userId } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    habitId: r.habitId,
    behavior: r.behavior,
    time: r.time,
    location: r.location,
    isBreaking: r.isBreaking,
    reflection: r.reflection,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function actionCreateHabitCue(data: {
  habitId: string;
  behavior: string;
  time: string;
  location: string;
  isBreaking: boolean;
}): Promise<HabitCueData> {
  const userId = await requireUserId();

  const habit = await prisma.trackedHabit.findFirst({
    where: { id: data.habitId, userId },
    select: { id: true },
  });
  if (!habit) throw new Error("Habit not found");

  const row = await prisma.habitCue.create({
    data: {
      habitId: data.habitId,
      behavior: data.behavior,
      time: data.time,
      location: data.location,
      isBreaking: data.isBreaking,
    },
  });

  return {
    id: row.id,
    habitId: row.habitId,
    behavior: row.behavior,
    time: row.time,
    location: row.location,
    isBreaking: row.isBreaking,
    reflection: row.reflection,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function actionUpdateHabitCueReflection(cueId: string, reflection: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.habitCue.updateMany({
    where: { id: cueId, habit: { userId } },
    data: { reflection },
  });
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
    goalEntryId: row.goalEntryId,
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
