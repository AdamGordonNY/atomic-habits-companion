"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Note } from "@/types/habit";
import {
  createNote,
  deleteNote,
  getNotes,
  togglePin,
  updateNote,
} from "@/lib/notes-store";
import { RichEditor } from "./rich-editor";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function excerpt(text: string, max = 100): string {
  const trimmed = text.trim();
  return trimmed.length > max ? trimmed.slice(0, max) + "…" : trimmed;
}

// ─── tag pill ─────────────────────────────────────────────────────────────────

function TagPill({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 text-slate-400 hover:text-slate-700"
        >
          ×
        </button>
      )}
    </span>
  );
}

// ─── note card in list ────────────────────────────────────────────────────────

function NoteCard({
  note,
  active,
  onClick,
}: {
  note: Note;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3.5 text-left transition-all ${
        active
          ? "border-slate-950 bg-slate-950 text-white shadow-md"
          : "border-slate-100 bg-white text-slate-900 hover:border-slate-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={`truncate text-sm font-semibold ${
            active ? "text-white" : "text-slate-950"
          }`}
        >
          {note.title || "Untitled note"}
        </p>
        <div className="flex flex-shrink-0 items-center gap-1">
          {note.pinned && (
            <span className={`text-xs ${active ? "text-slate-400" : "text-slate-400"}`}>
              📌
            </span>
          )}
          <span
            className={`text-[10px] ${active ? "text-slate-400" : "text-slate-400"}`}
          >
            {formatRelative(note.updatedAt)}
          </span>
        </div>
      </div>
      {note.contentText.trim() && (
        <p
          className={`mt-1 line-clamp-2 text-xs leading-5 ${
            active ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {excerpt(note.contentText)}
        </p>
      )}
      {note.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {note.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                active
                  ? "bg-slate-800 text-slate-300"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function NotesClient() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  // editor state (controlled locally, saved on explicit save or blur)
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editContentText, setEditContentText] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [editorKey, setEditorKey] = useState(0); // reset key
  const [dirty, setDirty] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Signals the selection useEffect to open the incoming note in edit mode.
  // Set to true only by handleNew(); the effect resets it after reading.
  const openInEditModeRef = useRef(false);

  // sidebar visibility on mobile
  const [showSidebar, setShowSidebar] = useState(true);

  // true = read-only view, false = editing
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loaded = getNotes();
    setNotes(loaded);
    setMounted(true);
    const f = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(f);
  }, []);

  // load selected note into editor state
  useEffect(() => {
    if (!selected) return;
    setEditTitle(selected.title);
    setEditContent(selected.content);
    setEditContentText(selected.contentText);
    setEditTags(selected.tags);
    setEditorKey((k) => k + 1);
    setDirty(false);
    setShowDelete(false);
    setIsEditing(openInEditModeRef.current); // true only for brand-new notes
    openInEditModeRef.current = false;       // reset for next selection
    // on mobile, switch to editor pane
    setShowSidebar(false);
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function refreshList() {
    setNotes(getNotes());
  }

  function handleNew() {
    const note = createNote({
      title: "",
      content: "",
      contentText: "",
      tags: [],
      pinned: false,
    });
    refreshList();
    openInEditModeRef.current = true; // new note → open directly in editor
    setSelected(note);
  }

  function selectNote(note: Note) {
    setSelected(note);
    setIsEditing(false); // existing notes open in view mode
  }

  function handleDoneEditing() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    if (selected) save(selected, editTitle, editContent, editContentText, editTags);
    setIsEditing(false);
  }

  function save(note: Note, title: string, content: string, contentText: string, tags: string[]) {
    updateNote(note.id, { title, content, contentText, tags });
    refreshList();
    setDirty(false);
  }

  function handleEditorChange(json: string, text: string) {
    setEditContent(json);
    setEditContentText(text);
    setDirty(true);

    // autosave 1.5 s after last keystroke
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      if (selected) {
        save(selected, editTitle, json, text, editTags);
      }
    }, 1500);
  }

  function handleTitleChange(v: string) {
    setEditTitle(v);
    setDirty(true);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      if (selected) {
        save(selected, v, editContent, editContentText, editTags);
      }
    }, 1500);
  }

  function handleAddTag() {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || editTags.includes(tag)) { setTagInput(""); return; }
    const next = [...editTags, tag];
    setEditTags(next);
    setTagInput("");
    if (selected) save(selected, editTitle, editContent, editContentText, next);
  }

  function handleRemoveTag(tag: string) {
    const next = editTags.filter((t) => t !== tag);
    setEditTags(next);
    if (selected) save(selected, editTitle, editContent, editContentText, next);
  }

  function handleDelete() {
    if (!selected) return;
    deleteNote(selected.id);
    setSelected(null);
    setShowDelete(false);
    setShowSidebar(true);
    refreshList();
  }

  function handlePin() {
    if (!selected) return;
    togglePin(selected.id);
    refreshList();
    // keep selected in sync
    setSelected((prev) =>
      prev ? { ...prev, pinned: !prev.pinned } : null,
    );
  }

  const filtered = notes.filter((n) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.contentText.toLowerCase().includes(q) ||
      n.tags.some((t) => t.includes(q))
    );
  });

  return (
    <div
      className={`flex h-screen flex-col overflow-hidden transition-all duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* ── top nav ────────────────────────────────────────────────────────── */}
      <header className="z-20 flex flex-shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {/* mobile back-to-list button */}
          {!showSidebar && (
            <button
              type="button"
              onClick={() => setShowSidebar(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 sm:hidden"
            >
              ←
            </button>
          )}
          <Link
            href="/dashboard"
            className="hidden text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 hover:text-slate-600 sm:block"
          >
            ← Dashboard
          </Link>
          <span className="text-sm font-semibold text-slate-950">Notes</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNew}
            className="inline-flex h-8 items-center justify-center rounded-full bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            + New note
          </button>
        </div>
      </header>

      {/* ── body ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* sidebar */}
        <aside
          className={`flex w-full flex-shrink-0 flex-col border-r border-slate-100 bg-slate-50/70 sm:w-72 sm:flex-shrink-0 sm:!flex ${
            showSidebar ? "flex" : "hidden"
          }`}
        >
          {/* search */}
          <div className="px-3 py-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
            />
          </div>

          {/* list */}
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {!mounted ? (
              <SkeletonList />
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-slate-400">
                  {search ? "No matching notes." : "No notes yet."}
                </p>
                {!search && (
                  <button
                    type="button"
                    onClick={handleNew}
                    className="mt-3 text-xs font-medium text-slate-600 underline underline-offset-2"
                  >
                    Create your first note
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    active={selected?.id === note.id}
                    onClick={() => selectNote(note)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* editor pane */}
        <main
          className={`flex-1 overflow-y-auto bg-white sm:!flex ${
            showSidebar ? "hidden" : "flex"
          } flex-col`}
        >
          {selected ? (
            <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6">
              {isEditing ? (
                /* ── EDIT MODE ──────────────────────────────────────────── */
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Note title"
                    className="mb-4 w-full border-none bg-transparent text-2xl font-bold text-slate-950 placeholder:text-slate-300 focus:outline-none"
                  />

                  {/* meta row */}
                  <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span>{formatRelative(selected.updatedAt)} · {selected.createdAt !== selected.updatedAt ? "edited" : "created"}</span>

                    <button
                      type="button"
                      onClick={handleDoneEditing}
                      className="rounded-full border border-slate-200 px-2.5 py-0.5 font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    >
                      ✓ Done
                    </button>

                    <button
                      type="button"
                      onClick={handlePin}
                      className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 transition ${
                        selected.pinned
                          ? "border-amber-300 bg-amber-50 text-amber-700"
                          : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                      }`}
                    >
                      📌 {selected.pinned ? "Pinned" : "Pin"}
                    </button>

                    {showDelete ? (
                      <span className="flex items-center gap-1">
                        <button type="button" onClick={handleDelete} className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-rose-600 hover:bg-rose-100">Confirm delete</button>
                        <button type="button" onClick={() => setShowDelete(false)} className="rounded-full border border-slate-200 px-2.5 py-0.5 text-slate-500 hover:bg-slate-50">Cancel</button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => setShowDelete(true)} className="rounded-full border border-slate-200 px-2.5 py-0.5 text-slate-400 hover:border-rose-200 hover:text-rose-500">Delete</button>
                    )}

                    {dirty && <span className="text-slate-300">saving…</span>}
                  </div>

                  {/* tags with add */}
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    {editTags.map((t) => (
                      <TagPill key={t} tag={t} onRemove={() => handleRemoveTag(t)} />
                    ))}
                    <form onSubmit={(e) => { e.preventDefault(); handleAddTag(); }} className="flex items-center">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="+ add tag"
                        className="w-20 border-none bg-transparent text-[11px] text-slate-400 placeholder:text-slate-300 focus:outline-none"
                      />
                    </form>
                  </div>

