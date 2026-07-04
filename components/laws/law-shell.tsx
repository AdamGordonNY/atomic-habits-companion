"use client";

import { type ReactNode } from "react";
import { Show, SignUpButton, UserButton } from "@clerk/nextjs";

function MenuIcon({ glyph }: { glyph: string }) {
  return <span className="text-xs font-semibold text-slate-400">{glyph}</span>;
}

export function LawShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <span className="flex-shrink-0 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Atomic Habits
          </span>
          <nav className="flex flex-wrap items-center gap-1.5 pb-0.5">
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
                  <UserButton.Link
                    label="Profile"
                    labelIcon={<MenuIcon glyph=">" />}
                    href="/profile"
                  />
                  <UserButton.Link
                    label="Settings"
                    labelIcon={<MenuIcon glyph=">" />}
                    href="/settings"
                  />
                  <UserButton.Link
                    label="Goals"
                    labelIcon={<MenuIcon glyph=">" />}
                    href="/goals"
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
