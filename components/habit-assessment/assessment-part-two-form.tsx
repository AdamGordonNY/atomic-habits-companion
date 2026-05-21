"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  AssessmentDayLog,
  AssessmentEnergyDirection,
  HabitAssessmentPartTwo,
  times,
} from "@/types/habit";

const STORAGE_VERSION = 1;

const HOURS: times[] = [
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

function toIsoDate(date: Date): string {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function makeSevenDayLog(startDate: Date): AssessmentDayLog[] {
  return Array.from({ length: 7 }).map((_, dayIndex) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + dayIndex);

    return {
      date: toIsoDate(date),
      entries: HOURS.map((hour) => ({
        hour,
        activity: "",
        energyLevel: "UP",
      })),
    };
  });
}

function createDraft(assessmentId: string): HabitAssessmentPartTwo {
  return {
    id: assessmentId,
    days: makeSevenDayLog(new Date()),
    updatedAt: new Date().toISOString(),
  };
}

interface StoredState {
  version?: number;
  dayIndex?: number;
  draft?: HabitAssessmentPartTwo;
  completedAt?: string | null;
}

function readStoredState(storageKey: string): {
  dayIndex: number;
  draft: HabitAssessmentPartTwo;
  completedAt: string | null;
} | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredState;
    if (parsed.version !== STORAGE_VERSION || !parsed.draft) {
      return null;
    }

    return {
      dayIndex: typeof parsed.dayIndex === "number" ? parsed.dayIndex : 0,
      draft: parsed.draft,
      completedAt: parsed.completedAt ?? null,
    };
  } catch {
    return null;
  }
}

interface AssessmentPartTwoFormProps {
  assessmentId: string;
}

export function AssessmentPartTwoForm({ assessmentId }: AssessmentPartTwoFormProps) {
  const storageKey = useMemo(
    () => `habit-assessment:${assessmentId}:part-two`,
    [assessmentId],
  );

  const [draft, setDraft] = useState<HabitAssessmentPartTwo>(() =>
    createDraft(assessmentId),
  );
  const [dayIndex, setDayIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [cardVisible, setCardVisible] = useState(false);

  useEffect(() => {
    const stored = readStoredState(storageKey);
    if (stored) {
      setDraft(stored.draft);
      setDayIndex(Math.max(0, Math.min(stored.dayIndex, 6)));
      setCompletedAt(stored.completedAt);
    }

    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: STORAGE_VERSION,
        dayIndex,
        draft,
        completedAt,
      }),
    );
  }, [completedAt, dayIndex, draft, hydrated, storageKey]);

  useEffect(() => {
    setCardVisible(false);
    const frame = window.requestAnimationFrame(() => setCardVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [dayIndex]);

  const activeDay = draft.days[dayIndex];

  function updateDate(nextDate: string) {
    setDraft((current) => {
      const nextDays = [...current.days];
      nextDays[dayIndex] = {
        ...nextDays[dayIndex],
        date: nextDate,
      };

      return {
        ...current,
        updatedAt: new Date().toISOString(),
        days: nextDays,
      };
    });
  }

  function updateEntry(
    hourIndex: number,
    key: "activity" | "energyLevel",
    value: string,
  ) {
    setDraft((current) => {
      const nextDays = [...current.days];
      const nextEntries = [...nextDays[dayIndex].entries];
      const entry = nextEntries[hourIndex];

      nextEntries[hourIndex] = {
        ...entry,
        [key]: value,
      } as typeof entry;

      nextDays[dayIndex] = {
        ...nextDays[dayIndex],
        entries: nextEntries,
      };

      return {
        ...current,
        updatedAt: new Date().toISOString(),
        days: nextDays,
      };
    });
  }

  function setEnergyLevel(hourIndex: number, level: AssessmentEnergyDirection) {
    updateEntry(hourIndex, "energyLevel", level);
  }

  const isFirstDay = dayIndex === 0;
  const isLastDay = dayIndex === 6;

  function goBackDay() {
    if (!isFirstDay) {
      setDayIndex((current) => current - 1);
    }
  }

  function goNextDay() {
    if (!isLastDay) {
      setDayIndex((current) => current + 1);
      return;
    }

    setCompletedAt(new Date().toISOString());
  }

  if (completedAt) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
        <section className="w-full rounded-[2rem] border border-white/15 bg-white/80 p-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-2xl text-emerald-600">
            ✓
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Part Two saved.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Your 7-day hourly check-in is saved to localStorage for this
            assessment id.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setCompletedAt(null)}
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
            >
              Review log
            </button>
            <Link
              href={`/habit-assessment/${assessmentId}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Back to Part One
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-start px-6 py-12">
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Habit assessment · part two
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Hour-by-hour log for 7 days
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-right">
            Each row tracks the date, hour, activity, and energy level as UP
            or DOWN.
          </p>
        </div>

        <section
          className={`overflow-hidden rounded-[2rem] border border-white/15 bg-white/80 shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-500 ${
            cardVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">
                Day {dayIndex + 1} of 7
              </p>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                Date
                <input
                  type="date"
                  value={activeDay.date}
                  onChange={(event) => updateDate(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
                />
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBackDay}
                disabled={isFirstDay}
                className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              >
                Previous day
              </button>
              <button
                type="button"
                onClick={goNextDay}
                className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
              >
                {isLastDay ? "Finish" : "Next day"}
              </button>
            </div>
          </div>

          <div className="max-h-[65vh] overflow-auto p-4 sm:p-6">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Hour</th>
                  <th className="px-3 py-2">Activity</th>
                  <th className="px-3 py-2">Energy</th>
                </tr>
              </thead>
              <tbody>
                {activeDay.entries.map((entry, index) => (
                  <tr
                    key={`${activeDay.date}-${entry.hour}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70"
                  >
                    <td className="px-3 py-2 text-sm text-slate-600">{activeDay.date}</td>
                    <td className="px-3 py-2 text-sm font-medium text-slate-700">
                      {entry.hour}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={entry.activity}
                        onChange={(event) =>
                          updateEntry(index, "activity", event.target.value)
                        }
                        placeholder="What were you doing?"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white p-1">
                        <button
                          type="button"
                          onClick={() => setEnergyLevel(index, "UP")}
                          className={`h-8 rounded-full px-3 text-xs font-semibold transition ${
                            entry.energyLevel === "UP"
                              ? "bg-emerald-500 text-white"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          UP
                        </button>
                        <button
                          type="button"
                          onClick={() => setEnergyLevel(index, "DOWN")}
                          className={`h-8 rounded-full px-3 text-xs font-semibold transition ${
                            entry.energyLevel === "DOWN"
                              ? "bg-rose-500 text-white"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          DOWN
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}