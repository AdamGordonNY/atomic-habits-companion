"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchGoalEntryById, type GoalEntryData } from "@/lib/actions/next-step-actions";
import { actionCreateGoalChecklist, actionGetGoalChecklists } from "@/lib/checklists-actions";
import type { ChecklistRecord } from "@/types/checklist";

export function GoalPage({ goalId }: { goalId: string }) {
  const router = useRouter();
  const [goal, setGoal] = useState<GoalEntryData | null>(null);
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [g, c] = await Promise.all([
        fetchGoalEntryById(goalId),
        actionGetGoalChecklists(goalId),
      ]);
      if (cancelled) return;
      setGoal(g);
      setChecklists(c);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [goalId]);

  async function handleNewCheckIn() {
    if (!goal) return;
    setCreating(true);
    try {
      const checklist = await actionCreateGoalChecklist(goal.id, `Goal Check-in: ${goal.goal}`);
      router.push(`/checklists/${checklist.id}`);
    } catch (err) {
      console.error("[GoalPage] create checklist failed", err);
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
          <button
            type="button"
            onClick={handleNewCheckIn}
            disabled={creating}
            className="inline-flex h-8 items-center rounded-full bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {creating ? "Creating..." : "+ New goal check-in"}
          </button>
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

          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Goal check-ins
              </p>
              <button
                type="button"
                onClick={handleNewCheckIn}
                disabled={creating}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50"
              >
                + New
              </button>
            </div>

            {checklists.length === 0 ? (
              <button
                type="button"
                onClick={handleNewCheckIn}
                disabled={creating}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-transparent py-10 text-sm font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Start your first goal check-in"}
              </button>
            ) : (
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
                {checklists.map((cl) => (
                  <Link
                    key={cl.id}
                    href={`/checklists/${cl.id}`}
                    className="group flex min-w-[250px] flex-shrink-0 flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:translate-y-0"
                  >
                    <div>
                      <p className="line-clamp-1 text-sm font-semibold text-slate-900">{cl.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Updated {new Date(cl.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-600">Open check-in -&gt;</span>
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
