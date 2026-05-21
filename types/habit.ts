export type Frequency = "daily" | "weekly";

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
  habitId: string;       // References Habit.id
  date: string;          // ISO 8601 date string for the log entry
  completed: boolean;
  notes?: string;        // Optional reflection or notes for the day
}
