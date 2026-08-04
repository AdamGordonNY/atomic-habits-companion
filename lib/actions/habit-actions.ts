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
  goalId?: string | null;
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

function toTrackedHabitData(row: {
  id: string;
  name: string;
  category: string | null;
  goalId: string;
  createdAt: Date;
  updatedAt: Date;
  goal?: { identityId: string };
}): TrackedHabitData {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    goalEntryId: row.goalId,
    goalId: row.goalId,
    identityId: row.goal?.identityId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getOrCreateDefaultGoalId(userId: string): Promise<string> {
  const firstGoal = await prisma.goal.findFirst({
    where: { identity: { userId } },
    orderBy: { id: "asc" },
    select: { id: true },
  });
  if (firstGoal) return firstGoal.id;

  const identity = await prisma.identity.findFirst({
    where: { userId },
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  const identityId = identity
    ? identity.id
    : (
        await prisma.identity.create({
          data: { userId, name: "General", category: null },
          select: { id: true },
        })
      ).id;

  const goal = await prisma.goal.create({
    data: {
      identityId,
      text: identity?.name ? `Support ${identity.name}` : "General Goal",
      category: null,
      currentSystem: "",
      systemEval: "",
      systemRating: 0,
      idealSystem: "",
    },
    select: { id: true },
  });

  return goal.id;
}

export async function actionGetTrackedHabits(): Promise<TrackedHabitData[]> {
  const userId = await requireUserId();
  const rows = await prisma.habit.findMany({
    where: { userId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: { goal: { select: { identityId: true } } },
  });
  return rows.map(toTrackedHabitData);
}

export async function actionGetTrackedHabit(name: string): Promise<TrackedHabitData | null> {
  const userId = await requireUserId();
  const row = await prisma.habit.findFirst({
    where: { userId, name },
    orderBy: { createdAt: "asc" },
    include: { goal: { select: { identityId: true } } },
  });
  return row ? toTrackedHabitData(row) : null;
}

export async function actionGetTrackedHabitById(id: string): Promise<TrackedHabitData | null> {
  const userId = await requireUserId();
  const row = await prisma.habit.findFirst({
    where: { id, userId },
    include: { goal: { select: { identityId: true } } },
  });
  return row ? toTrackedHabitData(row) : null;
}

export async function actionGetAttachableGoalsForHabit(habitId: string): Promise<HabitAssignmentOption[]> {
  const userId = await requireUserId();

  const current = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    select: { goalId: true },
  });

  const rows = await prisma.goal.findMany({
    where: {
      identity: { userId },
      ...(current?.goalId ? { id: { not: current.goalId } } : {}),
    },
    orderBy: { text: "asc" },
    select: { id: true, text: true },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.text,
    category: null,
    goalEntryId: row.id,
  }));
}

export async function actionGetAttachableIdentitiesForHabit(habitId: string): Promise<IdentityAssignmentOption[]> {
  const userId = await requireUserId();

  const current = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    include: { goal: { select: { identityId: true } } },
  });

  const rows = await prisma.identity.findMany({
    where: {
      userId,
      ...(current?.goal.identityId ? { id: { not: current.goal.identityId } } : {}),
    },
    orderBy: { name: "asc" },
    include: {
      goals: {
        orderBy: { text: "asc" },
        select: { id: true, text: true },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    identity: row.name,
    supportingGoals: row.goals.map((goal) => ({ id: goal.id, goal: goal.text })),
  }));
}

export async function actionGetAttachableHabitsForIdentity(identityId: string): Promise<HabitAssignmentOption[]> {
  const userId = await requireUserId();

  const rows = await prisma.habit.findMany({
    where: {
      userId,
      goal: { identityId: { not: identityId } },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      goalId: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    goalEntryId: row.goalId,
  }));
}

export async function actionGetAttachableHabitsForGoal(goalId: string): Promise<HabitAssignmentOption[]> {
  const userId = await requireUserId();

  const rows = await prisma.habit.findMany({
    where: {
      userId,
      goalId: { not: goalId },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, goalId: true },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    goalEntryId: row.goalId,
  }));
}

export async function actionGetOrCreateHabitsForGoal(goalId: string): Promise<TrackedHabitData[]> {
  const userId = await requireUserId();

  const goal = await prisma.goal.findFirst({
    where: { id: goalId, identity: { userId } },
    select: { id: true },
  });

  if (!goal) return [];

  const rows = await prisma.habit.findMany({
    where: { userId, goalId: goal.id },
    orderBy: { name: "asc" },
    include: { goal: { select: { identityId: true } } },
  });

  return rows.map(toTrackedHabitData);
}

export async function actionAddHabitToGoal(
  goalId: string,
  name: string,
  category?: string | null,
): Promise<TrackedHabitData> {
  const userId = await requireUserId();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Habit name is required");

  const goal = await prisma.goal.findFirst({
    where: { id: goalId, identity: { userId } },
    select: { id: true, identityId: true },
  });
  if (!goal) throw new Error("Goal not found");

  const row = await prisma.habit.create({
    data: {
      userId,
      goalId: goal.id,
      name: trimmedName,
      category: category ?? null,
      mode: "building",
      cue: "",
      time: "",
      location: "",
    },
    include: { goal: { select: { identityId: true } } },
  });

  return toTrackedHabitData(row);
}

