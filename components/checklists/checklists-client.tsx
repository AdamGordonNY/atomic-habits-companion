"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  actionGetChecklists,
  actionCreateChecklist,
  actionDeleteChecklist,
  actionGetTemplates,
} from "@/lib/checklists-actions";

import type { ChecklistRecord, ChecklistTemplate } from "@/types/checklist";
import formatDate from "@/lib/utils";
import CreateChecklistModal from "./checklist-modal";


// ─── helpers ──────────────────────────────────────────────────────────────────

function checklistIcon(cl: ChecklistRecord, templates: ChecklistTemplate[]): string {
  if (cl.mode === "custom") {
    return templates.find((t) => t.id === cl.templateId)?.icon ?? "📋";
  }
  return "✅";
}

function checklistSubtitle(cl: ChecklistRecord, templates: ChecklistTemplate[]): string {
  if (cl.mode === "custom") {
    const templateName = templates.find((t) => t.id === cl.templateId)?.name;
    const count = Object.values(cl.customEntries ?? {}).filter(Boolean).length;
    return `${templateName ? templateName + " · " : ""}${count} entr${count !== 1 ? "ies" : "y"} · ${formatDate(cl.updatedAt)}`;
  }
  return `${cl.content.length} habit${cl.content.length !== 1 ? "s" : ""} · ${formatDate(cl.updatedAt)}`;
}
export function ChecklistsClient() {
  const router = useRouter();
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  useEffect(() => {
    Promise.all([actionGetChecklists(), actionGetTemplates()]).then(
      ([checklistData, templateData]) => {
        setChecklists(checklistData);
        setTemplates(templateData);
        setLoading(false);
      },
    );
  }, [])
async function handleCreate(templateId?: string) {
  setCreating(true);
  setShowCreateModal(false);
  try {
    const checklist = await actionCreateChecklist({ templateId });
    router.push(`/checklists/${checklist.id}`);
  } catch (err) {
    console.error(err);
    setCreating(false);
  }
}

  async function handleDelete(id: string) {
    if (!confirm("Delete this checklist?")) return;
    setDeletingId(id);
    try {
      await actionDeleteChecklist(id);
      setChecklists((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Modal — rendered at root so it overlays everything */}
      {showCreateModal && (
        <CreateChecklistModal
          templates={templates}
          onSelectAction={handleCreate}
          onCloseAction={() => setShowCreateModal(false)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              ← Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="text-sm font-semibold text-slate-900">Checklists</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            disabled={creating}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {creating ? "Creating…" : "+ New checklist"}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-5 py-8">
        <div className="mx-auto max-w-2xl">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-2xl border border-slate-100 bg-white"
                />
              ))}
            </div>
          ) : checklists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl shadow-sm">
                ✅
              </div>
              <p className="text-base font-semibold text-slate-900">No checklists yet</p>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Create a habit assessment or pick a custom template to start tracking.
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                disabled={creating}
                className="mt-5 inline-flex h-9 items-center rounded-full bg-slate-950 px-5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create first checklist"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {checklists.map((cl) => (
                <div
                  key={cl.id}
                  className="group relative flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-slate-200 hover:shadow-md"
                >
                  <Link
                    href={`/checklists/${cl.id}`}
                    className="flex flex-1 items-center gap-3"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-base">
                      {checklistIcon(cl, templates)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{cl.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {checklistSubtitle(cl, templates)}
                      </p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(cl.id)}
                    disabled={deletingId === cl.id}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 disabled:opacity-50"
                    aria-label="Delete checklist"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
