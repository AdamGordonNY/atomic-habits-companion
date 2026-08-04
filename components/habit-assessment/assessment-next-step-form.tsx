"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchNextStep, upsertNextStep } from "@/lib/actions/next-step-actions";
import { fetchPartFour } from "@/lib/actions/part-four-actions";
import type { NextStepGoalData } from "@/lib/actions/next-step-actions";

// ─── constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

const SECTION_LABELS: Record<number, string> = {
  0: "Q1 · Your Goals",
  1: "Q2 · Current Systems",
  2: "Q3 · System Evaluation",
  3: "Q4 · Ideal Systems",
  4: "Q5 · Component Habits",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function defaultEntry(goal = ""): NextStepGoalData {
  return {
    goal,
    currentSystem: "",
    systemEval: "",
    systemRating: 0,
    idealSystem: "",
    componentHabits: [],
  };
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
    />
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
    />
  );
}

// ─── GoalContextBadge — shows the goal title above each entry ─────────────────

function GoalBadge({ goal, index }: { goal: string; index: number }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[10px] font-bold text-white">
        {index + 1}
      </span>
      <p className="text-sm font-semibold text-slate-800">{goal || `Goal ${index + 1}`}</p>
    </div>
  );
}

// ─── RatingSelector ───────────────────────────────────────────────────────────

function RatingSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const labels: Record<number, string> = {
    1: "Not working",
    2: "Barely working",
    3: "Somewhat working",
    4: "Mostly working",
    5: "Working well",
  };
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          title={labels[n]}
          onClick={() => onChange(value === n ? 0 : n)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition ${
            value === n
              ? n <= 2
                ? "border-rose-400 bg-rose-50 text-rose-700"
                : n === 3
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-emerald-400 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// ─── HabitChipInput ───────────────────────────────────────────────────────────

function HabitChipInput({
  habits,
  onChange,
}: {
  habits: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function add() {
    const val = input.trim();
    if (!val) return;
    onChange([...habits, val]);
    setInput("");
  }

  function remove(i: number) {
    onChange(habits.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      {habits.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {habits.map((h, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {h}
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-0.5 text-slate-400 hover:text-slate-700"
                aria-label="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Type a habit and press Enter"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function AssessmentNextStepForm({ assessmentId }: { assessmentId: string }) {
  void assessmentId;
  const router = useRouter();

  const [entries, setEntries] = useState<NextStepGoalData[]>([defaultEntry()]);
  const [stepIndex, setStepIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved data or seed goals from Part 4
  useEffect(() => {
    Promise.all([fetchNextStep(), fetchPartFour()]).then(([saved, p4]) => {
      if (saved && saved.goalEntries.length > 0) {
        setEntries(saved.goalEntries);
      } else {
        // Seed from Part 4 reflectionGoals (falling back to majorGoals)
        const goals =
          p4?.reflectionGoals?.filter(Boolean).length
            ? p4.reflectionGoals.filter(Boolean)
            : p4?.majorGoals?.filter(Boolean) ?? [];
        setEntries(
          goals.length > 0 ? goals.map((g) => defaultEntry(g)) : [defaultEntry()],
        );
      }
      setHydrated(true);
    });
  }, []);

  // Autosave after 2 s of inactivity
  function scheduleAutosave() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      upsertNextStep(entriesRef.current).catch(console.error);
    }, 2000);
  }

  function updateEntry(idx: number, patch: Partial<NextStepGoalData>) {
    setEntries((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
    scheduleAutosave();
  }

  async function persist(completedAt?: string | null) {
    setSaving(true);
    try {
      await upsertNextStep(entriesRef.current, completedAt);
    } catch (err) {
      console.error("[NextStep] save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  async function goTo(index: number) {
    if (index === stepIndex) return;
    await persist();
    setStepIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    if (stepIndex > 0) goTo(stepIndex - 1);
  }

  function goContinue() {
    if (stepIndex < TOTAL_STEPS - 1) goTo(stepIndex + 1);
  }

  async function saveAndExit() {
    await persist(null);
    router.push("/dashboard");
  }

  async function finish() {
    await persist(new Date().toISOString());
    router.push("/dashboard");
  }

  const progress = ((stepIndex + 1) / TOTAL_STEPS) * 100;
  const isLastStep = stepIndex === TOTAL_STEPS - 1;
  const slideIn = "translate-x-0 opacity-100";

  // ─── step renders ──────────────────────────────────────────────────────────

  function renderStep() {
    switch (stepIndex) {
      // ── Q1: Goals refresher — editable list seeded from Part 4 ────────────
      case 0:
        return (
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-lg font-semibold text-slate-950">
                Your goals
              </h2>
              <p className="mb-5 text-sm text-slate-500">
                These are the goals you identified in &ldquo;Where Do You Want to End Up&rdquo;.
                Review them, edit if needed, and add any you&apos;ve thought of since.
              </p>
              <div className="flex flex-col gap-2">
                {entries.map((e, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                      {idx + 1}
                    </span>
                    <TextInput
                      value={e.goal}
                      onChange={(v) => updateEntry(idx, { goal: v })}
                      placeholder={`Goal ${idx + 1}`}
                    />
                    {entries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setEntries((prev) => prev.filter((_, i) => i !== idx));
                          scheduleAutosave();
                        }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Remove goal"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setEntries((prev) => [...prev, defaultEntry()]);
                  scheduleAutosave();
                }}
                className="mt-3 self-start text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                + Add another goal
              </button>
            </div>
          </div>
        );

      // ── Q2: Current system per goal ───────────────────────────────────────
      case 1:
        return (
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-100 bg-white px-6 pt-6 pb-2 shadow-sm">
              <h2 className="mb-1 text-lg font-semibold text-slate-950">Current systems</h2>
              <p className="mb-5 text-sm text-slate-500">
                For each goal, describe the system you currently have in place. If you
                have nothing yet, write &ldquo;None&rdquo; or leave blank.
              </p>
            </div>
            {entries.map((e, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <GoalBadge goal={e.goal} index={idx} />
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateEntry(idx, { currentSystem: e.currentSystem === "None" ? "" : "None" })}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                        e.currentSystem === "None"
                          ? "border-slate-400 bg-slate-100 text-slate-700"
                          : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      No system yet
                    </button>
                  </div>
                  {e.currentSystem !== "None" && (
                    <Textarea
                      value={e.currentSystem}
                      onChange={(v) => updateEntry(idx, { currentSystem: v })}
                      placeholder="Describe the approach or routine you currently use for this goal…"
                      rows={3}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      // ── Q3: System evaluation + 1–5 rating ───────────────────────────────
      case 2:
        return (
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-100 bg-white px-6 pt-6 pb-2 shadow-sm">
              <h2 className="mb-1 text-lg font-semibold text-slate-950">Evaluate your systems</h2>
              <p className="mb-5 text-sm text-slate-500">
                For each goal, assess whether your current system is working.
                Write what&apos;s good and what isn&apos;t, then give it a 1–5 rating.
              </p>
            </div>
            {entries.map((e, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <GoalBadge goal={e.goal} index={idx} />
                {e.currentSystem && e.currentSystem !== "None" && (
                  <p className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-600">Current system: </span>
                    {e.currentSystem}
                  </p>
                )}
                <div className="flex flex-col gap-3">
                  <Textarea
                    value={e.systemEval}
                    onChange={(v) => updateEntry(idx, { systemEval: v })}
                    placeholder="Is it working? What's helping? What's getting in the way?"
                    rows={3}
                  />
                  <div>
                    <p className="mb-2 text-xs font-medium text-slate-500">
                      How well is this system working? <span className="text-slate-400">(1 = not at all, 5 = very well)</span>
                    </p>
                    <RatingSelector
                      value={e.systemRating}
                      onChange={(v) => updateEntry(idx, { systemRating: v })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      // ── Q4: Ideal system per goal ─────────────────────────────────────────
      case 3:
        return (
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-100 bg-white px-6 pt-6 pb-2 shadow-sm">
              <h2 className="mb-1 text-lg font-semibold text-slate-950">Design your ideal system</h2>
              <p className="mb-5 text-sm text-slate-500">
                Using your current reality as a reference, describe the ideal system for
                each goal — something that would actually work for your life.
              </p>
            </div>
            {entries.map((e, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <GoalBadge goal={e.goal} index={idx} />
                {(e.currentSystem || e.systemEval) && (
                  <div className="mb-3 flex flex-col gap-1.5 rounded-xl bg-slate-50 px-3 py-2">
                    {e.currentSystem && e.currentSystem !== "None" && (
                      <p className="text-xs text-slate-500">
                        <span className="font-medium text-slate-600">Current: </span>
                        {e.currentSystem}
                      </p>
                    )}
                    {e.systemRating > 0 && (
                      <p className="text-xs text-slate-500">
                        <span className="font-medium text-slate-600">Rating: </span>
                        {e.systemRating}/5
                      </p>
                    )}
                  </div>
                )}
                <Textarea
                  value={e.idealSystem}
                  onChange={(v) => updateEntry(idx, { idealSystem: v })}
                  placeholder="What would the ideal approach look like for you, given your real life constraints and energy patterns?"
                  rows={4}
                />
              </div>
            ))}
          </div>
        );

      // ── Q5: Component habits per goal ─────────────────────────────────────
      case 4:
        return (
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-100 bg-white px-6 pt-6 pb-2 shadow-sm">
              <h2 className="mb-1 text-lg font-semibold text-slate-950">Break it into habits</h2>
              <p className="mb-5 text-sm text-slate-500">
                For each goal, list the individual habits that would make up the ideal
                system. Keep each habit small and concrete.
              </p>
            </div>
            {entries.map((e, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <GoalBadge goal={e.goal} index={idx} />
                {e.idealSystem && (
                  <p className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-600">Ideal system: </span>
                    {e.idealSystem}
                  </p>
                )}
                <HabitChipInput
                  habits={e.componentHabits}
                  onChange={(v) => updateEntry(idx, { componentHabits: v })}
                />
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              {SECTION_LABELS[stepIndex]}
            </p>
            <h1 className="text-base font-semibold text-slate-950">The Next Step</h1>
          </div>
          <button
            type="button"
            onClick={saveAndExit}
            disabled={saving}
            className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save & exit"}
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-slate-800 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mx-auto max-w-2xl px-4 py-2">
          <p className="text-xs text-slate-400">
            Step {stepIndex + 1} of {TOTAL_STEPS}
          </p>
        </div>
      </header>

      {/* Step content */}
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div
            key={stepIndex}
            className={`transition-all duration-300 ease-out ${slideIn}`}
          >
            {renderStep()}
          </div>
        </div>
      </main>

      {/* Navigation */}
      <footer className="sticky bottom-0 border-t border-slate-200/70 bg-white/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0 || saving}
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-30"
          >
            ← Back
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={finish}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Complete ✓"}
            </button>
          ) : (
            <button
              type="button"
              onClick={goContinue}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Continue →"}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
