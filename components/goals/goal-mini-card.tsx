import { useState } from "react";
import { HabitMiniCard } from "../habits/habit-mini-card";
import { TreeGoal, TreeHabit } from "../identity/identity-tree";
import Link from "next/link";
export function GoalMiniCard({
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
