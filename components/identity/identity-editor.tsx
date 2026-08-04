"use client";

import { useEffect, useMemo, useState } from "react";
import { upsertPartFour } from "@/lib/actions/assessment-part-four-actions";
import { type NextStepGoalData, upsertNextStep } from "@/lib/actions/assessment-next-step-actions";
import type { HabitAssessmentPartFour } from "@/types/habit";

interface IdentityEditorProps {
  initialPartFour: HabitAssessmentPartFour | null;
  initialNextStepCompletedAt: string | null;
  initialEntries: NextStepGoalData[];
}

type LastEditedMap = Record<string, string>;

const LAST_EDITED_KEY = "identity-page-last-edited-v1";

function defaultPartFour(): HabitAssessmentPartFour {
  return {
    id: "",
    updatedAt: new Date(0).toISOString(),
    completedAt: null,
    existingCommitments: [],
    desiredCommitments: [],
    unwantedCommitments: [],
    idealMorning: "",
    idealAfternoon: "",
    idealEvening: "",
    cleanSlateReflection: "",
    majorGoals: [],
    vision6Months: "",
    vision2Years: "",
    vision5Years: "",
    majorChanges: [],
    successDefinition: "",
    domainVisions: [],
    identities: [],
    futureReflection: "",
    reflectionGoals: [],
  };
}

function defaultGoalEntry(): NextStepGoalData {
  return {
    goal: "",
    currentSystem: "",
    systemEval: "",
    systemRating: 0,
    idealSystem: "",
    componentHabits: [],
  };
}

