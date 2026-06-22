"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Show, SignUpButton, UserButton } from "@clerk/nextjs";
import {
  ensureDbUser,
  syncNotes,
  syncPartOne,
  syncPartTwo,
  syncPartThree,
} from "@/lib/sync-actions";
import { fetchDashboardData, type DashboardStatus } from "@/lib/actions/dashboard-actions";
import type { TrackedHabitData } from "@/lib/actions/habit-actions";

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
  const [partThree, setPartThree] = useState<PartThreeSnapshot | null>(null);
  const [partFour, setPartFour] = useState<PartFourSnapshot | null>(null);
  const [nextStep, setNextStep] = useState<NextStepSnapshot | null>(null);
  const [trackedHabits, setTrackedHabits] = useState<TrackedHabitData[]>([]);
  const [goals, setGoals] = useState<{ id: string; label: string }[]>([]);
  const [recentNotes, setRecentNotes] = useState<{ id: string; title: string; updatedAt: string }[]>([]);
  const [recentChecklists, setRecentChecklists] = useState<{ id: string; title: string; updatedAt: string }[]>([]);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    setSyncDone(false);
    try {
      await ensureDbUser();
      const rawNotes = localStorage.getItem("atomic-habits:notes");
      if (rawNotes) {
        const parsed = JSON.parse(rawNotes) as { notes?: unknown[] };
        if (Array.isArray(parsed?.notes) && parsed.notes.length > 0) {
          await syncNotes(parsed.notes as Parameters<typeof syncNotes>[0]);
        }
      }
      const rawP1 = localStorage.getItem("habit-assessment:onboarding");
      if (rawP1) await syncPartOne(JSON.parse(rawP1));
      const rawP2 = localStorage.getItem("habit-assessment:onboarding:part-two");
      if (rawP2) await syncPartTwo(JSON.parse(rawP2));
      const rawP3 = localStorage.getItem("habit-assessment:onboarding:part-three");
      if (rawP3) await syncPartThree(JSON.parse(rawP3));
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
    } catch (err) {
      console.error("[handleSync]", err);
    } finally {
      setSyncing(false);
    }
  }

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
      setTrackedHabits(data.trackedHabits);
      setGoals(data.goals);
      setRecentNotes(data.recentNotes);
      setRecentChecklists(data.recentChecklists);
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
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <span className="flex-shrink-0 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Atomic Habits
          </span>
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <NavDropdown
              label="Laws"
              items={[
                { type: "link", href: "/dashboard", label: "Assessment", description: "Law 0" },
                { type: "divider" },
                { type: "link", href: "/laws/1", label: "Cue", description: "Law 1" },
                { type: "link", href: "/laws/2", label: "Craving", description: "Law 2" },
                { type: "link", href: "/laws/3", label: "Response", description: "Law 3" },
                { type: "link", href: "/laws/4", label: "Reward", description: "Law 4" },
              ]}
            />
            <NavDropdown
              label="Goals"
              emptyLabel="Complete Part 5 to add goals"
              items={goals.length > 0 ? goals.map((g) => ({ type: "link" as const, href: `/goals/${g.id}`, label: g.label })) : []}
            />
            <NavDropdown
              label="Habits"
              emptyLabel="Complete Part 5 to see your habits here"
              items={buildHabitItems(trackedHabits)}
            />
            <NavDropdown
              label="Notes"
              items={buildRecentItems(
                recentNotes.map((n) => ({
                  href: `/notes/${n.id}`,
                  label: n.title,
                  description: formatDate(n.updatedAt),
                })),
                { href: "/notes", label: "View all notes" },
              )}
            />
            <NavDropdown
              label="Checklists"
              items={buildRecentItems(
                recentChecklists.map((c) => ({
                  href: `/checklists/${c.id}`,
                  label: c.title,
                  description: formatDate(c.updatedAt),
                })),
                { href: "/checklists", label: "View all checklists" },
              )}
            />
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
                  <UserButton.Action
                    label={
                      syncing ? "Syncing…" : syncDone ? "Synced!" : "Sync data"
                    }
                    labelIcon={
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 2v6h-6" />
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                        <path d="M3 22v-6h6" />
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                      </svg>
                    }
                    onClick={handleSync}
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

// ─── Dropdown nav ─────────────────────────────────────────────────────────────

type DropdownItem =
  | { type: "link"; href: string; label: string; description?: string }
  | { type: "section"; href: string; label: string }
  | { type: "divider" };

function buildRecentItems(
  entries: Array<{ href: string; label: string; description?: string }>,
  viewAll: { href: string; label: string },
): DropdownItem[] {
  const items: DropdownItem[] = entries.map((entry) => ({
    type: "link",
    href: entry.href,
    label: entry.label,
    description: entry.description,
  }));
  items.push({ type: "divider" });
  items.push({ type: "link", href: viewAll.href, label: viewAll.label });
  return items;
}

function buildHabitItems(habits: TrackedHabitData[]): DropdownItem[] {
  const byCategory = new Map<string, TrackedHabitData[]>();
  const uncategorized: TrackedHabitData[] = [];

  for (const h of habits) {
    if (h.category) {
      if (!byCategory.has(h.category)) byCategory.set(h.category, []);
      byCategory.get(h.category)!.push(h);
    } else {
      uncategorized.push(h);
    }
  }

  const items: DropdownItem[] = [];

  for (const [cat, catHabits] of byCategory) {
    items.push({ type: "section", label: cat, href: `/habits/category/${encodeURIComponent(cat)}` });
    for (const h of catHabits) {
      items.push({ type: "link", label: h.name, href: `/habits/${h.id}` });
    }
    items.push({ type: "divider" });
  }

  if (uncategorized.length > 0) {
    // Remove trailing divider before uncategorized block
    if (items.length > 0 && items[items.length - 1].type === "divider") items.pop();
    if (byCategory.size > 0) items.push({ type: "divider" });
    for (const h of uncategorized) {
      items.push({ type: "link", label: h.name, href: `/habits/${h.id}` });
    }
  }

  return items;
}

function NavDropdown({
  label,
  items,
  emptyLabel,
}: {
  label: string;
  items: DropdownItem[];
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      >
        {label}
        <svg
          className={`h-3 w-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-900/10">
          {items.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-400">
              {emptyLabel ?? "Nothing here yet"}
            </p>
          ) : (
            items.map((item, i) => {
              if (item.type === "divider") {
                return <div key={i} className="my-1 border-t border-slate-100" />;
              }
              if (item.type === "section") {
                return (
                  <Link
                    key={`section-${item.label}`}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between px-4 py-2 transition hover:bg-slate-50"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </span>
                    <svg className="h-3 w-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              }
              return (
                <Link
                  key={`${item.label}-${i}`}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex flex-col gap-0.5 px-4 py-2.5 transition hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-800">{item.label}</span>
                  {item.description && (
                    <span className="text-[11px] text-slate-400">{item.description}</span>
                  )}
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

