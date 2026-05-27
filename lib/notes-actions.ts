"use server";

/**
 * Notes — Server Actions
 *
 * These are the bridge between the "use client" components and the DB layer.
 * The client imports these actions instead of direct prisma calls, keeping
 * the Prisma client and database credentials on the server.
 *
 * Usage in a client component:
 *   import { actionGetNotes, actionCreateNote } from "@/lib/notes-actions";
 *   const notes = await actionGetNotes();
 */

import { auth } from "@/auth";
import {
  dbCreateNote,
  dbDeleteNote,
  dbGetNoteById,
  dbGetNotes,
  dbTogglePin,
  dbUpdateNote,
  syncNotesToDb,
} from "@/lib/notes-db";
import type { Note } from "@/types/habit";

// ─── auth guard ───────────────────────────────────────────────────────────────

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

// ─── actions ──────────────────────────────────────────────────────────────────

export async function actionGetNotes(): Promise<Note[]> {
  const userId = await requireUserId();
  return dbGetNotes(userId);
}

export async function actionGetNoteById(noteId: string): Promise<Note | null> {
  const userId = await requireUserId();
  return dbGetNoteById(userId, noteId);
}

export async function actionCreateNote(
  data: Pick<Note, "title" | "content" | "contentText" | "tags" | "pinned">,
): Promise<Note> {
  const userId = await requireUserId();
  return dbCreateNote(userId, data);
}

export async function actionUpdateNote(
  noteId: string,
  data: Partial<Pick<Note, "title" | "content" | "contentText" | "tags" | "pinned">>,
): Promise<Note> {
  const userId = await requireUserId();
  return dbUpdateNote(userId, noteId, data);
}

export async function actionDeleteNote(noteId: string): Promise<void> {
  const userId = await requireUserId();
  await dbDeleteNote(userId, noteId);
}

export async function actionTogglePin(noteId: string): Promise<Note> {
  const userId = await requireUserId();
  return dbTogglePin(userId, noteId);
}

/**
 * Push all localStorage notes into the database.
 * Call once after sign-in to migrate local data to the account.
 */
export async function actionSyncLocalNotes(localNotes: Note[]): Promise<Note[]> {
  const userId = await requireUserId();
  return syncNotesToDb(userId, localNotes);
}
