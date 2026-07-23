import type { Metadata } from "next";
import { ProfileNotesPanel } from "@/components/notes/profile-notes-panel";
import { IdentitiesSection } from "@/components/profile/profile-sections";
import { actionGetNotesForProfileEntity } from "@/lib/notes-actions";
import { fetchGoalsData, fetchHabitsData, fetchIdentitiesData } from "@/lib/profile-data";

export const metadata: Metadata = {
  title: "Identities · Atomic Habits Companion",
  description: "SSR view of your identity entries.",
};

export default async function IdentitiesPage() {
  const [{ isAuthed, data }, goalsResult, habitsResult] = await Promise.all([
    fetchIdentitiesData(),
    fetchGoalsData(),
    fetchHabitsData(),
  ]);
  const notes = isAuthed ? await actionGetNotesForProfileEntity("identities", data?.id ?? null) : [];
  return <div className="mx-auto max-w-3xl space-y-6 px-5 py-8"><IdentitiesSection data={data} goals={goalsResult.data} habits={habitsResult.data} showRouteLink={false} /><ProfileNotesPanel entityType="identities" entityId={data?.id ?? null} initialNotes={notes} /></div>;
}