"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  HabitAssessmentPartThree,
  HabitInventoryEntry,
  HabitInventoryScorecard,
  HabitRecord,
  HabitAttempt,
} from "@/types/habit";

// ─── constants ────────────────────────────────────────────────────────────────

const STORAGE_VERSION = 1;
const TOTAL_STEPS = 17;

// ─── helpers ──────────────────────────────────────────────────────────────────

function createDraft(assessmentId: string): HabitAssessmentPartThree {
  return {
    id: assessmentId,
    majorTimeSpends: [""],
    highEnergyHoursPerDay: null,
    highEnergyHoursList: [""],
    highEnergyActivities: "",
    lowEnergyHours: [""],
    wantHighEnergySpend: [""],
    wantLowEnergySpend: [""],
    timeSinksReflection: "",
    stressSource: "",
    anticipatedChanges: "",
    beneficialHabits: [{ habit: "", explanation: "" }],
    successfulHabits: [{ habit: "", explanation: "" }],
    stickinessPatterns: "",
    habitAttempts: [{ habit: "", mode: "building", whatDidntWork: "", obstacle: "" }],
    morningScorecard: { entries: [{ habit: "", score: "+", reasoning: "" }], takeaway: "", wantToAdd: [""], wantToRemove: [""] },
    afternoonScorecard: { entries: [{ habit: "", score: "+", reasoning: "" }], takeaway: "", wantToAdd: [""], wantToRemove: [""] },
    eveningScorecard: { entries: [{ habit: "", score: "+", reasoning: "" }], takeaway: "", wantToAdd: [""], wantToRemove: [""] },
    finalReflection: "",
    part1WrapUpReflection: "",
    updatedAt: new Date().toISOString(),
    completedAt: null,
  };
}

interface StoredState {
  version?: number;
  stepIndex?: number;
  draft?: HabitAssessmentPartThree;
  completedAt?: string | null;
}

function readStoredState(key: string): {
  stepIndex: number;
  draft: HabitAssessmentPartThree;
  completedAt: string | null;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const p = JSON.parse(raw) as StoredState;
    if (p.version !== STORAGE_VERSION || !p.draft) return null;
    return {
      stepIndex: typeof p.stepIndex === "number" ? p.stepIndex : 0,
      draft: p.draft,
      completedAt: p.completedAt ?? null,
    };
  } catch {
    return null;
  }
}

// ─── step metadata ────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<number, string> = {
  0: "Section 1 · Time & Energy Mapping",
  1: "Section 1 · Time & Energy Mapping",
  2: "Section 1 · Time & Energy Mapping",
  3: "Section 1 · Time & Energy Mapping",
  4: "Section 1 · Time & Energy Mapping",
  5: "Section 2 · Big Picture",
  6: "Section 2 · Big Picture",
  7: "Section 2 · Big Picture",
  8: "Section 3 · Past Habit History",
  9: "Section 3 · Past Habit History",
  10: "Section 3 · Past Habit History",
  11: "Section 4 · Building & Breaking",
  12: "Section 5 · Habit Inventory · Morning",
  13: "Section 5 · Habit Inventory · Afternoon",
  14: "Section 5 · Habit Inventory · Evening",
  15: "Section 6 · Final Reflection",
  16: "Part 1 Complete · Wrap-Up",
};

// ─── reusable input primitives ────────────────────────────────────────────────

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 5,
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

/** A growing list of single-line text inputs */
function ListInput({
  items,
  onChange,
  placeholder,
  addLabel = "+ Add another",
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  function update(idx: number, val: string) {
    const next = [...items];
    next[idx] = val;
    onChange(next);
  }
  function add() {
    onChange([...items, ""]);
  }
  function remove(idx: number) {
    if (items.length === 1) return;
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <TextInput
            value={item}
            onChange={(v) => update(idx, v)}
            placeholder={placeholder ?? `Item ${idx + 1}`}
          />
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => remove(idx)}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Remove"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="mt-1 self-start text-xs font-medium text-slate-500 hover:text-slate-800"
      >
        {addLabel}
      </button>
    </div>
  );
}

