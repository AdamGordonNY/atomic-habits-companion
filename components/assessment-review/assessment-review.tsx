"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type {
  HabitAssessmentPartThree,
  HabitAssessmentPartTwo,
  HabitInventoryScorecard,
  HabitRecord,
  HabitAttempt,
} from "@/types/habit";
import {
  analyzePartTwoEnergy,
  analyzeDaysEnergy,
  analyzeActivities,
} from "@/lib/energy-analysis";

// ─── local types mirroring assessment-form draft ─────────────────────────────

interface ProjectEntry {
  id: string;
  name: string;
  progress: string;
}

interface AssessmentDraft {
  personalSatisfaction: { rating: number | ""; why: string };
  professionalSatisfaction: { rating: number | ""; why: string };
  topPriorities: string[];
  optimization: { what: string; why: string };
  projects: ProjectEntry[];
  obligations: string[];
  workingWell: string[];
  notWorkingWell: string[];
  blockers: { what: string; overcome: string; why: string };
  changes: { what: string; why: string };
}

interface StoredPartOne {
  version?: number;
  draft?: AssessmentDraft;
  completedAt?: string | null;
}

interface StoredPartTwo {
  version?: number;
  draft?: HabitAssessmentPartTwo;
  dayIndex?: number;
  completedAt?: string | null;
}

interface StoredPartThree {
  version?: number;
  draft?: HabitAssessmentPartThree;
  stepIndex?: number;
  completedAt?: string | null;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function isEmpty(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === "string") return val.trim() === "";
  if (Array.isArray(val)) return val.every((v) => isEmpty(v));
  return false;
}

// ─── primitive display blocks ─────────────────────────────────────────────────

function Empty() {
  return (
    <span className="text-sm italic text-slate-400">Not answered</span>
  );
}

function Prose({ text }: { text: string }) {
  if (!text.trim()) return <Empty />;
  return (
    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{text}</p>
  );
}

