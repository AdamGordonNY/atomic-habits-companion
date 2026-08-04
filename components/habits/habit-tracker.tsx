"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchNextStep } from "@/lib/actions/assessment-next-step-actions";
import { actionCreateHabitChecklist, actionGetHabitChecklists } from "@/lib/checklists-actions";
import {
  actionAttachHabitToGoal,
  actionAttachHabitToIdentity,
  actionGetTrackedHabitById,
  actionGetAttachableGoalsForHabit,
  actionGetAttachableIdentitiesForHabit,
  actionUpdateHabitCategory,
  actionGetHabitCheckIns,
} from "@/lib/actions/habit-actions";
import type { ChecklistRecord } from "@/types/checklist";
import type { HabitAssignmentOption, IdentityAssignmentOption } from "@/lib/actions/habit-actions";
import { HabitCheckInCard } from "@/components/habits/habit-check-in-card";
import { HabitCalendar } from "@/components/habits/habit-calendar";

interface GoalContext {
  id: string;
  goal: string;
  systemEval: string;
  idealSystem: string;
}

export function HabitTracker({ habitId }: { habitId: string }) {
  const router = useRouter();
  const [habitName, setHabitName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [editingCategory, setEditingCategory] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const [goalContexts, setGoalContexts] = useState<GoalContext[]>([]);
  const [attachableGoals, setAttachableGoals] = useState<HabitAssignmentOption[]>([]);
  const [attachableIdentities, setAttachableIdentities] = useState<IdentityAssignmentOption[]>([]);
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [attachingGoal, setAttachingGoal] = useState(false);
  const [attachingIdentity, setAttachingIdentity] = useState(false);
  const [selectedAttachGoalId, setSelectedAttachGoalId] = useState("");
  const [selectedAttachIdentityId, setSelectedAttachIdentityId] = useState("");
  const [checkIns, setCheckIns] = useState<{ date: string; completed: boolean; note: string }[]>([]);
  const [habitCreatedAt, setHabitCreatedAt] = useState("");
  const categoryInputRef = useRef<HTMLInputElement>(null);

  async function loadHabitState() {
    const tracked = await actionGetTrackedHabitById(habitId);
    if (!tracked) {
      setLoading(false);
      return;
    }

    const [nextStepData, habitChecklists, goals, identities] = await Promise.all([
      fetchNextStep(),
      actionGetHabitChecklists(tracked.id, tracked.name),
      actionGetAttachableGoalsForHabit(tracked.id),
      actionGetAttachableIdentitiesForHabit(tracked.id),
    ]);

    // Fetch this month's check-ins
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthCheckIns = await actionGetHabitCheckIns(tracked.id, yearMonth);
    setCheckIns(monthCheckIns);
    setHabitCreatedAt(tracked.createdAt);
    setHabitName(tracked.name);
    setCategory(tracked.category ?? "");

    const entries = (nextStepData?.goalEntries ?? []).filter(
      (e) => e.componentHabits.includes(tracked.name) || e.id === tracked.goalEntryId,
    );

    const uniqueEntries = [...new Map(entries.map((e) => [e.id ?? e.goal, e])).values()];
    setGoalContexts(
      uniqueEntries.map((entry, idx) => ({
        id: entry.id ?? `goal-${idx}`,
        goal: entry.goal,
        systemEval: entry.systemEval,
        idealSystem: entry.idealSystem,
      })),
    );

    setAttachableGoals(goals);
    setAttachableIdentities(identities);
    setSelectedAttachGoalId(goals[0]?.id ?? "");
    setSelectedAttachIdentityId(identities[0]?.id ?? "");
    setChecklists(habitChecklists);

    setLoading(false);
  }

  useEffect(() => {
    loadHabitState();
  }, [habitId]);

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
    if (!habitId || !habitName) return;
    setCreating(true);
    try {
      const cl = await actionCreateHabitChecklist(habitId, habitName);
      router.push(`/checklists/${cl.id}`);
    } catch (err) {
      console.error(err);
      setCreating(false);
    }
  }

  async function attachGoal() {
    if (!selectedAttachGoalId) return;
    setAttachingGoal(true);
    try {
      await actionAttachHabitToGoal(habitId, selectedAttachGoalId);
      await loadHabitState();
    } finally {
      setAttachingGoal(false);
    }
  }

  async function attachIdentity() {
    if (!selectedAttachIdentityId) return;
    setAttachingIdentity(true);
    try {
      await actionAttachHabitToIdentity(habitId, selectedAttachIdentityId);
      await loadHabitState();
    } finally {
      setAttachingIdentity(false);
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
      {/* Page sub-header */}
      <div className="border-b border-slate-100 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
            <Link href="/habits" className="hover:text-slate-800">Habits</Link>
            <span>/</span>
            {category && (
              <>
                <Link href={`/habits/category/${encodeURIComponent(category)}`} className="hover:text-slate-800">{category}</Link>
                <span>/</span>
              </>
            )}
            <span className="font-semibold text-slate-800">{habitName || "Habit"}</span>
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
      </div>

      <main className="flex-1 px-5 py-8">
        <div className="mx-auto max-w-2xl space-y-6">

          {/* Habit title + streak subheading */}
          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{habitName || "Habit"}</h2>
            {(() => {
              const today = (() => {
                const d = new Date();
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              })();
              const completed = new Set(checkIns.filter((c) => c.completed).map((c) => c.date));
              const startDate = completed.has(today) ? today : (() => {
                const d = new Date(today + "T00:00:00");
                d.setDate(d.getDate() - 1);
                return d.toISOString().split("T")[0];
              })();
              let streak = 0;
              const d = new Date(startDate + "T00:00:00");
              while (completed.has(d.toISOString().split("T")[0])) {
                streak++;
                d.setDate(d.getDate() - 1);
              }
              const fires = "🔥".repeat(Math.min(Math.floor(streak / 3), 5));
              return (
                <p className="mt-1 text-sm text-slate-500">
                  {streak > 0 ? (
                    <>{fires && <span className="mr-1">{fires}</span>}{streak} day streak</>
                  ) : (
                    "No streak yet — check in today to start one"
                  )}
                </p>
              );
            })()}

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

          {/* Daily check-in card */}
          {habitName && (
            <HabitCheckInCard
              habitId={habitId}
              habitName={habitName}
              habitCreatedAt={habitCreatedAt}
              checkIns={checkIns}
              showLink={false}
            />
          )}

          {/* Monthly calendar */}
          {habitCreatedAt && (
            <HabitCalendar checkIns={checkIns} habitCreatedAt={habitCreatedAt} />
          )}

          <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Attach to goal</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <select
                  value={selectedAttachGoalId}
                  onChange={(e) => setSelectedAttachGoalId(e.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                >
                  {attachableGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={attachGoal}
                  disabled={attachingGoal || !selectedAttachGoalId}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {attachingGoal ? "Attaching..." : "Attach"}
                </button>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Attach to identity</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <select
                  value={selectedAttachIdentityId}
                  onChange={(e) => setSelectedAttachIdentityId(e.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                >
                  {attachableIdentities.map((identity) => (
                    <option key={identity.id} value={identity.id}>
                      {identity.identity}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={attachIdentity}
                  disabled={attachingIdentity || !selectedAttachIdentityId}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {attachingIdentity ? "Attaching..." : "Attach"}
                </button>
              </div>
            </div>
          </section>

          {/* Goal context cards */}
          {goalContexts.length > 0 && (
            <section className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Associated goals
              </p>
              {goalContexts.map((goalContext) => (
                <article key={goalContext.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Goal context
                  </p>
                  <Link href={`/goals/${goalContext.id}`} className="text-sm font-semibold text-slate-900 hover:text-slate-700">
                    {goalContext.goal}
                  </Link>

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
                </article>
              ))}
            </section>
          )}

          {/* Past habit check-ins */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Past habit check-ins
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
                {creating ? "Creating…" : "Start your first check-in for this habit"}
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
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{cl.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Updated{" "}
                        {new Date(cl.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                      Open check-in
                      <svg
                        className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
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
