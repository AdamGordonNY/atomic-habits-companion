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
  goal: string;
  currentSystem: string;
  systemEval: string;
  systemRating: number;
  idealSystem: string;
  componentHabits: string[];
}

export interface NextStepData {
  completedAt: string | null;
  goalEntries: NextStepGoalData[];
}

export interface GoalEntryData extends NextStepGoalData {
  id: string;
}

// ─── read ─────────────────────────────────────────────────────────────────────

export async function fetchNextStep(): Promise<NextStepData | null> {
  const userId = await requireUserId();

  const row = await prisma.assessmentNextStep.findUnique({
    where: { userId },
    include: { goalEntries: true },
  });

  if (!row) return null;

  return {
    completedAt: row.completedAt?.toISOString() ?? null,
    goalEntries: row.goalEntries.map((e) => ({
      id: e.id,
      goal: e.goal,
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

  const row = await prisma.nextStepGoalEntry.findFirst({
    where: {
      id: goalId,
      nextStep: { userId },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    goal: row.goal,
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

  // Replace all goal entries atomically
  await prisma.nextStepGoalEntry.deleteMany({ where: { nextStepId: parent.id } });

  if (payload.length > 0) {
    await prisma.nextStepGoalEntry.createMany({
      data: payload.map((e) => ({
        nextStepId: parent.id,
        goal: e.goal,
        currentSystem: e.currentSystem,
        systemEval: e.systemEval,
        systemRating: e.systemRating,
        idealSystem: e.idealSystem,
        componentHabits: e.componentHabits,
      })),
    });
  }
}
