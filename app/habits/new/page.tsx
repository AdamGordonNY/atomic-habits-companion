import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "New Habit · Atomic Habits Companion",
  description: "Create a new habit and attach it to a goal or identity.",
};

export default async function NewHabitPage() {
  const { userId } = await auth();
  if (!userId) notFound();

  const [goals, identities] = await Promise.all([
    prisma.goal.findMany({
      where: { identity: { userId } },
      orderBy: { text: "asc" },
      select: { id: true, text: true, identityId: true },
    }),
    prisma.identity.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const saveHabit = async (formData: FormData) => {
    "use server";

    const { userId } = await auth();
    if (!userId) notFound();

    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;

    const category = String(formData.get("category") ?? "").trim() || null;
    const goalId = String(formData.get("goalId") ?? "").trim() || null;
    const identityId = String(formData.get("identityId") ?? "").trim() || null;

    let resolvedGoalId = goalId;
    let resolvedIdentityId = identityId;

    if (resolvedGoalId) {
      const goal = await prisma.goal.findFirst({
        where: { id: resolvedGoalId, identity: { userId } },
        select: { id: true, identityId: true },
      });
      if (!goal) throw new Error("Goal not found");
      resolvedGoalId = goal.id;
      resolvedIdentityId = resolvedIdentityId ?? goal.identityId ?? null;
    }

    if (resolvedIdentityId) {
      const identity = await prisma.identity.findFirst({
        where: { id: resolvedIdentityId, userId },
        select: { id: true },
      });
      if (!identity) throw new Error("Identity not found");
      resolvedIdentityId = identity.id;
    }

    if (!resolvedGoalId && resolvedIdentityId) {
      const createdGoal = await prisma.goal.create({
        data: {
          identityId: resolvedIdentityId,
          text: `Support ${name}`,
          category: null,
          currentSystem: "",
          systemEval: "",
          systemRating: 0,
          idealSystem: "",
        },
        select: { id: true },
      });
      resolvedGoalId = createdGoal.id;
    }

    if (!resolvedGoalId) {
      const fallbackGoal = await prisma.goal.findFirst({
        where: { identity: { userId } },
        orderBy: { id: "asc" },
        select: { id: true },
      });
      if (!fallbackGoal) throw new Error("Create an identity/goal before adding habits");
      resolvedGoalId = fallbackGoal.id;
    }

    const existing = await prisma.habit.findFirst({
      where: { userId, name },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    const habit = existing
      ? await prisma.habit.update({
          where: { id: existing.id },
          data: {
            category: category ?? undefined,
            goalId: resolvedGoalId,
            updatedAt: new Date(),
          },
        })
      : await prisma.habit.create({
          data: {
            userId,
            name,
            category,
          goalId: resolvedGoalId,
          mode: "building",
          cue: "",
          time: "",
          location: "",
          },
      });

    revalidatePath("/habits");
    revalidatePath("/profile");
    if (resolvedGoalId && resolvedIdentityId) {
      revalidatePath(`/identities/${resolvedIdentityId}/goals/${resolvedGoalId}`);
      redirect(`/identities/${resolvedIdentityId}/goals/${resolvedGoalId}/habits/${habit.id}`);
    }
    if (resolvedGoalId) {
      redirect(`/goals/${resolvedGoalId}`);
    }
    if (resolvedIdentityId) {
      redirect(`/identities/${resolvedIdentityId}`);
    }
    redirect(`/habits/${habit.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Add New</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Create habit</h1>
        <p className="mt-2 text-sm text-slate-600">
          Add a habit and attach it to a goal or identity on the same page.
        </p>

        <form action={saveHabit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Habit</span>
            <input
              name="name"
              placeholder="What habit do you want to track?"
              className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Category</span>
            <input
              name="category"
              placeholder="Optional category"
              className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Goal</span>
              <select
                name="goalId"
                defaultValue=""
                className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="">No goal</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.text}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Identity</span>
              <select
                name="identityId"
                defaultValue=""
                className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="">No identity</option>
                {identities.map((identity) => (
                  <option key={identity.id} value={identity.id}>
                    {identity.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create habit
            </button>
            <Link href="/habits" className="text-sm font-medium text-slate-600 hover:text-slate-950">
              Back to habits
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
