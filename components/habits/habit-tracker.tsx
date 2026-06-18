"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchNextStep } from "@/lib/actions/next-step-actions";
import { actionGetChecklists, actionCreateChecklist } from "@/lib/checklists-actions";
import {
  actionUpsertTrackedHabit,
  actionUpdateHabitCategory,
} from "@/lib/actions/habit-actions";
import type { ChecklistRecord } from "@/types/checklist";

interface GoalContext {
  goal: string;
  systemEval: string;
  idealSystem: string;
}

export function HabitTracker({ habitName }: { habitName: string }) {
  const router = useRouter();
  const [habitId, setHabitId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");
  const [editingCategory, setEditingCategory] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [goalContext, setGoalContext] = useState<GoalContext | null>(null);
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const [tracked, nextStepData, allChecklists] = await Promise.all([
        // Auto-save this habit to the TrackedHabit table
        actionUpsertTrackedHabit(habitName),
        fetchNextStep(),
        actionGetChecklists(),
      ]);

      setHabitId(tracked.id);
      setCategory(tracked.category ?? "");

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

  // Focus the category input when editing starts
  useEffect(() => {
    if (editingCategory) categoryInputRef.current?.focus();
  }, [editingCategory]);

  async function saveCategory() {
    if (!habitId) return;
    setSavingCategory(true);
    const trimmed = categoryInput.trim() || null;
    await actionUpdateHabitCategory(habitId, trimmed);
    setCategory(trimmed ?? "");
    setEditingCategory(false);
    setSavingCategory(false);
  }

  function startEditCategory() {
    setCategoryInput(category);
    setEditingCategory(true);
  }

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
            {category && (
              <>
                <Link
                  href={`/habits/category/${encodeURIComponent(category)}`}
                  className="hidden text-xs font-medium text-slate-500 hover:text-slate-800 sm:block"
                >
                  {category}
                </Link>
                <span className="hidden text-slate-300 sm:block">/</span>
              </>
            )}
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

          {/* Habit title + category */}
          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{habitName}</h2>

            {/* Category badge / editor */}
            <div className="mt-2 flex items-center gap-2">
              {editingCategory ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={categoryInputRef}
                    type="text"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveCategory();
                      if (e.key === "Escape") setEditingCategory(false);
                    }}
                    placeholder="e.g. Health, Learning…"
                    className="h-7 rounded-full border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-100"
                  />
                  <button
                    type="button"
                    onClick={saveCategory}
                    disabled={savingCategory}
                    className="text-xs font-semibold text-slate-800 hover:text-slate-950 disabled:opacity-50"
                  >
                    {savingCategory ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCategory(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : category ? (
                <button
                  type="button"
                  onClick={startEditCategory}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Link
                    href={`/habits/category/${encodeURIComponent(category)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-slate-950"
                  >
                    {category}
                  </Link>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-400 group-hover:text-slate-600">edit</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startEditCategory}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add category
                </button>
              )}
            </div>
          </section>

          {/* Goal context card */}
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
