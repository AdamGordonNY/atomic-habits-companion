"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { actionCreateTemplate } from "@/lib/checklists-actions";
import type { CustomField, FieldType } from "@/types/checklist";

// ─── constants ────────────────────────────────────────────────────────────────

const FIELD_TYPES: { value: FieldType; label: string; hint: string }[] = [
  { value: "text",     label: "Short text",  hint: "Single line answer"     },
  { value: "textarea", label: "Long text",   hint: "Multi-line notes"       },
  { value: "rating",   label: "Rating",      hint: "1–5 star scale"         },
  { value: "date",     label: "Date",        hint: "Date picker"            },
  { value: "url",      label: "URL",         hint: "Link / web address"     },
];

const ICON_SUGGESTIONS = ["📚", "🏃", "💧", "🧘", "✍️", "🎯", "💡", "🎵", "🌱", "💪"];

function makeBlankField(): CustomField {
  return { id: "", label: "", type: "text", required: false, placeholder: "" };
}

// ─── sub-components ───────────────────────────────────────────────────────────

function FieldRow({
  field,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  field: CustomField;
  index: number;
  total: number;
  onChange: (patch: Partial<CustomField>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Row header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">Field {index + 1}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-xs text-slate-400 hover:bg-slate-100 disabled:opacity-30"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-xs text-slate-400 hover:bg-slate-100 disabled:opacity-30"
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-xs text-rose-400 hover:bg-rose-50"
            aria-label="Remove field"
          >
            ×
          </button>
        </div>
      </div>

      {/* Label + type in one row */}
      <div className="mb-3 flex gap-2">
        <input
          type="text"
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Field label"
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
        />
        <select
          value={field.type}
          onChange={(e) => onChange({ type: e.target.value as FieldType })}
          className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
        >
          {FIELD_TYPES.map((ft) => (
            <option key={ft.value} value={ft.value}>
              {ft.label}
            </option>
          ))}
        </select>
      </div>

      {/* Placeholder (not shown for rating/date) */}
      {field.type !== "rating" && field.type !== "date" && (
        <input
          type="text"
          value={field.placeholder ?? ""}
          onChange={(e) => onChange({ placeholder: e.target.value })}
          placeholder="Placeholder text (optional)"
          className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
        />
      )}

      {/* Required toggle */}
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={field.required ?? false}
          onChange={(e) => onChange({ required: e.target.checked })}
          className="h-3.5 w-3.5 rounded accent-slate-900"
        />
        <span className="text-xs text-slate-500">Required</span>
      </label>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function TemplateBuilderClient() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📋");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<CustomField[]>([makeBlankField()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── field helpers ──

  function addField() {
    setFields((prev) => [...prev, makeBlankField()]);
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function updateField(index: number, patch: Partial<CustomField>) {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  }

  function moveField(index: number, dir: -1 | 1) {
    setFields((prev) => {
      const next = [...prev];
      const swap = index + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  }

  // ── validation ──

  function validate(): string | null {
    if (!name.trim()) return "Template name is required.";
    if (fields.length === 0) return "Add at least one field.";
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim()) return `Field ${i + 1} needs a label.`;
    }
    return null;
  }

  // ── submit ──

  async function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setSaving(true);
    try {
      await actionCreateTemplate({
        name: name.trim(),
        icon,
        description: description.trim() || undefined,
        fields,
      });
      router.push("/checklists");
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  // ── render ──

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/checklists"
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              ← Checklists
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="text-sm font-semibold text-slate-900">New Template</h1>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save template"}
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 py-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">

          {/* Error banner */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600">
              {error}
            </div>
          )}

          {/* ── Identity card ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Template info
            </p>

            {/* Icon picker */}
            <p className="mb-2 text-xs font-medium text-slate-600">Icon</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {ICON_SUGGESTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border text-lg transition ${
                    icon === emoji
                      ? "border-slate-900 bg-slate-100"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {emoji}
                </button>
              ))}
              {/* Custom emoji input */}
              <input
                type="text"
                value={ICON_SUGGESTIONS.includes(icon) ? "" : icon}
                onChange={(e) => {
                  const val = [...e.target.value].at(-1) ?? icon;
                  setIcon(val);
                }}
                placeholder="✏️"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-base focus:border-slate-400 focus:outline-none"
              />
            </div>

            {/* Name */}
            <p className="mb-2 text-xs font-medium text-slate-600">Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Reading Log"
              className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            />

            {/* Description */}
            <p className="mb-2 text-xs font-medium text-slate-600">
              Description{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </p>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Track books I've read"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            />
          </section>

          {/* ── Fields ── */}
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Fields
            </p>

            <div className="flex flex-col gap-3">
              {fields.map((field, i) => (
                <FieldRow
                  key={i}
                  field={field}
                  index={i}
                  total={fields.length}
                  onChange={(patch) => updateField(i, patch)}
                  onRemove={() => removeField(i)}
                  onMove={(dir) => moveField(i, dir)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addField}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-3 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:bg-white"
            >
              <span className="text-base">＋</span> Add field
            </button>
          </section>

          {/* Bottom save button (convenience) */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-full bg-slate-950 py-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save template"}
          </button>

        </div>
      </main>
    </div>
  );
}
