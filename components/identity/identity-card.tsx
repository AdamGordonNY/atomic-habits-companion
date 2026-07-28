// ─── Identity card ────────────────────────────────────────────────────────────

import { useState } from "react";
import { TreeGoal, TreeHabit, TreeIdentity } from "./identity-tree";
import Link from "next/link";
import { GoalMiniCard } from "../goals/goal-mini-card";

export function IdentityCard({
  identity,
  goals,
  habits,
}: {
  identity: TreeIdentity;
  goals: TreeGoal[];
  habits: TreeHabit[];
}) {
  const [open, setOpen] = useState(false);

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