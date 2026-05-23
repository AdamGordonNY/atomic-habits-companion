"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface PartOneSnapshot {
  stepIndex: number;
  completedAt: string | null;
}

interface PartTwoSnapshot {
  dayIndex: number;
  completedAt: string | null;
  startDate: string | null; // first day's date
}

const PART_ONE_KEY = "habit-assessment:onboarding";
const PART_TWO_KEY = "habit-assessment:onboarding:part-two";

function readPartOne(): PartOneSnapshot | null {
  try {
    const raw = localStorage.getItem(PART_ONE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as {
      stepIndex?: number;
      completedAt?: string | null;
    };
    return {
      stepIndex: p.stepIndex ?? 0,
      completedAt: p.completedAt ?? null,
    };
  } catch {
    return null;
  }
}

function readPartTwo(): PartTwoSnapshot | null {
  try {
    const raw = localStorage.getItem(PART_TWO_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as {
      dayIndex?: number;
      completedAt?: string | null;
      draft?: { days?: { date: string }[] };
    };
    return {
      dayIndex: p.dayIndex ?? 0,
      completedAt: p.completedAt ?? null,
      startDate: p.draft?.days?.[0]?.date ?? null,
    };
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardClient() {
  const [partOne, setPartOne] = useState<PartOneSnapshot | null>(null);
  const [partTwo, setPartTwo] = useState<PartTwoSnapshot | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setPartOne(readPartOne());
    setPartTwo(readPartTwo());
    setMounted(true);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const hasPartOneProgress = mounted && partOne !== null;
  const partOneComplete = partOne?.completedAt != null;
  const partOneTotalSteps = 9;
  const partOneStep = partOne?.stepIndex ?? 0;

  const hasPartTwoProgress = mounted && partTwo !== null;
  const partTwoComplete = partTwo?.completedAt != null;
  const partTwoDay = (partTwo?.dayIndex ?? 0) + 1;

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
  } else if (partOneComplete && partTwoComplete) {
    resumeLabel = "Assessment complete";
    resumeHint = "Return to Part Two to review or edit your log";
    resumeHref = "/habit-assessment/onboarding/part-two";
  }

  return (
    <div
      className={`flex min-h-screen flex-col transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Atomic Habits
          </span>
          <Link
            href="/habit-assessment/onboarding"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Assessment
          </Link>
        </div>
      </header>

      <main className="flex-1 px-5 py-10">
        <div className="mx-auto max-w-2xl space-y-8">

          {/* Welcome */}
          <section className="space-y-2">
            <p className="text-sm font-medium text-slate-500">{greeting()}</p>
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

          {/* Progress cards */}
          {mounted ? (
            <section className="grid grid-cols-2 gap-3">
              <ProgressCard
                label="Part One"
                subtitle="Baseline assessment"
                done={partOneComplete}
                detail={
                  hasPartOneProgress && !partOneComplete
                    ? `Question ${Math.min(partOneStep + 1, partOneTotalSteps)} of ${partOneTotalSteps}`
                    : partOneComplete
                      ? "Complete"
                      : "Not started"
                }
                href="/habit-assessment/onboarding"
              />
              <ProgressCard
                label="Part Two"
                subtitle="7-day energy log"
                done={partTwoComplete}
                detail={
                  hasPartTwoProgress && !partTwoComplete
                    ? `Day ${partTwoDay} of 7${partTwo?.startDate ? ` · from ${formatDate(partTwo.startDate)}` : ""}`
                    : partTwoComplete
                      ? "Complete"
                      : "Not started"
                }
                href={
                  partOneComplete
                    ? `/habit-assessment/onboarding/part-two${hasPartTwoProgress ? `?day=${partTwo?.dayIndex ?? 0}` : ""}`
                    : "/habit-assessment/onboarding"
                }
              />
            </section>
          ) : (
            <section className="grid grid-cols-2 gap-3">
              <SkeletonCard />
              <SkeletonCard />
            </section>
          )}

          {/* Tips strip */}
          <section className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              How it works
            </p>
            <ol className="space-y-2">
              {[
                "Complete the baseline assessment (Part One) once.",
                "Log your hourly activities and energy for 7 days (Part Two).",
                "Use your patterns to build habits that fit your real life.",
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

function ProgressCard({
  label,
  subtitle,
  done,
  detail,
  href,
}: {
  label: string;
  subtitle: string;
  done: boolean;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm active:translate-y-0"
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${done ? "bg-emerald-500" : "bg-slate-300"}`}
        />
        <span className="text-xs font-semibold text-slate-700">{label}</span>
      </div>
      <p className="text-[11px] text-slate-500">{subtitle}</p>
      <p className="mt-auto text-xs font-medium text-slate-900">{detail}</p>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-2 rounded-[1.5rem] border border-slate-200 bg-white/90 p-4">
      <div className="h-2.5 w-16 animate-pulse rounded-full bg-slate-200" />
      <div className="h-2 w-20 animate-pulse rounded-full bg-slate-100" />
      <div className="mt-2 h-2.5 w-12 animate-pulse rounded-full bg-slate-200" />
    </div>
  );
}
