import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "New Checklist · Atomic Habits Companion",
  description: "Create a new checklist attached to an identity, goal, or habit.",
};

export default async function NewChecklistPage() {
  const { userId } = await auth();
  if (!userId) notFound();

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

  const saveChecklist = async (formData: FormData) => {
    "use server";

    const { userId } = await auth();
    if (!userId) notFound();

    const title = String(formData.get("title") ?? "").trim() || "New Checklist";
    const entityKind = String(formData.get("entityKind") ?? "").trim();
    const entityId = String(formData.get("entityId") ?? "").trim();

    let habitId: string | null = null;
    if (entityKind === "habit" && entityId) {
      const habit = await prisma.habit.findFirst({
        where: { id: entityId, userId },
        select: { id: true },
      });
      if (habit) habitId = habit.id;
    }

    const row = await prisma.checklist.create({
      data: {
        userId,
        title,
        mode: habitId ? "habit-assessment" : "custom",
        habitId,
        content: "[]",
        customEntries: "{}",
      },
    });

    revalidatePath("/checklists");
    redirect(`/checklists/${row.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Add New</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Create checklist</h1>

        <form action={saveChecklist} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Title</span>
            <input
              name="title"
              placeholder="Checklist title"
              className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
            />
          </label>

          <fieldset className="rounded-2xl border border-slate-200 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Attach to (optional)</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs text-slate-500">Type</span>
                <select
                  name="entityKind"
                  defaultValue=""
                  className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                >
                  <option value="">None</option>
                  <option value="identity">Identity</option>
                  <option value="goal">Goal</option>
                  <option value="habit">Habit</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-slate-500">Which one?</span>
                <select
                  name="entityId"
                  defaultValue=""
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
              Create checklist
            </button>
            <Link href="/checklists" className="text-sm font-medium text-slate-600 hover:text-slate-950">
              Back to checklists
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
