"use server";

/**
 * localStorage → Database sync actions.
 *
 * Each action receives the raw parsed localStorage object from the client,
 * maps it to the Prisma schema, and upserts it against the authenticated user.
 *
 * Called once after sign-in by components/auth/post-signin-sync.tsx.
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type {
  Note,
  HabitAssessmentPartThree,
  HabitInventoryScorecard,
} from "@/types/habit";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

// ─── Notes sync ───────────────────────────────────────────────────────────────

export async function syncNotes(localNotes: Note[]): Promise<void> {
  const userId = await requireUserId();
  if (!localNotes.length) return;

  await Promise.all(
    localNotes.map((n) =>
      prisma.note.upsert({
        where: { id: n.id },
        create: {
          id: n.id,
          userId,
          title: n.title,
          content: n.content,
          contentText: n.contentText,
          tags: n.tags,
          pinned: n.pinned,
          createdAt: new Date(n.createdAt),
        },
        update: {
          title: n.title,
          content: n.content,
          contentText: n.contentText,
          tags: n.tags,
          pinned: n.pinned,
        },
      }),
    ),
  );
}

// ─── Part One sync ────────────────────────────────────────────────────────────

interface LocalPartOneProject {
  id: string;
  name: string;
  progress: string;
}

interface LocalPartOneDraft {
  personalSatisfaction?: { rating?: number | ""; why?: string };
  professionalSatisfaction?: { rating?: number | ""; why?: string };
  topPriorities?: string[];
  optimization?: { what?: string; why?: string };
  projects?: LocalPartOneProject[];
  obligations?: string[];
  workingWell?: string[];
  notWorkingWell?: string[];
  blockers?: { what?: string; overcome?: string; why?: string };
  changes?: { what?: string; why?: string };
}

interface LocalPartOnePayload {
  version?: number;
  stepIndex?: number;
  draft?: LocalPartOneDraft;
  completedAt?: string | null;
}

export async function syncPartOne(payload: LocalPartOnePayload): Promise<void> {
  const userId = await requireUserId();
  const d = payload.draft ?? {};

  const personalRating = Number(d.personalSatisfaction?.rating) || null;
  const professionalRating = Number(d.professionalSatisfaction?.rating) || null;

  // Upsert the main assessment record (one per user)
  const assessment = await prisma.assessmentPartOne.upsert({
    where: { userId },
    create: {
      userId,
      personalRating,
      personalWhy: d.personalSatisfaction?.why ?? "",
      professionalRating,
      professionalWhy: d.professionalSatisfaction?.why ?? "",
      topPriorities: d.topPriorities ?? [],
      optimizationWhat: d.optimization?.what ?? "",
      optimizationWhy: d.optimization?.why ?? "",
      obligations: d.obligations ?? [],
      workingWell: d.workingWell ?? [],
      notWorkingWell: d.notWorkingWell ?? [],
      blockerWhat: d.blockers?.what ?? "",
      blockerOvercome: d.blockers?.overcome ?? "",
      blockerWhy: d.blockers?.why ?? "",
      changesWhat: d.changes?.what ?? "",
      changesWhy: d.changes?.why ?? "",
      completedAt: payload.completedAt ? new Date(payload.completedAt) : null,
    },
    update: {
      personalRating,
      personalWhy: d.personalSatisfaction?.why ?? "",
      professionalRating,
      professionalWhy: d.professionalSatisfaction?.why ?? "",
      topPriorities: d.topPriorities ?? [],
      optimizationWhat: d.optimization?.what ?? "",
      optimizationWhy: d.optimization?.why ?? "",
      obligations: d.obligations ?? [],
      workingWell: d.workingWell ?? [],
      notWorkingWell: d.notWorkingWell ?? [],
      blockerWhat: d.blockers?.what ?? "",
      blockerOvercome: d.blockers?.overcome ?? "",
      blockerWhy: d.blockers?.why ?? "",
      changesWhat: d.changes?.what ?? "",
      changesWhy: d.changes?.why ?? "",
      completedAt: payload.completedAt ? new Date(payload.completedAt) : null,
    },
  });

  // Sync projects — delete existing and re-insert from localStorage
  if (Array.isArray(d.projects) && d.projects.length > 0) {
    await prisma.project.deleteMany({ where: { assessmentId: assessment.id } });
    await prisma.project.createMany({
      data: d.projects.map((p) => ({
        id: p.id,
        name: p.name,
        progress: p.progress,
        assessmentId: assessment.id,
      })),
    });
  }
}

// ─── Part Two sync ────────────────────────────────────────────────────────────

interface LocalHourlyEntry {
  hour: string;
  activity: string;
  energyLevel: string;
}

interface LocalDayLog {
  date: string;
  entries: LocalHourlyEntry[];
}

interface LocalPartTwoDraft {
  id?: string;
  days?: LocalDayLog[];
  updatedAt?: string;
}

interface LocalPartTwoPayload {
  version?: number;
  dayIndex?: number;
  draft?: LocalPartTwoDraft;
  completedAt?: string | null;
}

export async function syncPartTwo(payload: LocalPartTwoPayload): Promise<void> {
  const userId = await requireUserId();
  const days = payload.draft?.days ?? [];

  // Upsert the top-level record
  const partTwo = await prisma.assessmentPartTwo.upsert({
    where: { userId },
    create: {
      userId,
      completedAt: payload.completedAt ? new Date(payload.completedAt) : null,
    },
    update: {
      completedAt: payload.completedAt ? new Date(payload.completedAt) : null,
    },
  });

  // Delete all existing day logs and re-create (simpler than diffing)
  await prisma.dayLog.deleteMany({ where: { assessmentId: partTwo.id } });

  for (const day of days) {
    const dayLog = await prisma.dayLog.create({
      data: {
        assessmentId: partTwo.id,
        date: new Date(day.date),
      },
    });

    const filledEntries = (day.entries ?? []).filter(
      (e) => e.activity?.trim() || e.energyLevel,
    );
    if (filledEntries.length > 0) {
      await prisma.hourlyEntry.createMany({
        data: filledEntries.map((e) => ({
          dayLogId: dayLog.id,
          hour: e.hour,
          activity: e.activity ?? "",
          energyLevel: e.energyLevel ?? "UP",
        })),
      });
    }
  }
}

// ─── Part Three sync ──────────────────────────────────────────────────────────

interface LocalPartThreePayload {
  version?: number;
  stepIndex?: number;
  draft?: HabitAssessmentPartThree;
  completedAt?: string | null;
}

async function upsertScorecard(
  partThreeId: string,
  period: "morning" | "afternoon" | "evening",
  scorecard: HabitInventoryScorecard,
  relationField: "morningForId" | "afternoonForId" | "eveningForId",
) {
  // Find existing scorecard for this period
  const existing = await prisma.habitScorecard.findFirst({
    where: { [relationField]: partThreeId },
  });

  if (existing) {
    await prisma.habitScorecardEntry.deleteMany({
      where: { scorecardId: existing.id },
    });
    await prisma.habitScorecard.update({
      where: { id: existing.id },
      data: {
        takeaway: scorecard.takeaway,
        wantToAdd: scorecard.wantToAdd.filter(Boolean),
        wantToRemove: scorecard.wantToRemove.filter(Boolean),
      },
    });
    const filled = scorecard.entries.filter((e) => e.habit?.trim());
    if (filled.length) {
      await prisma.habitScorecardEntry.createMany({
        data: filled.map((e) => ({
          scorecardId: existing.id,
          habit: e.habit,
          score: e.score,
          reasoning: e.reasoning ?? "",
        })),
      });
    }
  } else {
    const created = await prisma.habitScorecard.create({
      data: {
        period,
        takeaway: scorecard.takeaway,
        wantToAdd: scorecard.wantToAdd.filter(Boolean),
        wantToRemove: scorecard.wantToRemove.filter(Boolean),
        [relationField]: partThreeId,
      },
    });
    const filled = scorecard.entries.filter((e) => e.habit?.trim());
    if (filled.length) {
      await prisma.habitScorecardEntry.createMany({
        data: filled.map((e) => ({
          scorecardId: created.id,
          habit: e.habit,
          score: e.score,
          reasoning: e.reasoning ?? "",
        })),
      });
    }
  }
}

export async function syncPartThree(
  payload: LocalPartThreePayload,
): Promise<void> {
  const userId = await requireUserId();
  const d = payload.draft;
  if (!d) return;

  const partThree = await prisma.assessmentPartThree.upsert({
    where: { userId },
    create: {
      userId,
      majorTimeSpends: d.majorTimeSpends?.filter(Boolean) ?? [],
      highEnergyHoursPerDay: d.highEnergyHoursPerDay ?? null,
      highEnergyHoursList: d.highEnergyHoursList?.filter(Boolean) ?? [],
      highEnergyActivities: d.highEnergyActivities ?? "",
      lowEnergyHours: d.lowEnergyHours?.filter(Boolean) ?? [],
      wantHighEnergySpend: d.wantHighEnergySpend?.filter(Boolean) ?? [],
      wantLowEnergySpend: d.wantLowEnergySpend?.filter(Boolean) ?? [],
      timeSinksReflection: d.timeSinksReflection ?? "",
      stressSource: d.stressSource ?? "",
      anticipatedChanges: d.anticipatedChanges ?? "",
      stickinessPatterns: d.stickinessPatterns ?? "",
      finalReflection: d.finalReflection ?? "",
      part1WrapUpReflection: d.part1WrapUpReflection ?? "",
      completedAt: d.completedAt ? new Date(d.completedAt) : null,
    },
    update: {
      majorTimeSpends: d.majorTimeSpends?.filter(Boolean) ?? [],
      highEnergyHoursPerDay: d.highEnergyHoursPerDay ?? null,
      highEnergyHoursList: d.highEnergyHoursList?.filter(Boolean) ?? [],
      highEnergyActivities: d.highEnergyActivities ?? "",
      lowEnergyHours: d.lowEnergyHours?.filter(Boolean) ?? [],
      wantHighEnergySpend: d.wantHighEnergySpend?.filter(Boolean) ?? [],
      wantLowEnergySpend: d.wantLowEnergySpend?.filter(Boolean) ?? [],
      timeSinksReflection: d.timeSinksReflection ?? "",
      stressSource: d.stressSource ?? "",
      anticipatedChanges: d.anticipatedChanges ?? "",
      stickinessPatterns: d.stickinessPatterns ?? "",
      finalReflection: d.finalReflection ?? "",
      part1WrapUpReflection: d.part1WrapUpReflection ?? "",
      completedAt: d.completedAt ? new Date(d.completedAt) : null,
    },
  });

  // Beneficial habits
  await prisma.habitRecord.deleteMany({
    where: { beneficialForId: partThree.id },
  });
  const beneficialFilled = (d.beneficialHabits ?? []).filter((h) =>
    h.habit?.trim(),
  );
  if (beneficialFilled.length) {
    await prisma.habitRecord.createMany({
      data: beneficialFilled.map((h) => ({
        habit: h.habit,
        explanation: h.explanation ?? "",
        beneficialForId: partThree.id,
      })),
    });
  }

  // Successful habits
  await prisma.habitRecord.deleteMany({
    where: { successfulForId: partThree.id },
  });
  const successfulFilled = (d.successfulHabits ?? []).filter((h) =>
    h.habit?.trim(),
  );
  if (successfulFilled.length) {
    await prisma.habitRecord.createMany({
      data: successfulFilled.map((h) => ({
        habit: h.habit,
        explanation: h.explanation ?? "",
        successfulForId: partThree.id,
      })),
    });
  }

  // Habit attempts
  await prisma.habitAttempt.deleteMany({ where: { assessmentId: partThree.id } });
  const attemptsFilled = (d.habitAttempts ?? []).filter((a) => a.habit?.trim());
  if (attemptsFilled.length) {
    await prisma.habitAttempt.createMany({
      data: attemptsFilled.map((a) => ({
        assessmentId: partThree.id,
        habit: a.habit,
        mode: a.mode,
        whatDidntWork: a.whatDidntWork ?? "",
        obstacle: a.obstacle ?? "",
      })),
    });
  }

  // Scorecards
  if (d.morningScorecard) {
    await upsertScorecard(
      partThree.id,
      "morning",
      d.morningScorecard,
      "morningForId",
    );
  }
  if (d.afternoonScorecard) {
    await upsertScorecard(
      partThree.id,
      "afternoon",
      d.afternoonScorecard,
      "afternoonForId",
    );
  }
  if (d.eveningScorecard) {
    await upsertScorecard(
      partThree.id,
      "evening",
      d.eveningScorecard,
      "eveningForId",
    );
  }
}
