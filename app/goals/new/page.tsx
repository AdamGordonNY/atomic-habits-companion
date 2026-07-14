import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "New Goal · Atomic Habits Companion",
  description: "Create a new goal and attach it to an identity.",
};

function parseLines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default async function NewGoalPage() {
  const { userId } = await auth();
  if (!userId) notFound();

  const partFour = await prisma.assessmentPartFour.findUnique({
    where: { userId },
    include: { identities: { orderBy: { identity: "asc" } } },
  });

  const saveGoal = async (formData: FormData) => {
    "use server";

    const { userId } = await auth();
    if (!userId) notFound();

    const goal = String(formData.get("goal") ?? "").trim();
    if (!goal) return;

    const identityId = String(formData.get("identityId") ?? "").trim() || null;
    const componentHabits = parseLines(formData.get("componentHabits"));

    const nextStep = await prisma.assessmentNextStep.upsert({
      where: { userId },
      create: { userId },
      update: { updatedAt: new Date() },
      select: { id: true },
    });

    const record = await prisma.nextStepGoalEntry.create({
      data: {
        nextStepId: nextStep.id,
        identityId,
        goal,
        currentSystem: "",
        systemEval: "",
        systemRating: 0,
        idealSystem: "",
        componentHabits,
      },
    });

    if (componentHabits.length > 0) {
      await prisma.trackedHabit.createMany({
        data: componentHabits.map((name) => ({
          userId,
          name,
          goalEntryId: record.id,
          identityId,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/goals");
    revalidatePath("/profile");
    if (identityId) {
      revalidatePath(`/identities/${identityId}`);
      redirect(`/identities/${identityId}/goals/${record.id}`);
    }
    redirect(`/goals/${record.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Add New</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Create goal</h1>
        <p className="mt-2 text-sm text-slate-600">
          Create a goal, optionally bind it to an identity, and add supporting habits.
        </p>

        <form action={saveGoal} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Goal</span>
            <input
              name="goal"
              placeholder="What do you want to achieve?"
              className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Identity</span>
              <select
                name="identityId"
                defaultValue=""
                className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="">No identity</option>
                {partFour?.identities.map((identity) => (
                  <option key={identity.id} value={identity.id}>
                    {identity.identity}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Supporting habits</span>
              <textarea
                name="componentHabits"
                rows={3}
                placeholder="One habit per line"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create goal
            </button>
            <Link href="/goals" className="text-sm font-medium text-slate-600 hover:text-slate-950">
              Back to goals
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
