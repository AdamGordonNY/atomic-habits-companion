import "server-only";

import { auth } from "@clerk/nextjs/server";
import { actionGetTrackedHabits, type TrackedHabitData } from "@/lib/actions/habit-actions";
import { fetchNextStep, type NextStepData } from "@/lib/actions/next-step-actions";
import { fetchPartFour } from "@/lib/actions/part-four-actions";
import { prisma } from "@/lib/prisma";
import type { HabitAssessmentPartFour } from "@/types/habit";

export interface ProfileSnapshot {
  isAuthed: boolean;
  partFour: HabitAssessmentPartFour | null;
  nextStep: NextStepData | null;
  trackedHabits: TrackedHabitData[];
  identities: HabitAssessmentPartFour["identities"];
}

export interface CommitmentsData {
  id: string;
  updatedAt: string;
  completedAt: string | null;
  existingCommitments: string[];
  desiredCommitments: string[];
  unwantedCommitments: string[];
}

export interface IdealsData {
  id: string;
  updatedAt: string;
  completedAt: string | null;
  idealMorning: string;
  idealAfternoon: string;
  idealEvening: string;
  cleanSlateReflection: string;
}

export interface VisionData {
  id: string;
  updatedAt: string;
  completedAt: string | null;
  majorGoals: string[];
  vision6Months: string;
  vision2Years: string;
  vision5Years: string;
  majorChanges: string[];
  successDefinition: string;
  domainVisions: HabitAssessmentPartFour["domainVisions"];
  futureReflection: string;
  reflectionGoals: string[];
}

export interface IdentitiesData {
  id: string;
  updatedAt: string;
  completedAt: string | null;
  identities: HabitAssessmentPartFour["identities"];
}

export interface GoalsData {
  id: string;
  updatedAt: string;
  completedAt: string | null;
  entries: NextStepData["goalEntries"];
}

export interface HabitsData {
  habits: Array<
    TrackedHabitData & {
      goalId: string | null;
      goalName: string | null;
      identityId: string | null;
    }
  >;
}

export async function fetchProfileSnapshot(): Promise<ProfileSnapshot> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        isAuthed: false,
        partFour: null,
        nextStep: null,
        trackedHabits: [],
        identities: [],
      };
    }

    const [partFour, nextStep, trackedHabits, identityRows] = await Promise.all([
      fetchPartFour(),
      fetchNextStep(),
      actionGetTrackedHabits(),
      prisma.identity.findMany({
        where: { userId },
        orderBy: { name: "asc" },
        include: {
          goals: {
            orderBy: { text: "asc" },
            include: {
              habits: {
                orderBy: { name: "asc" },
                select: { name: true },
              },
            },
          },
        },
      }),
    ]);

    const identities = identityRows.map((identity) => ({
      id: identity.id,
      identity: identity.name,
      category: identity.category,
      habits: [...new Set(identity.goals.flatMap((goal) => goal.habits.map((habit) => habit.name)))],
    }));

    return {
      isAuthed: true,
      partFour,
      nextStep,
      trackedHabits,
      identities,
    };
  } catch {
    return {
      isAuthed: false,
      partFour: null,
      nextStep: null,
      trackedHabits: [],
      identities: [],
    };
  }
}

export function getCommitmentsData(snapshot: ProfileSnapshot): CommitmentsData | null {
  if (!snapshot.partFour) return null;
  return {
    id: snapshot.partFour.id,
    updatedAt: snapshot.partFour.updatedAt,
    completedAt: snapshot.partFour.completedAt,
    existingCommitments: snapshot.partFour.existingCommitments,
    desiredCommitments: snapshot.partFour.desiredCommitments,
    unwantedCommitments: snapshot.partFour.unwantedCommitments,
  };
}

export function getIdealsData(snapshot: ProfileSnapshot): IdealsData | null {
  if (!snapshot.partFour) return null;
  return {
    id: snapshot.partFour.id,
    updatedAt: snapshot.partFour.updatedAt,
    completedAt: snapshot.partFour.completedAt,
    idealMorning: snapshot.partFour.idealMorning,
    idealAfternoon: snapshot.partFour.idealAfternoon,
    idealEvening: snapshot.partFour.idealEvening,
    cleanSlateReflection: snapshot.partFour.cleanSlateReflection,
  };
}

