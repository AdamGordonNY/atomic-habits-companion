/**
 * Notes storage layer.
 *
 * All reads/writes go through the functions below.
 * When you add Supabase, replace each function body with the
 * equivalent `supabase.from("notes")…` call — the component
 * layer never needs to change.
 */

import type { Note } from "@/types/habit";

const STORAGE_KEY = "atomic-habits:notes";
const STORAGE_VERSION = 1;

interface StoredNotes {
  version: number;
  notes: Note[];
}

// ─── internal helpers ─────────────────────────────────────────────────────────

function readAll(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredNotes;
    if (parsed.version !== STORAGE_VERSION) return [];
    return parsed.notes ?? [];
  } catch {
    return [];
  }
}

function writeAll(notes: Note[]): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: STORAGE_VERSION, notes }),
  );
}

// ─── public API ───────────────────────────────────────────────────────────────
// Each function mirrors the shape you'd use with Supabase so migration is a
// straight swap:
//   getNotes()          → supabase.from("notes").select("*").order("pinned", …)
//   createNote(draft)   → supabase.from("notes").insert(draft)
//   updateNote(id, patch) → supabase.from("notes").update(patch).eq("id", id)
//   deleteNote(id)      → supabase.from("notes").delete().eq("id", id)

export function getNotes(): Note[] {
  return readAll().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function getNoteById(id: string): Note | null {
  return readAll().find((n) => n.id === id) ?? null;
}

export function createNote(
  draft: Omit<Note, "id" | "createdAt" | "updatedAt">,
): Note {
  const now = new Date().toISOString();
  const note: Note = {
    ...draft,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  const notes = readAll();
  writeAll([note, ...notes]);
  return note;
}

export function updateNote(id: string, patch: Partial<Omit<Note, "id" | "createdAt">>): Note | null {
  const notes = readAll();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  const updated: Note = {
    ...notes[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  notes[idx] = updated;
  writeAll(notes);
  return updated;
}

export function deleteNote(id: string): void {
  writeAll(readAll().filter((n) => n.id !== id));
}

export function togglePin(id: string): Note | null {
  const note = getNoteById(id);
  if (!note) return null;
  return updateNote(id, { pinned: !note.pinned });
}
