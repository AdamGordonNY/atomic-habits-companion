"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// ─── types ────────────────────────────────────────────────────────────────────

export interface NextStepGoalData {
  id?: string;
  identityId?: string | null;
  goal: string;
  category?: string | null;
  currentSystem: string;
  systemEval: string;
  systemRating: number;
  idealSystem: string;
  componentHabits: string[];
}

export interface NextStepData {
  id: string;
  updatedAt: string;
  completedAt: string | null;
  goalEntries: NextStepGoalData[];
}

export interface GoalEntryData extends NextStepGoalData {
  id: string;
}

export interface GoalAssignmentOption {
  id: string;
  goal: string;
  identityId: string | null;
  supportingHabits: string[];
}

// ─── read ─────────────────────────────────────────────────────────────────────

export async function fetchNextStep(): Promise<NextStepData | null> {
  const userId = await requireUserId();

  const partFour = await prisma.assessmentPartFour.findUnique({
    where: { userId },
    select: { id: true, updatedAt: true, completedAt: true },
  });
  if (!partFour) return null;

  const goalEntries = await prisma.nextStepGoalEntry.findMany({
    where: { nextStepId: partFour.id },
    orderBy: [{ goal: "asc" }, { id: "asc" }],
  });

  return {
    id: partFour.id,
    updatedAt: partFour.updatedAt.toISOString(),
    completedAt: partFour.completedAt?.toISOString() ?? null,
    goalEntries: goalEntries.map((e) => ({
      id: e.id,
      identityId: e.identityId,
      goal: e.goal,
      category: e.category,
      currentSystem: e.currentSystem,
      systemEval: e.systemEval,
      systemRating: e.systemRating,
      idealSystem: e.idealSystem,
      componentHabits: e.componentHabits,
    })),
  };
}

export async function fetchGoalEntryById(goalId: string): Promise<GoalEntryData | null> {
  const userId = await requireUserId();

  const partFour = await prisma.assessmentPartFour.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!partFour) return null;

  const row = await prisma.nextStepGoalEntry.findFirst({
    where: {
      id: goalId,
      nextStepId: partFour.id,
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    identityId: row.identityId,
    goal: row.goal,
    category: row.category,
    currentSystem: row.currentSystem,
    systemEval: row.systemEval,
    systemRating: row.systemRating,
    idealSystem: row.idealSystem,
    componentHabits: row.componentHabits,
  };
}

// ─── write ────────────────────────────────────────────────────────────────────

export async function upsertNextStep(
  payload: NextStepGoalData[],
  completedAt?: string | null,
): Promise<void> {
  const userId = await requireUserId();

  const partFour = await prisma.assessmentPartFour.upsert({
    where: { userId },
    create: {
      userId,
      ...(completedAt !== undefined
        ? { completedAt: completedAt ? new Date(completedAt) : null }
        : {}),
    },
    update: {
      updatedAt: new Date(),
      ...(completedAt !== undefined
        ? { completedAt: completedAt ? new Date(completedAt) : null }
        : {}),
    },
    select: { id: true },
  });

  const identities = await prisma.identity.findMany({
    where: { userId },
    orderBy: { id: "asc" },
    select: { id: true },
  });

  let fallbackIdentityId = identities[0]?.id ?? null;
  if (!fallbackIdentityId && payload.some((entry) => !entry.identityId)) {
    const created = await prisma.identity.create({
      data: { userId, name: "General", category: null },
      select: { id: true },
    });
    fallbackIdentityId = created.id;
  }

  const existing = await prisma.nextStepGoalEntry.findMany({
    where: { nextStepId: partFour.id },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((entry) => entry.id));
  const retainedIds = new Set(payload.map((entry) => entry.id).filter((id): id is string => Boolean(id)));
  const deleteIds = [...existingIds].filter((id) => !retainedIds.has(id));

  await prisma.$transaction(async (tx) => {
    if (deleteIds.length > 0) {
      await tx.nextStepGoalEntry.deleteMany({ where: { id: { in: deleteIds } } });
    }

    for (const entry of payload) {
      const normalizedIdentityId = entry.identityId ?? fallbackIdentityId;

      if (entry.id && existingIds.has(entry.id)) {
        await tx.nextStepGoalEntry.update({
          where: { id: entry.id },
          data: {
            identityId: normalizedIdentityId,
            goal: entry.goal,
            category: entry.category ?? undefined,
            currentSystem: entry.currentSystem,
            systemEval: entry.systemEval,
            systemRating: entry.systemRating,
            idealSystem: entry.idealSystem,
            componentHabits: entry.componentHabits,
          },
        });
        continue;
      }

      await tx.nextStepGoalEntry.create({
        data: {
          nextStepId: partFour.id,
          identityId: normalizedIdentityId,
          goal: entry.goal,
          category: entry.category ?? undefined,
          currentSystem: entry.currentSystem,
          systemEval: entry.systemEval,
          systemRating: entry.systemRating,
          idealSystem: entry.idealSystem,
          componentHabits: entry.componentHabits,
        },
      });
    }
  });
}

export async function actionGetAssignableGoalsForIdentity(identityId: string): Promise<GoalAssignmentOption[]> {
  const userId = await requireUserId();

  const rows = await prisma.goal.findMany({
    where: {
      identity: { userId },
      identityId: { not: identityId },
    },
    orderBy: { text: "asc" },
    select: {
      id: true,
      text: true,
      identityId: true,
      habits: {
        orderBy: { name: "asc" },
        select: { name: true },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    goal: row.text,
    identityId: row.identityId,
    supportingHabits: row.habits.map((habit) => habit.name),
  }));
}

export async function actionGetAttachableIdentitiesForGoal(goalId: string): Promise<Array<{ id: string; identity: string }>> {
  const userId = await requireUserId();

  const current = await prisma.goal.findFirst({
    where: { id: goalId, identity: { userId } },
    select: { identityId: true },
  });

  const rows = await prisma.identity.findMany({
    where: {
      userId,
      ...(current?.identityId ? { id: { not: current.identityId } } : {}),
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return rows.map((row) => ({ id: row.id, identity: row.name }));
}

export async function actionAttachGoalToIdentity(goalId: string, identityId: string): Promise<void> {
  const userId = await requireUserId();

  const goal = await prisma.goal.findFirst({
    where: {
      id: goalId,
      identity: { userId },
    },
    select: { id: true },
  });
  if (!goal) throw new Error("Goal not found");

  const identity = await prisma.identity.findFirst({
    where: {
      id: identityId,
      userId,
    },
    select: { id: true },
  });
  if (!identity) throw new Error("Identity not found");

  await prisma.goal.update({
    where: { id: goalId },
    data: { identityId },
  });
}

export async function actionUpdateGoalCategory(
  goalId: string,
  category: string | null,
): Promise<void> {
  const userId = await requireUserId();
  await prisma.goal.updateMany({
    where: { id: goalId, identity: { userId } },
    data: { category },
  });
}

export async function actionUpdateIdentityCategory(
  identityId: string,
  category: string | null,
): Promise<void> {
  const userId = await requireUserId();
  await prisma.identity.updateMany({
    where: { id: identityId, userId },
    data: { category },
  });
}
