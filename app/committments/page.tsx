import type { Metadata } from "next";
import { ProfileNotesPanel } from "@/components/notes/profile-notes-panel";
import { CommitmentsSection } from "@/components/profile/profile-sections";
import { actionGetNotesForProfileEntity } from "@/lib/notes-actions";
import { fetchCommitmentsData } from "@/lib/profile-data";

export const metadata: Metadata = {
  title: "Commitments · Atomic Habits Companion",
  description: "SSR view of commitments from your profile.",
};

export default async function CommittmentsPage() {
  const { isAuthed, data } = await fetchCommitmentsData();
  const notes = isAuthed ? await actionGetNotesForProfileEntity("commitments", data?.id ?? null) : [];
  return <div className="mx-auto max-w-3xl space-y-6 px-5 py-8"><CommitmentsSection data={data} showRouteLink={false} /><ProfileNotesPanel entityType="commitments" entityId={data?.id ?? null} initialNotes={notes} /></div>;
}