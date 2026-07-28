import { uid } from "@/lib/utils";
import { ChecklistObstacle } from "@/types/checklist";

export function ObstacleList({
  obstacles,
  onChange,
}: {
  obstacles: ChecklistObstacle[];
  onChange: (v: ChecklistObstacle[]) => void;
}) {
  function update(idx: number, patch: Partial<ChecklistObstacle>) {
    const next = [...obstacles];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  }

  function add() {
    onChange([...obstacles, { id: uid(), obstacle: "", plan: "" }]);
  }

  function remove(idx: number) {
    onChange(obstacles.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-500">
        Obstacles &amp; plans to overcome them
      </label>
      <div className="flex flex-col gap-3">
        {obstacles.map((o, idx) => (
          <div
            key={o.id}
            className="relative flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Obstacle {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-xs text-slate-300 hover:text-rose-500"
                aria-label="Remove obstacle"
              >
                ×
              </button>
            </div>
            <input
              type="text"
              value={o.obstacle}
              onChange={(e) => update(idx, { obstacle: e.target.value })}
              placeholder="Describe the obstacle…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
            <input
              type="text"
              value={o.plan}
              onChange={(e) => update(idx, { plan: e.target.value })}
              placeholder="Plan to overcome it…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="self-start text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          + Add obstacle
        </button>
      </div>
    </div>
  );
}
    