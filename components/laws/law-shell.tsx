"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Show, SignUpButton, UserButton } from "@clerk/nextjs";
import {
  ensureDbUser,
  syncNotes,
  syncPartOne,
  syncPartTwo,
  syncPartThree,
} from "@/lib/sync-actions";
import { fetchDashboardData } from "@/lib/actions/dashboard-actions";
import type { TrackedHabitData } from "@/lib/actions/habit-actions";

type DropdownItem =
  | { type: "link"; href: string; label: string; description?: string }
  | { type: "section"; href: string; label: string }
  | { type: "divider" };

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function buildRecentItems(
  entries: Array<{ href: string; label: string; description?: string }>,
  viewAll: { href: string; label: string },
): DropdownItem[] {
  const items: DropdownItem[] = entries.map((entry) => ({
    type: "link",
    href: entry.href,
    label: entry.label,
    description: entry.description,
  }));
  items.push({ type: "divider" });
  items.push({ type: "link", href: viewAll.href, label: viewAll.label });
  return items;
}

function buildHabitItems(habits: TrackedHabitData[]): DropdownItem[] {
  const byCategory = new Map<string, TrackedHabitData[]>();
  const uncategorized: TrackedHabitData[] = [];

  for (const h of habits) {
    if (h.category) {
      if (!byCategory.has(h.category)) byCategory.set(h.category, []);
      byCategory.get(h.category)?.push(h);
    } else {
      uncategorized.push(h);
    }
  }

  const items: DropdownItem[] = [];

  for (const [cat, catHabits] of byCategory) {
    items.push({ type: "section", label: cat, href: `/habits/category/${encodeURIComponent(cat)}` });
    for (const h of catHabits) {
      items.push({ type: "link", label: h.name, href: `/habits/${h.id}` });
    }
    items.push({ type: "divider" });
  }

  if (uncategorized.length > 0) {
    if (items.length > 0 && items[items.length - 1].type === "divider") items.pop();
    if (byCategory.size > 0) items.push({ type: "divider" });
    for (const h of uncategorized) {
      items.push({ type: "link", label: h.name, href: `/habits/${h.id}` });
    }
  }

  return items;
}

