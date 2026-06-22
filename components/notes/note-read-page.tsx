"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { actionGetNoteById } from "@/lib/notes-actions";
import type { Note } from "@/types/habit";

export function NoteReadPage({ noteId }: { noteId: string }) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    actionGetNoteById(noteId)
      .then((n) => setNote(n))
      .finally(() => setLoading(false));
  }, [noteId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Note not found.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 px-5 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link href="/notes" className="text-xs font-medium text-slate-500 hover:text-slate-800">
          &lt; Back to notes
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          {note.title || "Untitled note"}
        </h1>
        <p className="text-xs text-slate-400">
          Updated {new Date(note.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {note.contentText || "No preview content."}
        </p>
      </div>
    </div>
  );
}
