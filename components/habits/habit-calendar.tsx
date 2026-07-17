"use client";
import React from "react";
interface CheckIn {
  date: string;       // YYYY-MM-DD
  completed: boolean;
}

interface HabitCalendarProps {
  checkIns: CheckIn[];
  /** ISO string — days before this are never shown as missed */
  habitCreatedAt: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function HabitCalendar({ checkIns, habitCreatedAt }: HabitCalendarProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const today = `${year}-${pad(month + 1)}-${pad(now.getDate())}`;
  const createdDate = habitCreatedAt.split("T")[0];

  // Build a map of date → completed
  const checkInMap = new Map(checkIns.map((c) => [c.date, c.completed]));

  // Days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Day of week for the 1st (0 = Sun)
  const firstDow = new Date(year, month, 1).getDay();

  const monthName = new Date(year, month, 1).toLocaleString("default", { month: "long" });

  const days: React.JSX.Element[] = [];

  // Empty cells before first
  for (let i = 0; i < firstDow; i++) {
    days.push(<div key={`empty-${i}`} />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
    const isPast = dateStr < today;
    const isToday = dateStr === today;
    const isFuture = dateStr > today;
    const afterCreation = dateStr >= createdDate;
    const checkIn = checkInMap.get(dateStr);

    let content: string | null = null;
    let cellClass = "relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium";

    if (checkIn === true) {
      // Completed
      cellClass += " bg-emerald-100 text-emerald-700";
      content = "✓";
    } else if (checkIn === false) {
      // Explicitly marked not done
      cellClass += " bg-red-100 text-red-600";
      content = "✗";
    } else if (isPast && afterCreation) {
      // Past day with no check-in after habit was created = missed
      cellClass += " bg-red-50 text-red-400";
      content = "✗";
    } else if (isToday) {
      cellClass += " border border-slate-400 text-slate-700";
    } else if (isFuture) {
      cellClass += " text-slate-300";
    } else {
      // Past before habit creation
      cellClass += " text-slate-200";
    }

    days.push(
      <div key={dateStr} className="flex items-center justify-center">
        <div className={cellClass} title={dateStr}>
          {content ?? <span className={isToday ? "font-bold" : ""}>{d}</span>}
          {!content && <span className="absolute inset-0 flex items-center justify-center">{d}</span>}
        </div>
      </div>,
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-950">
        {monthName} {year}
      </p>

      {/* Day-of-week header */}
      <div className="mb-1 grid grid-cols-7 gap-1 text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dow) => (
          <div key={dow} className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {dow}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">{days}</div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-700">✓</span>
          Done
        </span>
        <span className="flex items-center gap-1">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-50 text-[9px] font-bold text-red-400">✗</span>
          Missed
        </span>
        <span className="flex items-center gap-1">
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-400 text-[9px] text-slate-700">·</span>
          Today
        </span>
      </div>
    </div>
  );
}