function NavDropdown({
  label,
  items,
  emptyLabel,
}: {
  label: string;
  items: DropdownItem[];
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openMenu() {
    clearCloseTimer();
    setOpen(true);
  }

  function closeMenu() {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 120);
  }

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      clearCloseTimer();
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      onFocusCapture={openMenu}
      onBlurCapture={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => {
          clearCloseTimer();
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      >
        {label}
        <svg
          className={`h-3 w-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-900/10">
          {items.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-400">
              {emptyLabel ?? "Nothing here yet"}
            </p>
          ) : (
            items.map((item, i) => {
              if (item.type === "divider") {
                return <div key={i} className="my-1 border-t border-slate-100" />;
              }
              if (item.type === "section") {
                return (
                  <Link
                    key={`section-${item.label}`}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between px-4 py-2 transition hover:bg-slate-50"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </span>
                    <svg className="h-3 w-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              }
              return (
                <Link
                  key={`${item.label}-${i}`}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex flex-col gap-0.5 px-4 py-2.5 transition hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-800">{item.label}</span>
                  {item.description && (
                    <span className="text-[11px] text-slate-400">{item.description}</span>
                  )}
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function LawShell({ children }: { children: ReactNode }) {
  const [trackedHabits, setTrackedHabits] = useState<TrackedHabitData[]>([]);
  const [goals, setGoals] = useState<{ id: string; label: string }[]>([]);
  const [recentNotes, setRecentNotes] = useState<{ id: string; title: string; updatedAt: string }[]>([]);
  const [recentChecklists, setRecentChecklists] = useState<{ id: string; title: string; updatedAt: string }[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    setSyncDone(false);
    try {
      await ensureDbUser();
      const rawNotes = localStorage.getItem("atomic-habits:notes");
      if (rawNotes) {
        const parsed = JSON.parse(rawNotes) as { notes?: unknown[] };
        if (Array.isArray(parsed?.notes) && parsed.notes.length > 0) {
          await syncNotes(parsed.notes as Parameters<typeof syncNotes>[0]);
        }
      }
      const rawP1 = localStorage.getItem("habit-assessment:onboarding");
      if (rawP1) await syncPartOne(JSON.parse(rawP1));
      const rawP2 = localStorage.getItem("habit-assessment:onboarding:part-two");
      if (rawP2) await syncPartTwo(JSON.parse(rawP2));
      const rawP3 = localStorage.getItem("habit-assessment:onboarding:part-three");
      if (rawP3) await syncPartThree(JSON.parse(rawP3));
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
    } catch (err) {
      console.error("[handleSync]", err);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchDashboardData();
      if (cancelled) return;
      setTrackedHabits(data.trackedHabits);
      setGoals(data.goals);
      setRecentNotes(data.recentNotes);
      setRecentChecklists(data.recentChecklists);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <span className="flex-shrink-0 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Atomic Habits
          </span>
          <nav className="flex flex-wrap items-center gap-1.5 pb-0.5">
            <NavDropdown
              label="Law 0"
              items={[
                { type: "link", href: "/dashboard", label: "Law 0: Assessment", description: "Dashboard overview" },
                { type: "divider" },
                { type: "link", href: "/habit-assessment/onboarding", label: "Part 1", description: "Baseline questions" },
                { type: "link", href: "/habit-assessment/onboarding/part-two", label: "Part 2", description: "7-day energy log" },
                { type: "link", href: "/habit-assessment/onboarding/part-three", label: "Part 3", description: "Time & habit deep-dive" },
                { type: "link", href: "/habit-assessment/onboarding/part-four", label: "Part 4", description: "Ideal future & identity" },
                { type: "link", href: "/habit-assessment/onboarding/part-five", label: "Part 5", description: "The Next Step" },
                { type: "divider" },
                { type: "link", href: "/habit-assessment/onboarding/review", label: "Review all answers" },
              ]}
            />
            <NavDropdown label="Law 1" items={[{ type: "link", href: "/laws/1", label: "Law 1: Make it Obvious/Invisible" }]} />
            <NavDropdown label="Law 2" items={[{ type: "link", href: "/laws/2", label: "Law 2: Make it Attractive/Unattractive" }]} />
            <NavDropdown label="Law 3" items={[{ type: "link", href: "/laws/3", label: "Law 3: Make it Easy/Difficult" }]} />
            <NavDropdown label="Law 4" items={[{ type: "link", href: "/laws/4", label: "Law 4: Make it Satisfying/Unsatisfying" }]} />
            <NavDropdown
              label="Goals"
              emptyLabel="Complete Part 5 to add goals"
              items={goals.length > 0 ? goals.map((g) => ({ type: "link" as const, href: `/goals/${g.id}`, label: g.label })) : []}
            />
            <NavDropdown
              label="Habits"
              emptyLabel="Complete Part 5 to see your habits here"
              items={buildHabitItems(trackedHabits)}
            />
            <NavDropdown
              label="Notes"
              items={buildRecentItems(
                recentNotes.map((n) => ({
                  href: `/notes/${n.id}`,
                  label: n.title,
                  description: formatDate(n.updatedAt),
                })),
                { href: "/notes", label: "View all notes" },
              )}
            />
            <NavDropdown
              label="Checklists"
              items={buildRecentItems(
                recentChecklists.map((c) => ({
                  href: `/checklists/${c.id}`,
                  label: c.title,
                  description: formatDate(c.updatedAt),
                })),
                { href: "/checklists", label: "View all checklists" },
              )}
            />
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="whitespace-nowrap rounded-full border border-slate-950 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Make account
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Action
                    label={syncing ? "Syncing..." : syncDone ? "Synced!" : "Sync data"}
                    labelIcon={
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 2v6h-6" />
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                        <path d="M3 22v-6h6" />
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                      </svg>
                    }
                    onClick={handleSync}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </Show>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-5 py-10">
        <div className="mx-auto max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
