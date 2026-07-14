import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  actionAttachGoalToIdentity,
  actionGetAssignableGoalsForIdentity,
} from "@/lib/actions/next-step-actions";
import {
  actionAttachHabitToIdentity,
  actionGetAttachableHabitsForIdentity,
} from "@/lib/actions/habit-actions";

type PageProps = { params: Promise<{ identityId: string }> };

export default async function IdentityDetailPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) notFound();

  const { identityId } = await params;

  const assignGoalAction = async (formData: FormData) => {
    "use server";

    const goalId = String(formData.get("goalId") ?? "").trim();
    if (!goalId) return;

    await actionAttachGoalToIdentity(goalId, identityId);
    revalidatePath(`/identities/${identityId}`);
    revalidatePath("/profile");
  };

  const assignHabitAction = async (formData: FormData) => {
    "use server";

    const habitId = String(formData.get("habitId") ?? "").trim();
    if (!habitId) return;

    await actionAttachHabitToIdentity(habitId, identityId);
    revalidatePath(`/identities/${identityId}`);
    revalidatePath("/profile");
  };

  const identity = await prisma.identityRecord.findFirst({
    where: {
      id: identityId,
      assessment: { userId },
    },
    include: {
      goals: {
        orderBy: { id: "asc" },
        include: {
          trackedHabits: {
            orderBy: { name: "asc" },
          },
        },
      },
      trackedHabits: {
        orderBy: { name: "asc" },
        include: {
          goalEntry: true,
        },
      },
    },
  });

  if (!identity) notFound();

  const [assignableGoals, assignableHabits] = await Promise.all([
    actionGetAssignableGoalsForIdentity(identity.id),
    actionGetAttachableHabitsForIdentity(identity.id),
  ]);

  const goalHabits = identity.goals.flatMap((goal) =>
    goal.trackedHabits.map((habit) => ({ ...habit, goalId: goal.id, goalName: goal.goal })),
  );
  const directHabits = identity.trackedHabits.map((habit) => ({
    ...habit,
    goalId: habit.goalEntryId ?? habit.goalEntry?.id ?? null,
    goalName: habit.goalEntry?.goal ?? null,
  }));
  const allHabits = [...goalHabits, ...directHabits].filter((habit, index, array) =>
    array.findIndex((candidate) => candidate.id === habit.id) === index,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 py-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Identity</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{identity.identity || "Untitled identity"}</h1>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Goals</h2>
        {assignableGoals.length > 0 && (
          <form action={assignGoalAction} className="mt-3 flex flex-wrap items-center gap-2">
            <select
              name="goalId"
              defaultValue=""
              className="h-9 rounded-full border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
            >
              <option value="" disabled>
                Attach goal to this identity...
              </option>
              {assignableGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.goal || "Untitled goal"}{goal.supportingHabits.length > 0 ? ` · ${goal.supportingHabits.join(", ")}` : ""}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Attach goal
            </button>
          </form>
        )}
        {identity.goals.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No goals linked to this identity yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {identity.goals.map((goal) => (
              <Link
                key={goal.id}
                href={`/identities/${identity.id}/goals/${goal.id}`}
                className="block rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:border-slate-300 hover:text-slate-900"
              >
                {goal.goal || "Untitled goal"}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Supporting Goals and Habits</h2>
        {assignableHabits.length > 0 && (
          <form action={assignHabitAction} className="mt-3 flex flex-wrap items-center gap-2">
            <select
              name="habitId"
              defaultValue=""
              className="h-9 rounded-full border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
            >
              <option value="" disabled>
                Attach habit to this identity...
              </option>
              {assignableHabits.map((habit) => (
                <option key={habit.id} value={habit.id}>
                  {habit.name}{habit.category ? ` (${habit.category})` : ""}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Attach habit
            </button>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Habits</h2>
        {allHabits.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No habits linked under this identity yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {allHabits.map((habit) => (
              <Link
                key={habit.id}
                href={habit.goalId ? `/identities/${identity.id}/goals/${habit.goalId}/habits/${habit.id}` : `/habits/${habit.id}`}
                className="block rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:border-slate-300 hover:text-slate-900"
              >
                {habit.name}
                <span className="ml-2 text-xs text-slate-500">({habit.goalName || "Direct habit"})</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
