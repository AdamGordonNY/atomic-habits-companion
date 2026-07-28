import Link from "next/link";
import { IdentityTree } from "../identity/identity-tree";
import BentoCard from "./bento-card";
import { DashboardData } from "@/lib/actions/dashboard-actions";
import { greeting } from "@/lib/utils";
import { HabitCheckInCard } from "../habits/habit-check-in-card";

export default function BentoDashboard({ data }: { data: DashboardData }) {
  const goalCount = data.goals.length;
  const habitCount = data.trackedHabits.length;
  const noteCount = data.recentNotes.length;
  const checklistCount = data.recentChecklists.length;

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="space-y-1">
          <p className="text-sm font-medium text-slate-500" suppressHydrationWarning>{greeting()}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Dashboard</h1>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BentoCard href="/identities" icon="🧠" label="Identities" sublabel={data.identityCount > 0 ? `${data.identityCount} identit${data.identityCount === 1 ? "y" : "ies"}` : "Define who you're becoming"} accent />
          <BentoCard href="/goals" icon="🎯" label="Goals" sublabel={goalCount > 0 ? `${goalCount} goal${goalCount === 1 ? "" : "s"}` : "Set your next objectives"} />
          <BentoCard href="/habits" icon="⚡" label="Habits" sublabel={habitCount > 0 ? `${habitCount} tracked habit${habitCount === 1 ? "" : "s"}` : "Build your systems"} />
          <BentoCard href="/laws/0" icon="📖" label="Laws" sublabel="The four laws of behaviour change" />
          <BentoCard href="/notes" icon="✏️" label="Notes" sublabel={noteCount > 0 ? `${noteCount} recent note${noteCount === 1 ? "" : "s"}` : "Thoughts and reflections"} />
          <BentoCard href="/checklists" icon="✅" label="Checklists" sublabel={checklistCount > 0 ? `${checklistCount} recent checklist${checklistCount === 1 ? "" : "s"}` : "Track habit completion"} />
          <BentoCard href="/habit-assessment/onboarding/review" icon="📋" label="Review assessment" sublabel="Browse all your assessment answers" wide />
        </section>

        {!data.status.nextStep?.completedAt && (
          <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-700">In progress</p>
            <p className="mt-1 text-sm font-medium text-amber-900">Your assessment is not fully complete yet.</p>
            <Link href="/habit-assessment/onboarding" className="mt-3 inline-flex h-9 items-center rounded-full bg-amber-900 px-4 text-xs font-semibold text-white hover:bg-amber-800">
              Continue assessment →
            </Link>
          </section>
        )}

        {data.identities.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Identities</h2>
              <Link href="/identities" className="text-xs font-medium text-slate-500 hover:text-slate-800">
                View all →
              </Link>
            </div>
            <IdentityTree
              identities={data.identities}
              goals={data.goals.map((g) => ({ id: g.id, goal: g.label, identityId: g.identityId }))}
              habits={data.trackedHabits.map((h) => ({ id: h.id, name: h.name, category: h.category, goalEntryId: h.goalEntryId ?? null, identityId: h.identityId ?? null }))}
            />
          </section>
        )}

        {data.trackedHabits.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Habits</h2>
              <Link href="/habits" className="text-xs font-medium text-slate-500 hover:text-slate-800">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.trackedHabits.map((habit) => (
                <HabitCheckInCard
                  key={habit.id}
                  habitId={habit.id}
                  habitName={habit.name}
                  habitCreatedAt={habit.createdAt}
                  checkIns={habit.checkIns ?? []}
                  showLink
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
