import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ProfileEntityType } from "@/types/habit";

export const metadata: Metadata = {
  title: "New Note · Atomic Habits Companion",
  description: "Create a new note attached to an identity, goal, or habit.",
};

const ENTITY_TYPES: { value: ProfileEntityType; label: string }[] = [
  { value: "identities", label: "Identity" },
  { value: "goals", label: "Goal" },
  { value: "habits", label: "Habit" },
];

export default async function NewNotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const { userId } = await auth();
  if (!userId) notFound();

  const sp = await searchParams;
  const presetHabitId = sp.habitId ?? null;

  const [identities, goals, habits] = await Promise.all([
    prisma.identity.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.goal.findMany({
      where: { identity: { userId } },
      orderBy: { text: "asc" },
      select: { id: true, text: true },
    }),
    prisma.habit.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const saveNote = async (formData: FormData) => {
    "use server";

    const { userId } = await auth();
    if (!userId) notFound();

    const title = String(formData.get("title") ?? "").trim() || "Untitled note";
    const body = String(formData.get("body") ?? "").trim();
    const entityType = String(formData.get("entityType") ?? "").trim() as ProfileEntityType | "";
    const entityId = String(formData.get("entityId") ?? "").trim() || null;

    const note = await prisma.note.create({
      data: {
        userId,
        title,
        content: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: body }] }] }),
        contentText: body,
        tags: [],
        pinned: false,
        profileEntityType: entityType || null,
        profileEntityId: entityType && entityId ? entityId : null,
      },
    });

    revalidatePath("/notes");
    redirect(`/notes/${note.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Add New</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Create note</h1>

        <form action={saveNote} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Title</span>
            <input
              name="title"
              placeholder="Note title"
              className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Content</span>
            <textarea
              name="body"
              rows={6}
              placeholder="Write your note…"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
            />
          </label>

          <fieldset className="rounded-2xl border border-slate-200 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Attach to (optional)</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs text-slate-500">Type</span>
                <select
                  name="entityType"
                  defaultValue={presetHabitId ? "habits" : ""}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                >
                  <option value="">None</option>
                  {ENTITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-slate-500">Which one?</span>
                <select
                  name="entityId"
                  defaultValue={presetHabitId ?? ""}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                >
                  <option value="">—</option>
                  {identities.length > 0 && (
                    <optgroup label="Identities">
                      {identities.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </optgroup>
                  )}
                  {goals.length > 0 && (
                    <optgroup label="Goals">
                      {goals.map((g) => <option key={g.id} value={g.id}>{g.text}</option>)}
                    </optgroup>
                  )}
                  {habits.length > 0 && (
                    <optgroup label="Habits">
                      {habits.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </optgroup>
                  )}
                </select>
              </label>
            </div>
          </fieldset>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create note
            </button>
            <Link href="/notes" className="text-sm font-medium text-slate-600 hover:text-slate-950">
              Back to notes
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
