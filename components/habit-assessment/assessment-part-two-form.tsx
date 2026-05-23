"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AssessmentDayLog,
  AssessmentEnergyDirection,
  HabitAssessmentPartTwo,
  times,
} from "@/types/habit";

// ─── constants ────────────────────────────────────────────────────────────────

const STORAGE_VERSION = 1;
const TOTAL_DAYS = 7;

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

// ─── helpers ──────────────────────────────────────────────────────────────────

function toIsoDate(d: Date): string {
  const c = new Date(d);
  c.setMinutes(c.getMinutes() - c.getTimezoneOffset());
  return c.toISOString().slice(0, 10);
}

function formatTabDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatHeaderDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function countFilled(day: AssessmentDayLog): number {
  return day.entries.filter((e) => e.activity.trim() !== "").length;
}

// ─── init ─────────────────────────────────────────────────────────────────────

function makeSevenDayLog(startDate: Date): AssessmentDayLog[] {
  return Array.from({ length: TOTAL_DAYS }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return {
      date: toIsoDate(d),
      entries: HOURS.map((hour) => ({ hour, activity: "", energyLevel: "UP" })),
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

// ─── storage ──────────────────────────────────────────────────────────────────

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
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const p = JSON.parse(raw) as StoredState;
    if (p.version !== STORAGE_VERSION || !p.draft) return null;
    return {
      dayIndex: typeof p.dayIndex === "number" ? p.dayIndex : 0,
      draft: p.draft,
      completedAt: p.completedAt ?? null,
    };
  } catch {
    return null;
  }
}

// ─── component ───────────────────────────────────────────────────────────────

interface AssessmentPartTwoFormProps {
  assessmentId: string;
}

export function AssessmentPartTwoForm({ assessmentId }: AssessmentPartTwoFormProps) {
  const storageKey = useMemo(
    () => `habit-assessment:${assessmentId}:part-two`,
    [assessmentId],
  );
  const router = useRouter();

  const [draft, setDraft] = useState<HabitAssessmentPartTwo>(() =>
    createDraft(assessmentId),
  );
  const [dayIndex, setDayIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");
  const [panelKey, setPanelKey] = useState(0);
  const [panelVisible, setPanelVisible] = useState(false);

  const tabStripRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // hydrate from localStorage + optional ?day= URL param
  useEffect(() => {
    const stored = readStoredState(storageKey);
    let initialDay = 0;
    try {
      const sp = new URLSearchParams(window.location.search);
      const dp = sp.get("day");
      if (dp !== null) {
        const n = parseInt(dp, 10);
        if (!isNaN(n) && n >= 0 && n < TOTAL_DAYS) initialDay = n;
      }
    } catch { /* ignore */ }

    if (stored) {
      setDraft(stored.draft);
      setDayIndex(Math.max(0, Math.min(initialDay || stored.dayIndex, TOTAL_DAYS - 1)));
    } else {
      setDayIndex(initialDay);
    }
    setHydrated(true);
  }, [storageKey]);

  // persist on every state change
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({ version: STORAGE_VERSION, dayIndex, draft, completedAt: null }),
    );
  }, [dayIndex, draft, hydrated, storageKey]);

  // animate panel on day switch
  useEffect(() => {
    setPanelVisible(false);
    const f1 = requestAnimationFrame(() => {
      setPanelKey((k) => k + 1);
      requestAnimationFrame(() => setPanelVisible(true));
    });
    return () => cancelAnimationFrame(f1);
  }, [dayIndex]);

  // scroll active tab into view
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [dayIndex]);

  function goToDay(index: number) {
    if (index === dayIndex) return;
    setSlideDir(index > dayIndex ? "right" : "left");
    setDayIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateDate(nextDate: string) {
    setDraft((c) => {
      const days = [...c.days];
      days[dayIndex] = { ...days[dayIndex], date: nextDate };
      return { ...c, days, updatedAt: new Date().toISOString() };
    });
  }

  function updateEntry(hourIndex: number, key: "activity" | "energyLevel", value: string) {
    setDraft((c) => {
      const days = [...c.days];
      const entries = [...days[dayIndex].entries];
      entries[hourIndex] = { ...entries[hourIndex], [key]: value } as typeof entries[0];
      days[dayIndex] = { ...days[dayIndex], entries };
      return { ...c, days, updatedAt: new Date().toISOString() };
    });
  }

  function setEnergy(hourIndex: number, level: AssessmentEnergyDirection) {
    updateEntry(hourIndex, "energyLevel", level);
  }

  function persist(completedAt: string | null) {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: STORAGE_VERSION,
        dayIndex,
        draft: { ...draft, updatedAt: new Date().toISOString() },
        completedAt,
      }),
    );
  }

  function saveAndExit() {
    persist(null);
    router.push("/dashboard");
  }

  function finishAll() {
    persist(new Date().toISOString());
    router.push("/dashboard");
  }

  const activeDay = draft.days[dayIndex];
  const isLastDay = dayIndex === TOTAL_DAYS - 1;
  const slideIn = slideDir === "right" ? "translate-x-4 opacity-0" : "-translate-x-4 opacity-0";

  return (
    <div className="flex min-h-screen flex-col">
      {/* sticky header + tab strip */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Part Two</p>
            <h1 className="text-base font-semibold text-slate-950">7-day energy log</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={saveAndExit}
              className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Save &amp; exit
            </button>
            {isLastDay && (
              <button
                type="button"
                onClick={finishAll}
                className="inline-flex h-9 items-center justify-center rounded-full bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Finish all 7
              </button>
            )}
          </div>
        </div>

        {/* scrollable day tab strip */}
        <div
          ref={tabStripRef}
          className="mx-auto mt-3 flex max-w-2xl gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {draft.days.map((day, i) => {
            const filled = countFilled(day);
            const isActive = i === dayIndex;
            return (
              <button
                key={day.date + i}
                ref={isActive ? activeTabRef : undefined}
                type="button"
                onClick={() => goToDay(i)}
                className={`flex flex-shrink-0 flex-col items-center gap-0.5 rounded-2xl px-3.5 py-2 text-center transition-all duration-200 ${
                  isActive
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide">Day {i + 1}</span>
                <span className={`text-[10px] ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                  {formatTabDate(day.date)}
                </span>
                {filled > 0 && (
                  <span className={`mt-0.5 h-1 w-1 rounded-full ${isActive ? "bg-emerald-400" : "bg-emerald-500"}`} />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* animated day panel */}
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <div
            key={panelKey}
            className={`transition-all duration-350 ease-out ${
              panelVisible ? "translate-x-0 opacity-100" : slideIn
            }`}
          >
            {/* day header */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{formatHeaderDate(activeDay.date)}</h2>
                <p className="text-xs text-slate-500">{countFilled(activeDay)} of {HOURS.length} hours logged</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-medium">Date</span>
                <input
                  type="date"
                  value={activeDay.date}
                  onChange={(e) => updateDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
                />
              </label>
            </div>

            {/* hour rows */}
            <div className="space-y-2">
              {activeDay.entries.map((entry, i) => (
                <HourRow
                  key={`${activeDay.date}-${entry.hour}`}
                  hour={entry.hour}
                  activity={entry.activity}
                  energyLevel={entry.energyLevel}
                  onActivity={(val) => updateEntry(i, "activity", val)}
                  onEnergy={(val) => setEnergy(i, val)}
                />
              ))}
            </div>

            {/* bottom nav */}
            <div className="mt-6 flex gap-3">
              {dayIndex > 0 && (
                <button
                  type="button"
                  onClick={() => goToDay(dayIndex - 1)}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  ← Day {dayIndex}
                </button>
              )}
              {!isLastDay ? (
                <button
                  type="button"
                  onClick={() => goToDay(dayIndex + 1)}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Day {dayIndex + 2} →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishAll}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Finish &amp; return to dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── HourRow ──────────────────────────────────────────────────────────────────

interface HourRowProps {
  hour: times;
  activity: string;
  energyLevel: AssessmentEnergyDirection;
  onActivity: (value: string) => void;
  onEnergy: (value: AssessmentEnergyDirection) => void;
}

function HourRow({ hour, activity, energyLevel, onActivity, onEnergy }: HourRowProps) {
  const filled = activity.trim() !== "";
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all duration-150 ${
        filled ? "border-slate-200 bg-white shadow-sm" : "border-slate-100 bg-slate-50/60"
      }`}
    >
      <span className="w-[4.5rem] flex-shrink-0 text-[11px] font-semibold text-slate-500">{hour}</span>
      <input
        type="text"
        value={activity}
        onChange={(e) => onActivity(e.target.value)}
        placeholder="Activity…"
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
      />
      <div className="flex flex-shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white p-0.5">
        <button
          type="button"
          onClick={() => onEnergy("UP")}
          className={`h-7 rounded-full px-2.5 text-[10px] font-bold transition-colors duration-150 ${
            energyLevel === "UP" ? "bg-emerald-500 text-white" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          UP
        </button>
        <button
          type="button"
          onClick={() => onEnergy("DOWN")}
          className={`h-7 rounded-full px-2.5 text-[10px] font-bold transition-colors duration-150 ${
            energyLevel === "DOWN" ? "bg-rose-500 text-white" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          DN
        </button>
      </div>
    </div>
  );
}
