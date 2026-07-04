import type { Metadata } from "next";
import { ProfileNotesPanel } from "@/components/notes/profile-notes-panel";
import { VisionSection } from "@/components/profile/profile-sections";
import { actionGetNotesForProfileEntity } from "@/lib/notes-actions";
import { fetchVisionData } from "@/lib/profile-data";

export const metadata: Metadata = {
  title: "Vision · Atomic Habits Companion",
  description: "SSR view of your longer-term vision.",
};

export default async function VisionPage() {
  const { isAuthed, data } = await fetchVisionData();
  const notes = isAuthed ? await actionGetNotesForProfileEntity("vision", data?.id ?? null) : [];
  return <div className="mx-auto max-w-3xl space-y-6 px-5 py-8"><VisionSection data={data} showRouteLink={false} /><ProfileNotesPanel entityType="vision" entityId={data?.id ?? null} initialNotes={notes} /></div>;
}