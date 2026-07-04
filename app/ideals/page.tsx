import type { Metadata } from "next";
import { ProfileNotesPanel } from "@/components/notes/profile-notes-panel";
import { IdealsSection } from "@/components/profile/profile-sections";
import { actionGetNotesForProfileEntity } from "@/lib/notes-actions";
import { fetchIdealsData } from "@/lib/profile-data";

export const metadata: Metadata = {
  title: "Ideals · Atomic Habits Companion",
  description: "SSR view of your ideal routines.",
};

export default async function IdealsPage() {
  const { isAuthed, data } = await fetchIdealsData();
  const notes = isAuthed ? await actionGetNotesForProfileEntity("ideals", data?.id ?? null) : [];
  return <div className="mx-auto max-w-3xl space-y-6 px-5 py-8"><IdealsSection data={data} showRouteLink={false} /><ProfileNotesPanel entityType="ideals" entityId={data?.id ?? null} initialNotes={notes} /></div>;
}