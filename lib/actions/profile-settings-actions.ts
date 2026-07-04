"use server";

import { cookies } from "next/headers";
import {
  PROFILE_SETTINGS_COOKIE,
  type ProfileVisibilitySettings,
  serializeProfileVisibilitySettings,
} from "@/lib/profile-settings";

export async function updateProfileVisibilitySettings(settings: ProfileVisibilitySettings): Promise<void> {
  const store = await cookies();
  store.set(PROFILE_SETTINGS_COOKIE, serializeProfileVisibilitySettings(settings), {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}