/** A growing list of two-field pairs (habit + explanation) */
function PairListInput({
  items,
  onChange,
  label1,
  label2,
  placeholder1,
  placeholder2,
}: {
  items: HabitRecord[];
  onChange: (items: HabitRecord[]) => void;
  label1?: string;
  label2?: string;
  placeholder1?: string;
  placeholder2?: string;
}) {
  function update(idx: number, key: keyof HabitRecord, val: string) {
    const next = [...items];
    next[idx] = { ...next[idx], [key]: val };
    onChange(next);
  }
  function add() {
    onChange([...items, { habit: "", explanation: "" }]);
  }
  function remove(idx: number) {
    if (items.length === 1) return;
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, idx) => (
        <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              #{idx + 1}
            </span>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Remove
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div>
              {label1 && <p className="mb-1 text-xs text-slate-500">{label1}</p>}
              <TextInput
                value={item.habit}
                onChange={(v) => update(idx, "habit", v)}
                placeholder={placeholder1 ?? "Habit"}
              />
            </div>
            <div>
              {label2 && <p className="mb-1 text-xs text-slate-500">{label2}</p>}
              <Textarea
                value={item.explanation}
                onChange={(v) => update(idx, "explanation", v)}
                placeholder={placeholder2 ?? "Explanation"}
                rows={3}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start text-xs font-medium text-slate-500 hover:text-slate-800"
      >
        + Add another
      </button>
    </div>
  );
}

