import "server-only";

import { actionGetTrackedHabits, type TrackedHabitData } from "@/lib/actions/habit-actions";
import { fetchNextStep, type NextStepData } from "@/lib/actions/next-step-actions";
import { fetchPartFour } from "@/lib/actions/part-four-actions";
import type { HabitAssessmentPartFour } from "@/types/habit";

export interface ProfileSnapshot {
  isAuthed: boolean;
  partFour: HabitAssessmentPartFour | null;
  nextStep: NextStepData | null;
  trackedHabits: TrackedHabitData[];
}

export interface CommitmentsData {
  updatedAt: string;
  completedAt: string | null;
  existingCommitments: string[];
  desiredCommitments: string[];
  unwantedCommitments: string[];
}

export interface IdealsData {
  updatedAt: string;
  completedAt: string | null;
  idealMorning: string;
  idealAfternoon: string;
  idealEvening: string;
  cleanSlateReflection: string;
}

export interface VisionData {
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
  updatedAt: string;
  completedAt: string | null;
  identities: HabitAssessmentPartFour["identities"];
}

export interface GoalsData {
  updatedAt: string;
  completedAt: string | null;
  entries: NextStepData["goalEntries"];
}

export interface HabitsData {
  habits: TrackedHabitData[];
}

export async function fetchProfileSnapshot(): Promise<ProfileSnapshot> {
  try {
    const [partFour, nextStep, trackedHabits] = await Promise.all([
      fetchPartFour(),
      fetchNextStep(),
      actionGetTrackedHabits(),
    ]);

    return {
      isAuthed: true,
      partFour,
      nextStep,
      trackedHabits,
    };
  } catch {
    return {
      isAuthed: false,
      partFour: null,
      nextStep: null,
      trackedHabits: [],
    };
  }
}

export function getCommitmentsData(snapshot: ProfileSnapshot): CommitmentsData | null {
  if (!snapshot.partFour) return null;
  return {
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
  if (!snapshot.partFour) return null;
  return {
    updatedAt: snapshot.partFour.updatedAt,
    completedAt: snapshot.partFour.completedAt,
    identities: snapshot.partFour.identities,
  };
}

export function getGoalsData(snapshot: ProfileSnapshot): GoalsData | null {
  if (!snapshot.nextStep) return null;
  return {
    updatedAt: snapshot.nextStep.updatedAt,
    completedAt: snapshot.nextStep.completedAt,
    entries: snapshot.nextStep.goalEntries,
  };
}

export function getHabitsData(snapshot: ProfileSnapshot): HabitsData {
  return {
    habits: snapshot.trackedHabits,
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