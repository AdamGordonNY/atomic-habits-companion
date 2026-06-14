"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchPartFour, upsertPartFour } from "@/lib/actions/part-four-actions";
import { fetchPartTwoForReview } from "@/lib/assessment-reads";
import { analyzePartTwoEnergy } from "@/lib/energy-analysis";
import { LIFE_DOMAINS } from "@/types/habit";
import type { DomainVision, EnergyAnalysis, HabitAssessmentPartFour, IdentityEntry } from "@/types/habit";

// ─── constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 11;

const SECTION_LABELS: Record<number, string> = {
  0: "Question 1 · Clean Slate",
  1: "Question 1 · Clean Slate",
  2: "Question 1 · Clean Slate",
  3: "Question 1 · Clean Slate",
  4: "Question 2 · Your Ideal Future",
  5: "Question 2 · Your Ideal Future",
  6: "Question 2 · Your Ideal Future",
  7: "Question 2 · Your Ideal Future",
  8: "Question 2 · Your Ideal Future",
  9: "Question 2 · Your Ideal Future",
  10: "Question 2 · Your Ideal Future",
};

// ─── draft types ──────────────────────────────────────────────────────────────

type DraftState = Omit<HabitAssessmentPartFour, "id" | "updatedAt">;

function defaultDraft(): DraftState {
  return {
    completedAt: null,
    existingCommitments: [""],
    desiredCommitments: [""],
    unwantedCommitments: [""],
    idealMorning: "",
    idealAfternoon: "",
    idealEvening: "",
    cleanSlateReflection: "",
    majorGoals: [""],
    vision6Months: "",
    vision2Years: "",
    vision5Years: "",
    majorChanges: [""],
    successDefinition: "",
    domainVisions: LIFE_DOMAINS.map((d) => ({ domain: d, vision: "" })),
    identities: [{ identity: "", habits: [] }],
    futureReflection: "",
    reflectionGoals: [""],
  };
}

function mergeDomainVisions(stored: DomainVision[]): DomainVision[] {
  const map = new Map(stored.map((d) => [d.domain, d.vision]));
  return LIFE_DOMAINS.map((domain) => ({ domain, vision: map.get(domain) ?? "" }));
}

function dbToDraft(data: HabitAssessmentPartFour): DraftState {
  return {
    completedAt: data.completedAt,
    existingCommitments: data.existingCommitments.length ? data.existingCommitments : [""],
    desiredCommitments: data.desiredCommitments.length ? data.desiredCommitments : [""],
    unwantedCommitments: data.unwantedCommitments.length ? data.unwantedCommitments : [""],
    idealMorning: data.idealMorning,
    idealAfternoon: data.idealAfternoon,
    idealEvening: data.idealEvening,
    cleanSlateReflection: data.cleanSlateReflection,
    majorGoals: data.majorGoals.length ? data.majorGoals : [""],
    vision6Months: data.vision6Months,
    vision2Years: data.vision2Years,
    vision5Years: data.vision5Years,
    majorChanges: data.majorChanges.length ? data.majorChanges : [""],
    successDefinition: data.successDefinition,
    domainVisions: mergeDomainVisions(data.domainVisions),
    identities: data.identities.length ? data.identities : [{ identity: "", habits: [] }],
    futureReflection: data.futureReflection,
    reflectionGoals: data.reflectionGoals.length ? data.reflectionGoals : [""],
  };
}

function draftToPayload(d: DraftState) {
  return {
    existingCommitments: d.existingCommitments.filter(Boolean),
    desiredCommitments: d.desiredCommitments.filter(Boolean),
    unwantedCommitments: d.unwantedCommitments.filter(Boolean),
    idealMorning: d.idealMorning,
    idealAfternoon: d.idealAfternoon,
    idealEvening: d.idealEvening,
    cleanSlateReflection: d.cleanSlateReflection,
    majorGoals: d.majorGoals.filter(Boolean),
    vision6Months: d.vision6Months,
    vision2Years: d.vision2Years,
    vision5Years: d.vision5Years,
    majorChanges: d.majorChanges.filter(Boolean),
    successDefinition: d.successDefinition,
    domainVisions: d.domainVisions,
    identities: d.identities.filter((i) => i.identity.trim()),
    futureReflection: d.futureReflection,
    reflectionGoals: d.reflectionGoals.filter(Boolean),
  };
}

// ─── UI primitives ────────────────────────────────────────────────────────────

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
          <TextInput value={item} onChange={(v) => update(idx, v)} placeholder={placeholder ?? `Item ${idx + 1}`} />
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

// ─── EnergyAuditPanel ────────────────────────────────────────────────────────

