// ─── Shared ───────────────────────────────────────────────────────────────────

import { ChecklistRecord } from "./checklist";

export type Frequency = "daily" | "weekly";
export type AssessmentRating = 1 | 2 | 3 | 4 | 5;
export type AssessmentCategory = "personal" | "professional" | string;
export type AssessmentEnergyLevel = "UP" | "DOWN" | "NEUTRAL";
export type AssessmentEnergyDirection = "UP" | "DOWN";

export type times =
  | "12:00 AM" | "01:00 AM" | "02:00 AM" | "03:00 AM"
  | "04:00 AM" | "05:00 AM" | "06:00 AM" | "07:00 AM"
  | "08:00 AM" | "09:00 AM" | "10:00 AM" | "11:00 AM"
  | "12:00 PM" | "01:00 PM" | "02:00 PM" | "03:00 PM"
  | "04:00 PM" | "05:00 PM" | "06:00 PM" | "07:00 PM"
  | "08:00 PM" | "09:00 PM" | "10:00 PM" | "11:00 PM";

// ─── Core domain: Identity → Goal → Habit → CheckIn ─────────────────────────

export interface HabitCheckIn {
  id: string;
  habitId: string;
  date: string;        // YYYY-MM-DD
  completed: boolean;
  note: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  goalId: string;
  name: string;
  category?: string;
  mode: "building" | "breaking";
  cue: string;         // implementation intention description
  time: string;        // e.g. "08:00 AM"
  location: string;
  createdAt: string;
  updatedAt: string;
  // Populated relations — optional so they don't have to be fetched every time
  checkIns?: HabitCheckIn[];
  checklists?: ChecklistRecord[];
}

export interface Goal {
  id: string;
  identityId: string;
  text: string;
  category?: string;
  currentSystem: string;
  systemEval: string;
  systemRating: 0 | 1 | 2 | 3 | 4 | 5;
  idealSystem: string;
  // Populated relations
  habits?: Habit[];
}

export interface Identity {
  id: string;
  name: string;
  category?: string;
  // Populated relations
  goals?: Goal[];
}
export interface Habit {
  id: string;
  habitName: string;
  why: string;
  frequency: Frequency;
  currentStreak: number;
  lastCompletedDate: string | null; // ISO 8601 date string, e.g. "2026-05-21"
  createdDate: string;              // ISO 8601 date string
  completionHistory: string[];      // Array of ISO 8601 date strings
}

export interface HabitEntry {
  id: string;
  habitId: string; // References Habit.id
  date: string; // ISO 8601 date string for the log entry
  completed: boolean;
  notes?: string; // Optional reflection or notes for the day
}

export interface HabitAssessment {
  id: string;
  category: AssessmentCategory;
  question: string;
  pageOrder: number; // Each question should be shown on its own page
  rating?: AssessmentRating; // User's rating for the question, e.g. 1-5
  options?: string[]; // Possible answers for non-rating questions
  obligations?: string[]; // Optional list of obligations or actions based on the assessment
}

// ─── Assessment wizard (onboarding only — read-only after completion) ─────────

export interface HabitAssessment {
  id: string;
  category: AssessmentCategory;
  question: string;
  pageOrder: number;
  rating?: AssessmentRating;
  options?: string[];
  obligations?: string[];
}

export interface AssessmentCalendar {
  id: string;
  date: string;
  hour: times;
  energyLevel: AssessmentEnergyLevel;
}

export interface AssessmentHourlyEntry {
  hour: times;
  activity: string;
  energyLevel: AssessmentEnergyLevel;
}

export interface AssessmentDayLog {
  date: string;
  entries: AssessmentHourlyEntry[];
}

export interface HabitAssessmentPartTwo {
  id: string;
  days: AssessmentDayLog[];
  updatedAt: string;
}

// ─── Part Two — Energy Analysis ───────────────────────────────────────────────

export interface HourEnergyStats {
  hour: times;
  upCount: number;
  downCount: number;
  neutralCount: number;
  totalTracked: number;
  upRate: number;
  downRate: number;
  energyScore: number;
  topActivities: string[];
}

