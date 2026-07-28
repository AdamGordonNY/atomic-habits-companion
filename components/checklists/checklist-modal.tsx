"use client";

import Link from "next/link";
import type { ChecklistTemplate } from "@/types/checklist";

export default function CreateChecklistModal({
  templates,
  onSelectAction,
  onCloseAction,
}: {
  templates: ChecklistTemplate[];
  onSelectAction: (templateId?: string) => void;
  onCloseAction: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">New Checklist</h2>
        <p className="mb-4 text-xs text-slate-500">Choose a type or use a saved template.</p>

        {/* Built-in type */}
        <button
          type="button"
          onClick={() => onSelectAction(undefined)}
          className="mb-2 flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
        >
          <span className="text-lg">✅</span>
          <div>
            <p className="text-xs font-semibold text-slate-900">Habit Assessment</p>
            <p className="text-xs text-slate-400">Standard habit check-in form</p>
          </div>
        </button>

        {/* Custom templates */}
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectAction(t.id)}
            className="mb-2 flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
          >
            <span className="text-lg">{t.icon ?? "📋"}</span>
            <div>
              <p className="text-xs font-semibold text-slate-900">{t.name}</p>
              <p className="text-xs text-slate-400">
                {t.description ?? `${t.fields.length} fields`}
              </p>
            </div>
          </button>
        ))}

        {/* Create new template — Link instead of router.push */}
        <Link
          href="/checklists/templates/new"
          className="mt-1 flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-200 p-3 text-left hover:bg-slate-50"
        >
          <span className="text-lg">＋</span>
          <p className="text-xs font-medium text-slate-500">Create new template…</p>
        </Link>

        <button
          type="button"
          onClick={onCloseAction}
          className="mt-4 w-full rounded-full py-2 text-xs text-slate-400 hover:text-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}