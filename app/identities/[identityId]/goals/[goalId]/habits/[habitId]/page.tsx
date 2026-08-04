import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { actionGetHabitChecklists } from "@/lib/checklists-actions";
import { actionGetNotesForProfileEntity } from "@/lib/notes-actions";

type PageProps = {
  params: Promise<{ identityId: string; goalId: string; habitId: string }>;
};

export default async function IdentityGoalHabitDetailPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) notFound();

  const { identityId, goalId, habitId } = await params;

  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      
      goalId: goalId,
      goal: {
        identityId,
      },
    },
    include: {
      goal: {
        include: { identity: true },
      },
    },
  });

  if (!habit) notFound();

  const [notes, checklists] = await Promise.all([
    actionGetNotesForProfileEntity("habits", habit.id),
    actionGetHabitChecklists(habit.id, habit.name),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 py-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Habit</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{habit.name}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Goal: <Link href={`/identities/${identityId}/goals/${goalId}`} className="font-medium text-slate-800 hover:text-slate-900">{habit?.goal?.text || "Untitled goal"}</Link>
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Identity: <Link href={`/identities/${identityId}`} className="font-medium text-slate-800 hover:text-slate-900">{habit?.goal?.identity?.name || "Unknown"}</Link>
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Checkins (Checklists)</h2>
        {checklists.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No checklists attached to this habit yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {checklists.map((checklist) => (
              <Link
                key={checklist.id}
                href={`/checklists/${checklist.id}`}
                className="block rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:border-slate-300 hover:text-slate-900"
              >
                {checklist.title}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Attached Notes</h2>
        {notes.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No notes attached to this habit yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="block rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:border-slate-300 hover:text-slate-900"
              >
                {note.title || "Untitled note"}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Recent Habit Cues</h2>
        {habit.cues.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No cues logged yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {habit.cues.map((cue) => (
              <div key={cue.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <p className="font-medium text-slate-900">{cue.behavior}</p>
                <p className="text-xs text-slate-500">{cue.time} · {cue.location}</p>
                {cue.reflection && <p className="mt-1 text-sm text-slate-600">{cue.reflection}</p>}
              </div>
            ))}
          </div>
        )}
      </section> */}
    </div>
  );
}
