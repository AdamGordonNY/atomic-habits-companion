import type { Metadata } from "next";
import Link from "next/link";
import { fetchNextStep } from "@/lib/actions/next-step-actions";
import { actionGetTrackedHabits } from "@/lib/actions/habit-actions";

export const metadata: Metadata = {
  title: "Goals · Atomic Habits Companion",
  description: "All goals and the habits designated to reach them.",
};

export default async function GoalsPage() {
  let goals: Array<{ id: string; goal: string; componentHabits: string[] }> = [];
  let trackedHabitMap = new Map<string, string>();
  let isAuthed = true;

  try {
    const [nextStep, trackedHabits] = await Promise.all([
      fetchNextStep(),
      actionGetTrackedHabits(),
    ]);

    goals = (nextStep?.goalEntries ?? [])
      .map((entry) => ({
        id: entry.id ?? "",
        goal: entry.goal,
        componentHabits: [...new Set(entry.componentHabits.map((h) => h.trim()).filter(Boolean))],
      }))
      .filter((entry) => entry.goal.trim().length > 0);

    trackedHabitMap = new Map(
      trackedHabits.map((habit) => [habit.name.toLowerCase(), habit.id]),
    );
  } catch {
    isAuthed = false;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-5 py-8">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Identity (Next Steps)</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Goals and designated habits</h1>
      </header>

      {!isAuthed ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Sign in to view your goals and designated habits.</p>
        </section>
      ) : goals.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">No goals found yet. Complete The Next Step to generate goals and habits.</p>
          <Link
            href="/habit-assessment/onboarding/part-five"
            className="mt-3 inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Open The Next Step
          </Link>
        </section>
      ) : (
        goals.map((goal, index) => (
          <section key={`${goal.id || goal.goal}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Goal</p>
            {goal.id ? (
              <Link href={`/goals/${goal.id}`} className="text-base font-semibold text-slate-900 hover:text-slate-700">
                {goal.goal}
              </Link>
            ) : (
              <p className="text-base font-semibold text-slate-900">{goal.goal}</p>
            )}

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Designated habits</p>
            {goal.componentHabits.length === 0 ? (
              <p className="mt-1 text-sm text-slate-500">No designated habits for this goal yet.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {goal.componentHabits.map((habitName) => {
                  const habitId = trackedHabitMap.get(habitName.toLowerCase());
                  return (
                    <li key={`${goal.id}-${habitName}`}>
                      {habitId ? (
                        <Link href={`/habits/${habitId}`} className="text-sm font-medium text-slate-700 hover:text-slate-900">
                          {habitName}
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-600">{habitName}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))
      )}
    </div>
  );
}
