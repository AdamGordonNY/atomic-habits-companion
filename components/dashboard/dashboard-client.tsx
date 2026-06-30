"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Show, SignUpButton, UserButton } from "@clerk/nextjs";
import { fetchDashboardData, type DashboardStatus } from "@/lib/actions/dashboard-actions";

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

function MenuIcon({ glyph }: { glyph: string }) {
  return <span className="text-xs font-semibold text-slate-400">{glyph}</span>;
}

export function DashboardClient() {
  const [partOne, setPartOne] = useState<PartOneSnapshot | null>(null);
  const [partTwo, setPartTwo] = useState<PartTwoSnapshot | null>(null);
  const [partThree, setPartThree] = useState<PartThreeSnapshot | null>(null);
  const [partFour, setPartFour] = useState<PartFourSnapshot | null>(null);
  const [nextStep, setNextStep] = useState<NextStepSnapshot | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchDashboardData();
      if (cancelled) return;
      const snaps = statusToSnapshots(data.status);
      setPartOne(snaps.partOne);
      setPartTwo(snaps.partTwo);
      setPartThree(snaps.partThree);
      setPartFour(snaps.partFour);
      setNextStep(snaps.nextStep);
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const hasPartOneProgress = mounted && partOne !== null;
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

  // Determine the primary resume action
  let resumeHref = "/habit-assessment/onboarding";
  let resumeLabel = "Start assessment";
  let resumeHint = "Complete your baseline before building habits";

  if (hasPartOneProgress && !partOneComplete) {
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
  } else if (partOneComplete && partTwoComplete && partThreeComplete && partFourComplete && nextStepComplete) {
    resumeLabel = "Assessment complete";
    resumeHint = "All sections done — review your answers below";
    resumeHref = "/habit-assessment/onboarding/review";
  }

  return (
    <div
      className={`flex min-h-screen flex-col transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <span className="flex-shrink-0 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Atomic Habits
          </span>
          <nav className="flex flex-wrap items-center gap-1.5 pb-0.5">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="whitespace-nowrap rounded-full border border-slate-950 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Make account
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Identity"
                    labelIcon={<MenuIcon glyph=">" />}
                    href="/identity"
                  />
                  <UserButton.Link
                    label="Goals"
                    labelIcon={<MenuIcon glyph=">" />}
                    href="/goals"
                  />
                </UserButton.MenuItems>
              </UserButton>
            </Show>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-5 py-10">
        <div className="mx-auto max-w-2xl space-y-8">

          {/* Welcome */}
          <section className="space-y-2">
            <p className="text-sm font-medium text-slate-500" suppressHydrationWarning>{greeting()}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Welcome back.
            </h1>
            <p className="max-w-md text-base leading-7 text-slate-600">
              Your habit assessment helps you understand what to change before
              building new behaviours.
            </p>
          </section>

          {/* Primary resume CTA */}
          <section>
            <Link
              href={resumeHref}
              className="group flex w-full items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:translate-y-0"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg text-white">
                  →
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-950">
                    {resumeLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{resumeHint}</p>
                </div>
              </div>
              <svg
                className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </section>

          {/* Law 0 overview card */}
          <section>
            <Link
              href="/dashboard"
              className="group flex w-full items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:translate-y-0"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-base font-semibold text-white">
                  L0
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-950">Law 0 - Assessment</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {mounted
                      ? `Part 1 ${partOneComplete ? "done" : "pending"} · Part 2 ${partTwoComplete ? "done" : "pending"} · Part 3 ${partThreeComplete ? "done" : "pending"} · Part 4 ${partFourComplete ? "done" : "pending"} · Part 5 ${nextStepComplete ? "done" : "pending"}`
                      : "Loading assessment status..."}
                  </p>
                </div>
              </div>
              <svg
                className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </section>

          {/* The Next Step CTA */}
          {mounted && partFourComplete && (
            <section>
              <Link
                href="/habit-assessment/onboarding/part-five"
                className="group flex w-full items-center justify-between gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-sm active:translate-y-0"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base">
                    🎯
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-950">
                      {nextStepComplete ? "Revisit The Next Step" : "The Next Step"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Turn your goals into systems and component habits
                    </p>
                  </div>
                </div>
                <svg
                  className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </section>
          )}

          {/* Review CTA */}
          {mounted && (hasPartOneProgress || hasPartTwoProgress || hasPartThreeProgress || hasPartFourProgress || hasNextStepProgress) && (
            <section>
              <Link
                href="/habit-assessment/onboarding/review"
                className="group flex w-full items-center justify-between gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-sm active:translate-y-0"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base">
                    📋
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-950">Review your answers</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Browse everything you've entered across all four parts
                    </p>
                  </div>
                </div>
                <svg
                  className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </section>
          )}

          {/* Notes quick access */}
          <section>
            <Link
              href="/notes"
              className="group flex w-full items-center justify-between gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-sm active:translate-y-0"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base">
                  ✏️
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-950">Notes</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Quick thoughts, reflections, and ideas
                  </p>
                </div>
              </div>
              <svg
                className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </section>

          {/* Checklists quick access */}
          <section>
            <Link
              href="/checklists"
              className="group flex w-full items-center justify-between gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-sm active:translate-y-0"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base">
                  ✅
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-950">Checklists</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Track habits with reusable, fillable checklists
                  </p>
                </div>
              </div>
              <svg
                className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </section>

          {/* Tips strip */}
          <section className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              How it works
            </p>
            <ol className="space-y-2">
              {[
                "Complete the baseline assessment (Part One) once.",
                "Log your hourly activities and energy for 7 days (Part Two).",
                "Reflect on your time, energy, and habit history (Part Three).",
                "Define where you want to end up and the identity you want to build (Part Four).",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-600">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </main>
    </div>
  );
}

