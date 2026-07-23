"use client";

import Link from "next/link";
import { useState } from "react";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface TreeHabit {
  id: string;
  name: string;
  category: string | null;
  goalEntryId?: string | null;
  identityId?: string | null;
}

export interface TreeGoal {
  id: string;
  goal: string;
  identityId?: string | null;
}

export interface TreeIdentity {
  id: string;
  identity: string;
}

// ─── Habit mini-card ──────────────────────────────────────────────────────────

function HabitMiniCard({
  habit,
  identityId,
  goalId,
}: {
  habit: TreeHabit;
  identityId: string;
  goalId: string;
}) {
  return (
    <Link
      href={`/identities/${identityId}/goals/${goalId}/habits/${habit.id}`}
      className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-200 hover:shadow-sm"
    >
      <span className="font-medium text-slate-800">{habit.name}</span>
      {habit.category && (
        <span className="ml-auto shrink-0 text-xs text-slate-400">{habit.category}</span>
      )}
    </Link>
  );
}

// ─── Goal mini-card (inside an identity) ─────────────────────────────────────

function GoalMiniCard({
  goal,
  habits,
  identityId,
}: {
  goal: TreeGoal;
  habits: TreeHabit[];
  identityId: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        className="flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-slate-100"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" && setOpen((v) => !v)}
      >
        <Link
          href={`/identities/${identityId}/goals/${goal.id}`}
          className="flex-1 text-sm font-semibold text-slate-800 hover:text-slate-950"
          onClick={(e) => e.stopPropagation()}
        >
          {goal.goal || "Untitled goal"}
        </Link>
        <div className="flex shrink-0 items-center gap-2 pl-3">
          {habits.length > 0 && (
            <span className="text-[11px] text-slate-400">
              {habits.length} habit{habits.length === 1 ? "" : "s"}
            </span>
          )}
          <span className="text-[10px] text-slate-400">{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div className="space-y-1.5 px-4 pb-3 pt-1">
          {habits.length === 0 ? (
            <p className="text-xs text-slate-400">No habits yet.</p>
          ) : (
            habits.map((habit) => (
              <HabitMiniCard
                key={habit.id}
                habit={habit}
                identityId={identityId}
                goalId={goal.id}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Identity card ────────────────────────────────────────────────────────────

function IdentityCard({
  identity,
  goals,
  habits,
}: {
  identity: TreeIdentity;
  goals: TreeGoal[];
  habits: TreeHabit[];
}) {
  const [open, setOpen] = useState(true);

  const totalHabits = new Set(
    habits
      .filter(
        (h) =>
          h.identityId === identity.id ||
          goals.some((g) => g.id === h.goalEntryId),
      )
      .map((h) => h.id),
  ).size;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        className="flex cursor-pointer items-center justify-between bg-slate-50 px-5 py-4 hover:bg-slate-100"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" && setOpen((v) => !v)}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/identities/${identity.id}`}
            className="text-base font-semibold text-slate-900 hover:text-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            {identity.identity || "Untitled identity"}
          </Link>
          {goals.length > 0 && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {goals.length} goal{goals.length === 1 ? "" : "s"}
            </span>
          )}
          {totalHabits > 0 && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {totalHabits} habit{totalHabits === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <span className="ml-4 shrink-0 text-[10px] text-slate-400">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="space-y-2 p-4">
          {goals.length === 0 ? (
            <p className="text-sm text-slate-400">No goals linked.</p>
          ) : (
            goals.map((goal) => (
              <GoalMiniCard
                key={goal.id}
                goal={goal}
                habits={habits.filter((h) => h.goalEntryId === goal.id)}
                identityId={identity.id}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Full identity tree (identities → goals → habits) ────────────────────────

export function IdentityTree({
  identities,
  goals,
  habits,
}: {
  identities: TreeIdentity[];
  goals: TreeGoal[];
  habits: TreeHabit[];
}) {
  if (identities.length === 0) {
    return <p className="text-sm text-slate-500">No identity entries yet.</p>;
  }

  return (
    <div className="space-y-4">
      {identities.map((identity) => (
        <IdentityCard
          key={identity.id}
          identity={identity}
          goals={goals.filter((g) => g.identityId === identity.id)}
          habits={habits}
        />
      ))}
    </div>
  );
}

// ─── Goals-only tree (goals → habits, used on the Goals page) ────────────────

function StandaloneGoalCard({
  goal,
  habits,
}: {
  goal: TreeGoal;
  habits: TreeHabit[];
}) {
  const [open, setOpen] = useState(true);
  const href =
    goal.identityId
      ? `/identities/${goal.identityId}/goals/${goal.id}`
      : `/goals/${goal.id}`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        className="flex cursor-pointer items-center justify-between bg-slate-50 px-4 py-3 hover:bg-slate-100"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" && setOpen((v) => !v)}
      >
        <Link
          href={href}
          className="flex-1 text-sm font-semibold text-slate-800 hover:text-slate-950"
          onClick={(e) => e.stopPropagation()}
        >
          {goal.goal || "Untitled goal"}
        </Link>
        <div className="flex shrink-0 items-center gap-2 pl-3">
          {habits.length > 0 && (
            <span className="text-[11px] text-slate-400">
              {habits.length} habit{habits.length === 1 ? "" : "s"}
            </span>
          )}
          <span className="text-[10px] text-slate-400">{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div className="space-y-1.5 px-4 pb-3 pt-1">
          {habits.length === 0 ? (
            <p className="text-xs text-slate-400">No habits yet.</p>
          ) : (
            habits.map((habit) => {
              const habitHref =
                goal.identityId
                  ? `/identities/${goal.identityId}/goals/${goal.id}/habits/${habit.id}`
                  : `/habits/${habit.id}`;
              return (
                <Link
                  key={habit.id}
                  href={habitHref}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm transition-colors hover:border-slate-200 hover:bg-white hover:shadow-sm"
                >
                  <span className="font-medium text-slate-800">{habit.name}</span>
                  {habit.category && (
                    <span className="ml-auto shrink-0 text-xs text-slate-400">{habit.category}</span>
                  )}
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function GoalHabitsTree({
  goals,
  habits,
}: {
  goals: TreeGoal[];
  habits: TreeHabit[];
}) {
  const validGoals = goals.filter((g) => g.id);

  if (validGoals.length === 0) {
    return <p className="text-sm text-slate-500">No goals yet. Complete The Next Step to generate them.</p>;
  }

  return (
    <div className="space-y-3">
      {validGoals.map((goal) => (
        <StandaloneGoalCard
          key={goal.id}
          goal={goal}
          habits={habits.filter((h) => h.goalEntryId === goal.id)}
        />
      ))}
    </div>
  );
}