export function getVisionData(snapshot: ProfileSnapshot): VisionData | null {
  if (!snapshot.partFour) return null;
  return {
    id: snapshot.partFour.id,
    updatedAt: snapshot.partFour.updatedAt,
    completedAt: snapshot.partFour.completedAt,
    majorGoals: snapshot.partFour.majorGoals,
    vision6Months: snapshot.partFour.vision6Months,
    vision2Years: snapshot.partFour.vision2Years,
    vision5Years: snapshot.partFour.vision5Years,
    majorChanges: snapshot.partFour.majorChanges,
    successDefinition: snapshot.partFour.successDefinition,
    domainVisions: snapshot.partFour.domainVisions,
    futureReflection: snapshot.partFour.futureReflection,
    reflectionGoals: snapshot.partFour.reflectionGoals,
  };
}

export function getIdentitiesData(snapshot: ProfileSnapshot): IdentitiesData | null {
  if (snapshot.partFour) {
    return {
      id: snapshot.partFour.id,
      updatedAt: snapshot.partFour.updatedAt,
      completedAt: snapshot.partFour.completedAt,
      identities: snapshot.partFour.identities,
    };
  }

  if (snapshot.identities.length === 0) return null;

  return {
    id: "",
    updatedAt: new Date().toISOString(),
    completedAt: null,
    identities: snapshot.identities,
  };
}

export function getGoalsData(snapshot: ProfileSnapshot): GoalsData | null {
  if (!snapshot.nextStep) return null;
  return {
    id: snapshot.nextStep.id,
    updatedAt: snapshot.nextStep.updatedAt,
    completedAt: snapshot.nextStep.completedAt,
    entries: snapshot.nextStep.goalEntries,
  };
}

export function getHabitsData(snapshot: ProfileSnapshot): HabitsData {
  const goalLookup = new Map<string, NonNullable<NextStepData["goalEntries"][number]>>();
  for (const goal of snapshot.nextStep?.goalEntries ?? []) {
    if (goal.id) goalLookup.set(goal.id, goal);
  }

  return {
    habits: snapshot.trackedHabits.map((habit) => {
      const goal = habit.goalEntryId ? goalLookup.get(habit.goalEntryId) : undefined;
      return {
        ...habit,
        goalId: habit.goalEntryId ?? null,
        goalName: goal?.goal ?? null,
        identityId: habit.identityId ?? goal?.identityId ?? null,
      };
    }),
  };
}

export async function fetchCommitmentsData(): Promise<{ isAuthed: boolean; data: CommitmentsData | null }> {
  const snapshot = await fetchProfileSnapshot();
  return { isAuthed: snapshot.isAuthed, data: getCommitmentsData(snapshot) };
}

export async function fetchIdealsData(): Promise<{ isAuthed: boolean; data: IdealsData | null }> {
  const snapshot = await fetchProfileSnapshot();
  return { isAuthed: snapshot.isAuthed, data: getIdealsData(snapshot) };
}

export async function fetchVisionData(): Promise<{ isAuthed: boolean; data: VisionData | null }> {
  const snapshot = await fetchProfileSnapshot();
  return { isAuthed: snapshot.isAuthed, data: getVisionData(snapshot) };
}

export async function fetchIdentitiesData(): Promise<{ isAuthed: boolean; data: IdentitiesData | null }> {
  const snapshot = await fetchProfileSnapshot();
  return { isAuthed: snapshot.isAuthed, data: getIdentitiesData(snapshot) };
}

export async function fetchGoalsData(): Promise<{ isAuthed: boolean; data: GoalsData | null }> {
  const snapshot = await fetchProfileSnapshot();
  return { isAuthed: snapshot.isAuthed, data: getGoalsData(snapshot) };
}

export async function fetchHabitsData(): Promise<{ isAuthed: boolean; data: HabitsData }> {
  const snapshot = await fetchProfileSnapshot();
  return { isAuthed: snapshot.isAuthed, data: getHabitsData(snapshot) };
}