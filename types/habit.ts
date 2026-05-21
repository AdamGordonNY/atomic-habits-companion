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
  energyLevel: AssessmentEnergyDirection;
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