import type { Metadata } from "next";
import Link from "next/link";
import { fetchNextStep } from "@/lib/actions/next-step-actions";

export const metadata: Metadata = {
  title: "Identity · Atomic Habits Companion",
  description: "Read-only summary of your Next Step answers.",
};

function ratingLabel(value: number): string {
  if (value <= 0) return "Not rated";
  return `${value}/5`;
}

export default async function IdentityPage() {
  let isAuthed = true;
  let completedAt: string | null = null;
  let entries: Array<{
    id: string;
    goal: string;
    currentSystem: string;
    systemEval: string;
    systemRating: number;
    idealSystem: string;
    componentHabits: string[];
  }> = [];

  try {
    const nextStep = await fetchNextStep();
    completedAt = nextStep?.completedAt ?? null;
    entries = (nextStep?.goalEntries ?? []).map((entry, index) => ({
      id: entry.id ?? `entry-${index}`,
      goal: entry.goal,
      currentSystem: entry.currentSystem,
      systemEval: entry.systemEval,
      systemRating: entry.systemRating,
      idealSystem: entry.idealSystem,
      componentHabits: entry.componentHabits,
    }));
  } catch {
    isAuthed = false;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-5 py-8">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Identity</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Next Step answers</h1>
        {completedAt && (
          <p className="mt-1 text-xs text-slate-500">
            Completed {new Date(completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        )}
      </header>

      {!isAuthed ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Sign in to view your Next Step answers.</p>
        </section>
      ) : entries.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">No Next Step answers found yet.</p>
          <Link
            href="/habit-assessment/onboarding/part-five"
            className="mt-3 inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Open The Next Step
          </Link>
        </section>
      ) : (
        entries.map((entry, idx) => (
          <section key={`${entry.id}-${idx}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Goal {idx + 1}</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{entry.goal || "(No goal provided)"}</p>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Current system</p>
                <p className="mt-1 text-sm text-slate-700">{entry.currentSystem || "No answer"}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">System evaluation</p>
                <p className="mt-1 text-sm text-slate-700">{entry.systemEval || "No answer"}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">System rating</p>
                <p className="mt-1 text-sm text-slate-700">{ratingLabel(entry.systemRating)}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Ideal system</p>
                <p className="mt-1 text-sm text-slate-700">{entry.idealSystem || "No answer"}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Component habits</p>
                {entry.componentHabits.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {entry.componentHabits.map((habit, habitIndex) => (
                      <li key={`${entry.id}-habit-${habitIndex}`} className="text-sm text-slate-700">
                        {habit}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-slate-700">No answer</p>
                )}
              </div>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
