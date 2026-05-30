/**
 * Pure calculation functions for Part Two (7-Day Energy Log) data.
 *
 * All functions are dependency-free and work with the types defined in
 * @/types/habit — no Prisma or Clerk imports needed.
 *
 * Usage:
 *   import { analyzePartTwoEnergy } from "@/lib/energy-analysis";
 *   const analysis = analyzePartTwoEnergy(partTwo.days);
 */

import type {
  AssessmentDayLog,
  EnergyAnalysis,
  HourEnergyStats,
  times,
} from "@/types/habit";

// ─── Hour ordering ────────────────────────────────────────────────────────────

/** All 24 hour labels in chronological order (matches the `times` union type). */
export const HOURS_IN_ORDER: times[] = [
  "12:00 AM",
  "01:00 AM",
  "02:00 AM",
  "03:00 AM",
  "04:00 AM",
  "05:00 AM",
  "06:00 AM",
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM",
  "10:00 PM",
  "11:00 PM",
];

// ─── Core aggregation ─────────────────────────────────────────────────────────

type EnergyBucket = {
  up: number;
  down: number;
  neutral: number;
  activities: string[];
};

/**
 * Aggregates hourly entries from all logged days into per-hour energy buckets,
 * then produces ranked results.
 *
 * Only hours that have at least `minDaysTracked` entries across the week are
 * included in the rankings (default 1 — include everything).
 */
export function analyzePartTwoEnergy(
  days: AssessmentDayLog[],
  minDaysTracked = 1,
): EnergyAnalysis {
  // ── Step 1: bucket entries by hour ────────────────────────────────────────
  const buckets = new Map<times, EnergyBucket>();

  for (const day of days) {
    for (const entry of day.entries ?? []) {
      if (!entry.hour || !entry.activity?.trim()) continue; // skip unlogged slots

      const hour = entry.hour as times;
      if (!buckets.has(hour)) {
        buckets.set(hour, { up: 0, down: 0, neutral: 0, activities: [] });
      }

      const bucket = buckets.get(hour)!;
      const level = (entry.energyLevel ?? "").toUpperCase();

      if (level === "UP") bucket.up++;
      else if (level === "DOWN") bucket.down++;
      else bucket.neutral++;

      if (entry.activity?.trim()) {
        bucket.activities.push(entry.activity.trim());
      }
    }
  }

  // ── Step 2: convert buckets → HourEnergyStats, in chronological order ────
  const hourStats: HourEnergyStats[] = [];

  for (const hour of HOURS_IN_ORDER) {
    const b = buckets.get(hour);
    if (!b) continue;

    const totalTracked = b.up + b.down + b.neutral;
    if (totalTracked < minDaysTracked) continue;

    const upRate = b.up / totalTracked;
    const downRate = b.down / totalTracked;
    // Score: +1 = always high energy, -1 = always low energy
    const energyScore = (b.up - b.down) / totalTracked;

    // Top 3 most-frequent activities for this hour
    const activityFrequency = new Map<string, number>();
    for (const act of b.activities) {
      activityFrequency.set(act, (activityFrequency.get(act) ?? 0) + 1);
    }
    const topActivities = [...activityFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([activity]) => activity);

    hourStats.push({
      hour,
      upCount: b.up,
      downCount: b.down,
      neutralCount: b.neutral,
      totalTracked,
      upRate,
      downRate,
      energyScore,
      topActivities,
    });
  }

  // ── Step 3: build rankings ────────────────────────────────────────────────
  const highEnergyRanking = [...hourStats].sort(
    (a, b) => b.energyScore - a.energyScore,
  );
  const lowEnergyRanking = [...hourStats].sort(
    (a, b) => a.energyScore - b.energyScore,
  );

  return {
    daysTracked: days.length,
    hourStats,
    highEnergyRanking,
    lowEnergyRanking,
    peakHour: highEnergyRanking[0] ?? null,
    lowestHour: lowEnergyRanking[0] ?? null,
  };
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Returns the top N highest-energy hours from a Part Two data set.
 * Defaults to 5.
 */
export function getHighEnergyHours(
  days: AssessmentDayLog[],
  n = 5,
): HourEnergyStats[] {
  return analyzePartTwoEnergy(days).highEnergyRanking.slice(0, n);
}

/**
 * Returns the top N lowest-energy hours from a Part Two data set.
 * Defaults to 5.
 */
export function getLowEnergyHours(
  days: AssessmentDayLog[],
  n = 5,
): HourEnergyStats[] {
  return analyzePartTwoEnergy(days).lowEnergyRanking.slice(0, n);
}

/**
 * Formats an energy score (-1 to +1) as a human-readable label.
 *   >= 0.5  → "High"
 *   <= -0.5 → "Low"
 *   else    → "Mixed"
 */
export function energyScoreLabel(score: number): "High" | "Mixed" | "Low" {
  if (score >= 0.5) return "High";
  if (score <= -0.5) return "Low";
  return "Mixed";
}

// ─── Day-level analysis ───────────────────────────────────────────────────────

/** Aggregated energy statistics for a single logged day. */
export interface DayEnergyStats {
  /** ISO date string, e.g. "2026-05-27" */
  date: string;
  /** 1-based day number within the tracking period */
  dayNumber: number;
  /** Number of hours that had an activity logged */
  totalLogged: number;
  upCount: number;
  downCount: number;
  neutralCount: number;
  upRate: number;
  downRate: number;
  /**
   * (upCount - downCount) / totalLogged.
   * +1 = all-UP day, -1 = all-DOWN day, 0 = balanced/no data.
   */
  energyScore: number;
}

/**
 * Returns per-day energy stats for each day in the tracking period.
 * Only hours where the user logged an activity are counted.
 */
export function analyzeDaysEnergy(days: AssessmentDayLog[]): DayEnergyStats[] {
  return days.map((day, i) => {
    const logged = day.entries.filter((e) => e.activity?.trim());

    const upCount = logged.filter((e) => e.energyLevel === "UP").length;
    const downCount = logged.filter((e) => e.energyLevel === "DOWN").length;
    const neutralCount = logged.filter((e) => e.energyLevel === "NEUTRAL").length;
    const total = logged.length;

    return {
      date: day.date,
      dayNumber: i + 1,
      totalLogged: total,
      upCount,
      downCount,
      neutralCount,
      upRate: total > 0 ? upCount / total : 0,
      downRate: total > 0 ? downCount / total : 0,
      energyScore: total > 0 ? (upCount - downCount) / total : 0,
    };
  });
}