export interface ActivityStats {
  activity: string;
  count: number;
  topHours: times[];
  upCount: number;
  downCount: number;
  neutralCount: number;
  dominantEnergy: AssessmentEnergyLevel;
  energyScore: number;
}

export interface EnergyAnalysis {
  daysTracked: number;
  hourStats: HourEnergyStats[];
  highEnergyRanking: HourEnergyStats[];
  lowEnergyRanking: HourEnergyStats[];
  peakHour: HourEnergyStats | null;
  lowestHour: HourEnergyStats | null;
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export type ProfileEntityType =
  | "commitments"
  | "ideals"
  | "vision"
  | "identities"
  | "goals"
  | "habits";

export interface Note {
  id: string;
  title: string;
  content: string;       // TipTap JSON serialised as string
  contentText: string;   // Plain-text excerpt for previews
  createdAt: string;
  updatedAt: string;
  tags: string[];
  pinned: boolean;
  profileEntityType: ProfileEntityType | null;
  profileEntityId: string | null;
}

// ─── Part Three ───────────────────────────────────────────────────────────────

export interface WizardHabitRecord {
  habit: string;
  explanation: string;
}

export interface WizardHabitAttempt {
  habit: string;
  mode: "building" | "breaking";
  whatDidntWork: string;
  obstacle: string;
}

export interface HabitInventoryEntry {
  habit: string;
  score: "+" | "-";
  reasoning: string;
}

export interface HabitInventoryScorecard {
  entries: HabitInventoryEntry[];
  takeaway: string;
  wantToAdd: string[];
  wantToRemove: string[];
}

export interface HabitAssessmentPartThree {
  id: string;
  majorTimeSpends: string[];
  highEnergyHoursPerDay: number | null;
  highEnergyHoursList: string[];
  highEnergyActivities: string;
  lowEnergyHours: string[];
  wantHighEnergySpend: string[];
  wantLowEnergySpend: string[];
  timeSinksReflection: string;
  stressSource: string;
  anticipatedChanges: string;
  beneficialHabits: WizardHabitRecord[];
  successfulHabits: WizardHabitRecord[];
  stickinessPatterns: string;
  habitAttempts: WizardHabitAttempt[];
  morningScorecard: HabitInventoryScorecard;
  afternoonScorecard: HabitInventoryScorecard;
  eveningScorecard: HabitInventoryScorecard;
  finalReflection: string;
  part1WrapUpReflection: string;
  updatedAt: string;
  completedAt: string | null;
}
// ─── Part Four — Ideal Life Design ───────────────────────────────────────────

export interface DomainVision {
  domain: string;
  vision: string;
}

// WizardIdentityEntry is the wizard's in-progress shape.
// After completion it becomes a proper Identity row (with Goal[] children).
export interface WizardIdentityEntry {
  id?: string;
  identity: string;
  habits: string[];   // plain text — seeded into Goal/Habit rows on completion
  category?: string | null;
}

export const LIFE_DOMAINS = [
  "Physical Health", "Mental Health", "Career",
  "Relationships & Social Connections", "Learning & Personal Growth",
  "Financial Security", "Financial Freedom", "Recreation & Fun",
  "Creativity", "Community & Contribution", "Spirituality",
  "Family", "Legacy",
] as const;

export type LifeDomain = (typeof LIFE_DOMAINS)[number];

export interface HabitAssessmentPartFour {
  id: string;
  updatedAt: string;
  completedAt: string | null;
  existingCommitments: string[];
  desiredCommitments: string[];
  unwantedCommitments: string[];
  idealMorning: string;
  idealAfternoon: string;
  idealEvening: string;
  cleanSlateReflection: string;
  majorGoals: string[];
  vision6Months: string;
  vision2Years: string;
  vision5Years: string;
  majorChanges: string[];
  successDefinition: string;
  domainVisions: DomainVision[];
  identities: WizardIdentityEntry[];   // renamed from IdentityEntry
  futureReflection: string;
  reflectionGoals: string[];
}