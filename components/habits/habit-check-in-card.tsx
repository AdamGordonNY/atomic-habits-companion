"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { actionToggleHabitCheckIn } from "@/lib/actions/habit-actions";

export interface CheckIn {
  date: string;       // YYYY-MM-DD
  completed: boolean;
  note: string;
}

interface HabitCheckInCardProps {
  habitId: string;
  habitName: string;
  habitCreatedAt: string; // ISO string
  checkIns: CheckIn[];
  /** Show habit name as a link to its page (dashboard). On habit page set false. */
  showLink?: boolean;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calcStreak(checkIns: CheckIn[], today: string): number {
  const completed = new Set(checkIns.filter((c) => c.completed).map((c) => c.date));
  // If today isn't checked yet, start streak from yesterday
  const start = completed.has(today) ? today : (() => {
    const d = new Date(today + "T00:00:00");
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  })();
  let streak = 0;
  const d = new Date(start + "T00:00:00");
  while (completed.has(d.toISOString().split("T")[0])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function fireEmojis(streak: number): string {
  const count = Math.min(Math.floor(streak / 3), 5);
  return "🔥".repeat(count);
}

// ─── component ───────────────────────────────────────────────────────────────

export function HabitCheckInCard({
  habitId,
  habitName,
  checkIns,
  showLink = true,
}: HabitCheckInCardProps) {
  const today = todayStr();
  const todayChecked = checkIns.some((c) => c.date === today && c.completed);

  const [optimisticChecked, addOptimistic] = useOptimistic(
    todayChecked,
    (_state: boolean, next: boolean) => next,
  );

  const [isPending, startTransition] = useTransition();
  const streak = calcStreak(checkIns, today);
  const fires = fireEmojis(streak);

  function toggle() {
    const next = !optimisticChecked;
    startTransition(async () => {
      addOptimistic(next);
      await actionToggleHabitCheckIn(habitId, today, next);
    });
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Checkbox */}
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        aria-label={optimisticChecked ? "Mark not done" : "Mark done today"}
        className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          optimisticChecked
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-slate-300 bg-white hover:border-emerald-400"
        }`}
      >
        {optimisticChecked && (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          {/* Habit name */}
          {showLink ? (
            <Link
              href={`/habits/${habitId}`}
              className="text-sm font-semibold text-slate-950 hover:text-slate-600 hover:underline underline-offset-2"
            >
              {habitName}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-slate-950">{habitName}</span>
          )}

          {/* Action buttons */}
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <Link
              href={`/notes/new?habitId=${habitId}`}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              ✏️ Note
            </Link>
          </div>
        </div>

        {/* Streak row */}
        <div className="mt-2 flex items-center justify-end gap-1 text-xs text-slate-500">
          {fires && <span className="text-sm leading-none">{fires}</span>}
          <span>
            {streak > 0 ? `${streak} day streak` : "No streak yet"}
          </span>
        </div>
      </div>
    </div>
  );
}
