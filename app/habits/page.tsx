import type { Metadata } from "next";
import { ProfileNotesPanel } from "@/components/notes/profile-notes-panel";
import { HabitsSection } from "@/components/profile/profile-sections";
import { actionGetNotesForProfileEntity } from "@/lib/notes-actions";
import { fetchHabitsData } from "@/lib/profile-data";

export const metadata: Metadata = {
  title: "Habits · Atomic Habits Companion",
  description: "SSR view of your tracked habits.",
};

export default async function HabitsPage() {
  const { isAuthed, data } = await fetchHabitsData();
  const notes = isAuthed ? await actionGetNotesForProfileEntity("habits", null) : [];
  return <div className="mx-auto max-w-3xl space-y-6 px-5 py-8"><HabitsSection data={data} showRouteLink={false} /><ProfileNotesPanel entityType="habits" entityId={null} initialNotes={notes} /></div>;
}