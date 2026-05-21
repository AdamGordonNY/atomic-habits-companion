"use client";

import { useEffect, useMemo, useState } from "react";
import { AssessmentCard } from "./assessment-card";
import type { AssessmentRating } from "@/types/habit";

type StepDirection = "forward" | "backward";

interface ProjectEntry {
  id: string;
  name: string;
  progress: string;
}

interface AssessmentDraft {
  personalSatisfaction: {
    rating: AssessmentRating | "";
    why: string;
  };
  professionalSatisfaction: {
    rating: AssessmentRating | "";
    why: string;
  };
  topPriorities: string[];
  optimization: {
    what: string;
    why: string;
  };
  projects: ProjectEntry[];
  obligations: string[];
  workingWell: string[];
  notWorkingWell: string[];
  blockers: {
    what: string;
    overcome: string;
    why: string;
  };
  changes: {
    what: string;
    why: string;
  };
}

interface AssessmentStepConfig {
  id: string;
  category: string;
  title: string;
  description: string;
}

const STEPS: AssessmentStepConfig[] = [
  {
    id: "personal",
    category: "personal",
    title: "How satisfied are you with your personal life?",
    description: "Rate your personal life from 1 to 5, then explain why.",
  },
  {
    id: "professional",
    category: "professional",
    title: "How satisfied are you with your professional life?",
    description: "Rate your professional life from 1 to 5, then explain why.",
  },
  {
    id: "priorities",
    category: "focus",
    title: "What are your top 3 priorities right now?",
    description: "Capture the three things that deserve your attention most.",
  },
  {
    id: "optimization",
    category: "focus",
    title: "What are you optimizing for right now, and why?",
    description: "Write the outcome you want and the reason behind it.",
  },
  {
    id: "projects",
    category: "projects",
    title: "What major projects are you working on, and how are they going?",
    description: "Add one row per project with the project name and progress.",
  },
  {
    id: "obligations",
    category: "life",
    title: "What are the non-negotiable obligations in life right now?",
    description: "List the five obligations that cannot be ignored.",
  },
  {
    id: "working",
    category: "reflection",
    title: "What is working well in your life, and what is not?",
    description: "Capture both sides so you can see the full picture.",
  },
  {
    id: "blockers",
    category: "growth",
    title: "What holds you back, and how can you overcome it?",
    description: "Describe the blocker, the fix, and why it matters.",
  },
  {
    id: "changes",
    category: "growth",
    title: "What major things do you want to change in your life, and why?",
    description: "State the change clearly and explain your motivation.",
  },
];

const STORAGE_VERSION = 1;

function createProjectEntry(): ProjectEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    progress: "",
  };
}

function createDraft(): AssessmentDraft {
  return {
    personalSatisfaction: { rating: "", why: "" },
    professionalSatisfaction: { rating: "", why: "" },
    topPriorities: ["", "", ""],
    optimization: { what: "", why: "" },
    projects: [createProjectEntry()],
    obligations: ["", "", "", "", ""],
    workingWell: ["", "", ""],
    notWorkingWell: ["", "", ""],
    blockers: { what: "", overcome: "", why: "" },
    changes: { what: "", why: "" },
  };
}

function isAssessmentRating(value: unknown): value is AssessmentRating {
  return [1, 2, 3, 4, 5].includes(value as number);
}

function readStoredState(storageKey: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as {
      version?: number;
      stepIndex?: number;
      draft?: AssessmentDraft;
      completedAt?: string | null;
    };

    if (parsed.version !== STORAGE_VERSION || !parsed.draft) {
      return null;
    }

    return {
      stepIndex: typeof parsed.stepIndex === "number" ? parsed.stepIndex : 0,
      draft: parsed.draft,
      completedAt: parsed.completedAt ?? null,
    };
  } catch {
    return null;
  }
}

interface AssessmentFormProps {
  assessmentId: string;
}

