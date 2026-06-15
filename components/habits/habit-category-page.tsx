"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { actionGetTrackedHabits, type TrackedHabitData } from "@/lib/actions/habit-actions";

export function HabitCategoryPage({ category }: { category: string }) {
  const [habits, setHabits] = useState<TrackedHabitData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    actionGetTrackedHabits().then((all) => {
      setHabits(all.filter((h) => h.category === category));
      setLoading(false);
    });
  }, [category]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/dashboard"
            className="flex-shrink-0 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            ← Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <h1 className="truncate text-sm font-semibold text-slate-900">{category}</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-8">
        <div className="mx-auto max-w-2xl space-y-6">

          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Category
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {category}
            </h2>
          </section>

          <section>
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Habits in this category
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-white"
                  />
                ))}
              </div>
            ) : habits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center">
                <p className="text-sm text-slate-500">No habits in this category yet.</p>
                <p className="mt-1 text-xs text-slate-400">
                  Visit a habit&apos;s page and set its category to &quot;{category}&quot; to add it here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {habits.map((h) => (
                  <Link
                    key={h.id}
                    href={`/habits/${encodeURIComponent(h.name)}`}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:translate-y-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{h.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Tracked since{" "}
                        {new Date(h.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
