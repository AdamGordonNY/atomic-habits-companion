"use client";

/**
 * Fires once after a user signs in.
 * Reads all localStorage assessment data and notes, then pushes them to the DB
 * via Server Actions. Marks sync complete in sessionStorage so it only runs once
 * per browser session.
 */

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import {
  ensureDbUser,
  syncNotes,
  syncPartOne,
  syncPartTwo,
  syncPartThree,
} from "@/lib/sync-actions";

const SYNC_FLAG = "atomic-habits:synced";

export function PostSigninSync() {
  const { isSignedIn, isLoaded, user } = useUser();
  const ran = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;
    if (ran.current) return;
    if (typeof window === "undefined") return;

    ran.current = true;

    (async () => {
      try {
        // ── 1. Provision the DB user row (idempotent). ─────────────────────
        // This MUST run before any sync so FK constraints are satisfied.
        const { isNew } = await ensureDbUser();

        // ── 2. Skip if we already synced this user this session ────────────
        // New users always run the sync so their localStorage data is never lost.
        if (!isNew && sessionStorage.getItem(SYNC_FLAG) === user.id) return;

        // ── 3. Sync localStorage → DB ──────────────────────────────────────
        const rawNotes = localStorage.getItem("atomic-habits:notes");
        if (rawNotes) {
          const parsed = JSON.parse(rawNotes) as { notes?: unknown[] };
          if (Array.isArray(parsed?.notes) && parsed.notes.length > 0) {
            await syncNotes(parsed.notes as Parameters<typeof syncNotes>[0]);
          }
        }

        const rawP1 = localStorage.getItem("habit-assessment:onboarding");
        if (rawP1) await syncPartOne(JSON.parse(rawP1));

        const rawP2 = localStorage.getItem(
          "habit-assessment:onboarding:part-two",
        );
        if (rawP2) await syncPartTwo(JSON.parse(rawP2));

        const rawP3 = localStorage.getItem(
          "habit-assessment:onboarding:part-three",
        );
        if (rawP3) await syncPartThree(JSON.parse(rawP3));

        sessionStorage.setItem(SYNC_FLAG, user.id);
      } catch (err) {
        // Non-critical — localStorage data stays intact on failure
        console.error("[PostSigninSync] sync failed:", err);
      }
    })();
  }, [isLoaded, isSignedIn, user?.id]);

  // Renders nothing — purely side-effectful
  return null;
}
