"use client";

import Link from "next/link";
import {
  PROFILE_SECTION_KEYS,
  PROFILE_SECTION_LABELS,
  PROFILE_SECTION_ROUTES,
  type ProfileVisibilitySettings,
} from "@/lib/profile-settings";
import type {
  CommitmentsData,
  GoalsData,
  HabitsData,
  IdentitiesData,
  IdealsData,
  VisionData,
} from "@/lib/profile-data";
import {
  CommitmentsSection,
  GoalsSection,
  HabitsSection,
  IdentitiesSection,
  IdealsSection,
  VisionSection,
} from "./profile-sections";

interface ProfilePageClientProps {
  isAuthed: boolean;
  visibilitySettings: ProfileVisibilitySettings;
  commitments: CommitmentsData | null;
  ideals: IdealsData | null;
  vision: VisionData | null;
  identities: IdentitiesData | null;
  goals: GoalsData | null;
  habits: HabitsData;
}

export function ProfilePageClient({
  isAuthed,
  visibilitySettings,
  commitments,
  ideals,
  vision,
  identities,
  goals,
  habits,
}: ProfilePageClientProps) {
  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">Sign in to view your profile.</p>
        </section>
      </div>
    );
  }

  const visibleKeys = PROFILE_SECTION_KEYS.filter((key) => visibilitySettings[key]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-8">
      <header className="space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Profile</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Your profile workspace</h1>
          <p className="mt-2 text-sm text-slate-600">Sections are read-only by default. Use inline edit on any section when you want to update it.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PROFILE_SECTION_KEYS.map((key) => (
            <Link key={key} href={PROFILE_SECTION_ROUTES[key]} className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold ${visibilitySettings[key] ? "border-slate-300 bg-white text-slate-700 hover:border-slate-400" : "border-slate-200 bg-slate-100 text-slate-400"}`}>
              {PROFILE_SECTION_LABELS[key]}
            </Link>
          ))}
          <Link href="/settings" className="inline-flex h-8 items-center rounded-full bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800">Settings</Link>
        </div>
      </header>

      {visibleKeys.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">All profile sections are hidden right now.</p>
          <Link href="/settings" className="mt-3 inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">Manage profile settings</Link>
        </section>
      ) : (
        <div className="space-y-6">
          {visibilitySettings.commitments && <CommitmentsSection data={commitments} />}
          {visibilitySettings.ideals && <IdealsSection data={ideals} />}
          {visibilitySettings.vision && <VisionSection data={vision} />}
          {visibilitySettings.identities && <IdentitiesSection data={identities} goals={goals} habits={habits} />}
          {visibilitySettings.goals && <GoalsSection data={goals} habits={habits} />}
          {visibilitySettings.habits && <HabitsSection data={habits} />}
        </div>
      )}
    </div>
  );
}