function formatDate(value?: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function linesFromList(list: string[]): string {
  return list.join("\n");
}

function SectionHeader({
  title,
  expanded,
  onToggle,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-slate-300"
    >
      <span className="text-sm font-semibold text-slate-900">{title}</span>
      <span className="text-xs font-medium text-slate-500">{expanded ? "Hide" : "Show"}</span>
    </button>
  );
}

function FieldLastEdited({ value }: { value?: string }) {
  if (!value) return null;
  const label = formatDate(value);
  if (!label) return null;
  return <p className="mt-1 text-[11px] text-slate-500">Last edited {label}</p>;
}

export function IdentityEditor({
  initialPartFour,
  initialNextStepCompletedAt,
  initialEntries,
}: IdentityEditorProps) {
  const [partFour, setPartFour] = useState<HabitAssessmentPartFour>(initialPartFour ?? defaultPartFour());
  const [entries, setEntries] = useState<NextStepGoalData[]>(initialEntries.length ? initialEntries : [defaultGoalEntry()]);
  const [nextStepCompletedAt] = useState<string | null>(initialNextStepCompletedAt);
  const [lastEdited, setLastEdited] = useState<LastEditedMap>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    commitments: true,
    ideals: true,
    vision: true,
    identities: true,
    reflection: true,
    existingGoalsHabits: true,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAST_EDITED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LastEditedMap;
        setLastEdited(parsed);
      }
    } catch {
      // ignore malformed local storage
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LAST_EDITED_KEY, JSON.stringify(lastEdited));
  }, [lastEdited]);

  const partFourUpdatedAtLabel = useMemo(() => formatDate(partFour.updatedAt), [partFour.updatedAt]);

  function markEdited(field: string) {
    setLastEdited((prev) => ({ ...prev, [field]: new Date().toISOString() }));
    setSaveMessage(null);
  }

  function toggle(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSaveAll() {
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      await Promise.all([
        upsertPartFour({
          existingCommitments: partFour.existingCommitments,
          desiredCommitments: partFour.desiredCommitments,
          unwantedCommitments: partFour.unwantedCommitments,
          idealMorning: partFour.idealMorning,
          idealAfternoon: partFour.idealAfternoon,
          idealEvening: partFour.idealEvening,
          cleanSlateReflection: partFour.cleanSlateReflection,
          majorGoals: partFour.majorGoals,
          vision6Months: partFour.vision6Months,
          vision2Years: partFour.vision2Years,
          vision5Years: partFour.vision5Years,
          majorChanges: partFour.majorChanges,
          successDefinition: partFour.successDefinition,
          domainVisions: partFour.domainVisions,
          identities: partFour.identities,
          futureReflection: partFour.futureReflection,
          reflectionGoals: partFour.reflectionGoals,
          completedAt: partFour.completedAt,
        }),
        upsertNextStep(entries, nextStepCompletedAt),
      ]);
      setSaveMessage("Saved.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-5 py-8">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Identity</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Identity worksheet</h1>
        {partFourUpdatedAtLabel && <p className="mt-1 text-xs text-slate-500">Part 4 updated {partFourUpdatedAtLabel}</p>}
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-700">Edit values below, then save all changes.</p>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex h-9 items-center rounded-full bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save all"}
          </button>
        </div>
        {saveError && <p className="text-xs text-rose-600">{saveError}</p>}
        {saveMessage && <p className="text-xs text-emerald-600">{saveMessage}</p>}
      </section>

      <section className="space-y-2">
        <SectionHeader title="Commitments" expanded={expanded.commitments} onToggle={() => toggle("commitments")} />
        {expanded.commitments && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-700">Existing commitments</p>
                <textarea
                  value={linesFromList(partFour.existingCommitments)}
                  onChange={(e) => {
                    setPartFour((prev) => ({ ...prev, existingCommitments: parseLines(e.target.value) }));
                    markEdited("part4.existingCommitments");
                  }}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <FieldLastEdited value={lastEdited["part4.existingCommitments"]} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">Desired commitments</p>
                <textarea
                  value={linesFromList(partFour.desiredCommitments)}
                  onChange={(e) => {
                    setPartFour((prev) => ({ ...prev, desiredCommitments: parseLines(e.target.value) }));
                    markEdited("part4.desiredCommitments");
                  }}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <FieldLastEdited value={lastEdited["part4.desiredCommitments"]} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">Unwanted commitments</p>
                <textarea
                  value={linesFromList(partFour.unwantedCommitments)}
                  onChange={(e) => {
                    setPartFour((prev) => ({ ...prev, unwantedCommitments: parseLines(e.target.value) }));
                    markEdited("part4.unwantedCommitments");
                  }}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <FieldLastEdited value={lastEdited["part4.unwantedCommitments"]} />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <SectionHeader title="Ideals" expanded={expanded.ideals} onToggle={() => toggle("ideals")} />
        {expanded.ideals && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-700">Ideal morning</p>
                <textarea
                  value={partFour.idealMorning}
                  onChange={(e) => {
                    setPartFour((prev) => ({ ...prev, idealMorning: e.target.value }));
                    markEdited("part4.idealMorning");
                  }}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <FieldLastEdited value={lastEdited["part4.idealMorning"]} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">Ideal afternoon</p>
                <textarea
                  value={partFour.idealAfternoon}
                  onChange={(e) => {
                    setPartFour((prev) => ({ ...prev, idealAfternoon: e.target.value }));
                    markEdited("part4.idealAfternoon");
                  }}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <FieldLastEdited value={lastEdited["part4.idealAfternoon"]} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">Ideal evening</p>
                <textarea
                  value={partFour.idealEvening}
                  onChange={(e) => {
                    setPartFour((prev) => ({ ...prev, idealEvening: e.target.value }));
                    markEdited("part4.idealEvening");
                  }}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <FieldLastEdited value={lastEdited["part4.idealEvening"]} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">Clean slate</p>
                <textarea
                  value={partFour.cleanSlateReflection}
                  onChange={(e) => {
                    setPartFour((prev) => ({ ...prev, cleanSlateReflection: e.target.value }));
                    markEdited("part4.cleanSlateReflection");
                  }}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <FieldLastEdited value={lastEdited["part4.cleanSlateReflection"]} />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <SectionHeader title="Vision" expanded={expanded.vision} onToggle={() => toggle("vision")} />
        {expanded.vision && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-700">Major goals</p>
                <textarea
                  value={linesFromList(partFour.majorGoals)}
                  onChange={(e) => {
                    setPartFour((prev) => ({ ...prev, majorGoals: parseLines(e.target.value) }));
                    markEdited("part4.majorGoals");
                  }}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <FieldLastEdited value={lastEdited["part4.majorGoals"]} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">6 month vision</p>
                <textarea
                  value={partFour.vision6Months}
                  onChange={(e) => {
                    setPartFour((prev) => ({ ...prev, vision6Months: e.target.value }));
                    markEdited("part4.vision6Months");
                  }}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <FieldLastEdited value={lastEdited["part4.vision6Months"]} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">2 year vision</p>
                <textarea
                  value={partFour.vision2Years}
                  onChange={(e) => {
                    setPartFour((prev) => ({ ...prev, vision2Years: e.target.value }));
                    markEdited("part4.vision2Years");
                  }}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <FieldLastEdited value={lastEdited["part4.vision2Years"]} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">5 year vision</p>
                <textarea
                  value={partFour.vision5Years}
                  onChange={(e) => {
                    setPartFour((prev) => ({ ...prev, vision5Years: e.target.value }));
                    markEdited("part4.vision5Years");
                  }}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <FieldLastEdited value={lastEdited["part4.vision5Years"]} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">Major changes</p>
                <textarea
                  value={linesFromList(partFour.majorChanges)}
                  onChange={(e) => {
                    setPartFour((prev) => ({ ...prev, majorChanges: parseLines(e.target.value) }));
                    markEdited("part4.majorChanges");
                  }}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <FieldLastEdited value={lastEdited["part4.majorChanges"]} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">Success definition</p>
                <textarea
                  value={partFour.successDefinition}
                  onChange={(e) => {
                    setPartFour((prev) => ({ ...prev, successDefinition: e.target.value }));
                    markEdited("part4.successDefinition");
                  }}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <FieldLastEdited value={lastEdited["part4.successDefinition"]} />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">Domain visions</p>
                  <button
                    type="button"
                    onClick={() => {
                      setPartFour((prev) => ({ ...prev, domainVisions: [...prev.domainVisions, { domain: "", vision: "" }] }));
                      markEdited("part4.domainVisions");
                    }}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    + Add domain vision
                  </button>
                </div>
                <div className="space-y-2">
                  {partFour.domainVisions.map((item, idx) => (
                    <div key={`domain-${idx}`} className="rounded-xl border border-slate-200 p-3">
                      <input
                        value={item.domain}
                        onChange={(e) => {
                          setPartFour((prev) => ({
                            ...prev,
                            domainVisions: prev.domainVisions.map((d, i) => (i === idx ? { ...d, domain: e.target.value } : d)),
                          }));
                          markEdited(`part4.domainVisions.${idx}.domain`);
                        }}
                        placeholder="Domain"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                      />
                      <textarea
                        value={item.vision}
                        onChange={(e) => {
                          setPartFour((prev) => ({
                            ...prev,
                            domainVisions: prev.domainVisions.map((d, i) => (i === idx ? { ...d, vision: e.target.value } : d)),
                          }));
                          markEdited(`part4.domainVisions.${idx}.vision`);
                        }}
                        rows={3}
                        placeholder="Vision"
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPartFour((prev) => ({
                            ...prev,
                            domainVisions: prev.domainVisions.filter((_, i) => i !== idx),
                          }));
                          markEdited("part4.domainVisions");
                        }}
                        className="mt-2 text-xs font-medium text-rose-600 hover:text-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <FieldLastEdited value={lastEdited["part4.domainVisions"]} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">Reflection goals</p>
                <textarea
                  value={linesFromList(partFour.reflectionGoals)}
                  onChange={(e) => {
                    setPartFour((prev) => ({ ...prev, reflectionGoals: parseLines(e.target.value) }));
                    markEdited("part4.reflectionGoals");
                  }}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                />
                <FieldLastEdited value={lastEdited["part4.reflectionGoals"]} />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <SectionHeader title="Identities" expanded={expanded.identities} onToggle={() => toggle("identities")} />
        {expanded.identities && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-700">Identity entries</p>
              <button
                type="button"
                onClick={() => {
                  setPartFour((prev) => ({ ...prev, identities: [...prev.identities, { identity: "", habits: [] }] }));
                  markEdited("part4.identities");
                }}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                + Add identity
              </button>
            </div>

            <div className="space-y-3">
              {partFour.identities.map((entry, idx) => (
                <article key={`identity-${idx}`} className="rounded-xl border border-slate-200 p-3">
                  <input
                    value={entry.identity}
                    onChange={(e) => {
                      setPartFour((prev) => ({
                        ...prev,
                        identities: prev.identities.map((item, i) =>
                          i === idx ? { ...item, identity: e.target.value } : item,
                        ),
                      }));
                      markEdited(`part4.identities.${idx}.identity`);
                    }}
                    placeholder="Identity"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                  />
                  <textarea
                    value={linesFromList(entry.habits)}
                    onChange={(e) => {
                      setPartFour((prev) => ({
                        ...prev,
                        identities: prev.identities.map((item, i) =>
                          i === idx ? { ...item, habits: parseLines(e.target.value) } : item,
                        ),
                      }));
                      markEdited(`part4.identities.${idx}.habits`);
                    }}
                    rows={3}
                        placeholder="Supporting goals and habits (one per line)"
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                  />
                  <FieldLastEdited value={lastEdited[`part4.identities.${idx}.identity`] ?? lastEdited[`part4.identities.${idx}.habits`]} />
                  <button
                    type="button"
                    onClick={() => {
                      setPartFour((prev) => ({
                        ...prev,
                        identities: prev.identities.filter((_, i) => i !== idx),
                      }));
                      markEdited("part4.identities");
                    }}
                    className="mt-2 text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    Remove identity
                  </button>
                </article>
              ))}
            </div>
            <FieldLastEdited value={lastEdited["part4.identities"]} />
          </div>
        )}
      </section>

      <section className="space-y-2">
        <SectionHeader title="Reflection" expanded={expanded.reflection} onToggle={() => toggle("reflection")} />
        {expanded.reflection && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-xs font-semibold text-slate-700">Future reflection</p>
              <textarea
                value={partFour.futureReflection}
                onChange={(e) => {
                  setPartFour((prev) => ({ ...prev, futureReflection: e.target.value }));
                  markEdited("part4.futureReflection");
                }}
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
              />
              <FieldLastEdited value={lastEdited["part4.futureReflection"]} />
            </div>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <SectionHeader
          title="Existing Goals/Habits"
          expanded={expanded.existingGoalsHabits}
          onToggle={() => toggle("existingGoalsHabits")}
        />
        {expanded.existingGoalsHabits && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-700">Goal entries</p>
              <button
                type="button"
                onClick={() => {
                  setEntries((prev) => [...prev, defaultGoalEntry()]);
                  markEdited("nextstep.entries");
                }}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                + Add goal entry
              </button>
            </div>

            <div className="space-y-4">
              {entries.map((entry, idx) => (
                <article key={`goal-entry-${idx}`} className="rounded-xl border border-slate-200 p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold text-slate-700">Goal</p>
                      <textarea
                        value={entry.goal}
                        onChange={(e) => {
                          setEntries((prev) => prev.map((item, i) => (i === idx ? { ...item, goal: e.target.value } : item)));
                          markEdited(`nextstep.${idx}.goal`);
                        }}
                        rows={2}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                      />
                      <FieldLastEdited value={lastEdited[`nextstep.${idx}.goal`]} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-700">Current system</p>
                      <textarea
                        value={entry.currentSystem}
                        onChange={(e) => {
                          setEntries((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, currentSystem: e.target.value } : item)),
                          );
                          markEdited(`nextstep.${idx}.currentSystem`);
                        }}
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                      />
                      <FieldLastEdited value={lastEdited[`nextstep.${idx}.currentSystem`]} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-700">System evaluation</p>
                      <textarea
                        value={entry.systemEval}
                        onChange={(e) => {
                          setEntries((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, systemEval: e.target.value } : item)),
                          );
                          markEdited(`nextstep.${idx}.systemEval`);
                        }}
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                      />
                      <FieldLastEdited value={lastEdited[`nextstep.${idx}.systemEval`]} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-700">System rating</p>
                      <input
                        type="number"
                        min={0}
                        max={5}
                        value={entry.systemRating}
                        onChange={(e) => {
                          const parsed = Number(e.target.value);
                          const value = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(5, parsed));
                          setEntries((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, systemRating: value } : item)),
                          );
                          markEdited(`nextstep.${idx}.systemRating`);
                        }}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                      />
                      <FieldLastEdited value={lastEdited[`nextstep.${idx}.systemRating`]} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-700">Ideal system</p>
                      <textarea
                        value={entry.idealSystem}
                        onChange={(e) => {
                          setEntries((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, idealSystem: e.target.value } : item)),
                          );
                          markEdited(`nextstep.${idx}.idealSystem`);
                        }}
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                      />
                      <FieldLastEdited value={lastEdited[`nextstep.${idx}.idealSystem`]} />
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold text-slate-700">Component habits</p>
                      <textarea
                        value={linesFromList(entry.componentHabits)}
                        onChange={(e) => {
                          setEntries((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, componentHabits: parseLines(e.target.value) } : item,
                            ),
                          );
                          markEdited(`nextstep.${idx}.componentHabits`);
                        }}
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                      />
                      <FieldLastEdited value={lastEdited[`nextstep.${idx}.componentHabits`]} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEntries((prev) => prev.filter((_, i) => i !== idx));
                      markEdited("nextstep.entries");
                    }}
                    className="mt-3 text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    Remove goal entry
                  </button>
                </article>
              ))}
            </div>
            <FieldLastEdited value={lastEdited["nextstep.entries"]} />
          </div>
        )}
      </section>
    </div>
  );
}
