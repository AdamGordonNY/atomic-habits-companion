"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  actionGetChecklist,
  actionGetTemplateById,
  actionUpdateChecklist,
} from "@/lib/checklists-actions";
import type {
  ChecklistHabitEntry,
  ChecklistRecord,
  ChecklistTemplate,
  CustomField,
} from "@/types/checklist";
import { uid } from "@/lib/utils";
import HabitCard from "../HabitCard";

// ─── helpers ───────────────────────────────────────────────────────────────

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

// ─── Custom form ───────────────────────────────────────────────────────────

function CustomForm({
  template,
  values,
  onChange,
}: {
  template: ChecklistTemplate;
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {template.fields.map((field: CustomField) => (
        <div
          key={field.id}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <label className="mb-1.5 block text-xs font-medium text-slate-700">
            {field.label}
            {field.required && (
              <span className="ml-1 text-rose-400">*</span>
            )}
          </label>

          {field.type === "textarea" && (
            <textarea
              value={values[field.id] ?? ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder ?? ""}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            />
          )}

          {field.type === "text" && (
            <input
              type="text"
              value={values[field.id] ?? ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder ?? ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            />
          )}

          {field.type === "url" && (
            <input
              type="url"
              value={values[field.id] ?? ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder ?? "https://"}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            />
          )}

          {field.type === "date" && (
            <input
              type="date"
              value={values[field.id] ?? ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            />
          )}

          {field.type === "rating" && (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    onChange(
                      field.id,
                      values[field.id] === String(n) ? "" : String(n),
                    )
                  }
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                    values[field.id] === String(n)
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main editor ───────────────────────────────────────────────────────────

export function ChecklistEditor({ checklistId }: { checklistId: string }) {
  const [checklist, setChecklist] = useState<ChecklistRecord | null>(null);
  const [title, setTitle] = useState("");

  // habit-assessment state
  const [entries, setEntries] = useState<ChecklistHabitEntry[]>([]);

  // custom state
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // refs for autosave closure
  const titleRef = useRef(title);
  const entriesRef = useRef(entries);
  const customValuesRef = useRef(customValues);
  const modeRef = useRef<ChecklistRecord["mode"] | null>(null);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    customValuesRef.current = customValues;
  }, [customValues]);

  // ── initial fetch ──

  useEffect(() => {
    actionGetChecklist(checklistId).then((data) => {
      if (data) {
        setChecklist(data);
        setTitle(data.title);
        modeRef.current = data.mode;

        if (data.mode === "custom") {
          setCustomValues(data.customEntries ?? {});
          if (data.templateId) {
            setTemplateLoading(true);
            actionGetTemplateById(data.templateId).then((t) => {
              setTemplate(t);
              setTemplateLoading(false);
            });
          }
        } else {
          setEntries(
            data.content.length > 0 ? data.content : [emptyHabitEntry()],
          );
        }
      }
      setLoading(false);
    });
  }, [checklistId]);

  // ── save ──

  const save = useCallback(async () => {
    setSaving(true);
    try {
      if (modeRef.current === "custom") {
        await actionUpdateChecklist(checklistId, {
          title: titleRef.current,
          customEntries: customValuesRef.current,
        });
      } else {
        await actionUpdateChecklist(checklistId, {
          title: titleRef.current,
          content: entriesRef.current,
        });
      }
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

  // ── change handlers ──

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

  function updateCustomValue(fieldId: string, value: string) {
    setCustomValues((prev) => ({ ...prev, [fieldId]: value }));
    scheduleAutosave();
  }

  // ── loading / not found ──

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

  // ── render ──

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/checklists"
              className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              ← Checklists
            </Link>
            <span className="text-slate-300">/</span>
            {checklist.mode === "custom" && template && (
              <>
                <span className="shrink-0 text-slate-300 text-xs">
                  {template.icon ?? "📋"} {template.name}
                </span>
                <span className="text-slate-300">/</span>
              </>
            )}
            <input
              type="text"
              value={title}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="Checklist title…"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {lastSaved && (
              <span className="hidden text-[11px] text-slate-400 sm:block">
                Saved{" "}
                {lastSaved.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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

          {checklist.mode === "custom" ? (
            templateLoading ? (
              // skeleton
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-2xl border border-slate-100 bg-white"
                  />
                ))}
              </div>
            ) : template ? (
              <CustomForm
                template={template}
                values={customValues}
                onChange={updateCustomValue}
              />
            ) : (
              // template was deleted
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                <p className="font-semibold">Template deleted</p>
                <p className="mt-0.5">
                  The template used by this checklist no longer exists. Your
                  saved responses are preserved below.
                </p>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-amber-600">
                  {JSON.stringify(customValues, null, 2)}
                </pre>
              </div>
            )
          ) : (
            <>
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
            </>
          )}

        </div>
      </main>
    </div>
  );
}
