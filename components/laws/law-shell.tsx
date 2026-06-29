"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Show, SignUpButton, UserButton } from "@clerk/nextjs";
import {
  ensureDbUser,
  syncNotes,
  syncPartOne,
  syncPartTwo,
  syncPartThree,
} from "@/lib/sync-actions";
import { fetchDashboardData } from "@/lib/actions/dashboard-actions";
import type { TrackedHabitData } from "@/lib/actions/habit-actions";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function MenuIcon({ glyph }: { glyph: string }) {
  return <span className="text-xs font-semibold text-slate-400">{glyph}</span>;
}

export function LawShell({ children }: { children: ReactNode }) {
  const [trackedHabits, setTrackedHabits] = useState<TrackedHabitData[]>([]);
  const [goals, setGoals] = useState<{ id: string; label: string }[]>([]);
  const [recentNotes, setRecentNotes] = useState<{ id: string; title: string; updatedAt: string }[]>([]);
  const [recentChecklists, setRecentChecklists] = useState<{ id: string; title: string; updatedAt: string }[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    setSyncDone(false);
    try {
      await ensureDbUser();
      const rawNotes = localStorage.getItem("atomic-habits:notes");
      if (rawNotes) {
        const parsed = JSON.parse(rawNotes) as { notes?: unknown[] };
        if (Array.isArray(parsed?.notes) && parsed.notes.length > 0) {
          await syncNotes(parsed.notes as Parameters<typeof syncNotes>[0]);
        }
      }
      const rawP1 = localStorage.getItem("habit-assessment:onboarding");
      if (rawP1) await syncPartOne(JSON.parse(rawP1));
      const rawP2 = localStorage.getItem("habit-assessment:onboarding:part-two");
      if (rawP2) await syncPartTwo(JSON.parse(rawP2));
      const rawP3 = localStorage.getItem("habit-assessment:onboarding:part-three");
      if (rawP3) await syncPartThree(JSON.parse(rawP3));
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
    } catch (err) {
      console.error("[handleSync]", err);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchDashboardData();
      if (cancelled) return;
      setTrackedHabits(data.trackedHabits);
      setGoals(data.goals);
      setRecentNotes(data.recentNotes);
      setRecentChecklists(data.recentChecklists);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <span className="flex-shrink-0 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Atomic Habits
          </span>
          <nav className="flex flex-wrap items-center gap-1.5 pb-0.5">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="whitespace-nowrap rounded-full border border-slate-950 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Make account
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Identity (Next Steps)"
                    labelIcon={<MenuIcon glyph="=" />}
                    open="/habit-assessment/onboarding/part-five"
                  />
                  <UserButton.Link label="Dashboard" labelIcon={<MenuIcon glyph=">" />} href="/dashboard" />
                  <UserButton.Link
                    label="Part 4 - Ideal Future & Identity"
                    labelIcon={<MenuIcon glyph=">" />}
                    href="/habit-assessment/onboarding/part-four"
                  />
                  <UserButton.Link
                    label="Part 5 - The Next Step"
                    labelIcon={<MenuIcon glyph=">" />}
                    href="/habit-assessment/onboarding/part-five"
                  />
                  <UserButton.Link
                    label="Review All Answers"
                    labelIcon={<MenuIcon glyph=">" />}
                    href="/habit-assessment/onboarding/review"
                  />
                  {goals.length > 0 ? (
                    goals.map((goal) => (
                      <UserButton.Link
                        key={`goal-${goal.id}`}
                        label={`Goal: ${goal.label}`}
                        labelIcon={<MenuIcon glyph=">" />}
                        href={`/goals/${goal.id}`}
                      />
                    ))
                  ) : (
                    <UserButton.Action
                      label="No goals yet"
                      labelIcon={<MenuIcon glyph="-" />}
                      open="/habit-assessment/onboarding/part-five"
                    />
                  )}

                  <UserButton.Action label="Habits" labelIcon={<MenuIcon glyph="=" />} open="/dashboard" />
                  {trackedHabits.length > 0 ? (
                    trackedHabits.map((habit) => (
                      <UserButton.Link
                        key={`habit-${habit.id}`}
                        label={`${habit.category ? `${habit.category}: ` : ""}${habit.name}`}
                        labelIcon={<MenuIcon glyph=">" />}
                        href={`/habits/${habit.id}`}
                      />
                    ))
                  ) : (
                    <UserButton.Action
                      label="No habits yet"
                      labelIcon={<MenuIcon glyph="-" />}
                      open="/habit-assessment/onboarding/part-five"
                    />
                  )}

                  <UserButton.Action label="Laws" labelIcon={<MenuIcon glyph="=" />} open="/laws/1" />
                  <UserButton.Link label="Law 1 - Cue" labelIcon={<MenuIcon glyph=">" />} href="/laws/1" />
                  <UserButton.Link label="Law 2 - Craving" labelIcon={<MenuIcon glyph=">" />} href="/laws/2" />
                  <UserButton.Link label="Law 3 - Response" labelIcon={<MenuIcon glyph=">" />} href="/laws/3" />
                  <UserButton.Link label="Law 4 - Reward" labelIcon={<MenuIcon glyph=">" />} href="/laws/4" />

                  <UserButton.Action label="Notes & Checklists" labelIcon={<MenuIcon glyph="=" />} open="/notes" />
                  <UserButton.Link label="View all notes" labelIcon={<MenuIcon glyph=">" />} href="/notes" />
                  {recentNotes.slice(0, 3).map((note) => (
                    <UserButton.Link
                      key={`note-${note.id}`}
                      label={`Note: ${note.title} (${formatDate(note.updatedAt)})`}
                      labelIcon={<MenuIcon glyph=">" />}
                      href={`/notes/${note.id}`}
                    />
                  ))}
                  <UserButton.Link label="View all checklists" labelIcon={<MenuIcon glyph=">" />} href="/checklists" />
                  {recentChecklists.slice(0, 3).map((checklist) => (
                    <UserButton.Link
                      key={`checklist-${checklist.id}`}
                      label={`Checklist: ${checklist.title} (${formatDate(checklist.updatedAt)})`}
                      labelIcon={<MenuIcon glyph=">" />}
                      href={`/checklists/${checklist.id}`}
                    />
                  ))}

                  <UserButton.Action
                    label={syncing ? "Syncing..." : syncDone ? "Synced!" : "Sync data"}
                    labelIcon={
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 2v6h-6" />
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                        <path d="M3 22v-6h6" />
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                      </svg>
                    }
                    onClick={handleSync}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </Show>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-5 py-10">
        <div className="mx-auto max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
