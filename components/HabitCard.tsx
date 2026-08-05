import type { ChecklistHabitEntry } from "@/types/checklist";
import { useState } from "react";
import { ObstacleList} from "@/components/checklists/obstacle-list";
import { Textarea } from "@/components/Textarea";

export default function HabitCard({
  entry,
  index,
  total,
  onChange,
  onRemove,
}: {
  entry: ChecklistHabitEntry;
  index: number;
  total: number;
  onChange: (e: ChecklistHabitEntry) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  function patch(p: Partial<ChecklistHabitEntry>) {
    onChange({ ...entry, ...p });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[11px] font-bold text-white">
          {index + 1}
        </span>
        <input
          type="text"
          value={entry.habit}
          onChange={(e) => patch({ habit: e.target.value })}
          placeholder="Habit name…"
          className="flex-1 bg-transparent text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
        />
        <div className="flex items-center gap-1">
          {total > 1 && (
            <button
              type="button"
              onClick={onRemove}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 hover:bg-rose-50 hover:text-rose-500"
              aria-label="Remove habit"
            >
              ×
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            aria-label={open ? "Collapse" : "Expand"}
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Fields */}
      {open && (
        <div className="flex flex-col gap-4 border-t border-slate-100 px-4 pb-5 pt-4">
          <Textarea
            label="How is it going?"
            value={entry.howIsItGoing}
            onChange={(v) => patch({ howIsItGoing: v })}
            placeholder="Describe your current progress and feelings about this habit…"
          />
          <Textarea
            label="Is this habit reinforcing the identity you want to build?"
            value={entry.identityReinforcement}
            onChange={(v) => patch({ identityReinforcement: v })}
            placeholder="How does practising this habit shape who you're becoming?"
          />
          <Textarea
            label="Name a victory you've had regarding this habit"
            value={entry.victory}
            onChange={(v) => patch({ victory: v })}
            placeholder="A specific win, no matter how small…"
            rows={2}
          />
          <Textarea
            label="What's working and what's not working?"
            value={entry.workingNotWorking}
            onChange={(v) => patch({ workingNotWorking: v })}
            placeholder="Be honest about what helps and what's getting in the way…"
          />
          <ObstacleList
            obstacles={entry.obstacles}
            onChange={(v) => patch({ obstacles: v })}
          />
          <Textarea
            label="What have you learned from this?"
            value={entry.learnings}
            onChange={(v) => patch({ learnings: v })}
            placeholder="Insights, patterns, or lessons from working on this habit…"
          />
        </div>
      )}
    </div>
  );
}