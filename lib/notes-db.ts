/**
 * Notes — server-side database CRUD (Prisma + PostgreSQL)
 *
 * This module is SERVER-ONLY. Import it from Server Components or
 * Server Actions; never from "use client" files.
 *
 * The function signatures intentionally mirror lib/notes-store.ts so that
 * swapping between localStorage and the database requires only changing the
 * import path, not the call sites.
 *
 * Sync strategy
 * ─────────────
 * While the app is localStorage-first, use `syncNotesToDb` on sign-in to
 * push the local notes up to the database. After that point, the DB is the
 * source of truth and the client reads from /api/notes (or server props).
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import type { Note } from "@/types/habit";

// ─── type helpers ─────────────────────────────────────────────────────────────

/** Shape returned by Prisma — convert to the app's Note type */
function toNote(row: {
  id: string;
  title: string;
  content: string;
  contentText: string;
  tags: string[];
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    contentText: row.contentText,
    tags: row.tags,
    pinned: row.pinned,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ─── queries ──────────────────────────────────────────────────────────────────

/** Return all notes for a user, pinned first then newest first. */
export async function dbGetNotes(userId: string): Promise<Note[]> {
  const rows = await prisma.note.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
  return rows.map(toNote);
}

/** Return a single note. Returns null if not found or not owned by userId. */
export async function dbGetNoteById(
  userId: string,
  noteId: string,
): Promise<Note | null> {
  const row = await prisma.note.findFirst({
    where: { id: noteId, userId },
  });
  return row ? toNote(row) : null;
}

// ─── mutations ────────────────────────────────────────────────────────────────

export async function dbCreateNote(
  userId: string,
  data: Pick<Note, "title" | "content" | "contentText" | "tags" | "pinned">,
): Promise<Note> {
  const row = await prisma.note.create({
    data: { userId, ...data },
  });
  return toNote(row);
}

export async function dbUpdateNote(
  userId: string,
  noteId: string,
  data: Partial<Pick<Note, "title" | "content" | "contentText" | "tags" | "pinned">>,
): Promise<Note> {
  // The where clause ensures users can only update their own notes
  const row = await prisma.note.update({
    where: { id: noteId, userId },
    data,
  });
  return toNote(row);
}

export async function dbDeleteNote(
  userId: string,
  noteId: string,
): Promise<void> {
  await prisma.note.delete({ where: { id: noteId, userId } });
}

export async function dbTogglePin(
  userId: string,
  noteId: string,
): Promise<Note> {
  const current = await prisma.note.findFirst({
    where: { id: noteId, userId },
    select: { pinned: true },
  });
  if (!current) throw new Error("Note not found");
  return dbUpdateNote(userId, noteId, { pinned: !current.pinned });
}

// ─── sync helper ──────────────────────────────────────────────────────────────

/**
 * One-way sync: push localStorage notes into the database.
 * Call this after a user signs in for the first time on a device.
 *
 * Notes whose IDs already exist in the DB are skipped (upsert by local id).
 * Returns the full list of notes from the DB after sync.
 */
export async function syncNotesToDb(
  userId: string,
  localNotes: Note[],
): Promise<Note[]> {
  if (localNotes.length === 0) return dbGetNotes(userId);

  await Promise.all(
    localNotes.map((n) =>
      prisma.note.upsert({
        where: { id: n.id },
        create: {
          id: n.id,
          userId,
          title: n.title,
          content: n.content,
          contentText: n.contentText,
          tags: n.tags,
          pinned: n.pinned,
          createdAt: new Date(n.createdAt),
          // updatedAt is managed by Prisma @updatedAt
        },
        update: {
          // Only overwrite if local version is newer
          title: n.title,
          content: n.content,
          contentText: n.contentText,
          tags: n.tags,
          pinned: n.pinned,
        },
      }),
    ),
  );

  return dbGetNotes(userId);
}
