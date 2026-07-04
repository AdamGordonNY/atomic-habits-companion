"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PROFILE_SECTION_KEYS,
  PROFILE_SECTION_LABELS,
  PROFILE_SECTION_ROUTES,
  getDefaultProfileVisibilitySettings,
  readProfileVisibilitySettingsFromCookieString,
  type ProfileVisibilitySettings,
} from "@/lib/profile-settings";
import { updateProfileVisibilitySettings } from "@/lib/actions/profile-settings-actions";

export function ProfileSettingsForm({ initialSettings }: { initialSettings?: ProfileVisibilitySettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState<ProfileVisibilitySettings>(() => {
    if (initialSettings) return initialSettings;
    if (typeof document === "undefined") return getDefaultProfileVisibilitySettings();
    return readProfileVisibilitySettingsFromCookieString(document.cookie);
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(key: keyof ProfileVisibilitySettings) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setMessage(null);
  }

  function handleSave() {
    startTransition(async () => {
      await updateProfileVisibilitySettings(settings);
      setMessage("Saved.");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-5 py-8">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Settings</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Profile visibility</h1>
        <p className="mt-2 text-sm text-slate-600">Choose which sections appear on your profile page.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          {PROFILE_SECTION_KEYS.map((key) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{PROFILE_SECTION_LABELS[key]}</p>
                <p className="text-xs text-slate-500">Shown on <span className="font-medium">{PROFILE_SECTION_ROUTES[key]}</span> and on your profile overview.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings[key]}
                onClick={() => toggle(key)}
                className={`inline-flex h-7 w-14 items-center rounded-full p-1 transition ${settings[key] ? "bg-slate-950" : "bg-slate-200"}`}
              >
                <span className={`h-5 w-5 rounded-full bg-white transition ${settings[key] ? "translate-x-7" : "translate-x-0"}`} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button type="button" onClick={handleSave} disabled={isPending} className="inline-flex h-9 items-center rounded-full bg-slate-950 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
            {isPending ? "Saving..." : "Save settings"}
          </button>
          {message && <p className="text-xs text-emerald-600">{message}</p>}
        </div>
      </section>
    </div>
  );
}