export function AssessmentForm({ assessmentId }: AssessmentFormProps) {
  const storageKey = useMemo(
    () => `habit-assessment:${assessmentId}`,
    [assessmentId],
  );

  const [draft, setDraft] = useState<AssessmentDraft>(createDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<StepDirection>("forward");
  const [hydrated, setHydrated] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [stepVisible, setStepVisible] = useState(false);

  useEffect(() => {
    const stored = readStoredState(storageKey);

    if (stored) {
      setDraft(stored.draft);
      setStepIndex(Math.min(stored.stepIndex, STEPS.length - 1));
      setCompletedAt(stored.completedAt);
    }

    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: STORAGE_VERSION,
        stepIndex,
        draft,
        completedAt,
      }),
    );
  }, [completedAt, draft, hydrated, storageKey, stepIndex]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStepVisible(false);
    const frame = window.requestAnimationFrame(() => setStepVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [stepIndex]);

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const isFirstStep = stepIndex === 0;

  function goBack() {
    if (isFirstStep) {
      return;
    }

    setDirection("backward");
    setStepIndex((value) => value - 1);
  }

  function goNext() {
    if (isLastStep) {
      const now = new Date().toISOString();
      setCompletedAt(now);
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          version: STORAGE_VERSION,
          stepIndex,
          draft,
          completedAt: now,
        }),
      );
      return;
    }

    setDirection("forward");
    setStepIndex((value) => Math.min(value + 1, STEPS.length - 1));
  }

  function updateTopPriority(index: number, value: string) {
    setDraft((current) => {
      const next = [...current.topPriorities];
      next[index] = value;
      return { ...current, topPriorities: next };
    });
  }

  function updateObligation(index: number, value: string) {
    setDraft((current) => {
      const next = [...current.obligations];
      next[index] = value;
      return { ...current, obligations: next };
    });
  }

  function updateTextList(
    field: "workingWell" | "notWorkingWell",
    index: number,
    value: string,
  ) {
    setDraft((current) => {
      const next = [...current[field]];
      next[index] = value;
      return { ...current, [field]: next };
    });
  }

  function addTextListItem(field: "workingWell" | "notWorkingWell") {
    setDraft((current) => ({
      ...current,
      [field]: [...current[field], ""],
    }));
  }

  function removeTextListItem(field: "workingWell" | "notWorkingWell", index: number) {
    setDraft((current) => {
      if (current[field].length <= 1) {
        return current;
      }

      const next = current[field].filter((_, itemIndex) => itemIndex !== index);
      return { ...current, [field]: next };
    });
  }

  function updateProject(id: string, key: "name" | "progress", value: string) {
    setDraft((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === id ? { ...project, [key]: value } : project,
      ),
    }));
  }

  function addProject() {
    setDraft((current) => ({
      ...current,
      projects: [...current.projects, createProjectEntry()],
    }));
  }

  function removeProject(id: string) {
    setDraft((current) => ({
      ...current,
      projects: current.projects.length > 1 ? current.projects.filter((project) => project.id !== id) : current.projects,
    }));
  }

  const stepAnimationClass = stepVisible
    ? "translate-x-0 opacity-100"
    : direction === "forward"
      ? "translate-x-6 opacity-0"
      : "-translate-x-6 opacity-0";

  if (completedAt) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
        <section className="w-full rounded-[2rem] border border-white/15 bg-white/80 p-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-2xl text-emerald-600">
            ✓
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Assessment saved locally.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            You can return to this assessment anytime and your answers will
            still be waiting in localStorage for this route id.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setCompletedAt(null)}
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
            >
              Review answers
            </button>
            <button
              type="button"
              onClick={() => {
                const freshDraft = createDraft();
                setDraft(freshDraft);
                setStepIndex(0);
                setCompletedAt(null);
                window.localStorage.setItem(
                  storageKey,
                  JSON.stringify({
                    version: STORAGE_VERSION,
                    stepIndex: 0,
                    draft: freshDraft,
                    completedAt: null,
                  }),
                );
              }}
              className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Start over
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
      <div className="w-full">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Habit assessment
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Build your baseline before habits.
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-right">
            Your progress is saved after every change, so you can move back and
            forth without losing anything.
          </p>
        </div>

        <div
          key={currentStep.id}
          className={`transform transition-all duration-500 ease-out ${stepAnimationClass}`}
        >
          <AssessmentCard
            step={stepIndex + 1}
            totalSteps={STEPS.length}
            category={currentStep.category}
            title={currentStep.title}
            description={currentStep.description}
            onBack={goBack}
            onNext={goNext}
            backDisabled={isFirstStep}
            nextLabel={isLastStep ? "Finish assessment" : "Continue"}
            footerNote={`Question ${stepIndex + 1} of ${STEPS.length}`}
            nextDisabled={
              (currentStep.id === "personal" && !draft.personalSatisfaction.rating) ||
              (currentStep.id === "professional" && !draft.professionalSatisfaction.rating) ||
              (currentStep.id === "priorities" && draft.topPriorities.every((item) => !item.trim())) ||
              (currentStep.id === "optimization" && !draft.optimization.what.trim()) ||
              (currentStep.id === "projects" && draft.projects.every((item) => !item.name.trim() && !item.progress.trim())) ||
              (currentStep.id === "obligations" && draft.obligations.every((item) => !item.trim())) ||
              (currentStep.id === "working" && draft.workingWell.every((item) => !item.trim()) && draft.notWorkingWell.every((item) => !item.trim())) ||
              (currentStep.id === "blockers" && !draft.blockers.what.trim()) ||
              (currentStep.id === "changes" && !draft.changes.what.trim())
            }
          >
            {currentStep.id === "personal" ? (
              <div className="space-y-6">
                <RatingQuestion
                  value={draft.personalSatisfaction.rating}
                  onChange={(rating) =>
                    setDraft((current) => ({
                      ...current,
                      personalSatisfaction: { ...current.personalSatisfaction, rating },
                    }))
                  }
                />
                <TextField
                  label="Why?"
                  value={draft.personalSatisfaction.why}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      personalSatisfaction: { ...current.personalSatisfaction, why: value },
                    }))
                  }
                  placeholder="What is driving that rating?"
                />
              </div>
            ) : null}

            {currentStep.id === "professional" ? (
              <div className="space-y-6">
                <RatingQuestion
                  value={draft.professionalSatisfaction.rating}
                  onChange={(rating) =>
                    setDraft((current) => ({
                      ...current,
                      professionalSatisfaction: { ...current.professionalSatisfaction, rating },
                    }))
                  }
                />
                <TextField
                  label="Why?"
                  value={draft.professionalSatisfaction.why}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      professionalSatisfaction: { ...current.professionalSatisfaction, why: value },
                    }))
                  }
                  placeholder="What is influencing that score?"
                />
              </div>
            ) : null}

            {currentStep.id === "priorities" ? (
              <div className="space-y-4">
                {draft.topPriorities.map((priority, index) => (
                  <TextField
                    key={`priority-${index}`}
                    label={`Priority ${index + 1}`}
                    value={priority}
                    onChange={(value) => updateTopPriority(index, value)}
                    placeholder={`Top priority ${index + 1}`}
                  />
                ))}
              </div>
            ) : null}

            {currentStep.id === "optimization" ? (
              <div className="grid gap-4">
                <TextField
                  label="What are you optimizing for?"
                  value={draft.optimization.what}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      optimization: { ...current.optimization, what: value },
                    }))
                  }
                  placeholder="Example: more energy, deeper focus, less stress"
                />
                <TextField
                  label="Why?"
                  value={draft.optimization.why}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      optimization: { ...current.optimization, why: value },
                    }))
                  }
                  placeholder="Why does this matter right now?"
                />
              </div>
            ) : null}

            {currentStep.id === "projects" ? (
              <div className="space-y-4">
                {draft.projects.map((project, index) => (
                  <div
                    key={project.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-700">
                        Project {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeProject(project.id)}
                        disabled={draft.projects.length === 1}
                        className="text-sm font-medium text-slate-500 transition hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-4">
                      <TextField
                        label="Project name"
                        value={project.name}
                        onChange={(value) => updateProject(project.id, "name", value)}
                        placeholder="Project name"
                      />
                      <TextField
                        label="How is it going?"
                        value={project.progress}
                        onChange={(value) => updateProject(project.id, "progress", value)}
                        placeholder="What is the current status?"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addProject}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-dashed border-slate-300 px-5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
                >
                  Add another project
                </button>
              </div>
            ) : null}

            {currentStep.id === "obligations" ? (
              <div className="space-y-4">
                {draft.obligations.map((obligation, index) => (
                  <TextField
                    key={`obligation-${index}`}
                    label={`Obligation ${index + 1}`}
                    value={obligation}
                    onChange={(value) => updateObligation(index, value)}
                    placeholder={`Non-negotiable obligation ${index + 1}`}
                  />
                ))}
              </div>
            ) : null}

            {currentStep.id === "working" ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <EditableList
                  title="Working well"
                  values={draft.workingWell}
                  onAdd={() => addTextListItem("workingWell")}
                  onRemove={(index) => removeTextListItem("workingWell", index)}
                  onChange={(index, value) => updateTextList("workingWell", index, value)}
                />
                <EditableList
                  title="Not working well"
                  values={draft.notWorkingWell}
                  onAdd={() => addTextListItem("notWorkingWell")}
                  onRemove={(index) => removeTextListItem("notWorkingWell", index)}
                  onChange={(index, value) => updateTextList("notWorkingWell", index, value)}
                />
              </div>
            ) : null}

            {currentStep.id === "blockers" ? (
              <div className="grid gap-4">
                <TextField
                  label="What holds you back?"
                  value={draft.blockers.what}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      blockers: { ...current.blockers, what: value },
                    }))
                  }
                  placeholder="Name the friction point"
                />
                <TextField
                  label="How can you overcome it?"
                  value={draft.blockers.overcome}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      blockers: { ...current.blockers, overcome: value },
                    }))
                  }
                  placeholder="Describe the fix or next step"
                />
                <TextField
                  label="Why does it matter?"
                  value={draft.blockers.why}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      blockers: { ...current.blockers, why: value },
                    }))
                  }
                  placeholder="Explain the importance"
                />
              </div>
            ) : null}

            {currentStep.id === "changes" ? (
              <div className="grid gap-4">
                <TextField
                  label="What do you want to change?"
                  value={draft.changes.what}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      changes: { ...current.changes, what: value },
                    }))
                  }
                  placeholder="Describe the major change"
                />
                <TextField
                  label="Why?"
                  value={draft.changes.why}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      changes: { ...current.changes, why: value },
                    }))
                  }
                  placeholder="Why is this change important to you?"
                />
              </div>
            ) : null}
          </AssessmentCard>
        </div>
      </div>
    </main>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function TextField({ label, value, onChange, placeholder }: TextFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="min-h-20 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
      />
    </label>
  );
}

interface RatingQuestionProps {
  value: AssessmentRating | "";
  onChange: (value: AssessmentRating) => void;
}

function RatingQuestion({ value, onChange }: RatingQuestionProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">Select a rating</p>
      <div className="grid grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((rating) => {
          const isActive = value === rating;

          return (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating as AssessmentRating)}
              className={`flex h-14 items-center justify-center rounded-2xl border text-base font-semibold transition-all duration-200 ${
                isActive
                  ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/15"
                  : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {rating}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface EditableListProps {
  title: string;
  values: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

function EditableList({ title, values, onChange, onAdd, onRemove }: EditableListProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
        >
          Add
        </button>
      </div>
      <div className="space-y-3">
        {values.map((item, index) => (
          <div key={`${title}-${index}`} className="space-y-2">
            <textarea
              value={item}
              onChange={(event) => onChange(index, event.target.value)}
              rows={3}
              placeholder={`${title} ${index + 1}`}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={values.length === 1}
                className="text-xs font-medium text-slate-500 transition hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}