"use server";

/**
 * Server actions that read assessment data from the database.
 * Called by client components to avoid localStorage reads.
 */

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type {
  HabitAssessmentPartThree,
  HabitAssessmentPartTwo,
  HabitInventoryScorecard,
} from "@/types/habit";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

function emptyScorecard(): HabitInventoryScorecard {
  return { entries: [], takeaway: "", wantToAdd: [], wantToRemove: [] };
}

// ─── Part One ─────────────────────────────────────────────────────────────────

interface StoredPartOne {
  draft?: {
    personalSatisfaction: { rating: number | ""; why: string };
    professionalSatisfaction: { rating: number | ""; why: string };
    topPriorities: string[];
    optimization: { what: string; why: string };
    projects: { id: string; name: string; progress: string }[];
    obligations: string[];
    workingWell: string[];
    notWorkingWell: string[];
    blockers: { what: string; overcome: string; why: string };
    changes: { what: string; why: string };
  };
  completedAt?: string | null;
}

export async function fetchPartOneForReview(): Promise<StoredPartOne | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const row = await prisma.assessmentPartOne.findUnique({
    where: { userId },
    include: { projects: true },
  });
  if (!row) return null;

  return {
    completedAt: row.completedAt?.toISOString() ?? null,
    draft: {
      personalSatisfaction: {
        rating: row.personalRating ?? "",
        why: row.personalWhy,
      },
      professionalSatisfaction: {
        rating: row.professionalRating ?? "",
        why: row.professionalWhy,
      },
      topPriorities: row.topPriorities,
      optimization: {
        what: row.optimizationWhat,
        why: row.optimizationWhy,
      },
      projects: row.projects.map((p) => ({
        id: p.id,
        name: p.name,
        progress: p.progress,
      })),
      obligations: row.obligations,
      workingWell: row.workingWell,
      notWorkingWell: row.notWorkingWell,
      blockers: {
        what: row.blockerWhat,
        overcome: row.blockerOvercome,
        why: row.blockerWhy,
      },
      changes: {
        what: row.changesWhat,
        why: row.changesWhy,
      },
    },
  };
}

// ─── Part Two ─────────────────────────────────────────────────────────────────

interface StoredPartTwo {
  draft?: HabitAssessmentPartTwo;
  dayIndex?: number;
  completedAt?: string | null;
}

export async function fetchPartTwoForReview(): Promise<StoredPartTwo | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const row = await prisma.assessmentPartTwo.findUnique({
    where: { userId },
    include: {
      days: {
        include: { entries: true },
        orderBy: { date: "asc" },
      },
    },
  });
  if (!row) return null;

  return {
    completedAt: row.completedAt?.toISOString() ?? null,
    dayIndex: row.days.length > 0 ? row.days.length - 1 : 0,
    draft: {
      id: row.id,
      updatedAt: row.updatedAt.toISOString(),
      days: row.days.map((d) => ({
        date: isoDate(d.date),
        entries: d.entries.map((e) => ({
          hour: e.hour as HabitAssessmentPartTwo["days"][number]["entries"][number]["hour"],
          activity: e.activity,
          energyLevel: e.energyLevel as "UP" | "DOWN" | "NEUTRAL",
        })),
      })),
    },
  };
}

// ─── Part Three ───────────────────────────────────────────────────────────────

interface StoredPartThree {
  draft?: HabitAssessmentPartThree;
  stepIndex?: number;
  completedAt?: string | null;
}

export async function fetchPartThreeForReview(): Promise<StoredPartThree | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const row = await prisma.assessmentPartThree.findUnique({
    where: { userId },
    include: {
      beneficialHabits: true,
      successfulHabits: true,
      habitAttempts: true,
      morningScorecard: { include: { entries: true } },
      afternoonScorecard: { include: { entries: true } },
      eveningScorecard: { include: { entries: true } },
    },
  });
  if (!row) return null;

  type ScorecardWithEntries = NonNullable<typeof row.morningScorecard>;

  function mapScorecard(
    sc: ScorecardWithEntries | null,
  ): HabitInventoryScorecard {
    if (!sc) return emptyScorecard();
    return {
      takeaway: sc.takeaway,
      wantToAdd: sc.wantToAdd,
      wantToRemove: sc.wantToRemove,
      entries: sc.entries.map((e) => ({
        habit: e.habit,
        score: e.score as "+" | "-",
        reasoning: e.reasoning,
      })),
    };
  }

  const draft: HabitAssessmentPartThree = {
    id: row.id,
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,

    majorTimeSpends: row.majorTimeSpends,
    highEnergyHoursPerDay: row.highEnergyHoursPerDay,
    highEnergyHoursList: row.highEnergyHoursList,
    highEnergyActivities: row.highEnergyActivities,
    lowEnergyHours: row.lowEnergyHours,
    wantHighEnergySpend: row.wantHighEnergySpend,
    wantLowEnergySpend: row.wantLowEnergySpend,

    timeSinksReflection: row.timeSinksReflection,
    stressSource: row.stressSource,
    anticipatedChanges: row.anticipatedChanges,

    beneficialHabits: row.beneficialHabits.map((h) => ({
      habit: h.habit,
      explanation: h.explanation,
    })),
    successfulHabits: row.successfulHabits.map((h) => ({
      habit: h.habit,
      explanation: h.explanation,
    })),
    stickinessPatterns: row.stickinessPatterns,

    habitAttempts: row.habitAttempts.map((a) => ({
      habit: a.habit,
      mode: a.mode as "building" | "breaking",
      whatDidntWork: a.whatDidntWork,
      obstacle: a.obstacle,
    })),

    morningScorecard: mapScorecard(row.morningScorecard),
    afternoonScorecard: mapScorecard(row.afternoonScorecard),
    eveningScorecard: mapScorecard(row.eveningScorecard),

    finalReflection: row.finalReflection,
    part1WrapUpReflection: row.part1WrapUpReflection,
  };

  return {
    completedAt: row.completedAt?.toISOString() ?? null,
    draft,
  };
}

// ─── Dashboard status ─────────────────────────────────────────────────────────

export interface AssessmentStatus {
  partOne: { completedAt: string | null; exists: boolean } | null;
  partTwo: {
    completedAt: string | null;
    dayIndex: number;
    startDate: string | null;
    exists: boolean;
  } | null;
  partThree: { completedAt: string | null; exists: boolean } | null;
}

export async function fetchAssessmentStatus(): Promise<AssessmentStatus> {
  const userId = await getUserId();
  if (!userId) return { partOne: null, partTwo: null, partThree: null };

  const [p1, p2, p3] = await Promise.all([
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
      select: { completedAt: true },
    }),
  ]);

  return {
    partOne: p1
      ? { completedAt: p1.completedAt?.toISOString() ?? null, exists: true }
      : null,
    partTwo: p2
      ? {
          completedAt: p2.completedAt?.toISOString() ?? null,
          dayIndex: p2.days.length > 0 ? p2.days.length - 1 : 0,
          startDate: p2.days[0]?.date ? isoDate(p2.days[0].date) : null,
          exists: true,
        }
      : null,
    partThree: p3
      ? { completedAt: p3.completedAt?.toISOString() ?? null, exists: true }
      : null,
  };
}
