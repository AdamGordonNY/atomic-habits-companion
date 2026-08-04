"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

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

export async function fetchNextStep(): Promise<NextStepData | null> {
  const userId = await requireUserId();

  const row = await prisma.assessmentNextStep.findUnique({
    where: { userId },
    include: { goalEntries: { orderBy: { id: "asc" } } },
  });

  if (!row) return null;

  return {
    id: row.id,
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    goalEntries: row.goalEntries.map((entry) => ({
      id: entry.id,
      identityId: entry.identityId,
      goal: entry.goal,
      category: entry.category,
      currentSystem: entry.currentSystem,
      systemEval: entry.systemEval,
      systemRating: entry.systemRating,
      idealSystem: entry.idealSystem,
      componentHabits: entry.componentHabits,
    })),
  };
}

export async function fetchGoalEntryById(goalId: string): Promise<GoalEntryData | null> {
  const userId = await requireUserId();

  const row = await prisma.nextStepGoalEntry.findFirst({
    where: {
      id: goalId,
      nextStep: { userId },
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

export async function upsertNextStep(
  payload: NextStepGoalData[],
  completedAt?: string | null,
): Promise<void> {
  const userId = await requireUserId();

  const existing = await prisma.assessmentNextStep.findUnique({
    where: { userId },
    select: { completedAt: true },
  });

  if (existing?.completedAt) {
    throw new Error("This assessment is complete and can no longer be edited.");
  }

  const parent = await prisma.assessmentNextStep.upsert({
    where: { userId },
    create: { userId },
    update: {
      updatedAt: new Date(),
      ...(completedAt !== undefined
        ? { completedAt: completedAt ? new Date(completedAt) : null }
        : {}),
    },
    select: { id: true },
  });

  const existingEntries = await prisma.nextStepGoalEntry.findMany({
    where: { nextStepId: parent.id },
    select: { id: true },
  });
  const existingIds = new Set(existingEntries.map((entry) => entry.id));
  const retainedIds = new Set(payload.map((entry) => entry.id).filter((id): id is string => Boolean(id)));
  const deleteIds = [...existingIds].filter((id) => !retainedIds.has(id));

  await prisma.$transaction(async (tx) => {
    if (deleteIds.length > 0) {
      await tx.nextStepGoalEntry.deleteMany({ where: { id: { in: deleteIds } } });
    }

    for (const entry of payload) {
      if (entry.id && existingIds.has(entry.id)) {
        await tx.nextStepGoalEntry.update({
          where: { id: entry.id },
          data: {
            identityId: entry.identityId ?? null,
            goal: entry.goal,
            category: entry.category ?? null,
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
          nextStepId: parent.id,
          identityId: entry.identityId ?? null,
          goal: entry.goal,
          category: entry.category ?? null,
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
