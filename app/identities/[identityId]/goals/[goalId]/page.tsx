import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ identityId: string; goalId: string }> };

export default async function IdentityGoalDetailPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) notFound();

  const { identityId, goalId } = await params;

  const goal = await prisma.nextStepGoalEntry.findFirst({
    where: {
      id: goalId,
      identityId,
      nextStep: { userId },
    },
    include: {
      identity: true,
      trackedHabits: { orderBy: { name: "asc" } },
    },
  });

  if (!goal) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 py-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Goal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{goal.goal || "Untitled goal"}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Identity: <Link href={`/identities/${identityId}`} className="font-medium text-slate-800 hover:text-slate-900">{goal.identity?.identity || "Unknown"}</Link>
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Habits For This Goal</h2>
        {goal.trackedHabits.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No habits attached to this goal yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {goal.trackedHabits.map((habit) => (
              <Link
                key={habit.id}
                href={`/identities/${identityId}/goals/${goal.id}/habits/${habit.id}`}
                className="block rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:border-slate-300 hover:text-slate-900"
              >
                {habit.name}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
