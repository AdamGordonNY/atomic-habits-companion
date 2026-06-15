"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { actionGetChecklist, actionUpdateChecklist } from "@/lib/checklists-actions";
import type { ChecklistHabitEntry, ChecklistObstacle, ChecklistRecord } from "@/types/checklist";

// ─── id helper ────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptyHabitEntry(): ChecklistHabitEntry {
  return {
    id: uid(),
    habit: "",
    howIsItGoing: "",
    identityReinforcement: "",
    victory: "",
    workingNotWorking: "",
    obstacles: [],
    learnings: "",
  };
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100"
      />
    </div>
  );
}

// ─── ObstacleList ─────────────────────────────────────────────────────────────

function ObstacleList({
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

// ─── HabitCard ────────────────────────────────────────────────────────────────

function HabitCard({
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
  const [open, setOpen] = useState(true);

  function patch(p: Partial<ChecklistHabitEntry>) {
    onChange({ ...entry, ...p });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-950 text-[11px] font-bold text-white">
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

// ─── ChecklistEditor ──────────────────────────────────────────────────────────

export function ChecklistEditor({ checklistId }: { checklistId: string }) {
  const [checklist, setChecklist] = useState<ChecklistRecord | null>(null);
  const [title, setTitle] = useState("");
  const [entries, setEntries] = useState<ChecklistHabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const titleRef = useRef(title);
  titleRef.current = title;
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    actionGetChecklist(checklistId).then((data) => {
      if (data) {
        setChecklist(data);
        setTitle(data.title);
        setEntries(data.content.length > 0 ? data.content : [emptyHabitEntry()]);
      }
      setLoading(false);
    });
  }, [checklistId]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await actionUpdateChecklist(checklistId, {
        title: titleRef.current,
        content: entriesRef.current,
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [checklistId]);

  function scheduleAutosave() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(save, 1500);
  }

  function updateTitle(v: string) {
    setTitle(v);
    scheduleAutosave();
  }

  function updateEntry(idx: number, updated: ChecklistHabitEntry) {
    setEntries((prev) => {
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
    scheduleAutosave();
  }

  function addHabit() {
    setEntries((prev) => [...prev, emptyHabitEntry()]);
    scheduleAutosave();
  }

  function removeHabit(idx: number) {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
    scheduleAutosave();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Checklist not found.</p>
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
              href="/checklists"
              className="flex-shrink-0 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              ← Checklists
            </Link>
            <span className="text-slate-300">/</span>
            <input
              type="text"
              value={title}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="Checklist title…"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {lastSaved && (
              <span className="hidden text-[11px] text-slate-400 sm:block">
                Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex h-8 items-center rounded-full bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-5 py-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {entries.map((entry, idx) => (
            <HabitCard
              key={entry.id}
              entry={entry}
              index={idx}
              total={entries.length}
              onChange={(updated) => updateEntry(idx, updated)}
              onRemove={() => removeHabit(idx)}
            />
          ))}

          <button
            type="button"
            onClick={addHabit}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-transparent py-4 text-sm font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
          >
            <span className="text-lg leading-none">+</span>
            Add another habit
          </button>
        </div>
      </main>
    </div>
  );
}
