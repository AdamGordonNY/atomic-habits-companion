import "server-only";

import { cookies } from "next/headers";
import { parseProfileVisibilitySettings, PROFILE_SETTINGS_COOKIE, type ProfileVisibilitySettings } from "@/lib/profile-settings";

export async function readProfileVisibilitySettings(): Promise<ProfileVisibilitySettings> {
  const store = await cookies();
  return parseProfileVisibilitySettings(store.get(PROFILE_SETTINGS_COOKIE)?.value ?? null);
}