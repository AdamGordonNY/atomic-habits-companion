"use client";

import Link from "next/link";
import { useState } from "react";
import { IdentityCard } from "./identity-card";

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
  const [open, setOpen] = useState(false);
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
