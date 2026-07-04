"use client";

import Link from "next/link";
import { useState } from "react";
import { actionCreateNote } from "@/lib/notes-actions";
import type { Note, ProfileEntityType } from "@/types/habit";

function buildPlainTextTipTapJson(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => ({
      type: "paragraph",
      content: [{ type: "text", text: part }],
    }));

  return JSON.stringify({
    type: "doc",
    content: paragraphs.length > 0 ? paragraphs : [{ type: "paragraph" }],
  });
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProfileNotesPanel({
  entityType,
  entityId,
  initialNotes,
}: {
  entityType: ProfileEntityType;
  entityId?: string | null;
  initialNotes: Note[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreateNote() {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle && !trimmedBody) return;

    setSaving(true);
    try {
      const nextNote = await actionCreateNote({
        title: trimmedTitle || "Untitled note",
        content: buildPlainTextTipTapJson(trimmedBody),
        contentText: trimmedBody,
        tags: [],
        pinned: false,
        profileEntityType: entityType,
        profileEntityId: entityId ?? null,
      });
      setNotes((prev) => [nextNote, ...prev]);
      setTitle("");
      setBody("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-950">Notes</h2>
        <p className="mt-1 text-sm text-slate-500">Capture notes directly from this profile page.</p>
      </div>

      <div className="space-y-5 px-6 py-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Write a note about this area..."
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleCreateNote}
              disabled={saving || (!title.trim() && !body.trim())}
              className="inline-flex h-9 items-center rounded-full bg-slate-950 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add note"}
            </button>
            <Link href="/notes" className="text-xs font-medium text-slate-500 hover:text-slate-800">
              Open all notes
            </Link>
          </div>
        </div>

        {notes.length === 0 ? (
          <p className="text-sm text-slate-500">No notes for this page yet.</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="block rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{note.title || "Untitled note"}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                      {note.contentText || "No preview text."}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400">{formatDate(note.updatedAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}