function Tags({ items }: { items: string[] }) {
  const filled = items.filter((s) => s.trim());
  if (!filled.length) return <Empty />;
  return (
    <div className="flex flex-wrap gap-2">
      {filled.map((item, i) => (
        <span
          key={i}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function RatingDots({ rating }: { rating: number | "" }) {
  if (rating === "") return <Empty />;
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className={`h-3 w-3 rounded-full transition-colors ${
            n <= (rating as number) ? "bg-slate-950" : "bg-slate-200"
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-semibold text-slate-950">
        {rating} / 5
      </span>
    </div>
  );
}

// ─── layout blocks ────────────────────────────────────────────────────────────

function ReviewSection({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-100" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          {label}
        </span>
        <span className="h-px flex-1 bg-slate-100" />
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function QCard({
  question,
  children,
  editHref,
}: {
  question: string;
  children: React.ReactNode;
  editHref?: string;
}) {
  return (
    <div className="group relative rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {question}
        </p>
        {editHref && (
          <Link
            href={editHref}
            className="flex-shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-500 opacity-0 transition hover:border-slate-300 hover:text-slate-700 group-hover:opacity-100"
          >
            Edit
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function TwoColCard({
  question,
  pairs,
  editHref,
}: {
  question: string;
  pairs: { label: string; value: React.ReactNode }[];
  editHref?: string;
}) {
  return (
    <QCard question={question} editHref={editHref}>
      <div className="flex flex-col gap-4">
        {pairs.map((p, i) => (
          <div key={i}>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {p.label}
            </p>
            {p.value}
          </div>
        ))}
      </div>
    </QCard>
  );
}

// ─── scorecard display ────────────────────────────────────────────────────────

function ScorecardView({
  label,
  sc,
  editHref,
}: {
  label: string;
  sc: HabitInventoryScorecard;
  editHref?: string;
}) {
  const hasEntries = sc.entries.some((e) => e.habit.trim());
  const addFilled = sc.wantToAdd.filter((s) => s.trim());
  const removeFilled = sc.wantToRemove.filter((s) => s.trim());

  return (
    <div className="flex flex-col gap-3">
      {/* entry table */}
      <QCard question={`${label} scorecard`} editHref={editHref}>
        {!hasEntries ? (
          <Empty />
        ) : (
          <div className="flex flex-col gap-2">
            {sc.entries
              .filter((e) => e.habit.trim())
              .map((e, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      e.score === "+"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {e.score}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{e.habit}</p>
                    {e.reasoning.trim() && (
                      <p className="mt-0.5 text-xs text-slate-500">{e.reasoning}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </QCard>

      {/* takeaway */}
      <QCard question={`${label} takeaway`} editHref={editHref}>
        <Prose text={sc.takeaway} />
      </QCard>

      {/* redesign */}
      {(addFilled.length > 0 || removeFilled.length > 0) && (
        <QCard question={`${label} redesign`} editHref={editHref}>
          <div className="flex flex-col gap-4">
            {addFilled.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-emerald-700">Wants to add</p>
                <Tags items={addFilled} />
              </div>
            )}
            {removeFilled.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-rose-600">Wants to remove</p>
                <Tags items={removeFilled} />
              </div>
            )}
          </div>
        </QCard>
      )}
    </div>
  );
}

// ─── Part One view ────────────────────────────────────────────────────────────

function PartOneView({
  data,
  assessmentId,
}: {
  data: StoredPartOne;
  assessmentId: string;
}) {
  const d = data.draft;
  const editBase = `/habit-assessment/${assessmentId}`;

  if (!d) return <p className="text-sm text-slate-400">No Part One data found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <ReviewSection id="p1-satisfaction" label="Satisfaction">
        <TwoColCard
          question="Personal life satisfaction"
          editHref={editBase}
          pairs={[
            { label: "Rating", value: <RatingDots rating={d.personalSatisfaction.rating} /> },
            { label: "Why", value: <Prose text={d.personalSatisfaction.why} /> },
          ]}
        />
        <TwoColCard
          question="Professional life satisfaction"
          editHref={editBase}
          pairs={[
            { label: "Rating", value: <RatingDots rating={d.professionalSatisfaction.rating} /> },
            { label: "Why", value: <Prose text={d.professionalSatisfaction.why} /> },
          ]}
        />
      </ReviewSection>

      <ReviewSection id="p1-priorities" label="Focus">
        <QCard question="Top 3 priorities right now" editHref={editBase}>
          <Tags items={d.topPriorities} />
        </QCard>
        <TwoColCard
          question="Optimizing for"
          editHref={editBase}
          pairs={[
            { label: "What", value: <Prose text={d.optimization.what} /> },
            { label: "Why", value: <Prose text={d.optimization.why} /> },
          ]}
        />
      </ReviewSection>

      <ReviewSection id="p1-projects" label="Projects & Obligations">
        <QCard question="Major projects" editHref={editBase}>
          {d.projects.filter((p) => p.name.trim()).length === 0 ? (
            <Empty />
          ) : (
            <div className="flex flex-col gap-3">
              {d.projects
                .filter((p) => p.name.trim())
                .map((p, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    {p.progress.trim() && (
                      <p className="mt-0.5 text-xs text-slate-500">{p.progress}</p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </QCard>
        <QCard question="Non-negotiable obligations" editHref={editBase}>
          <Tags items={d.obligations} />
        </QCard>
      </ReviewSection>

      <ReviewSection id="p1-reflection" label="Reflection">
        <TwoColCard
          question="What's working and what's not"
          editHref={editBase}
          pairs={[
            { label: "Working well", value: <Tags items={d.workingWell} /> },
            { label: "Not working well", value: <Tags items={d.notWorkingWell} /> },
          ]}
        />
        <TwoColCard
          question="What holds you back"
          editHref={editBase}
          pairs={[
            { label: "The blocker", value: <Prose text={d.blockers.what} /> },
            { label: "How to overcome it", value: <Prose text={d.blockers.overcome} /> },
            { label: "Why it matters", value: <Prose text={d.blockers.why} /> },
          ]}
        />
        <TwoColCard
          question="Major changes wanted"
          editHref={editBase}
          pairs={[
            { label: "What", value: <Prose text={d.changes.what} /> },
            { label: "Why", value: <Prose text={d.changes.why} /> },
          ]}
        />
      </ReviewSection>
    </div>
  );
}

// ─── Activity patterns panel ──────────────────────────────────────────────────

function ActivityPatternsPanel({ days }: { days: HabitAssessmentPartTwo["days"] }) {
  const activities = analyzeActivities(days, 15);

  if (activities.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-6 text-center text-sm text-slate-400">
        Log activities in the 7-day tracker to see your patterns.
      </div>
    );
  }

  const maxCount = activities[0].count;

  return (
    <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-50">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Most frequent activities
        </p>
        <p className="text-[10px] text-slate-400">{activities.length} unique</p>
      </div>
      <div className="divide-y divide-slate-50">
        {activities.map((a) => {
          const barPct = (a.count / maxCount) * 100;
          const energyColor =
            a.dominantEnergy === "UP"
              ? "text-emerald-600 bg-emerald-50 border-emerald-100"
              : a.dominantEnergy === "DOWN"
              ? "text-rose-600 bg-rose-50 border-rose-100"
              : "text-slate-500 bg-slate-50 border-slate-100";
          const energyLabel =
            a.dominantEnergy === "UP" ? "↑" : a.dominantEnergy === "DOWN" ? "↓" : "–";

          return (
            <div key={a.activity} className="flex items-center gap-3 px-5 py-3">
              {/* frequency bar + activity name */}
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-800">
                    {a.activity}
                  </span>
                  <span
                    className={`flex-shrink-0 rounded-full border px-1.5 py-px text-[10px] font-bold ${energyColor}`}
                  >
                    {energyLabel}
                  </span>
                </div>
                <div className="relative h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                      a.dominantEnergy === "UP"
                        ? "bg-emerald-400"
                        : a.dominantEnergy === "DOWN"
                        ? "bg-rose-400"
                        : "bg-slate-300"
                    }`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>

              {/* count + top hours */}
              <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                <span className="text-xs font-semibold tabular-nums text-slate-700">
                  ×{a.count}
                </span>
                <span className="text-[10px] text-slate-400">
                  {a.topHours.slice(0, 2).join(", ")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Energy insights panel ────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const pct = Math.abs(score) * 100;
  const positive = score >= 0;
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${positive ? "bg-emerald-500" : "bg-rose-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-10 text-right text-[11px] font-semibold tabular-nums ${positive ? "text-emerald-600" : "text-rose-600"}`}>
        {score > 0 ? "+" : ""}{Math.round(score * 100)}%
      </span>
    </div>
  );
}

function EnergyInsightsPanel({ days }: { days: HabitAssessmentPartTwo["days"] }) {
  const analysis = analyzePartTwoEnergy(days);
  const dayStats = analyzeDaysEnergy(days);

  const hasData = analysis.hourStats.length > 0;

  if (!hasData) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-6 text-center text-sm text-slate-400">
        Log activities in the 7-day tracker to see your energy patterns.
      </div>
    );
  }

  const topHigh = analysis.highEnergyRanking.slice(0, 5);
  const topLow = analysis.lowEnergyRanking.slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      {/* Hour rankings */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Highest energy hours */}
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Highest energy hours
          </p>
          <div className="flex flex-col gap-2.5">
            {topHigh.map((h) => (
              <div key={h.hour} className="flex items-center gap-3">
                <span className="w-[4.5rem] flex-shrink-0 text-[11px] font-semibold text-slate-700">
                  {h.hour}
                </span>
                <ScoreBar score={h.energyScore} />
                {h.topActivities[0] && (
                  <span className="truncate text-[11px] text-slate-400">{h.topActivities[0]}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Lowest energy hours */}
        <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-700">
            Lowest energy hours
          </p>
          <div className="flex flex-col gap-2.5">
            {topLow.map((h) => (
              <div key={h.hour} className="flex items-center gap-3">
                <span className="w-[4.5rem] flex-shrink-0 text-[11px] font-semibold text-slate-700">
                  {h.hour}
                </span>
                <ScoreBar score={h.energyScore} />
                {h.topActivities[0] && (
                  <span className="truncate text-[11px] text-slate-400">{h.topActivities[0]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day breakdown */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Energy by day
        </p>
        <div className="flex flex-col gap-2.5">
          {dayStats.map((d) => {
            const hasEntries = d.totalLogged > 0;
            return (
              <div key={d.date} className="flex items-center gap-3">
                <span className="w-14 flex-shrink-0 text-[11px] font-semibold text-slate-600">
                  Day {d.dayNumber}
                </span>
                <span className="w-24 flex-shrink-0 text-[11px] text-slate-400">
                  {d.date
                    ? new Date(d.date + "T00:00:00").toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </span>
                {hasEntries ? (
                  <>
                    {/* stacked UP / NEUTRAL / DOWN bar */}
                    <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="bg-emerald-500 transition-all"
                        style={{ width: `${d.upRate * 100}%` }}
                      />
                      <div
                        className="bg-slate-300 transition-all"
                        style={{ width: `${(d.neutralCount / d.totalLogged) * 100}%` }}
                      />
                      <div
                        className="bg-rose-500 transition-all"
                        style={{ width: `${d.downRate * 100}%` }}
                      />
                    </div>
                    <span
                      className={`w-10 text-right text-[11px] font-semibold tabular-nums ${
                        d.energyScore > 0
                          ? "text-emerald-600"
                          : d.energyScore < 0
                          ? "text-rose-600"
                          : "text-slate-400"
                      }`}
                    >
                      {d.energyScore > 0 ? "+" : ""}
                      {Math.round(d.energyScore * 100)}%
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] italic text-slate-300">No entries</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Part Two view ────────────────────────────────────────────────────────────

function PartTwoView({
  data,
  assessmentId,
}: {
  data: StoredPartTwo;
  assessmentId: string;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const editBase = `/habit-assessment/${assessmentId}/part-two`;

  if (!data.draft?.days?.length)
    return <p className="text-sm text-slate-400">No Part Two data found.</p>;

  return (
    <div className="flex flex-col gap-4">
      <ReviewSection id="p2-insights" label="Energy Patterns">
        <EnergyInsightsPanel days={data.draft.days} />
      </ReviewSection>

      <ReviewSection id="p2-activities" label="Activity Patterns">
        <ActivityPatternsPanel days={data.draft.days} />
      </ReviewSection>

      <ReviewSection id="p2-days" label="7-Day Energy Log">
        {data.draft.days.map((day, di) => {
          const filled = day.entries.filter((e) => e.activity.trim());
          const upCount = filled.filter((e) => e.energyLevel === "UP").length;
          const downCount = filled.filter((e) => e.energyLevel === "DOWN").length;
          const neutralCount = filled.filter((e) => e.energyLevel === "NEUTRAL").length;
          const isExpanded = expanded === di;

          return (
            <div
              key={di}
              className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
            >
              {/* day header — always visible */}
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : di)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl text-xs font-bold ${
                      filled.length > 0
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {di + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(day.date)}
                    </p>
                    {filled.length > 0 ? (
                      <p className="text-xs text-slate-500">
                        {filled.length} hours logged · {upCount}↑ {neutralCount > 0 ? `${neutralCount}– ` : ""}{downCount}↓
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">No entries</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`${editBase}?day=${di}`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  >
                    Edit
                  </Link>
                  <svg
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* expanded hour list */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-5 pb-5 pt-3">
                  {filled.length === 0 ? (
                    <p className="text-sm italic text-slate-400">No entries for this day.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {day.entries
                        .filter((e) => e.activity.trim())
                        .map((e, hi) => (
                          <div
                            key={hi}
                            className="flex items-center gap-3 rounded-xl px-3 py-2 even:bg-slate-50"
                          >
                            <span className="w-16 flex-shrink-0 text-[11px] font-medium text-slate-400">
                              {e.hour}
                            </span>
                            <span className="flex-1 text-sm text-slate-800">
                              {e.activity}
                            </span>
                            <span
                              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                e.energyLevel === "UP"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : e.energyLevel === "DOWN"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {e.energyLevel === "UP" ? "↑" : e.energyLevel === "DOWN" ? "↓" : "–"}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </ReviewSection>
    </div>
  );
}

// ─── Part Three view ──────────────────────────────────────────────────────────

function PartThreeView({
  data,
  assessmentId,
}: {
  data: StoredPartThree;
  assessmentId: string;
}) {
  const d = data.draft;
  const editBase = `/habit-assessment/${assessmentId}/part-three`;

  if (!d) return <p className="text-sm text-slate-400">No Part Three data found.</p>;

  return (
    <div className="flex flex-col gap-6">
      {/* Section 1 */}
      <ReviewSection id="p3-energy" label="Time & Energy Mapping">
        <QCard question="Major ways time is currently spent" editHref={editBase}>
          <Tags items={d.majorTimeSpends} />
        </QCard>

        <TwoColCard
          question="High-energy hours"
          editHref={editBase}
          pairs={[
            {
              label: "Hours per day",
              value:
                d.highEnergyHoursPerDay !== null ? (
                  <span className="text-sm font-semibold text-slate-900">
                    {d.highEnergyHoursPerDay} hrs
                  </span>
                ) : (
                  <Empty />
                ),
            },
            { label: "Which hours", value: <Tags items={d.highEnergyHoursList} /> },
          ]}
        />

        <QCard question="What currently gets high-energy hours" editHref={editBase}>
          <Prose text={d.highEnergyActivities} />
        </QCard>

        <QCard question="Low-energy hours" editHref={editBase}>
          <Tags items={d.lowEnergyHours} />
        </QCard>

        <TwoColCard
          question="How I want to spend my hours"
          editHref={editBase}
          pairs={[
            {
              label: "High-energy hours",
              value: <Tags items={d.wantHighEnergySpend} />,
            },
            {
              label: "Low-energy hours",
              value: <Tags items={d.wantLowEnergySpend} />,
            },
          ]}
        />
      </ReviewSection>

      {/* Section 2 */}
      <ReviewSection id="p3-bigpicture" label="Big Picture">
        <QCard question="Feels like it consumes more time than it should" editHref={editBase}>
          <Prose text={d.timeSinksReflection} />
        </QCard>
        <QCard question="Current source of most stress or energy drain" editHref={editBase}>
          <Prose text={d.stressSource} />
        </QCard>
        <QCard question="Significant changes anticipated" editHref={editBase}>
          <Prose text={d.anticipatedChanges} />
        </QCard>
      </ReviewSection>

      {/* Section 3 */}
      <ReviewSection id="p3-history" label="Past Habit History">
        <QCard question="Beneficial habits" editHref={editBase}>
          <HabitRecordList items={d.beneficialHabits} />
        </QCard>
        <QCard question="Most successful habits and why they stuck" editHref={editBase}>
          <HabitRecordList items={d.successfulHabits} />
        </QCard>
        <QCard question="Patterns that made habits sticky" editHref={editBase}>
          <Prose text={d.stickinessPatterns} />
        </QCard>
      </ReviewSection>

      {/* Section 4 */}
      <ReviewSection id="p3-attempts" label="Building & Breaking">
        <QCard question="Past habit attempts" editHref={editBase}>
          <HabitAttemptList items={d.habitAttempts} />
        </QCard>
      </ReviewSection>

      {/* Section 5 */}
      <ReviewSection id="p3-inventory" label="Habit Inventory">
        <ScorecardView
          label="Morning"
          sc={d.morningScorecard}
          editHref={editBase}
        />
        <ScorecardView
          label="Afternoon"
          sc={d.afternoonScorecard}
          editHref={editBase}
        />
        <ScorecardView
          label="Evening"
          sc={d.eveningScorecard}
          editHref={editBase}
        />
      </ReviewSection>

      {/* Section 6 */}
      <ReviewSection id="p3-reflection" label="Final Reflection">
        <QCard question="Reflect on all data" editHref={editBase}>
          <Prose text={d.finalReflection} />
        </QCard>
      </ReviewSection>

      {/* Section 7 */}
      <ReviewSection id="p3-wrapup" label="Part 1 Wrap-Up">
        <QCard question="Looking back — what do you understand now that you didn't before?" editHref={editBase}>
          <Prose text={d.part1WrapUpReflection} />
        </QCard>
      </ReviewSection>
    </div>
  );
}

// ─── sub‑components used by Part Three view ───────────────────────────────────

function HabitRecordList({ items }: { items: HabitRecord[] }) {
  const filled = items.filter((r) => r.habit.trim());
  if (!filled.length) return <Empty />;
  return (
    <div className="flex flex-col gap-3">
      {filled.map((r, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
        >
          <p className="text-sm font-semibold text-slate-900">{r.habit}</p>
          {r.explanation.trim() && (
            <p className="mt-1 text-xs leading-5 text-slate-500">{r.explanation}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function HabitAttemptList({ items }: { items: HabitAttempt[] }) {
  const filled = items.filter((a) => a.habit.trim());
  if (!filled.length) return <Empty />;
  return (
    <div className="flex flex-col gap-3">
      {filled.map((a, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{a.habit}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                a.mode === "building"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {a.mode}
            </span>
          </div>
          {a.whatDidntWork.trim() && (
            <div className="mt-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                What didn&apos;t work
              </p>
              <p className="text-xs text-slate-600">{a.whatDidntWork}</p>
            </div>
          )}
          {a.obstacle.trim() && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Obstacle
              </p>
              <p className="text-xs text-slate-600">{a.obstacle}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── root component ───────────────────────────────────────────────────────────

const PART_TABS = [
  { key: "p1", label: "Part 1", sublabel: "Baseline" },
  { key: "p2", label: "Part 2", sublabel: "Energy Log" },
  { key: "p3", label: "Part 3", sublabel: "Deep-Dive" },
] as const;

type PartKey = (typeof PART_TABS)[number]["key"];

export function AssessmentReview({ assessmentId }: { assessmentId: string }) {
  const [partOne, setPartOne] = useState<StoredPartOne | null>(null);
  const [partTwo, setPartTwo] = useState<StoredPartTwo | null>(null);
  const [partThree, setPartThree] = useState<StoredPartThree | null>(null);
  const [activeTab, setActiveTab] = useState<PartKey>("p1");
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const tabStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPartOne(readJson<StoredPartOne>(`habit-assessment:${assessmentId}`));
    setPartTwo(readJson<StoredPartTwo>(`habit-assessment:${assessmentId}:part-two`));
    setPartThree(readJson<StoredPartThree>(`habit-assessment:${assessmentId}:part-three`));
    setMounted(true);
    const f = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(f);
  }, [assessmentId]);

  function completionLabel(completed: string | null | undefined) {
    if (!completed) return null;
    return (
      <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white">
        ✓
      </span>
    );
  }

  return (
    <div
      className={`flex min-h-screen flex-col transition-all duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      {/* sticky header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              Assessment Review
            </p>
            <h1 className="text-base font-semibold text-slate-950">Your answers</h1>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            ← Dashboard
          </Link>
        </div>

        {/* tab strip */}
        <div
          ref={tabStripRef}
          className="scrollbar-none flex gap-1 overflow-x-auto px-4 pb-3"
        >
          {PART_TABS.map((tab) => {
            const completed =
              tab.key === "p1"
                ? partOne?.completedAt
                : tab.key === "p2"
                  ? partTwo?.completedAt
                  : partThree?.completedAt;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] font-normal ${isActive ? "text-slate-400" : "text-slate-400"}`}
                >
                  · {tab.sublabel}
                </span>
                {mounted && completionLabel(completed)}
              </button>
            );
          })}
        </div>
      </header>

      {/* content */}
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          {!mounted ? (
            <SkeletonReview />
          ) : (
            <>
              {activeTab === "p1" && (
                <PartOneView
                  data={partOne ?? {}}
                  assessmentId={assessmentId}
                />
              )}
              {activeTab === "p2" && (
                <PartTwoView
                  data={partTwo ?? {}}
                  assessmentId={assessmentId}
                />
              )}
              {activeTab === "p3" && (
                <PartThreeView
                  data={partThree ?? {}}
                  assessmentId={assessmentId}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function SkeletonReview() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-3 h-3 w-1/3 rounded-full bg-slate-100" />
          <div className="h-4 w-2/3 rounded-full bg-slate-100" />
          <div className="mt-3 h-4 w-1/2 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