/** 4-column habit attempt rows */
function HabitAttemptList({
  items,
  onChange,
}: {
  items: HabitAttempt[];
  onChange: (items: HabitAttempt[]) => void;
}) {
  function update(idx: number, key: keyof HabitAttempt, val: string) {
    const next = [...items];
    next[idx] = { ...next[idx], [key]: val } as HabitAttempt;
    onChange(next);
  }
  function add() {
    onChange([
      ...items,
      { habit: "", mode: "building", whatDidntWork: "", obstacle: "" },
    ]);
  }
  function remove(idx: number) {
    if (items.length === 1) return;
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, idx) => (
        <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Habit #{idx + 1}
            </span>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Remove
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {/* Habit name */}
            <div>
              <p className="mb-1 text-xs text-slate-500">Habit name</p>
              <TextInput
                value={item.habit}
                onChange={(v) => update(idx, "habit", v)}
                placeholder="e.g. Daily exercise"
              />
            </div>

            {/* Building or breaking */}
            <div>
              <p className="mb-1 text-xs text-slate-500">Goal</p>
              <div className="flex gap-2">
                {(["building", "breaking"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => update(idx, "mode", mode)}
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold capitalize transition ${
                      item.mode === mode
                        ? mode === "building"
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                          : "border-rose-400 bg-rose-50 text-rose-700"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* What didn't work */}
            <div>
              <p className="mb-1 text-xs text-slate-500">What didn&apos;t work</p>
              <Textarea
                value={item.whatDidntWork}
                onChange={(v) => update(idx, "whatDidntWork", v)}
                placeholder="Describe what you tried that didn't stick..."
                rows={2}
              />
            </div>

            {/* Obstacle */}
            <div>
              <p className="mb-1 text-xs text-slate-500">Obstacle</p>
              <Textarea
                value={item.obstacle}
                onChange={(v) => update(idx, "obstacle", v)}
                placeholder="What got in the way?"
                rows={2}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start text-xs font-medium text-slate-500 hover:text-slate-800"
      >
        + Add another habit
      </button>
    </div>
  );
}

// ─── component ───────────────────────────────────────────────────────────────

interface AssessmentPartThreeFormProps {
  assessmentId: string;
}

export function AssessmentPartThreeForm({ assessmentId }: AssessmentPartThreeFormProps) {
  const storageKey = useMemo(
    () => `habit-assessment:${assessmentId}:part-three`,
    [assessmentId],
  );
  const router = useRouter();

  const [draft, setDraft] = useState<HabitAssessmentPartThree>(() =>
    createDraft(assessmentId),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [slideDir, setSlideDir] = useState<"right" | "left">("right");
  const [panelKey, setPanelKey] = useState(0);
  const [panelVisible, setPanelVisible] = useState(false);

  const progressBarRef = useRef<HTMLDivElement>(null);

  // hydrate
  useEffect(() => {
    const stored = readStoredState(storageKey);
    if (stored) {
      setDraft(stored.draft);
      setStepIndex(stored.stepIndex);
    }
    setHydrated(true);
  }, [storageKey]);

  // persist
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: STORAGE_VERSION,
        stepIndex,
        draft: { ...draft, updatedAt: new Date().toISOString() },
        completedAt: null,
      }),
    );
  }, [stepIndex, draft, hydrated, storageKey]);

  // slide animation
  useEffect(() => {
    setPanelVisible(false);
    const f1 = requestAnimationFrame(() => {
      setPanelKey((k) => k + 1);
      requestAnimationFrame(() => setPanelVisible(true));
    });
    return () => cancelAnimationFrame(f1);
  }, [stepIndex]);

  function goTo(index: number) {
    if (index === stepIndex) return;
    setSlideDir(index > stepIndex ? "right" : "left");
    setStepIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    if (stepIndex > 0) goTo(stepIndex - 1);
  }
  function goContinue() {
    if (stepIndex < TOTAL_STEPS - 1) goTo(stepIndex + 1);
  }

  function persist(completedAt: string | null) {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: STORAGE_VERSION,
        stepIndex,
        draft: { ...draft, updatedAt: new Date().toISOString(), completedAt },
        completedAt,
      }),
    );
  }

  function saveAndExit() {
    persist(null);
    router.push("/dashboard");
  }

  function finish() {
    persist(new Date().toISOString());
    router.push("/dashboard");
  }

  function update<K extends keyof HabitAssessmentPartThree>(
    key: K,
    value: HabitAssessmentPartThree[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  const progress = ((stepIndex + 1) / TOTAL_STEPS) * 100;
  const slideIn = slideDir === "right" ? "translate-x-4 opacity-0" : "-translate-x-4 opacity-0";
  const isLastStep = stepIndex === TOTAL_STEPS - 1;

  // ─── step panels ─────────────────────────────────────────────────────────

  function renderStep() {
    switch (stepIndex) {
      // ── Q1: Major time spends ────────────────────────────────────────────
      case 0:
        return (
          <StepCard
            question="What are the major ways your time is currently being spent?"
            hint="Think across work, personal, family, health, hobbies, and obligations."
          >
            <ListInput
              items={draft.majorTimeSpends}
              onChange={(v) => update("majorTimeSpends", v)}
              placeholder="e.g. Work meetings, social media, childcare…"
            />
          </StepCard>
        );

      // ── Q2: High energy hours count + which hours ────────────────────────
      case 1:
        return (
          <StepCard
            question="How many high-energy hours do you typically have per day, and what are they?"
            hint="High-energy hours are when you feel focused, motivated, and sharp."
          >
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Number of high-energy hours per day
                </p>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={draft.highEnergyHoursPerDay ?? ""}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    update("highEnergyHoursPerDay", isNaN(n) ? null : n);
                  }}
                  placeholder="e.g. 3"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Which hours are they? (times or descriptions)
                </p>
                <ListInput
                  items={draft.highEnergyHoursList}
                  onChange={(v) => update("highEnergyHoursList", v)}
                  placeholder="e.g. 9–11 AM, or right after lunch"
                />
              </div>
            </div>
          </StepCard>
        );

      // ── Q3: What activities use high-energy hours now ────────────────────
      case 2:
        return (
          <StepCard
            question="What activities are currently getting your high-energy hours?"
            hint="Be honest — this is about what you actually do, not what you plan to do."
          >
            <Textarea
              value={draft.highEnergyActivities}
              onChange={(v) => update("highEnergyActivities", v)}
              placeholder="e.g. Responding to emails, context-switching between tasks, meetings…"
              rows={6}
            />
          </StepCard>
        );

      // ── Q4: Low energy hours ─────────────────────────────────────────────
      case 3:
        return (
          <StepCard
            question="Identify your low-energy hours."
            hint="When do you feel sluggish, scattered, or mentally drained?"
          >
            <ListInput
              items={draft.lowEnergyHours}
              onChange={(v) => update("lowEnergyHours", v)}
              placeholder="e.g. 2–4 PM, early mornings, after lunch…"
            />
          </StepCard>
        );

      // ── Q5: Ideal high + low energy spend ───────────────────────────────
      case 4:
        return (
          <StepCard
            question="How would you like to spend your high-energy and low-energy hours?"
            hint="Dream a little — how would an ideal day look?"
          >
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-2 text-sm font-semibold text-emerald-700">High-energy hours</p>
                <ListInput
                  items={draft.wantHighEnergySpend}
                  onChange={(v) => update("wantHighEnergySpend", v)}
                  placeholder="e.g. Deep work, creative projects, exercise…"
                  addLabel="+ Add activity"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-500">Low-energy hours</p>
                <ListInput
                  items={draft.wantLowEnergySpend}
                  onChange={(v) => update("wantLowEnergySpend", v)}
                  placeholder="e.g. Admin tasks, light reading, walking…"
                  addLabel="+ Add activity"
                />
              </div>
            </div>
          </StepCard>
        );

      // ── Q6: Time sinks ───────────────────────────────────────────────────
      case 5:
        return (
          <StepCard
            question="Think big picture — what feels like it consumes more time than it should?"
            hint="What would you cut or reduce if you could?"
          >
            <Textarea
              value={draft.timeSinksReflection}
              onChange={(v) => update("timeSinksReflection", v)}
              placeholder="e.g. Endless scrolling, unnecessary meetings, household admin…"
              rows={6}
            />
          </StepCard>
        );

      // ── Q7: Stress / energy drain ────────────────────────────────────────
      case 6:
        return (
          <StepCard
            question="What is the current source of most stress or energy drain in your life?"
            hint="This could be a situation, person, commitment, or unresolved problem."
          >
            <Textarea
              value={draft.stressSource}
              onChange={(v) => update("stressSource", v)}
              placeholder="e.g. Financial pressure, a difficult work relationship, unclear priorities…"
              rows={6}
            />
          </StepCard>
        );

      // ── Q8: Anticipated changes ──────────────────────────────────────────
      case 7:
        return (
          <StepCard
            question="What significant changes do you anticipate navigating soon?"
            hint="New role, move, relationship shift, health commitment — anything on the horizon worth planning for."
          >
            <Textarea
              value={draft.anticipatedChanges}
              onChange={(v) => update("anticipatedChanges", v)}
              placeholder="e.g. Starting a new job in 2 months, planning a move, training for a race…"
              rows={6}
            />
          </StepCard>
        );

      // ── Q9: Beneficial habits (pair list) ────────────────────────────────
      case 8:
        return (
          <StepCard
            question="What beneficial habits do you currently have?"
            hint="List each habit and explain why it's a positive part of your life."
          >
            <PairListInput
              items={draft.beneficialHabits}
              onChange={(v) => update("beneficialHabits", v)}
              label1="Habit"
              label2="Why is it a positive habit?"
              placeholder1="e.g. Morning walk"
              placeholder2="e.g. Clears my head and sets the tone for the day"
            />
          </StepCard>
        );

      // ── Q10: Most successful habits + why they stuck ─────────────────────
      case 9:
        return (
          <StepCard
            question="What have been your most successful habits, and why did they stick?"
            hint="Think about habits that lasted — what made them different?"
          >
            <PairListInput
              items={draft.successfulHabits}
              onChange={(v) => update("successfulHabits", v)}
              label1="Habit"
              label2="Why did it stick?"
              placeholder1="e.g. Nightly journaling"
              placeholder2="e.g. I tied it to an existing routine and kept it short"
            />
          </StepCard>
        );

      // ── Q11: Stickiness patterns ─────────────────────────────────────────
      case 10:
        return (
          <StepCard
            question="Looking at your past data, what patterns made habits sticky and positive?"
            hint="Write down the common threads you notice — times of day, social accountability, environmental triggers, etc."
          >
            <Textarea
              value={draft.stickinessPatterns}
              onChange={(v) => update("stickinessPatterns", v)}
              placeholder="e.g. I succeed when the habit is attached to something I already do, is under 10 minutes, and I can see my streak…"
              rows={8}
            />
          </StepCard>
        );

      // ── Q12: Habit attempts (building/breaking, 4-field rows) ────────────
      case 11:
        return (
          <StepCard
            question="Reflect on habits you've tried building or breaking."
            hint="For each habit, record whether you were building or breaking it, what didn't work, and what got in the way."
          >
            <HabitAttemptList
              items={draft.habitAttempts}
              onChange={(v) => update("habitAttempts", v)}
            />
          </StepCard>
        );

      // ── Q13–15: Habit Inventory scorecards ──────────────────────────────
      case 12:
        return (
          <ScorecardStep
            label="Morning"
            timeHint="Habits you do from waking up through mid-morning"
            scorecard={draft.morningScorecard}
            onChange={(v) => update("morningScorecard", v)}
          />
        );

      case 13:
        return (
          <ScorecardStep
            label="Afternoon"
            timeHint="Habits spanning lunch through late afternoon"
            scorecard={draft.afternoonScorecard}
            onChange={(v) => update("afternoonScorecard", v)}
          />
        );

      case 14:
        return (
          <ScorecardStep
            label="Evening"
            timeHint="Habits from dinner time through your wind-down routine"
            scorecard={draft.eveningScorecard}
            onChange={(v) => update("eveningScorecard", v)}
          />
        );

      // ── Q16: Final reflection ────────────────────────────────────────────
      case 15:
        return (
          <StepCard
            question="Reflect on all of this data."
            hint="You've mapped your time, energy, habits, and history. What stands out? What do you want to change or protect?"
          >
            <Textarea
              value={draft.finalReflection}
              onChange={(v) => update("finalReflection", v)}
              placeholder="Write freely — patterns you've noticed, commitments you want to make, surprises you found…"
              rows={10}
            />
          </StepCard>
        );

      // ── Q17: Part 1 wrap-up ──────────────────────────────────────────────
      case 16:
        return (
          <div className="flex flex-col gap-6">
            {/* Completion banner */}
            <div className="rounded-3xl border border-slate-200 bg-slate-950 px-6 py-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Part 1 Complete</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">You've finished the full assessment.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                You've completed the baseline questions, the 7-day energy log, and the deep-dive into your time, habits, and history. Take a moment to reflect on the whole journey.
              </p>
            </div>

            <StepCard
              question="Looking back on everything — what do you now understand about yourself that you didn't before?"
              hint="Consider your energy patterns, your habit history, your biggest time drains, and the habits you want to build or break."
            >
              <Textarea
                value={draft.part1WrapUpReflection}
                onChange={(v) => update("part1WrapUpReflection", v)}
                placeholder="Write freely — what surprised you, what confirmed what you already knew, and what you're most motivated to change…"
                rows={10}
              />
            </StepCard>
          </div>
        );

      default:
        return null;
    }
  }

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col">
      {/* sticky header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              Part Three
            </p>
            <h1 className="text-base font-semibold text-slate-950">
              {SECTION_LABELS[stepIndex]}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={saveAndExit}
              className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Save &amp; exit
            </button>
            {isLastStep && (
              <button
                type="button"
                onClick={finish}
                className="inline-flex h-9 items-center justify-center rounded-full bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Finish
              </button>
            )}
          </div>
        </div>

        {/* progress bar */}
        <div className="mx-auto mt-3 max-w-2xl">
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              ref={progressBarRef}
              className="h-full rounded-full bg-slate-950 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[10px] text-slate-400">
            {stepIndex + 1} / {TOTAL_STEPS}
          </p>
        </div>
      </header>

      {/* animated panel */}
      <main className="flex flex-1 flex-col px-4 py-8">
        <div className="mx-auto w-full max-w-2xl">
          <div
            key={panelKey}
            className={`transition-all duration-300 ${
              panelVisible ? "translate-x-0 opacity-100" : slideIn
            }`}
          >
            {hydrated ? renderStep() : <SkeletonCard />}
          </div>

          {/* navigation */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-30"
            >
              ← Back
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={finish}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Complete assessment →
              </button>
            ) : (
              <button
                type="button"
                onClick={goContinue}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Continue →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── ScorecardStep ────────────────────────────────────────────────────────────

function HabitInventoryList({
  entries,
  onChange,
}: {
  entries: HabitInventoryEntry[];
  onChange: (entries: HabitInventoryEntry[]) => void;
}) {
  function updateEntry(idx: number, key: keyof HabitInventoryEntry, val: string) {
    const next = [...entries];
    next[idx] = { ...next[idx], [key]: val } as HabitInventoryEntry;
    onChange(next);
  }
  function add() {
    onChange([...entries, { habit: "", score: "+", reasoning: "" }]);
  }
  function remove(idx: number) {
    if (entries.length === 1) return;
    onChange(entries.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry, idx) => (
        <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Habit #{idx + 1}
            </span>
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Remove
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {/* Habit name */}
            <TextInput
              value={entry.habit}
              onChange={(v) => updateEntry(idx, "habit", v)}
              placeholder="Habit name"
            />

            {/* Score toggle */}
            <div className="flex gap-2">
              {(["+", "-"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateEntry(idx, "score", s)}
                  className={`flex h-9 w-14 items-center justify-center rounded-xl border text-sm font-bold transition ${
                    entry.score === s
                      ? s === "+"
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-rose-400 bg-rose-50 text-rose-700"
                      : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
              <span className="flex items-center text-xs text-slate-400">
                {entry.score === "+" ? "Positive habit" : "Negative habit"}
              </span>
            </div>

            {/* Reasoning */}
            <Textarea
              value={entry.reasoning}
              onChange={(v) => updateEntry(idx, "reasoning", v)}
              placeholder="Why is this habit positive or negative for you?"
              rows={2}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start text-xs font-medium text-slate-500 hover:text-slate-800"
      >
        + Add habit
      </button>
    </div>
  );
}

function ScorecardStep({
  label,
  timeHint,
  scorecard,
  onChange,
}: {
  label: string;
  timeHint: string;
  scorecard: HabitInventoryScorecard;
  onChange: (sc: HabitInventoryScorecard) => void;
}) {
  function set<K extends keyof HabitInventoryScorecard>(
    key: K,
    value: HabitInventoryScorecard[K],
  ) {
    onChange({ ...scorecard, [key]: value });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Scorecard header */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
          <span className="text-xs font-semibold text-slate-600">{label}</span>
        </div>
        <h2 className="mt-2 text-lg font-semibold leading-snug text-slate-950">
          {label} Habit Scorecard
        </h2>
        <p className="mt-1 text-sm text-slate-500">{timeHint}</p>
        <p className="mt-1 text-xs text-slate-400">
          List all habits you do in the {label.toLowerCase()}, rate them + or −, and explain your reasoning.
        </p>

        <div className="mt-5">
          <HabitInventoryList
            entries={scorecard.entries}
            onChange={(v) => set("entries", v)}
          />
        </div>
      </div>

      {/* Takeaway */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-slate-950">
          {label} takeaway
        </h3>
        <p className="mb-3 text-sm text-slate-500">
          What's the most important insight from your {label.toLowerCase()} habits?
        </p>
        <Textarea
          value={scorecard.takeaway}
          onChange={(v) => set("takeaway", v)}
          placeholder={`e.g. My ${label.toLowerCase()} is mostly reactive — I want to protect it for focused work…`}
          rows={4}
        />
      </div>

      {/* Want to add / remove */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-950">
          Redesign your {label.toLowerCase()}
        </h3>

        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-sm font-medium text-emerald-700">
              Habits to add in the {label.toLowerCase()}
            </p>
            <ListInput
              items={scorecard.wantToAdd}
              onChange={(v) => set("wantToAdd", v)}
              placeholder="e.g. 10 minutes of reading"
              addLabel="+ Add"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-rose-600">
              Habits to remove from the {label.toLowerCase()}
            </p>
            <ListInput
              items={scorecard.wantToRemove}
              onChange={(v) => set("wantToRemove", v)}
              placeholder="e.g. Checking social media first thing"
              addLabel="+ Add"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── StepCard ─────────────────────────────────────────────────────────────────

function StepCard({
  question,
  hint,
  children,
}: {
  question: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold leading-snug text-slate-950">{question}</h2>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-3 h-5 w-3/4 rounded-full bg-slate-100" />
      <div className="h-3 w-1/2 rounded-full bg-slate-100" />
      <div className="mt-5 flex flex-col gap-3">
        <div className="h-10 rounded-xl bg-slate-100" />
        <div className="h-10 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}