\


\                  <RichEditor
                    key={editorKey}
                    initialContent={editContent}
                    resetKey={editorKey}
                    placeholder="Start writing…"
                    onChange={handleEditorChange}
                    minHeight="16rem"
                  />
                </>
              ) : (
                /* ── VIEW MODE — styled card ────────────────────────────── */
                <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                  {/* card header */}
                  <div className="border-b border-slate-100 px-7 py-6">
                    <h1 className="text-2xl font-bold leading-snug text-slate-950">
                      {editTitle || <span className="text-slate-300">Untitled note</span>}
                    </h1>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      {formatRelative(selected.updatedAt)}
                      {selected.createdAt !== selected.updatedAt ? " · edited" : " · created"}
                      {selected.pinned && " · 📌 pinned"}
                    </p>
                    {editTags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {editTags.map((t) => (
                          <TagPill key={t} tag={t} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* card body — plain text content */}
                  <div className="px-7 py-6">
                    {editContentText.trim() ? (
                      <p className="whitespace-pre-wrap text-base leading-7 text-slate-700">
                        {editContentText}
                      </p>
                    ) : (
                      <p className="text-sm italic text-slate-300">No content yet.</p>
                    )}
                  </div>

                  {/* card footer — actions */}
                  <div className="flex items-center gap-2 border-t border-slate-100 px-7 py-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-700"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      onClick={handlePin}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition ${
                        selected.pinned
                          ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      📌 {selected.pinned ? "Unpin" : "Pin"}
                    </button>

                    <div className="ml-auto">
                      {showDelete ? (
                        <span className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDelete}
                            className="inline-flex h-8 items-center rounded-full border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                          >
                            Confirm delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDelete(false)}
                            className="inline-flex h-8 items-center rounded-full border border-slate-200 px-4 text-xs text-slate-500 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowDelete(true)}
                          className="inline-flex h-8 items-center rounded-full border border-slate-200 px-4 text-xs text-slate-400 hover:border-rose-200 hover:text-rose-500"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-3xl">
                📝
              </div>
              <div>
                <p className="font-semibold text-slate-900">No note selected</p>
                <p className="mt-1 text-sm text-slate-500">
                  Pick one from the list or create a new one.
                </p>
              </div>
              <button
                type="button"
                onClick={handleNew}
                className="mt-2 inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                + New note
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4"
        >
          <div className="mb-2 h-3.5 w-3/4 rounded-full bg-slate-100" />
          <div className="h-2.5 w-full rounded-full bg-slate-100" />
          <div className="mt-1 h-2.5 w-2/3 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
