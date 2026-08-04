"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { TrackedHabitData } from "@/lib/actions/habit-actions";
// Assessment Status for Dashboard Display
export interface DashboardStatus {
  partOne: { completedAt: string | null; exists: boolean } | null;
  partTwo: {
    completedAt: string | null;
    dayIndex: number;
    startDate: string | null;
    exists: boolean;
  } | null;
  partThree: { completedAt: string | null; exists: boolean } | null;
  partFour: { completedAt: string | null; exists: boolean } | null;
  nextStep: { completedAt: string | null; exists: boolean } | null;
}

export interface DashboardData {
  status: DashboardStatus;
  habitNames: string[];
  trackedHabits: TrackedHabitData[];
  goals: { id: string; label: string; identityId: string | null }[];
  identityCount: number;
  identities: { id: string; identity: string }[];
  recentNotes: { id: string; title: string; updatedAt: string }[];
  recentChecklists: { id: string; title: string; updatedAt: string }[];
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const { userId } = await auth();
  if (!userId) {
    return {
      status: {
        partOne: null,
        partTwo: null,
        partThree: null,
        partFour: null,
        nextStep: null,
      },
      habitNames: [],
      trackedHabits: [],
      goals: [],
      identityCount: 0,
      identities: [],
      recentNotes: [],
      recentChecklists: [],
    };
  }

  const [p1, p2, p3, p4, nextStep] = await prisma.$transaction([
    prisma.assessmentPartOne.findUnique({
      where: { userId },
      select: { completedAt: true },
    }),
    prisma.assessmentPartTwo.findUnique({
      where: { userId },
      include: {
        days: {
          select: { date: true },
          orderBy: { date: "asc" },
        },
      },
    }),
    prisma.assessmentPartThree.findUnique({
      where: { userId },
      select: { completedAt: true, updatedAt: true, part1WrapUpReflection: true },
    }),
    prisma.assessmentPartFour.findUnique({
      where: { userId },
      select: { completedAt: true },
    }),
    prisma.assessmentPartFour.findUnique({
      where: { userId },
      select: { id: true, completedAt: true },
    }),
  ]);

  const nextStepEntries = nextStep
    ? await prisma.nextStepGoalEntry.findMany({
        where: { nextStepId: nextStep.id },
        select: { id: true, goal: true, componentHabits: true, identityId: true },
        orderBy: { goal: "asc" },
      })
    : [];

  const habitNames = [
    ...new Set(
      nextStepEntries.flatMap((e) => e.componentHabits).filter(Boolean),
    ),
  ];

  const sixtyDaysAgoStr = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const tracked = await prisma.habit.findMany({
    where: { userId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      goal: { select: { identityId: true } },
      checkIns: {
        where: { date: { gte: sixtyDaysAgoStr } },
        select: { date: true, completed: true, note: true },
        orderBy: { date: "asc" },
      },
    },
  });

  const goals = await prisma.goal.findMany({
    where: { identity: { userId } },
    select: { id: true, text: true, identityId: true },
    orderBy: { text: "asc" },
  });

  const [notes, checklists, identities] = await Promise.all([
    prisma.note.findMany({
      where: { userId },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      take: 10,
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.checklist.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.identity.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const identityCount = identities.length;

  return {
    status: {
      partOne: p1
        ? { completedAt: p1.completedAt?.toISOString() ?? null, exists: true }
        : null,
      partTwo: p2
        ? {
            completedAt:
              p2.completedAt?.toISOString() ??
              (p2.days.length >= 7 ? p2.updatedAt.toISOString() : null),
            dayIndex: p2.days.length > 0 ? p2.days.length - 1 : 0,
            startDate: p2.days[0]?.date ? isoDate(p2.days[0].date) : null,
            exists: true,
          }
        : null,
      partThree: p3
        ? {
            completedAt:
              p3.completedAt?.toISOString() ??
              (p3.part1WrapUpReflection !== "" ? p3.updatedAt.toISOString() : null),
            exists: true,
          }
        : null,
      partFour: p4
        ? { completedAt: p4.completedAt?.toISOString() ?? null, exists: true }
        : null,
      nextStep: nextStep
        ? { completedAt: nextStep.completedAt?.toISOString() ?? null, exists: true }
        : null,
    },
    habitNames,
    trackedHabits: tracked.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      goalEntryId: r.goalId,
      goalId: r.goalId,
      identityId: r.goal.identityId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      checkIns: r.checkIns.map((c) => ({ date: c.date, completed: c.completed, note: c.note })),
    })),
    goals: goals.map((g) => ({
      id: g.id,
      label: g.text,
      identityId: g.identityId ?? null,
    })),
    identityCount,
    identities: identities.map((i) => ({ id: i.id, identity: i.name })),
    recentNotes: notes.map((n) => ({
      id: n.id,
      title: n.title || "Untitled note",
      updatedAt: n.updatedAt.toISOString(),
    })),
    recentChecklists: checklists.map((c) => ({
      id: c.id,
      title: c.title || "Untitled checklist",
      updatedAt: c.updatedAt.toISOString(),
    })),
  };
}
