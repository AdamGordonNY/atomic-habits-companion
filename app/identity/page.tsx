import type { Metadata } from "next";
import { fetchNextStep } from "@/lib/actions/next-step-actions";
import { fetchPartFour } from "@/lib/actions/part-four-actions";
import { IdentityEditor } from "@/components/identity/identity-editor";

export const metadata: Metadata = {
  title: "Identity · Atomic Habits Companion",
  description: "Editable identity workspace for Part 4 and Next Step answers.",
};

export default async function IdentityPage() {
  let isAuthed = true;
  let completedAt: string | null = null;
  let entries: Array<{
    goal: string;
    currentSystem: string;
    systemEval: string;
    systemRating: number;
    idealSystem: string;
    componentHabits: string[];
  }> = [];
  let partFour = null;

  try {
    const [nextStep, loadedPartFour] = await Promise.all([fetchNextStep(), fetchPartFour()]);
    completedAt = nextStep?.completedAt ?? null;
    partFour = loadedPartFour;
    entries = (nextStep?.goalEntries ?? []).map((entry) => ({
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
    <div>
      {!isAuthed ? (
        <div className="mx-auto max-w-2xl px-5 py-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">Sign in to view and edit your identity workspace.</p>
          </section>
        </div>
      ) : (
        <IdentityEditor
          initialPartFour={partFour}
          initialNextStepCompletedAt={completedAt}
          initialEntries={entries}
        />
      )}
    </div>
  );
}