export async function actionAttachHabitToIdentity(
  habitId: string,
  identityId: string,
): Promise<TrackedHabitData> {
  const userId = await requireUserId();

  const identity = await prisma.identity.findFirst({
    where: { id: identityId, userId },
    select: { id: true, name: true },
  });
  if (!identity) throw new Error("Identity not found");

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    select: { id: true },
  });
  if (!habit) throw new Error("Habit not found");

  const goal =
    (await prisma.goal.findFirst({
      where: { identityId: identity.id },
      orderBy: { id: "asc" },
      select: { id: true },
    })) ??
    (await prisma.goal.create({
      data: {
        identityId: identity.id,
        text: `Support ${identity.name}`,
        category: null,
        currentSystem: "",
        systemEval: "",
        systemRating: 0,
        idealSystem: "",
      },
      select: { id: true },
    }));

  const row = await prisma.habit.update({
    where: { id: habitId },
    data: { goalId: goal.id, updatedAt: new Date() },
    include: { goal: { select: { identityId: true } } },
  });

  return toTrackedHabitData(row);
}

export async function actionAttachHabitToGoal(
  habitId: string,
  goalId: string,
): Promise<TrackedHabitData> {
  const userId = await requireUserId();

  const goal = await prisma.goal.findFirst({
    where: { id: goalId, identity: { userId } },
    select: { id: true },
  });
  if (!goal) throw new Error("Goal not found");

  const row = await prisma.habit.updateMany({
    where: { id: habitId, userId },
    data: { goalId: goal.id, updatedAt: new Date() },
  });

  if (row.count === 0) throw new Error("Habit not found");

  const refreshed = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    include: { goal: { select: { identityId: true } } },
  });
  if (!refreshed) throw new Error("Habit not found");

  return toTrackedHabitData(refreshed);
}

export async function actionUpdateGoalHabit(
  habitId: string,
  data: { name?: string; category?: string | null },
): Promise<TrackedHabitData> {
  const userId = await requireUserId();

  const current = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });
  if (!current) throw new Error("Habit not found");

  const nextName = data.name?.trim();
  if (nextName !== undefined && !nextName) throw new Error("Habit name is required");

  const row = await prisma.habit.update({
    where: { id: habitId },
    data: {
      ...(nextName !== undefined ? { name: nextName } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      updatedAt: new Date(),
    },
    include: { goal: { select: { identityId: true } } },
  });

  return toTrackedHabitData(row);
}

export async function actionGetHabitCues(habitId: string): Promise<HabitCueData[]> {
  const userId = await requireUserId();
  const row = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    select: {
      id: true,
      cue: true,
      time: true,
      location: true,
      mode: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!row) return [];
  if (!row.cue && !row.time && !row.location) return [];

  return [
    {
      id: row.id,
      habitId: row.id,
      behavior: row.cue,
      time: row.time,
      location: row.location,
      isBreaking: row.mode === "breaking",
      reflection: "",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  ];
}

export async function actionCreateHabitCue(data: {
  habitId: string;
  behavior: string;
  time: string;
  location: string;
  isBreaking: boolean;
}): Promise<HabitCueData> {
  const userId = await requireUserId();

  const row = await prisma.habit.findFirst({
    where: { id: data.habitId, userId },
    select: { id: true, createdAt: true },
  });
  if (!row) throw new Error("Habit not found");

  const updated = await prisma.habit.update({
    where: { id: data.habitId },
    data: {
      cue: data.behavior,
      time: data.time,
      location: data.location,
      mode: data.isBreaking ? "breaking" : "building",
      updatedAt: new Date(),
    },
    select: { id: true, cue: true, time: true, location: true, mode: true, createdAt: true, updatedAt: true },
  });

  return {
    id: updated.id,
    habitId: updated.id,
    behavior: updated.cue,
    time: updated.time,
    location: updated.location,
    isBreaking: updated.mode === "breaking",
    reflection: "",
    createdAt: row.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function actionUpdateHabitCueReflection(cueId: string, reflection: string): Promise<void> {
  void cueId;
  void reflection;
  // Reflections for cues are not stored in the new schema.
}

export async function actionUpsertTrackedHabit(
  name: string,
  category?: string | null,
): Promise<TrackedHabitData> {
  const userId = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Habit name is required");

  const existing = await prisma.habit.findFirst({
    where: { userId, name: trimmed },
    orderBy: { createdAt: "asc" },
    include: { goal: { select: { identityId: true } } },
  });

  if (existing) {
    const updated = await prisma.habit.update({
      where: { id: existing.id },
      data: {
        ...(category !== undefined ? { category } : {}),
        updatedAt: new Date(),
      },
      include: { goal: { select: { identityId: true } } },
    });
    return toTrackedHabitData(updated);
  }

  const goalId = await getOrCreateDefaultGoalId(userId);
  const created = await prisma.habit.create({
    data: {
      userId,
      goalId,
      name: trimmed,
      category: category ?? null,
      mode: "building",
      cue: "",
      time: "",
      location: "",
    },
    include: { goal: { select: { identityId: true } } },
  });

  return toTrackedHabitData(created);
}

export async function actionUpdateHabitCategory(
  id: string,
  category: string | null,
): Promise<void> {
  const userId = await requireUserId();
  await prisma.habit.updateMany({
    where: { id, userId },
    data: { category },
  });
}

export async function actionDeleteTrackedHabit(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.habit.deleteMany({ where: { id, userId } });
}

export async function actionToggleHabitCheckIn(
  habitId: string,
  date: string,
  completed: boolean,
): Promise<void> {
  const userId = await requireUserId();
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    select: { id: true },
  });
  if (!habit) throw new Error("Not found");

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
  yearMonth: string,
): Promise<{ date: string; completed: boolean; note: string }[]> {
  const userId = await requireUserId();
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    select: { id: true },
  });
  if (!habit) throw new Error("Not found");

  const rows = await prisma.habitCheckIn.findMany({
    where: { habitId, date: { startsWith: yearMonth } },
    orderBy: { date: "asc" },
  });

  return rows.map((r) => ({ date: r.date, completed: r.completed, note: r.note }));
}
