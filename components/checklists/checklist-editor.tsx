"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { actionGetChecklist, actionUpdateChecklist } from "@/lib/checklists-actions";
import type { ChecklistHabitEntry, ChecklistObstacle, ChecklistRecord } from "@/types/checklist";
import {uid} from "@/lib/utils";
import{ Textarea }from "@/components/Textarea";
import { ObstacleList } from "@/components/checklists/obstacle-list";
import HabitCard from "../HabitCard";

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
