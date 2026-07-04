import type { Metadata } from "next";
import { ProfilePageClient } from "@/components/profile/profile-page-client";
import {
  fetchProfileSnapshot,
  getCommitmentsData,
  getGoalsData,
  getHabitsData,
  getIdentitiesData,
  getIdealsData,
  getVisionData,
} from "@/lib/profile-data";
import { readProfileVisibilitySettings } from "@/lib/profile-settings";

export const metadata: Metadata = {
  title: "Profile · Atomic Habits Companion",
  description: "Read-only by default profile workspace with inline editing.",
};

export default async function ProfilePage() {
  const [snapshot, visibilitySettings] = await Promise.all([
    fetchProfileSnapshot(),
    readProfileVisibilitySettings(),
  ]);

  return (
    <ProfilePageClient
      isAuthed={snapshot.isAuthed}
      visibilitySettings={visibilitySettings}
      commitments={getCommitmentsData(snapshot)}
      ideals={getIdealsData(snapshot)}
      vision={getVisionData(snapshot)}
      identities={getIdentitiesData(snapshot)}
      goals={getGoalsData(snapshot)}
      habits={getHabitsData(snapshot)}
    />
  );
}