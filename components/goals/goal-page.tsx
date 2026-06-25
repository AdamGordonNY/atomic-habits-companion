"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchGoalEntryById, type GoalEntryData } from "@/lib/actions/next-step-actions";
import { actionCreateHabitChecklist, actionGetHabitChecklists } from "@/lib/checklists-actions";
import {
  actionCreateHabitCue,
  actionGetHabitCues,
  actionGetOrCreateHabitsForGoal,
  actionUpdateHabitCueReflection,
  type HabitCueData,
  type TrackedHabitData,
} from "@/lib/actions/habit-actions";
import type { ChecklistRecord } from "@/types/checklist";

export function GoalPage({ goalId }: { goalId: string }) {
  const router = useRouter();
  const [goal, setGoal] = useState<GoalEntryData | null>(null);
  const [habits, setHabits] = useState<TrackedHabitData[]>([]);
  const [checklistsByHabit, setChecklistsByHabit] = useState<Record<string, ChecklistRecord[]>>({});
  const [cuesByHabit, setCuesByHabit] = useState<Record<string, HabitCueData[]>>({});
  const [selectedHabitId, setSelectedHabitId] = useState("");
  const [behavior, setBehavior] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [isBreaking, setIsBreaking] = useState(false);
  const [savingCue, setSavingCue] = useState(false);
  const [reflectingCueId, setReflectingCueId] = useState<string | null>(null);
  const [reflectionDraft, setReflectionDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingForHabitId, setCreatingForHabitId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [g, hs] = await Promise.all([fetchGoalEntryById(goalId), actionGetOrCreateHabitsForGoal(goalId)]);
      if (cancelled) return;
      setGoal(g);

      const checklistPairs = await Promise.all(
        hs.map(async (h) => [h.id, await actionGetHabitChecklists(h.id, h.name)] as const),
      );
      const cuePairs = await Promise.all(
        hs.map(async (h) => [h.id, await actionGetHabitCues(h.id)] as const),
      );

      if (cancelled) return;
      setHabits(hs);
      setChecklistsByHabit(Object.fromEntries(checklistPairs));
      setCuesByHabit(Object.fromEntries(cuePairs));
      if (hs.length > 0) setSelectedHabitId(hs[0].id);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [goalId]);

  async function handleNewCheckIn(habit: TrackedHabitData) {
    setCreatingForHabitId(habit.id);
    try {
      const checklist = await actionCreateHabitChecklist(habit.id, habit.name);
      router.push(`/checklists/${checklist.id}`);
    } catch (err) {
      console.error("[GoalPage] create habit checklist failed", err);
      setCreatingForHabitId(null);
    }
  }

  async function handleSaveCue() {
    if (!selectedHabitId || !behavior.trim() || !time.trim() || !location.trim()) return;
    setSavingCue(true);
    try {
      const cue = await actionCreateHabitCue({
        habitId: selectedHabitId,
        behavior: behavior.trim(),
        time: time.trim(),
        location: location.trim(),
        isBreaking,
      });
      setCuesByHabit((prev) => ({
        ...prev,
        [selectedHabitId]: [cue, ...(prev[selectedHabitId] ?? [])],
      }));
      setBehavior("");
      setTime("");
      setLocation("");
      setIsBreaking(false);
    } catch (err) {
      console.error("[GoalPage] save cue failed", err);
    } finally {
      setSavingCue(false);
    }
  }

  async function saveReflection(cueId: string, habitId: string) {
    await actionUpdateHabitCueReflection(cueId, reflectionDraft);
    setCuesByHabit((prev) => ({
      ...prev,
      [habitId]: (prev[habitId] ?? []).map((c) =>
        c.id === cueId ? { ...c, reflection: reflectionDraft, updatedAt: new Date().toISOString() } : c,
      ),
    }));
    setReflectingCueId(null);
    setReflectionDraft("");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Goal not found.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/dashboard" className="text-xs font-medium text-slate-500 hover:text-slate-800">
              &lt; Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="truncate text-sm font-semibold text-slate-900">Goal</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Goal</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{goal.goal}</h2>
            {goal.idealSystem && (
              <p className="mt-3 text-sm text-slate-600">Ideal system: {goal.idealSystem}</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Cue Crafting
            </p>
            <p className="mb-3 text-xs text-slate-500">
              Brainstorm an implementation plan in the form of
              {" "}<span className="font-semibold">I will{isBreaking ? " not" : ""} (behavior) at (time) and (location)</span>.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={selectedHabitId}
                onChange={(e) => setSelectedHabitId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
              >
                {habits.length === 0 ? (
                  <option value="">No habits available</option>
                ) : (
                  habits.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))
                )}
              </select>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Breaking habit
              </label>
              <input
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
                placeholder="Behavior"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
              />
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="Time"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
              />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveCue}
              disabled={savingCue || !selectedHabitId}
              className="mt-3 inline-flex h-8 items-center rounded-full bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {savingCue ? "Saving..." : "Save cue"}
            </button>
          </section>

          <section className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Habits for this goal
            </p>
            {habits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
                No habits associated with this goal yet.
              </div>
            ) : (
              habits.map((habit) => {
                const habitChecklists = checklistsByHabit[habit.id] ?? [];
                const habitCues = cuesByHabit[habit.id] ?? [];
                return (
                  <article key={habit.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <Link href={`/habits/${habit.id}`} className="text-sm font-semibold text-slate-900 hover:text-slate-700">
                        {habit.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleNewCheckIn(habit)}
                        disabled={creatingForHabitId === habit.id}
                        className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50"
                      >
                        {creatingForHabitId === habit.id ? "Creating..." : "+ New checklist"}
                      </button>
                    </div>

                    <div className="mb-4 -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
                      {habitChecklists.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs text-slate-500">
                          No checklists yet.
                        </p>
                      ) : (
                        habitChecklists.map((cl) => (
                          <Link
                            key={cl.id}
                            href={`/checklists/${cl.id}`}
                            className="group flex min-w-[220px] flex-shrink-0 flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300 hover:bg-white"
                          >
                            <p className="line-clamp-1 text-sm font-medium text-slate-900">{cl.title}</p>
                            <p className="text-xs text-slate-500">
                              Updated {new Date(cl.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </Link>
                        ))
                      )}
                    </div>

                    <div className="space-y-3">
                      {habitCues.length === 0 ? (
                        <p className="text-xs text-slate-500">No cue crafting entries yet for this habit.</p>
                      ) : (
                        habitCues.map((cue) => (
                          <div key={cue.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-sm text-slate-800">
                              I will{cue.isBreaking ? " not" : ""} <span className="font-semibold">{cue.behavior}</span> at
                              {" "}<span className="font-semibold">{cue.time}</span> and
                              {" "}<span className="font-semibold">{cue.location}</span>.
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                              Were you able to follow through with the plan? Why or why not? Do you want to adjust anything about your implementation intention or choose a new time and location and try again next week?
                            </p>
                            {reflectingCueId === cue.id ? (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  value={reflectionDraft}
                                  onChange={(e) => setReflectionDraft(e.target.value)}
                                  rows={3}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                                  placeholder="Add your one-week reflection..."
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => saveReflection(cue.id, habit.id)}
                                    className="inline-flex h-7 items-center rounded-full bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800"
                                  >
                                    Save reflection
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setReflectingCueId(null)}
                                    className="text-xs text-slate-500 hover:text-slate-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2">
                                {cue.reflection ? (
                                  <p className="text-sm text-slate-700">{cue.reflection}</p>
                                ) : (
                                  <p className="text-xs text-slate-500">No reflection yet.</p>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReflectingCueId(cue.id);
                                    setReflectionDraft(cue.reflection ?? "");
                                  }}
                                  className="mt-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                                >
                                  {cue.reflection ? "Edit reflection" : "Add one-week reflection"}
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
