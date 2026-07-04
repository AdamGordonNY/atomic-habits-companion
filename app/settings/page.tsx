import type { Metadata } from "next";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { readProfileVisibilitySettings } from "@/lib/profile-settings";

export const metadata: Metadata = {
  title: "Settings · Atomic Habits Companion",
  description: "Configure profile section visibility.",
};

export default async function SettingsPage() {
  const settings = await readProfileVisibilitySettings();
  return <ProfileSettingsForm initialSettings={settings} />;
}