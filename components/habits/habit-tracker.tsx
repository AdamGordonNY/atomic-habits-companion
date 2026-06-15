"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchNextStep } from "@/lib/actions/next-step-actions";
import { actionGetChecklists, actionCreateChecklist } from "@/lib/checklists-actions";
import type { ChecklistRecord } from "@/types/checklist";

interface GoalContext {
  goal: string;
  systemEval: string;
  idealSystem: string;
}

export function HabitTracker({ habitName }: { habitName: string }) {
  const router = useRouter();
  const [goalContext, setGoalContext] = useState<GoalContext | null>(null);
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function load() {
      const [nextStepData, allChecklists] = await Promise.all([
        fetchNextStep(),
        actionGetChecklists(),
      ]);

      // Find the goal entry that owns this habit
      const entry = nextStepData?.goalEntries.find((e) =>
        e.componentHabits.includes(habitName)
      );
      if (entry) {
        setGoalContext({
          goal: entry.goal,
          systemEval: entry.systemEval,
          idealSystem: entry.idealSystem,
        });
      }

      // Filter checklists by title match (exact or contains)
      const lower = habitName.toLowerCase();
      setChecklists(
        allChecklists.filter(
          (c) =>
            c.title.toLowerCase() === lower ||
            c.title.toLowerCase().includes(lower)
        )
      );

      setLoading(false);
    }
    load();
  }, [habitName]);

  async function startChecklist() {
    setCreating(true);
    try {
      const cl = await actionCreateChecklist(habitName, "habit-tracking");
      router.push(`/checklists/${cl.id}`);
    } catch (err) {
      console.error(err);
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="flex-shrink-0 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              ← Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="truncate text-sm font-semibold text-slate-900">{habitName}</h1>
          </div>
          <button
            type="button"
            onClick={startChecklist}
            disabled={creating}
            className="inline-flex h-8 flex-shrink-0 items-center rounded-full bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {creating ? "Creating…" : "+ New checklist"}
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 py-8">
        <div className="mx-auto max-w-2xl space-y-6">

          {/* Habit title */}
          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              {habitName}
            </h2>
          </section>

          {/* Goal context */}
          {goalContext && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Goal context
              </p>
              <p className="text-sm font-semibold text-slate-900">{goalContext.goal}</p>

              {goalContext.idealSystem && (
                <div className="mt-4">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Ideal system
                  </p>
                  <p className="text-sm leading-relaxed text-slate-600">{goalContext.idealSystem}</p>
                </div>
              )}

              {goalContext.systemEval && (
                <div className="mt-4">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Current evaluation
                  </p>
                  <p className="text-sm leading-relaxed text-slate-600">{goalContext.systemEval}</p>
                </div>
              )}
            </section>
          )}

          {/* Checklists section */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Checklists
              </p>
              <button
                type="button"
                onClick={startChecklist}
                disabled={creating}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50"
              >
                + New
              </button>
            </div>

            {checklists.length === 0 ? (
              <button
                type="button"
                onClick={startChecklist}
                disabled={creating}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-transparent py-10 text-sm font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700 disabled:opacity-50"
              >
                {creating ? "Creating…" : "Start your first checklist for this habit"}
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                {checklists.map((cl) => (
                  <Link
                    key={cl.id}
                    href={`/checklists/${cl.id}`}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:translate-y-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{cl.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {cl.content.length} habit{cl.content.length !== 1 ? "s" : ""} ·{" "}
                        Updated{" "}
                        {new Date(cl.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
