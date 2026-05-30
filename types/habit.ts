export type Frequency = "daily" | "weekly";

export type AssessmentRating = 1 | 2 | 3 | 4 | 5;

export type AssessmentCategory = "personal" | "professional" | string;

export type AssessmentEnergyLevel = "UP" | "DOWN" | "NEUTRAL";
export type AssessmentEnergyDirection = "UP" | "DOWN";

export type times =
  | "12:00 AM"
  | "01:00 AM"
  | "02:00 AM"
  | "03:00 AM"
  | "04:00 AM"
  | "05:00 AM"
  | "06:00 AM"
  | "07:00 AM"
  | "08:00 AM"
  | "09:00 AM"
  | "10:00 AM"
  | "11:00 AM"
  | "12:00 PM"
  | "01:00 PM"
  | "02:00 PM"
  | "03:00 PM"
  | "04:00 PM"
  | "05:00 PM"
  | "06:00 PM"
  | "07:00 PM"
  | "08:00 PM"
  | "09:00 PM"
  | "10:00 PM"
  | "11:00 PM";

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

export interface AssessmentCalendar {
  id: string;
  date: string; // ISO 8601 date string for the assessment entry
  hour: times;
  energyLevel: AssessmentEnergyLevel; // User's energy level at the time of assessment
}

export interface AssessmentHourlyEntry {
  hour: times;
  activity: string;
  energyLevel: AssessmentEnergyLevel;
}

export interface AssessmentDayLog {
  date: string; // ISO 8601 date string
  entries: AssessmentHourlyEntry[];
}

export interface HabitAssessmentPartTwo {
  id: string;
  days: AssessmentDayLog[]; // 7 day logs with hour-by-hour entries
  updatedAt: string;
}

export type AsessmentCalendar = AssessmentCalendar;

// ─── Part Two — Energy Analysis ───────────────────────────────────────────────

/**
 * Aggregated energy statistics for a single hour slot across all tracked days.
 * All rate and score fields are in the range [0, 1] or [-1, 1].
 */
export interface HourEnergyStats {
  /** The clock hour this row describes, e.g. "09:00 AM" */
  hour: times;
  /** Number of days this hour was logged as UP */
  upCount: number;
  /** Number of days this hour was logged as DOWN */
  downCount: number;
  /** Number of days this hour was logged as NEUTRAL */
  neutralCount: number;
  /** Total days where any entry existed for this hour */
  totalTracked: number;
  /** Fraction of tracked days that were UP (0–1) */
  upRate: number;
  /** Fraction of tracked days that were DOWN (0–1) */
  downRate: number;
  /**
   * Composite energy score = (upCount - downCount) / totalTracked.
   * +1 = always high energy, -1 = always low energy, 0 = balanced / neutral.
   */
  energyScore: number;
  /** Up to 3 most-frequently logged activities during this hour */
  topActivities: string[];
}

/** Aggregated stats for a single recurring activity phrase across the 7-day log. */
export interface ActivityStats {
  /** The activity as the user typed it (original casing of first occurrence) */
  activity: string;
  /** Total times this activity appeared across all logged days */
  count: number;
  /** Up to 3 most common hours this activity occurs at, in chronological order */
  topHours: times[];
  upCount: number;
  downCount: number;
  neutralCount: number;
  /** Most common energy level for this activity */
  dominantEnergy: AssessmentEnergyLevel;
  /** (upCount - downCount) / count; range -1 to +1 */
  energyScore: number;
}

/** Full result of running analyzePartTwoEnergy() on a Part Two data set. */
export interface EnergyAnalysis {
  /** Number of days that were analysed */
  daysTracked: number;
  /** All hours that had at least one entry, in chronological order */
  hourStats: HourEnergyStats[];
  /** Same hours sorted by energyScore descending (best first) */
  highEnergyRanking: HourEnergyStats[];
  /** Same hours sorted by energyScore ascending (worst first) */
  lowEnergyRanking: HourEnergyStats[];
  /** The single hour with the highest energy score, or null if no data */
  peakHour: HourEnergyStats | null;
  /** The single hour with the lowest energy score, or null if no data */
  lowestHour: HourEnergyStats | null;
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string;       // TipTap JSON serialised as string
  contentText: string;   // Plain-text excerpt for previews
  createdAt: string;     // ISO 8601
  updatedAt: string;     // ISO 8601
  tags: string[];
  pinned: boolean;
}

// ─── Part Three ───────────────────────────────────────────────────────────────

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

export interface HabitRecord {
  habit: string;
  explanation: string;
}

export interface HabitAttempt {
  habit: string;
  mode: "building" | "breaking";
  whatDidntWork: string;
  obstacle: string;
}

export interface HabitAssessmentPartThree {
  id: string;

  // Section 1 – Time & Energy Mapping
  majorTimeSpends: string[];          // Q1  – major ways time is spent
  highEnergyHoursPerDay: number | null; // Q2a – typical # of high-energy hours
  highEnergyHoursList: string[];      // Q2b – which hours they are
  highEnergyActivities: string;       // Q3  – activities in high-energy hours
  lowEnergyHours: string[];           // Q4  – low-energy hours
  wantHighEnergySpend: string[];      // Q5a – how they want to use high-energy hours
  wantLowEnergySpend: string[];       // Q5b – how they want to use low-energy hours

  // Section 2 – Big Picture
  timeSinksReflection: string;        // Q6
  stressSource: string;               // Q7
  anticipatedChanges: string;         // Q8

  // Section 3 – Past Habit History
  beneficialHabits: HabitRecord[];    // Q9
  successfulHabits: HabitRecord[];    // Q10
  stickinessPatterns: string;         // Q11

  // Section 4 – Building / Breaking
  habitAttempts: HabitAttempt[];      // Q12

  // Section 5 – Habit Inventory
  morningScorecard: HabitInventoryScorecard;    // Q13
  afternoonScorecard: HabitInventoryScorecard;  // Q14
  eveningScorecard: HabitInventoryScorecard;    // Q15

  // Section 6 – Final Reflection
  finalReflection: string;            // Q16

  // Section 7 – Part 1 Wrap-Up
  part1WrapUpReflection: string;      // Q17 — reflects on the entire assessment so far

  updatedAt: string;
  completedAt: string | null;
}