"use server";

import { revalidatePath } from "next/cache";
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
  identityId?: string | null;
  createdAt: string;
  updatedAt: string;
  checkIns?: { date: string; completed: boolean; note: string }[];
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

export interface HabitAssignmentOption {
  id: string;
  name: string;
  category: string | null;
  goalEntryId: string | null;
}

export interface IdentityAssignmentOption {
  id: string;
  identity: string;
  supportingGoals: Array<{ id: string; goal: string }>;
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
    identityId: r.identityId,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function actionGetTrackedHabit(name: string): Promise<TrackedHabitData | null> {
  const userId = await requireUserId();
  const row = await prisma.trackedHabit.findUnique({
    where: { userId_name: { userId, name } },
  });
  return row
    ? { id: row.id, name: row.name, category: row.category, goalEntryId: row.goalEntryId, identityId: row.identityId, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }
    : null;
}

export async function actionGetTrackedHabitById(id: string): Promise<TrackedHabitData | null> {
  const userId = await requireUserId();
  const row = await prisma.trackedHabit.findUnique({
    where: { id, userId },
  });
  return row
    ? { id: row.id, name: row.name, category: row.category, goalEntryId: row.goalEntryId, identityId: row.identityId, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }
    : null;
}

export async function actionGetAttachableGoalsForHabit(habitId: string): Promise<HabitAssignmentOption[]> {
  const userId = await requireUserId();

  const current = await prisma.trackedHabit.findFirst({
    where: { id: habitId, userId },
    select: { goalEntryId: true },
  });

  const rows = await prisma.nextStepGoalEntry.findMany({
    where: {
      nextStep: { userId },
      ...(current?.goalEntryId ? { id: { not: current.goalEntryId } } : {}),
    },
    orderBy: { goal: "asc" },
    select: { id: true, goal: true, identityId: true },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.goal,
    category: null,
    goalEntryId: row.identityId,
  }));
}

export async function actionGetAttachableIdentitiesForHabit(habitId: string): Promise<IdentityAssignmentOption[]> {
  const userId = await requireUserId();

  const current = await prisma.trackedHabit.findFirst({
    where: { id: habitId, userId },
    select: { identityId: true },
  });

  const rows = await prisma.identityRecord.findMany({
    where: {
      assessment: { userId },
      ...(current?.identityId ? { id: { not: current.identityId } } : {}),
    },
    orderBy: { identity: "asc" },
    select: {
      id: true,
      identity: true,
      goals: {
        orderBy: { goal: "asc" },
        select: {
          id: true,
          goal: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    identity: row.identity,
    supportingGoals: row.goals.map((goal) => ({ id: goal.id, goal: goal.goal })),
  }));
}

export async function actionGetAttachableHabitsForIdentity(identityId: string): Promise<HabitAssignmentOption[]> {
  const userId = await requireUserId();

  const rows = await prisma.trackedHabit.findMany({
    where: {
      userId,
      OR: [
        { identityId: null },
        { identityId: { not: identityId } },
      ],
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      goalEntryId: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    goalEntryId: row.goalEntryId,
  }));
}

export async function actionGetAttachableHabitsForGoal(goalId: string): Promise<HabitAssignmentOption[]> {
  const userId = await requireUserId();

  const rows = await prisma.trackedHabit.findMany({
    where: {
      userId,
      OR: [{ goalEntryId: null }, { goalEntryId: { not: goalId } }],
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    goalEntryId: row.goalEntryId,
  }));
}

export async function actionGetOrCreateHabitsForGoal(goalId: string): Promise<TrackedHabitData[]> {
  const userId = await requireUserId();

  const goal = await prisma.nextStepGoalEntry.findFirst({
    where: { id: goalId, nextStep: { userId } },
    select: { id: true, componentHabits: true, identityId: true },
  });

  if (!goal) return [];

  const names = [...new Set(goal.componentHabits.map((h) => h.trim()).filter(Boolean))];
  if (names.length > 0) {
    await prisma.trackedHabit.createMany({
      data: names.map((name) => ({ userId, name, goalEntryId: goal.id, identityId: goal.identityId })),
      skipDuplicates: true,
    });
  }

  if (names.length > 0) {
    await prisma.trackedHabit.updateMany({
      where: { userId, name: { in: names } },
      data: { goalEntryId: goal.id, identityId: goal.identityId },
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
    identityId: r.identityId,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
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
    select: { id: true, identityId: true },
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
        identityId: goal.identityId,
        ...(category !== undefined ? { category } : {}),
        updatedAt: new Date(),
      },
    })
    : await prisma.trackedHabit.create({
      data: {
        userId,
        name: trimmedName,
        goalEntryId: goal.id,
        identityId: goal.identityId,
        category: category ?? null,
      },
    });

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    goalEntryId: row.goalEntryId,
    identityId: row.identityId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function actionAttachHabitToIdentity(
  habitId: string,
  identityId: string,
): Promise<TrackedHabitData> {
  const userId = await requireUserId();

  const identity = await prisma.identityRecord.findFirst({
    where: { id: identityId, assessment: { userId } },
    select: { id: true },
  });
  if (!identity) throw new Error("Identity not found");

  const row = await prisma.trackedHabit.update({
    where: { id: habitId, userId },
    data: { identityId: identity.id, updatedAt: new Date() },
  });

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    goalEntryId: row.goalEntryId,
    identityId: row.identityId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function actionAttachHabitToGoal(
  habitId: string,
  goalId: string,
): Promise<TrackedHabitData> {
  const userId = await requireUserId();

  const goal = await prisma.nextStepGoalEntry.findFirst({
    where: { id: goalId, nextStep: { userId } },
    select: { id: true },
  });
  if (!goal) throw new Error("Goal not found");

  const row = await prisma.trackedHabit.update({
    where: { id: habitId, userId },
    data: { goalEntryId: goal.id, updatedAt: new Date() },
  });

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    goalEntryId: row.goalEntryId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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
    identityId: row.identityId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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
    updatedAt: row.updatedAt.toISOString(),
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

// ─── Check-ins ────────────────────────────────────────────────────────────────

export async function actionToggleHabitCheckIn(
  habitId: string,
  date: string, // YYYY-MM-DD
  completed: boolean,
): Promise<void> {
  const userId = await requireUserId();
  const habit = await prisma.trackedHabit.findUnique({
    where: { id: habitId },
    select: { userId: true },
  });
  if (!habit || habit.userId !== userId) throw new Error("Not found");

  await prisma.habitCheckIn.upsert({
    where: { habitId_date: { habitId, date } },
    create: { habitId, date, completed },
    update: { completed },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/habits/${habitId}`);
}

export async function actionGetHabitCheckIns(
  habitId: string,
  yearMonth: string, // YYYY-MM
): Promise<{ date: string; completed: boolean; note: string }[]> {
  const userId = await requireUserId();
  const habit = await prisma.trackedHabit.findUnique({
    where: { id: habitId },
    select: { userId: true },
  });
  if (!habit || habit.userId !== userId) throw new Error("Not found");

  const rows = await prisma.habitCheckIn.findMany({
    where: { habitId, date: { startsWith: yearMonth } },
    orderBy: { date: "asc" },
  });

  return rows.map((r) => ({ date: r.date, completed: r.completed, note: r.note }));
}
