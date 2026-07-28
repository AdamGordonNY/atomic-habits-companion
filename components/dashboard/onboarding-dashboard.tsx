import Link from "next/link";
import { NextStepSnapshot, PartFourSnapshot, PartOneSnapshot, PartThreeSnapshot, PartTwoSnapshot } from "./types";
import {greeting} from "@/lib/utils";




export default function OnboardingDashboard({
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