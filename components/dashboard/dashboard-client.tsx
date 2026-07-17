"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchDashboardData, type DashboardStatus, type DashboardData } from "@/lib/actions/dashboard-actions";
import { HabitCheckInCard } from "@/components/habits/habit-check-in-card";

interface PartOneSnapshot {
  stepIndex: number;
  completedAt: string | null;
}

interface PartTwoSnapshot {
  dayIndex: number;
  completedAt: string | null;
  startDate: string | null;
}

interface PartThreeSnapshot {
  stepIndex: number;
  completedAt: string | null;
}

interface PartFourSnapshot {
  completedAt: string | null;
}

interface NextStepSnapshot {
  completedAt: string | null;
}

function statusToSnapshots(status: DashboardStatus): {
  partOne: PartOneSnapshot | null;
  partTwo: PartTwoSnapshot | null;
  partThree: PartThreeSnapshot | null;
  partFour: PartFourSnapshot | null;
  nextStep: NextStepSnapshot | null;
} {
  return {
    partOne: status.partOne?.exists
      ? { stepIndex: 0, completedAt: status.partOne.completedAt }
      : null,
    partTwo: status.partTwo?.exists
      ? {
          dayIndex: status.partTwo.dayIndex,
          completedAt: status.partTwo.completedAt,
          startDate: status.partTwo.startDate,
        }
      : null,
    partThree: status.partThree?.exists
      ? { stepIndex: 0, completedAt: status.partThree.completedAt }
      : null,
    partFour: status.partFour?.exists
      ? { completedAt: status.partFour.completedAt }
      : null,
    nextStep: status.nextStep?.exists
      ? { completedAt: status.nextStep.completedAt }
      : null,
  };
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function BentoCard({
  href, icon, label, sublabel, accent = false, wide = false,
}: {
  href: string; icon: string; label: string; sublabel?: string; accent?: boolean; wide?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col justify-between gap-4 rounded-[1.5rem] border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${wide ? "sm:col-span-2" : ""} ${accent ? "border-slate-800 bg-slate-950 text-white hover:border-slate-700 hover:bg-slate-900" : "border-slate-200 bg-white hover:border-slate-300"}`}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={`text-sm font-semibold ${accent ? "text-white" : "text-slate-950"}`}>{label}</p>
        {sublabel && <p className={`mt-0.5 text-xs ${accent ? "text-slate-400" : "text-slate-500"}`}>{sublabel}</p>}
      </div>
    </Link>
  );
}

function BentoDashboard({ data }: { data: DashboardData }) {
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

function OnboardingDashboard({
  partOne, partTwo, partThree, partFour, nextStep, mounted,
}: {
  partOne: PartOneSnapshot | null;
  partTwo: PartTwoSnapshot | null;
  partThree: PartThreeSnapshot | null;
  partFour: PartFourSnapshot | null;
  nextStep: NextStepSnapshot | null;
  mounted: boolean;
}) {
  const partOneComplete = partOne?.completedAt != null;
  const partOneTotalSteps = 9;
  const partOneStep = partOne?.stepIndex ?? 0;
  const hasPartTwoProgress = mounted && partTwo !== null;
  const partTwoComplete = partTwo?.completedAt != null;
  const partTwoDay = (partTwo?.dayIndex ?? 0) + 1;
  const hasPartThreeProgress = mounted && partThree !== null;
  const partThreeComplete = partThree?.completedAt != null;
  const partThreeTotalSteps = 17;
  const partThreeStep = partThree?.stepIndex ?? 0;
  const hasPartFourProgress = mounted && partFour !== null;
  const partFourComplete = partFour?.completedAt != null;
  const hasNextStepProgress = mounted && nextStep !== null;
  const nextStepComplete = nextStep?.completedAt != null;

  let resumeHref = "/habit-assessment/onboarding";
  let resumeLabel = "Start assessment";
  let resumeHint = "Complete your baseline before building habits";

  if (partOne !== null && !partOneComplete) {
    resumeHref = "/habit-assessment/onboarding";
    resumeLabel = `Resume Part One — question ${Math.min(partOneStep + 1, partOneTotalSteps)}`;
    resumeHint = `${partOneTotalSteps - partOneStep - 1} question${partOneTotalSteps - partOneStep - 1 === 1 ? "" : "s"} remaining`;
  } else if (partOneComplete && hasPartTwoProgress && !partTwoComplete) {
    resumeHref = `/habit-assessment/onboarding/part-two?day=${partTwo!.dayIndex}`;
    resumeLabel = `Resume Part Two — day ${partTwoDay} of 7`;
    resumeHint = `${7 - partTwoDay} day${7 - partTwoDay === 1 ? "" : "s"} remaining`;
  } else if (partOneComplete && !hasPartTwoProgress) {
    resumeHref = "/habit-assessment/onboarding/part-two";
    resumeLabel = "Start Part Two — daily energy log";
    resumeHint = "7-day hour-by-hour activity and energy tracking";
  } else if (partOneComplete && partTwoComplete && hasPartThreeProgress && !partThreeComplete) {
    resumeHref = "/habit-assessment/onboarding/part-three";
    resumeLabel = `Resume Part Three — question ${Math.min(partThreeStep + 1, partThreeTotalSteps)} of ${partThreeTotalSteps}`;
    resumeHint = `${partThreeTotalSteps - partThreeStep - 1} question${partThreeTotalSteps - partThreeStep - 1 === 1 ? "" : "s"} remaining`;
  } else if (partOneComplete && partTwoComplete && !hasPartThreeProgress) {
    resumeHref = "/habit-assessment/onboarding/part-three";
    resumeLabel = "Start Part Three — time & habit deep-dive";
    resumeHint = "Reflect on energy patterns and past habit attempts";
  } else if (partOneComplete && partTwoComplete && partThreeComplete && hasPartFourProgress && !partFourComplete) {
    resumeHref = "/habit-assessment/onboarding/part-four";
    resumeLabel = "Resume Part Four — where do you want to end up?";
    resumeHint = "Define your ideal future and the identity you want to build";
  } else if (partOneComplete && partTwoComplete && partThreeComplete && !hasPartFourProgress) {
    resumeHref = "/habit-assessment/onboarding/part-four";
    resumeLabel = "Start Part Four — where do you want to end up?";
    resumeHint = "Define your ideal future and the identity you want to build";
  } else if (partOneComplete && partTwoComplete && partThreeComplete && partFourComplete && hasNextStepProgress && !nextStepComplete) {
    resumeHref = "/habit-assessment/onboarding/part-five";
    resumeLabel = "Resume Part Five — The Next Step";
    resumeHint = "Turn your goals into systems and component habits";
  } else if (partOneComplete && partTwoComplete && partThreeComplete && partFourComplete && !hasNextStepProgress) {
    resumeHref = "/habit-assessment/onboarding/part-five";
    resumeLabel = "Start Part Five — The Next Step";
    resumeHint = "Turn your goals into systems and component habits";
  } else if (nextStepComplete) {
    resumeLabel = "Assessment complete";
    resumeHint = "All sections done — review your answers below";
    resumeHref = "/habit-assessment/onboarding/review";
  }

  return (
    <main className="flex-1 px-5 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <section className="space-y-2">
          <p className="text-sm font-medium text-slate-500" suppressHydrationWarning>{greeting()}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Welcome.</h1>
          <p className="max-w-md text-base leading-7 text-slate-600">Your habit assessment helps you understand what to change before building new behaviours.</p>
        </section>

        <section>
          <Link href={resumeHref} className="group flex w-full items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:translate-y-0">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg text-white">→</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-950">{resumeLabel}</p>
                <p className="mt-0.5 text-xs text-slate-500">{resumeHint}</p>
              </div>
            </div>
            <svg className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </section>

        <section>
          <Link href="/dashboard" className="group flex w-full items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:translate-y-0">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-base font-semibold text-white">L0</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-950">Law 0 - Assessment</p>
                <p className="mt-0.5 text-xs text-slate-500">{mounted ? `Part 1 ${partOneComplete ? "done" : "pending"} · Part 2 ${partTwoComplete ? "done" : "pending"} · Part 3 ${partThreeComplete ? "done" : "pending"} · Part 4 ${partFourComplete ? "done" : "pending"} · Part 5 ${nextStepComplete ? "done" : "pending"}` : "Loading assessment status..."}</p>
              </div>
            </div>
            <svg className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </section>

        {mounted && (hasPartTwoProgress || hasPartThreeProgress || hasPartFourProgress || hasNextStepProgress) && (
          <section>
            <Link href="/habit-assessment/onboarding/review" className="group flex w-full items-center justify-between gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-sm active:translate-y-0">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base">📋</div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-950">Review your answers</p>
                  <p className="mt-0.5 text-xs text-slate-500">Browse everything you&apos;ve entered across all parts</p>
                </div>
              </div>
              <svg className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </section>
        )}

        <section className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">How it works</p>
          <ol className="space-y-2">
            {["Complete the baseline assessment (Part One) once.", "Log your hourly activities and energy for 7 days (Part Two).", "Reflect on your time, energy, and habit history (Part Three).", "Define where you want to end up and the identity you want to build (Part Four)."].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-600">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await fetchDashboardData();
      if (cancelled) return;
      setData(result);
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const snaps = data ? statusToSnapshots(data.status) : { partOne: null, partTwo: null, partThree: null, partFour: null, nextStep: null };
  const showBento = mounted && snaps.partFour?.completedAt != null;

  return (
    <div className={`flex min-h-screen flex-col transition-all duration-700 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
      {showBento && data ? (
        <BentoDashboard data={data} />
      ) : (
        <OnboardingDashboard
          partOne={snaps.partOne}
          partTwo={snaps.partTwo}
          partThree={snaps.partThree}
          partFour={snaps.partFour}
          nextStep={snaps.nextStep}
          mounted={mounted}
        />
      )}
    </div>
  );
}
