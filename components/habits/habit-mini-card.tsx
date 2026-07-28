import Link from "next/link";
import { TreeHabit } from "../identity/identity-tree";

export function HabitMiniCard({
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