function EnergyAuditPanel({ analysis }: { analysis: EnergyAnalysis | null }) {
  if (!analysis || analysis.daysTracked === 0) return null;

  const highHours = analysis.highEnergyRanking
    .filter((h) => h.energyScore > 0)
    .slice(0, 4);
  const lowHours = analysis.lowEnergyRanking
    .filter((h) => h.energyScore < 0)
    .slice(0, 4);
  const peakActivities = analysis.peakHour?.topActivities ?? [];

  return (
    <div className="mb-6 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-sky-700">
        Time &amp; Energy Audit · {analysis.daysTracked} day{analysis.daysTracked !== 1 ? "s" : ""} tracked
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1.5 text-xs font-medium text-emerald-700">↑ High energy</p>
          <div className="flex flex-wrap gap-1">
            {highHours.length > 0 ? (
              highHours.map((h) => (
                <span
                  key={h.hour}
                  className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
                >
                  {h.hour}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">No clear peaks</span>
            )}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-rose-600">↓ Low energy</p>
          <div className="flex flex-wrap gap-1">
            {lowHours.length > 0 ? (
              lowHours.map((h) => (
                <span
                  key={h.hour}
                  className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700"
                >
                  {h.hour}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">No clear dips</span>
            )}
          </div>
        </div>
      </div>
      {peakActivities.length > 0 && (
        <p className="mt-2.5 text-[11px] text-slate-500">
          <span className="font-medium text-slate-600">At your peak: </span>
          {peakActivities.join(" · ")}
        </p>
      )}
    </div>
  );
}

function StepCard({ question, hint, children }: { question: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <p className="mb-1 text-base font-semibold text-slate-900">{question}</p>
      {hint && <p className="mb-5 text-sm text-slate-500">{hint}</p>}
      {!hint && <div className="mb-5" />}
      {children}
    </div>
  );
}

// ─── IdentityCard ─────────────────────────────────────────────────────────────

function IdentityCard({
  entry,
  index,
  total,
  onChange,
  onRemove,
}: {
  entry: IdentityEntry;
  index: number;
  total: number;
  onChange: (e: IdentityEntry) => void;
  onRemove: () => void;
}) {
  const [habitInput, setHabitInput] = useState("");

  function addHabit() {
    const val = habitInput.trim();
    if (!val) return;
    onChange({ ...entry, habits: [...entry.habits, val] });
    setHabitInput("");
  }

  function removeHabit(i: number) {
    onChange({ ...entry, habits: entry.habits.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">Identity {index + 1}</label>
          <TextInput
            value={entry.identity}
            onChange={(v) => onChange({ ...entry, identity: v })}
            placeholder="e.g. I am an athlete"
          />
        </div>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="mt-5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            aria-label="Remove identity"
          >
            ×
          </button>
        )}
      </div>

      {/* Habit chips */}
      {entry.habits.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {entry.habits.map((h, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"
            >
              {h}
              <button
                type="button"
                onClick={() => removeHabit(i)}
                className="ml-0.5 text-slate-400 hover:text-slate-700"
                aria-label="Remove habit"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add habit */}
      <div className="flex gap-2">
        <input
          type="text"
          value={habitInput}
          onChange={(e) => setHabitInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addHabit();
            }
          }}
          placeholder="Add a habit and press Enter"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
        />
        <button
          type="button"
          onClick={addHabit}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function AssessmentPartFourForm({ assessmentId: _assessmentId }: { assessmentId: string }) {
  const router = useRouter();

  const [draft, setDraft] = useState<DraftState>(defaultDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [energyAnalysis, setEnergyAnalysis] = useState<EnergyAnalysis | null>(null);
  const [saving, setSaving] = useState(false);
  const [slideDir, setSlideDir] = useState<"right" | "left">("right");
  const [panelKey, setPanelKey] = useState(0);
  const [panelVisible, setPanelVisible] = useState(false);

  const draftRef = useRef(draft);
  draftRef.current = draft;

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from DB
  useEffect(() => {
    Promise.all([fetchPartFour(), fetchPartTwoForReview()]).then(([p4, p2]) => {
      if (p4) setDraft(dbToDraft(p4));
      const days = p2?.draft?.days;
      if (days && days.length > 0) {
        setEnergyAnalysis(analyzePartTwoEnergy(days));
      }
      setHydrated(true);
    });
  }, []);

  // Step slide animation
  useEffect(() => {
    setPanelVisible(false);
    const f = requestAnimationFrame(() => {
      setPanelKey((k) => k + 1);
      requestAnimationFrame(() => setPanelVisible(true));
    });
    return () => cancelAnimationFrame(f);
  }, [stepIndex]);

  // Autosave after 2 s of inactivity
  function scheduleAutosave() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      upsertPartFour(draftToPayload(draftRef.current)).catch(console.error);
    }, 2000);
  }

  function update<K extends keyof DraftState>(key: K, value: DraftState[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    scheduleAutosave();
  }

  async function persist(completedAt: string | null = null) {
    setSaving(true);
    try {
      await upsertPartFour({ ...draftToPayload(draftRef.current), completedAt });
    } catch (err) {
      console.error("[PartFour] save failed:", err);
    } finally {
      setSaving(false);
    }
  }

  async function goTo(index: number) {
    if (index === stepIndex) return;
    setSlideDir(index > stepIndex ? "right" : "left");
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
  const slideIn = slideDir === "right" ? "translate-x-4 opacity-0" : "-translate-x-4 opacity-0";

  // ─── step renders ──────────────────────────────────────────────────────────

  function renderStep() {
    switch (stepIndex) {
      // Step 0 — Q1.1: Current & desired commitments
      case 0:
        return (
          <div className="flex flex-col gap-5">
            <StepCard
              question="What commitments do you already have?"
              hint="Think across work, family, health, social, and personal obligations."
            >
              <ListInput
                items={draft.existingCommitments}
                onChange={(v) => update("existingCommitments", v)}
                placeholder="e.g. Weekly team meetings, gym 3× a week…"
              />
            </StepCard>
            <StepCard
              question="What commitments would you like to have?"
              hint="If you had a clean slate, what would you choose to take on?"
            >
              <ListInput
                items={draft.desiredCommitments}
                onChange={(v) => update("desiredCommitments", v)}
                placeholder="e.g. Daily journaling, learning Spanish…"
              />
            </StepCard>
          </div>
        );

      // Step 1 — Q1.2: Unwanted commitments
      case 1:
        return (
          <StepCard
            question="What commitments do you not want in your life?"
            hint="Be honest — what drains you or no longer aligns with who you want to be?"
          >
            <ListInput
              items={draft.unwantedCommitments}
              onChange={(v) => update("unwantedCommitments", v)}
              placeholder="e.g. Late-night scrolling, reactive email checking…"
            />
          </StepCard>
        );

      // Step 2 — Q1.3: Ideal day
      case 2:
        return (
          <div className="flex flex-col gap-5">
            <p className="text-sm font-medium text-slate-500">
              Describe what your ideal day would look like across three parts of the day.
            </p>
            <StepCard question="Morning" hint="How would you start the day?">
              <Textarea
                value={draft.idealMorning}
                onChange={(v) => update("idealMorning", v)}
                placeholder="Wake up at 6 am, 20-minute walk, coffee and journaling…"
                rows={4}
              />
            </StepCard>
            <StepCard question="Afternoon" hint="What would your midday look like?">
              <Textarea
                value={draft.idealAfternoon}
                onChange={(v) => update("idealAfternoon", v)}
                placeholder="Deep work from 9–12, lunch with a colleague, focused project blocks…"
                rows={4}
              />
            </StepCard>
            <StepCard question="Evening" hint="How would you wind down?">
              <Textarea
                value={draft.idealEvening}
                onChange={(v) => update("idealEvening", v)}
                placeholder="Family dinner, light reading, off screens by 9:30…"
                rows={4}
              />
            </StepCard>
          </div>
        );

      // Step 3 — Q1.4: Clean slate reflection
      case 3:
        return (
          <StepCard
            question="Reflect on the exercise"
            hint="What did you learn? What surprised you about your ideal day compared to your current reality?"
          >
            <Textarea
              value={draft.cleanSlateReflection}
              onChange={(v) => update("cleanSlateReflection", v)}
              placeholder="I noticed that I value quiet mornings far more than I thought…"
              rows={7}
            />
          </StepCard>
        );

      // Step 4 — Q2.1: Major goals
      case 4:
        return (
          <StepCard
            question="What are the major goals you're coming into this process with?"
            hint="List the goals that brought you here — big or small, personal or professional."
          >
            <ListInput
              items={draft.majorGoals}
              onChange={(v) => update("majorGoals", v)}
              placeholder="e.g. Write a book, get healthier, change careers…"
            />
          </StepCard>
        );

      // Step 5 — Q2.2: Future vision
      case 5:
        return (
          <div className="flex flex-col gap-5">
            <p className="text-sm font-medium text-slate-500">
              What do you hope your life looks like at these points in the future?
            </p>
            <StepCard question="6 months from now">
              <Textarea
                value={draft.vision6Months}
                onChange={(v) => update("vision6Months", v)}
                placeholder="I'm consistently working out 4 times a week and have started my side project…"
                rows={4}
              />
            </StepCard>
            <StepCard question="2 years from now">
              <Textarea
                value={draft.vision2Years}
                onChange={(v) => update("vision2Years", v)}
                placeholder="I've launched my business and spend 60% of my time on deep work…"
                rows={4}
              />
            </StepCard>
            <StepCard question="5 years from now">
              <Textarea
                value={draft.vision5Years}
                onChange={(v) => update("vision5Years", v)}
                placeholder="I'm financially free, my health is a non-negotiable, and I spend quality time with family…"
                rows={4}
              />
            </StepCard>
          </div>
        );

      // Step 6 — Q2.3: Major changes
      case 6:
        return (
          <StepCard
            question="What major changes do you want to see in your life?"
            hint="Think about what would make the biggest difference to your wellbeing, work, and relationships."
          >
            <ListInput
              items={draft.majorChanges}
              onChange={(v) => update("majorChanges", v)}
              placeholder="e.g. More intentional time with family, leave my comfort zone more…"
            />
          </StepCard>
        );

      // Step 7 — Q2.4: Success definition
      case 7:
        return (
          <StepCard
            question="Define what success means to you"
            hint="Not a conventional definition — your own. What does a successful life look and feel like for you?"
          >
            <Textarea
              value={draft.successDefinition}
              onChange={(v) => update("successDefinition", v)}
              placeholder="Success for me means feeling energised by my work, having deep relationships, and being present for the people I love…"
              rows={7}
            />
          </StepCard>
        );

      // Step 8 — Q2.5: Domain visions
      case 8:
        return (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-slate-500">
              For each area of life below, describe your vision — what does your ideal look like?
            </p>
            {draft.domainVisions.map((dv, idx) => (
              <div key={dv.domain} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-slate-800">{dv.domain}</p>
                <Textarea
                  value={dv.vision}
                  onChange={(v) => {
                    const next = [...draft.domainVisions];
                    next[idx] = { ...dv, vision: v };
                    update("domainVisions", next);
                  }}
                  placeholder={`Describe your ideal ${dv.domain.toLowerCase()}…`}
                  rows={3}
                />
              </div>
            ))}
          </div>
        );

      // Step 9 — Q2.6: Identities + habits
      case 9:
        return (
          <div className="flex flex-col gap-4">
            <StepCard
              question="Pick an identity and list habits associated with it"
              hint="Who do you want to become? List as many identities as you like, each with their associated habits."
            >
              <div className="flex flex-col gap-3">
                {draft.identities.map((entry, idx) => (
                  <IdentityCard
                    key={idx}
                    entry={entry}
                    index={idx}
                    total={draft.identities.length}
                    onChange={(updated) => {
                      const next = [...draft.identities];
                      next[idx] = updated;
                      update("identities", next);
                    }}
                    onRemove={() => {
                      if (draft.identities.length === 1) return;
                      update("identities", draft.identities.filter((_, i) => i !== idx));
                    }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => update("identities", [...draft.identities, { identity: "", habits: [] }])}
                  className="mt-1 self-start text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  + Add another identity
                </button>
              </div>
            </StepCard>
          </div>
        );

      // Step 10 — Q2.7 + 7b: Reflection + goals
      case 10:
        return (
          <div className="flex flex-col gap-5">
            <StepCard
              question="Reflect on what you've discovered"
              hint="What do you want? What don't you want? What patterns are you noticing?"
            >
              <Textarea
                value={draft.futureReflection}
                onChange={(v) => update("futureReflection", v)}
                placeholder="I keep coming back to connection and autonomy. I want more flexibility but also more meaningful relationships…"
                rows={7}
              />
            </StepCard>
            <StepCard
              question="Based on your reflection, list your goals"
              hint="Concrete goals you want to pursue — shaped by everything you've uncovered."
            >
              <ListInput
                items={draft.reflectionGoals}
                onChange={(v) => update("reflectionGoals", v)}
                placeholder="e.g. Build a morning routine I love, deepen 2–3 close friendships…"
              />
            </StepCard>
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
            <h1 className="text-base font-semibold text-slate-950">Where Do You Want to End Up?</h1>
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

        {/* Step indicator */}
        <div className="mx-auto max-w-2xl px-4 py-2">
          <p className="text-xs text-slate-400">
            Step {stepIndex + 1} of {TOTAL_STEPS}
          </p>
        </div>
      </header>

      {/* Step content */}
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <EnergyAuditPanel analysis={energyAnalysis} />
          <div
            key={panelKey}
            className={`transition-all duration-300 ease-out ${
              panelVisible ? "translate-x-0 opacity-100" : slideIn
            }`}
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
              {saving ? "Saving…" : "Complete Part 4 ✓"}
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
