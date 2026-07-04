import "server-only";

import { cookies } from "next/headers";

export const PROFILE_SETTINGS_COOKIE = "profile-visibility-settings";

export const PROFILE_SECTION_KEYS = [
  "commitments",
  "ideals",
  "vision",
  "identities",
  "goals",
  "habits",
] as const;

export type ProfileSectionKey = (typeof PROFILE_SECTION_KEYS)[number];

export type ProfileVisibilitySettings = Record<ProfileSectionKey, boolean>;

export const PROFILE_SECTION_LABELS: Record<ProfileSectionKey, string> = {
  commitments: "Commitments",
  ideals: "Ideals",
  vision: "Vision",
  identities: "Identities",
  goals: "Goals",
  habits: "Habits",
};

export const PROFILE_SECTION_ROUTES: Record<ProfileSectionKey, string> = {
  commitments: "/committments",
  ideals: "/ideals",
  vision: "/vision",
  identities: "/identities",
  goals: "/goals",
  habits: "/habits",
};

export function getDefaultProfileVisibilitySettings(): ProfileVisibilitySettings {
  return {
    commitments: true,
    ideals: true,
    vision: true,
    identities: true,
    goals: true,
    habits: true,
  };
}

function normalizeProfileVisibilitySettings(input: unknown): ProfileVisibilitySettings {
  const defaults = getDefaultProfileVisibilitySettings();
  if (!input || typeof input !== "object") return defaults;

  const next = { ...defaults };
  for (const key of PROFILE_SECTION_KEYS) {
    if (key in (input as Record<string, unknown>)) {
      next[key] = Boolean((input as Record<string, unknown>)[key]);
    }
  }
  return next;
}

export async function readProfileVisibilitySettings(): Promise<ProfileVisibilitySettings> {
  const store = await cookies();
  const raw = store.get(PROFILE_SETTINGS_COOKIE)?.value;
  if (!raw) return getDefaultProfileVisibilitySettings();

  try {
    return normalizeProfileVisibilitySettings(JSON.parse(raw));
  } catch {
    return getDefaultProfileVisibilitySettings();
  }
}

export function serializeProfileVisibilitySettings(settings: ProfileVisibilitySettings): string {
  return JSON.stringify(normalizeProfileVisibilitySettings(settings));
}