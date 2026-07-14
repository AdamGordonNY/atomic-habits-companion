"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { TrackedHabitData } from "@/lib/actions/habit-actions";

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
  goals: { id: string; label: string }[];
  identityCount: number;
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
    prisma.assessmentNextStep.findUnique({
      where: { userId },
      select: {
        completedAt: true,
        goalEntries: {
          select: { id: true, goal: true, componentHabits: true },
        },
      },
    }),
  ]);

  const habitNames = [
    ...new Set(
      (nextStep?.goalEntries ?? []).flatMap((e) => e.componentHabits).filter(Boolean),
    ),
  ];

  if (habitNames.length > 0) {
    await prisma.trackedHabit.createMany({
      data: habitNames.map((name) => ({ userId, name })),
      skipDuplicates: true,
    });
  }

  const tracked = await prisma.trackedHabit.findMany({
    where: { userId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const [notes, checklists, identityCount] = await Promise.all([
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
    prisma.identityRecord.count({ where: { assessment: { userId } } }),
  ]);

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
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    goals: (nextStep?.goalEntries ?? []).map((g) => ({
      id: g.id,
      label: g.goal,
    })),
    identityCount,
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
