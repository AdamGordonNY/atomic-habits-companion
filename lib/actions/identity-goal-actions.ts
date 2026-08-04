"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export interface GoalAssignmentOption {
  id: string;
  goal: string;
  identityId: string | null;
  supportingHabits: string[];
}

export interface IdentityAssignmentOption {
  id: string;
  identity: string;
  supportingGoals: Array<{ id: string; goal: string }>;
}

export async function actionGetAssignableGoalsForIdentity(identityId: string): Promise<GoalAssignmentOption[]> {
  const userId = await requireUserId();

  const rows = await prisma.nextStepGoalEntry.findMany({
    where: {
      nextStep: { userId },
      OR: [{ identityId: null }, { identityId: { not: identityId } }],
    },
    orderBy: { goal: "asc" },
    select: {
      id: true,
      goal: true,
      identityId: true,
      trackedHabits: {
        orderBy: { name: "asc" },
        select: { name: true },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    goal: row.goal,
    identityId: row.identityId,
    supportingHabits: row.trackedHabits.map((habit) => habit.name),
  }));
}

export async function actionGetAttachableIdentitiesForGoal(goalId: string): Promise<IdentityAssignmentOption[]> {
  const userId = await requireUserId();

  const current = await prisma.nextStepGoalEntry.findFirst({
    where: { id: goalId, nextStep: { userId } },
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
        select: { id: true, goal: true },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    identity: row.identity,
    supportingGoals: row.goals.map((goal) => ({ id: goal.id, goal: goal.goal })),
  }));
}

export async function actionAttachGoalToIdentity(goalId: string, identityId: string): Promise<void> {
  const userId = await requireUserId();

  const goal = await prisma.nextStepGoalEntry.findFirst({
    where: {
      id: goalId,
      nextStep: { userId },
    },
    select: { id: true },
  });
  if (!goal) throw new Error("Goal not found");

  const identity = await prisma.identityRecord.findFirst({
    where: {
      id: identityId,
      assessment: { userId },
    },
    select: { id: true },
  });
  if (!identity) throw new Error("Identity not found");

  await prisma.nextStepGoalEntry.update({
    where: { id: goalId },
    data: { identityId },
  });

  await prisma.trackedHabit.updateMany({
    where: { goalEntryId: goalId, userId },
    data: { identityId },
  });
}

export async function actionUpdateGoalCategory(
  goalId: string,
  category: string | null,
): Promise<void> {
  const userId = await requireUserId();
  await prisma.nextStepGoalEntry.updateMany({
    where: { id: goalId, nextStep: { userId } },
    data: { category },
  });
}

export async function actionUpdateIdentityCategory(
  identityId: string,
  category: string | null,
): Promise<void> {
  const userId = await requireUserId();
  await prisma.identityRecord.updateMany({
    where: { id: identityId, assessment: { userId } },
    data: { category },
  });
}
