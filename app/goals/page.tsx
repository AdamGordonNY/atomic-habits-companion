import type { Metadata } from "next";
import { ProfileNotesPanel } from "@/components/notes/profile-notes-panel";
import { GoalsSection } from "@/components/profile/profile-sections";
import { actionGetNotesForProfileEntity } from "@/lib/notes-actions";
import { fetchGoalsData } from "@/lib/profile-data";

export const metadata: Metadata = {
  title: "Goals · Atomic Habits Companion",
  description: "SSR view of your profile goals.",
};

export default async function GoalsPage() {
  const { isAuthed, data } = await fetchGoalsData();
  const notes = isAuthed ? await actionGetNotesForProfileEntity("goals", data?.id ?? null) : [];
  return <div className="mx-auto max-w-3xl space-y-6 px-5 py-8"><GoalsSection data={data} showRouteLink={false} /><ProfileNotesPanel entityType="goals" entityId={data?.id ?? null} initialNotes={notes} /></div>;
}
