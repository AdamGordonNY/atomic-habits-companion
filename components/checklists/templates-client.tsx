"use client";

import { useState } from "react";
import Link from "next/link";
import {
  actionDeleteTemplate,
} from "@/lib/checklists-actions";
import type { ChecklistTemplate, CustomField } from "@/types/checklist";

// ─── Field type badge ──────────────────────────────────────────────────────

const FIELD_TYPE_LABELS: Record<CustomField["type"], string> = {
  text:     "Text",
  textarea: "Long text",
  rating:   "Rating",
  date:     "Date",
  url:      "URL",
};

function FieldBadge({ type }: { type: CustomField["type"] }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
      {FIELD_TYPE_LABELS[type]}
    </span>
  );
}

// ─── Template card ─────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onDelete,
  deleting,
}: {
  template: ChecklistTemplate;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      {/* Card header */}
      <div className="flex items-start gap-4 p-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-2xl">
          {template.icon ?? "📋"}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{template.name}</p>
          {template.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
              {template.description}
            </p>
          )}
          <p className="mt-1.5 text-xs text-slate-400">
            {template.fields.length} field{template.fields.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={expanded ? "Collapse fields" : "Preview fields"}
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <polyline points="2,4 6,8 10,4" />
            </svg>
          </button>

          <Link
            href={`/checklists/templates/${template.id}/edit`}
            className="flex h-7 items-center rounded-full border border-slate-200 px-3 text-[11px] font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
          >
            Edit
          </Link>

          <button
            type="button"
            onClick={() => onDelete(template.id)}
            disabled={deleting}
            className="flex h-7 items-center rounded-full border border-rose-200 px-3 text-[11px] font-medium text-rose-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
          >
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </div>

      {/* Expandable field preview */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Fields
          </p>
          <div className="flex flex-col gap-2">
            {template.fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="min-w-0">
                  <span className="text-xs font-medium text-slate-800">
                    {field.label}
                  </span>
                  {field.required && (
                    <span className="ml-1 text-[10px] text-rose-400">required</span>
                  )}
                  {field.placeholder && (
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                      {field.placeholder}
                    </p>
                  )}
                </div>
                <FieldBadge type={field.type} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main client ───────────────────────────────────────────────────────────

export function TemplatesClient({
  initialTemplates,
}: {
  initialTemplates: ChecklistTemplate[];
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Delete this template? Checklists that used it will keep their saved data, but the form fields will no longer be editable.",
      )
    )
      return;

    setDeletingId(id);
    try {
      await actionDeleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

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
            <h1 className="text-sm font-semibold text-slate-900">Templates</h1>
          </div>
          <Link
            href="/checklists/templates/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            + New template
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-5 py-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {templates.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl shadow-sm">
                📋
              </div>
              <p className="text-base font-semibold text-slate-900">
                No templates yet
              </p>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Templates let you build reusable forms — reading logs, session
                notes, weekly reviews, and more.
              </p>
              <Link
                href="/checklists/templates/new"
                className="mt-5 inline-flex h-9 items-center rounded-full bg-slate-950 px-5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Create first template
              </Link>
            </div>
          ) : (
            templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onDelete={handleDelete}
                deleting={deletingId === t.id}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
