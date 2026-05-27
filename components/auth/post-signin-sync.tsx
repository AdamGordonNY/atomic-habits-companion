"use client";

/**
 * Fires once after a user signs in.
 * Reads all localStorage assessment data and notes, then pushes them to the DB
 * via Server Actions. Marks sync complete in sessionStorage so it only runs once
 * per browser session.
 */

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { syncNotes } from "@/lib/sync-actions";
import { syncPartOne } from "@/lib/sync-actions";
import { syncPartTwo } from "@/lib/sync-actions";
import { syncPartThree } from "@/lib/sync-actions";

const SYNC_FLAG = "atomic-habits:synced";

export function PostSigninSync() {
  const { data: session, status } = useSession();
  const ran = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    if (ran.current) return;
    if (typeof window === "undefined") return;

    // Only run once per session
    if (sessionStorage.getItem(SYNC_FLAG) === session.user.id) return;
    ran.current = true;

    (async () => {
      try {
        // ── Notes ──────────────────────────────────────────────────────────
        const rawNotes = localStorage.getItem("atomic-habits:notes");
        if (rawNotes) {
          const parsed = JSON.parse(rawNotes) as { notes?: unknown[] };
          if (Array.isArray(parsed?.notes) && parsed.notes.length > 0) {
            await syncNotes(parsed.notes as Parameters<typeof syncNotes>[0]);
          }
        }

        // ── Part One ───────────────────────────────────────────────────────
        const rawP1 = localStorage.getItem("habit-assessment:onboarding");
        if (rawP1) {
          await syncPartOne(JSON.parse(rawP1));
        }

        // ── Part Two ───────────────────────────────────────────────────────
        const rawP2 = localStorage.getItem(
          "habit-assessment:onboarding:part-two",
        );
        if (rawP2) {
          await syncPartTwo(JSON.parse(rawP2));
        }

        // ── Part Three ─────────────────────────────────────────────────────
        const rawP3 = localStorage.getItem(
          "habit-assessment:onboarding:part-three",
        );
        if (rawP3) {
          await syncPartThree(JSON.parse(rawP3));
        }

        sessionStorage.setItem(SYNC_FLAG, session.user.id);
      } catch (err) {
        // Non-critical — localStorage data stays intact on failure
        console.error("[PostSigninSync] sync failed:", err);
      }
    })();
  }, [status, session?.user?.id]);

  // Renders nothing — purely side-effectful
  return null;
}
