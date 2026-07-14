"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/identities", label: "Identities" },
  { href: "/goals", label: "Goals" },
  { href: "/habits", label: "Habits" },
] as const;

const CREATE_ITEMS = [
  { href: "/identities/new", label: "Identity" },
  { href: "/goals/new", label: "Goal" },
  { href: "/habits/new", label: "Habit" },
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 self-start text-sm font-semibold tracking-tight text-slate-950">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs text-white">AH</span>
          Atomic Habits Companion
        </Link>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <nav className="flex flex-wrap items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex h-9 items-center rounded-full px-4 text-xs font-semibold transition ${active ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <details className="relative">
            <summary className="list-none cursor-pointer rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800">
              Add New
            </summary>
            <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              {CREATE_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
