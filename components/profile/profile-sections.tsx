"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  actionDeleteTrackedHabit,
  actionUpdateGoalHabit,
  actionUpsertTrackedHabit,
  type TrackedHabitData,
} from "@/lib/actions/habit-actions";
import { type NextStepGoalData, upsertNextStep } from "@/lib/actions/next-step-actions";
import { upsertPartFour } from "@/lib/actions/part-four-actions";
import {
  PROFILE_SECTION_LABELS,
  PROFILE_SECTION_ROUTES,
  type ProfileSectionKey,
} from "@/lib/profile-settings";
import type {
  CommitmentsData,
  GoalsData,
  HabitsData,
  IdentitiesData,
  IdealsData,
  VisionData,
} from "@/lib/profile-data";

function formatDate(value?: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function listToLines(items: string[]): string {
  return items.join("\n");
}

function sectionMeta(updatedAt?: string | null, completedAt?: string | null): string {
  const updated = formatDate(updatedAt);
  const completed = formatDate(completedAt);
  if (updated && completed) return `Updated ${updated} · completed ${completed}`;
  if (updated) return `Updated ${updated}`;
  if (completed) return `Completed ${completed}`;
  return "";
}

function SectionCard({
  sectionKey,
  updatedAt,
  completedAt,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  saving,
  showRouteLink = true,
  children,
}: {
  sectionKey: ProfileSectionKey;
  updatedAt?: string | null;
  completedAt?: string | null;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
  showRouteLink?: boolean;
  children: React.ReactNode;
}) {
  const meta = sectionMeta(updatedAt, completedAt);

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="bg-slate-950 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Profile</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{PROFILE_SECTION_LABELS[sectionKey]}</h2>
            {meta && <p className="mt-1 text-[11px] text-slate-400">{meta}</p>}
          </div>
          <div className="flex items-center gap-2">
            {showRouteLink && (
              <Link
                href={PROFILE_SECTION_ROUTES[sectionKey]}
                className="inline-flex h-8 items-center rounded-full border border-slate-700 px-3 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
              >
                Open page
              </Link>
            )}
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex h-8 items-center rounded-full border border-slate-700 px-3 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="inline-flex h-8 items-center rounded-full bg-white px-3 text-xs font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-8 items-center rounded-full bg-white px-3 text-xs font-semibold text-slate-900 hover:bg-slate-100"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-slate-500">{message}</p>;
}

function TagColumnView({
  label,
  items,
  emptyText = "No entries.",
}: {
  label: string;
  items: string[];
  emptyText?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{label}</p>
      {items.length > 0 ? (
        <div className="mt-2 space-y-2">
          {items.map((item, index) => (
            <div
              key={`${label}-tag-${index}`}
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              {item}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}

function TagColumnEditor({
  label,
  items,
  onChange,
  addLabel,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{label}</p>
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          {addLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No entries yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={`${label}-editor-${index}`}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1"
            >
              <input
                value={item}
                onChange={(e) =>
                  onChange(items.map((entry, entryIndex) => (entryIndex === index ? e.target.value : entry)))
                }
                placeholder={placeholder}
                className="h-8 flex-1 bg-transparent px-2 text-sm text-slate-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, entryIndex) => entryIndex !== index))}
                className="inline-flex h-7 items-center rounded-full border border-rose-200 px-2 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommitmentsSection({ data, showRouteLink = true }: { data: CommitmentsData | null; showRouteLink?: boolean }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(() => ({
    existingCommitments: data?.existingCommitments ?? [],
    desiredCommitments: data?.desiredCommitments ?? [],
    unwantedCommitments: data?.unwantedCommitments ?? [],
  }));

  async function handleSave() {
    setSaving(true);
    try {
      await upsertPartFour({ ...draft, completedAt: data?.completedAt ?? null });
      setIsEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      sectionKey="commitments"
      updatedAt={data?.updatedAt}
      completedAt={data?.completedAt}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onCancel={() => {
        setDraft({
          existingCommitments: data?.existingCommitments ?? [],
          desiredCommitments: data?.desiredCommitments ?? [],
          unwantedCommitments: data?.unwantedCommitments ?? [],
        });
        setIsEditing(false);
      }}
      onSave={handleSave}
      saving={saving}
      showRouteLink={showRouteLink}
    >
      {isEditing ? (
        <div className="space-y-4">
          <TagColumnEditor
            label="Existing commitments"
            items={draft.existingCommitments}
            onChange={(existingCommitments) => setDraft((prev) => ({ ...prev, existingCommitments }))}
            addLabel="+ Add existing"
            placeholder="Existing commitment"
          />
          <TagColumnEditor
            label="Desired commitments"
            items={draft.desiredCommitments}
            onChange={(desiredCommitments) => setDraft((prev) => ({ ...prev, desiredCommitments }))}
            addLabel="+ Add desired"
            placeholder="Desired commitment"
          />
          <TagColumnEditor
            label="Unwanted commitments"
            items={draft.unwantedCommitments}
            onChange={(unwantedCommitments) => setDraft((prev) => ({ ...prev, unwantedCommitments }))}
            addLabel="+ Add unwanted"
            placeholder="Unwanted commitment"
          />
        </div>
      ) : !data ? (
        <EmptyState message="No commitments data yet." />
      ) : (
        <div className="space-y-4">
          <TagColumnView label="Existing commitments" items={data.existingCommitments} />
          <TagColumnView label="Desired commitments" items={data.desiredCommitments} />
          <TagColumnView label="Unwanted commitments" items={data.unwantedCommitments} />
        </div>
      )}
    </SectionCard>
  );
}

export function IdealsSection({ data, showRouteLink = true }: { data: IdealsData | null; showRouteLink?: boolean }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(() => ({
    idealMorning: data?.idealMorning ?? "",
    idealAfternoon: data?.idealAfternoon ?? "",
    idealEvening: data?.idealEvening ?? "",
    cleanSlateReflection: data?.cleanSlateReflection ?? "",
  }));

  async function handleSave() {
    setSaving(true);
    try {
      await upsertPartFour({ ...draft, completedAt: data?.completedAt ?? null });
      setIsEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      sectionKey="ideals"
      updatedAt={data?.updatedAt}
      completedAt={data?.completedAt}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onCancel={() => {
        setDraft({
          idealMorning: data?.idealMorning ?? "",
          idealAfternoon: data?.idealAfternoon ?? "",
          idealEvening: data?.idealEvening ?? "",
          cleanSlateReflection: data?.cleanSlateReflection ?? "",
        });
        setIsEditing(false);
      }}
      onSave={handleSave}
      saving={saving}
      showRouteLink={showRouteLink}
    >
      {!data ? (
        <EmptyState message="No ideals data yet." />
      ) : isEditing ? (
        <div className="space-y-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Ideal morning</p><textarea value={draft.idealMorning} onChange={(e) => setDraft((prev) => ({ ...prev, idealMorning: e.target.value }))} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Ideal afternoon</p><textarea value={draft.idealAfternoon} onChange={(e) => setDraft((prev) => ({ ...prev, idealAfternoon: e.target.value }))} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Ideal evening</p><textarea value={draft.idealEvening} onChange={(e) => setDraft((prev) => ({ ...prev, idealEvening: e.target.value }))} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Clean slate</p><textarea value={draft.cleanSlateReflection} onChange={(e) => setDraft((prev) => ({ ...prev, cleanSlateReflection: e.target.value }))} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" /></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Ideal morning</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{data.idealMorning || "No answer yet."}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Ideal afternoon</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{data.idealAfternoon || "No answer yet."}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Ideal evening</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{data.idealEvening || "No answer yet."}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Clean slate</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{data.cleanSlateReflection || "No answer yet."}</p></div>
        </div>
      )}
    </SectionCard>
  );
}

export function VisionSection({ data, showRouteLink = true }: { data: VisionData | null; showRouteLink?: boolean }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(() => ({
    majorGoals: data?.majorGoals ?? [],
    vision6Months: data?.vision6Months ?? "",
    vision2Years: data?.vision2Years ?? "",
    vision5Years: data?.vision5Years ?? "",
    majorChanges: data?.majorChanges ?? [],
    successDefinition: data?.successDefinition ?? "",
    domainVisions: data?.domainVisions ?? [],
    futureReflection: data?.futureReflection ?? "",
    reflectionGoals: data?.reflectionGoals ?? [],
  }));

  async function handleSave() {
    setSaving(true);
    try {
      await upsertPartFour({ ...draft, completedAt: data?.completedAt ?? null });
      setIsEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      sectionKey="vision"
      updatedAt={data?.updatedAt}
      completedAt={data?.completedAt}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onCancel={() => {
        setDraft({
          majorGoals: data?.majorGoals ?? [],
          vision6Months: data?.vision6Months ?? "",
          vision2Years: data?.vision2Years ?? "",
          vision5Years: data?.vision5Years ?? "",
          majorChanges: data?.majorChanges ?? [],
          successDefinition: data?.successDefinition ?? "",
          domainVisions: data?.domainVisions ?? [],
          futureReflection: data?.futureReflection ?? "",
          reflectionGoals: data?.reflectionGoals ?? [],
        });
        setIsEditing(false);
      }}
      onSave={handleSave}
      saving={saving}
      showRouteLink={showRouteLink}
    >
      {!data ? (
        <EmptyState message="No vision data yet." />
      ) : isEditing ? (
        <div className="space-y-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Major goals</p><textarea value={listToLines(draft.majorGoals)} onChange={(e) => setDraft((prev) => ({ ...prev, majorGoals: parseLines(e.target.value) }))} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">6 month vision</p><textarea value={draft.vision6Months} onChange={(e) => setDraft((prev) => ({ ...prev, vision6Months: e.target.value }))} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">2 year vision</p><textarea value={draft.vision2Years} onChange={(e) => setDraft((prev) => ({ ...prev, vision2Years: e.target.value }))} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">5 year vision</p><textarea value={draft.vision5Years} onChange={(e) => setDraft((prev) => ({ ...prev, vision5Years: e.target.value }))} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Major changes</p><textarea value={listToLines(draft.majorChanges)} onChange={(e) => setDraft((prev) => ({ ...prev, majorChanges: parseLines(e.target.value) }))} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Success definition</p><textarea value={draft.successDefinition} onChange={(e) => setDraft((prev) => ({ ...prev, successDefinition: e.target.value }))} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Future reflection</p><textarea value={draft.futureReflection} onChange={(e) => setDraft((prev) => ({ ...prev, futureReflection: e.target.value }))} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Reflection goals</p><textarea value={listToLines(draft.reflectionGoals)} onChange={(e) => setDraft((prev) => ({ ...prev, reflectionGoals: parseLines(e.target.value) }))} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" /></div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Domain visions</p>
              <button type="button" onClick={() => setDraft((prev) => ({ ...prev, domainVisions: [...prev.domainVisions, { domain: "", vision: "" }] }))} className="text-xs font-medium text-slate-600 hover:text-slate-900">+ Add domain vision</button>
            </div>
            {draft.domainVisions.map((item, index) => (
              <div key={`domain-vision-${index}`} className="rounded-xl border border-slate-200 p-3">
                <input value={item.domain} onChange={(e) => setDraft((prev) => ({ ...prev, domainVisions: prev.domainVisions.map((entry, entryIndex) => entryIndex === index ? { ...entry, domain: e.target.value } : entry) }))} placeholder="Domain" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" />
                <textarea value={item.vision} onChange={(e) => setDraft((prev) => ({ ...prev, domainVisions: prev.domainVisions.map((entry, entryIndex) => entryIndex === index ? { ...entry, vision: e.target.value } : entry) }))} rows={3} placeholder="Vision" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" />
                <button type="button" onClick={() => setDraft((prev) => ({ ...prev, domainVisions: prev.domainVisions.filter((_, entryIndex) => entryIndex !== index) }))} className="mt-2 text-xs font-medium text-rose-600 hover:text-rose-700">Remove</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Major goals</p>{data.majorGoals.length > 0 ? <ul className="mt-2 space-y-1">{data.majorGoals.map((item, index) => <li key={`major-goal-${index}`} className="text-sm text-slate-700">{item}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No entries.</p>}</div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">6 month vision</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{data.vision6Months || "No answer yet."}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">2 year vision</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{data.vision2Years || "No answer yet."}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">5 year vision</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{data.vision5Years || "No answer yet."}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Major changes</p>{data.majorChanges.length > 0 ? <ul className="mt-2 space-y-1">{data.majorChanges.map((item, index) => <li key={`major-change-${index}`} className="text-sm text-slate-700">{item}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No entries.</p>}</div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Success definition</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{data.successDefinition || "No answer yet."}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Domain visions</p>{data.domainVisions.length > 0 ? <div className="mt-2 space-y-2">{data.domainVisions.map((item, index) => <div key={`domain-view-${index}`} className="rounded-xl border border-slate-200 p-3"><p className="text-sm font-semibold text-slate-900">{item.domain || "Untitled domain"}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.vision || "No vision yet."}</p></div>)}</div> : <p className="mt-2 text-sm text-slate-500">No domain visions yet.</p>}</div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Future reflection</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{data.futureReflection || "No answer yet."}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Reflection goals</p>{data.reflectionGoals.length > 0 ? <ul className="mt-2 space-y-1">{data.reflectionGoals.map((item, index) => <li key={`reflection-goal-${index}`} className="text-sm text-slate-700">{item}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No entries.</p>}</div>
        </div>
      )}
    </SectionCard>
  );
}

export function IdentitiesSection({ data, showRouteLink = true }: { data: IdentitiesData | null; showRouteLink?: boolean }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(() => ({ identities: data?.identities ?? [] }));

  async function handleSave() {
    setSaving(true);
    try {
      await upsertPartFour({ identities: draft.identities, completedAt: data?.completedAt ?? null });
      setIsEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      sectionKey="identities"
      updatedAt={data?.updatedAt}
      completedAt={data?.completedAt}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onCancel={() => {
        setDraft({ identities: data?.identities ?? [] });
        setIsEditing(false);
      }}
      onSave={handleSave}
      saving={saving}
      showRouteLink={showRouteLink}
    >
      {!data ? (
        <EmptyState message="No identity entries yet." />
      ) : isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Identity entries</p>
            <button type="button" onClick={() => setDraft((prev) => ({ identities: [...prev.identities, { identity: "", habits: [] }] }))} className="text-xs font-medium text-slate-600 hover:text-slate-900">+ Add identity</button>
          </div>
          {draft.identities.map((entry, index) => (
            <div key={`identity-entry-${index}`} className="rounded-xl border border-slate-200 p-3">
              <input value={entry.identity} onChange={(e) => setDraft((prev) => ({ identities: prev.identities.map((item, itemIndex) => itemIndex === index ? { ...item, identity: e.target.value } : item) }))} placeholder="Identity" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" />
              <textarea value={listToLines(entry.habits)} onChange={(e) => setDraft((prev) => ({ identities: prev.identities.map((item, itemIndex) => itemIndex === index ? { ...item, habits: parseLines(e.target.value) } : item) }))} rows={3} placeholder="Supporting habits (one per line)" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" />
              <button type="button" onClick={() => setDraft((prev) => ({ identities: prev.identities.filter((_, itemIndex) => itemIndex !== index) }))} className="mt-2 text-xs font-medium text-rose-600 hover:text-rose-700">Remove</button>
            </div>
          ))}
        </div>
      ) : data.identities.length === 0 ? (
        <EmptyState message="No identity entries yet." />
      ) : (
        <div className="space-y-3">
          {data.identities.map((entry, index) => (
            <div key={`identity-view-${index}`} className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">{entry.identity || "Untitled identity"}</p>
              {entry.habits.length > 0 ? <ul className="mt-2 space-y-1">{entry.habits.map((habit, habitIndex) => <li key={`identity-habit-${index}-${habitIndex}`} className="text-sm text-slate-700">{habit}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No habits attached.</p>}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
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

export function GoalsSection({ data, showRouteLink = true }: { data: GoalsData | null; showRouteLink?: boolean }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<NextStepGoalData[]>(() => data?.entries ?? []);

  async function handleSave() {
    setSaving(true);
    try {
      await upsertNextStep(draft, data?.completedAt ?? null);
      setIsEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      sectionKey="goals"
      updatedAt={data?.updatedAt}
      completedAt={data?.completedAt}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onCancel={() => {
        setDraft(data?.entries ?? []);
        setIsEditing(false);
      }}
      onSave={handleSave}
      saving={saving}
      showRouteLink={showRouteLink}
    >
      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Goal tags</p>
            <button type="button" onClick={() => setDraft((prev) => [...prev, defaultGoalEntry()])} className="text-xs font-medium text-slate-600 hover:text-slate-900">+ Add goal</button>
          </div>
          {draft.map((entry, index) => (
            <div
              key={`goal-entry-${index}`}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1"
            >
              <input
                value={entry.goal}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, goal: e.target.value } : item,
                    ),
                  )
                }
                placeholder="Goal"
                className="h-8 flex-1 bg-transparent px-2 text-sm text-slate-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setDraft((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                className="inline-flex h-7 items-center rounded-full border border-rose-200 px-2 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : !data ? (
        <EmptyState message="No goals yet. Complete The Next Step to generate them." />
      ) : data.entries.length === 0 ? (
        <EmptyState message="No goals yet. Complete The Next Step to generate them." />
      ) : (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Goal tags</p>
          <div className="mt-2 space-y-2">
          {data.entries.map((entry, index) => (
            <div
              key={`goal-view-${index}`}
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              {entry.goal || "Untitled goal"}
            </div>
          ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

export function HabitsSection({ data, showRouteLink = true }: { data: HabitsData; showRouteLink?: boolean }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<TrackedHabitData[]>(data.habits);

  function addDraftHabit() {
    const suffix = Math.random().toString(36).slice(2, 10);
    const now = new Date().toISOString();
    setDraft((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${suffix}`,
        name: "",
        category: null,
        goalEntryId: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const existingIds = new Set(data.habits.map((habit) => habit.id));
      const retainedIds = new Set(draft.filter((habit) => existingIds.has(habit.id)).map((habit) => habit.id));
      const toDelete = data.habits.filter((habit) => !retainedIds.has(habit.id));

      if (toDelete.length > 0) {
        await Promise.all(toDelete.map((habit) => actionDeleteTrackedHabit(habit.id)));
      }

      const cleanedDraft = draft.filter((habit) => habit.name.trim().length > 0);
      await Promise.all(
        cleanedDraft.map((habit) => {
          const normalizedCategory = habit.category?.trim() ? habit.category.trim() : null;
          if (existingIds.has(habit.id)) {
            return actionUpdateGoalHabit(habit.id, {
              name: habit.name.trim(),
              category: normalizedCategory,
            });
          }
          return actionUpsertTrackedHabit(habit.name.trim(), normalizedCategory);
        }),
      );

      setIsEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const latestUpdatedAt = data.habits.length > 0
    ? data.habits.reduce((latest, habit) => latest > habit.updatedAt ? latest : habit.updatedAt, data.habits[0].updatedAt)
    : null;

  return (
    <SectionCard
      sectionKey="habits"
      updatedAt={latestUpdatedAt}
      completedAt={null}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onCancel={() => {
        setDraft(data.habits);
        setIsEditing(false);
      }}
      onSave={handleSave}
      saving={saving}
      showRouteLink={showRouteLink}
    >
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Habit tags</p>
            <button
              type="button"
              onClick={addDraftHabit}
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              + Add habit
            </button>
          </div>
          {draft.map((habit, index) => (
            <div key={habit.id} className="space-y-2 rounded-full border border-slate-200 bg-white px-3 py-2">
              <input value={habit.name} onChange={(e) => setDraft((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))} placeholder="Habit name" className="h-8 w-full bg-transparent text-sm text-slate-800 focus:outline-none" />
              <div className="flex items-center gap-2">
                <input value={habit.category ?? ""} onChange={(e) => setDraft((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, category: e.target.value || null } : item))} placeholder="Category (optional)" className="h-8 flex-1 rounded-full border border-slate-200 px-3 text-sm text-slate-800 focus:border-slate-400 focus:outline-none" />
                <button
                  type="button"
                  onClick={() => setDraft((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                  className="inline-flex h-7 items-center rounded-full border border-rose-200 px-2 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : data.habits.length === 0 ? (
        <EmptyState message="No tracked habits yet." />
      ) : (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Habit tags</p>
          <div className="mt-2 space-y-2">
          {data.habits.map((habit) => (
            <div key={habit.id} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/habits/${habit.id}`} className="text-sm font-semibold text-slate-900 hover:text-slate-700">{habit.name}</Link>
                  {habit.category && <p className="mt-0.5 text-xs text-slate-500">{habit.category}</p>}
                </div>
                <p className="text-[11px] text-slate-500">Edited {formatDate(habit.updatedAt)}</p>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}