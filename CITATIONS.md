# Code Citations

## License: unknown
https://github.com/Thiti-Dev/scraping-gateways/blob/7751be04cb07fee411a694657099b67c36b2258a/src/controllers/cores.ts

```
Let me read the current layout and auth files before making changes.   Now I have full context. Here's the plan:
1. Uninstall `next-auth`, remove `auth.ts`, `types/next-auth.d.ts`, the catch-all route
2. Install `@clerk/nextjs`
3. Create `middleware.ts` (not `proxy.ts` — Next.js uses `middleware.ts`)
4. Update `app/layout.tsx` with `ClerkProvider`
5. Update dashboard nav + sign-in page
6. Update `lib/notes-actions.ts` and `lib/sync-actions.ts` to use Clerk's `auth()`
````powershell
npm uninstall next-auth @auth/prisma-adapter && npm install @clerk/nextjs@latest
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/(.*)",
    "/(api|trpc)(.*)",
  ],
};
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\app\layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atomic Habits Companion",
  description: "Build better habits, one step at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\components\providers.tsx
"use client";

// SessionProvider removed — Clerk handles session state via ClerkProvider in layout.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
````

Now update the server actions to use Clerk's `auth()`, update the dashboard nav, replace the sign-in page, and delete the old auth files:
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\notes-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import {
  dbGetNotes,
  dbGetNoteById,
  dbCreateNote,
  dbUpdateNote,
  dbDeleteNote,
  dbTogglePin,
} from "@/lib/notes-db";
import type { Note } from "@/types/habit";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function actionGetNotes() {
  const userId = await getUserId();
  return dbGetNotes(userId);
}

export async function actionGetNoteById(id: string) {
  const userId = await getUserId();
  return dbGetNoteById(id, userId);
}

export async function actionCreateNote(data: Omit<Note, "id" | "createdAt" | "updatedAt">) {
  const userId = await getUserId();
  return dbCreateNote(userId, data);
}

export async function actionUpdateNote(id: string, data: Partial<Omit<Note, "id" | "createdAt">>) {
  const userId = await getUserId();
  return dbUpdateNote(id, userId, data);
}

export async function actionDeleteNote(id: string) {
  const userId = await getUserId();
  return dbDeleteNote(id, userId);
}

export async function actionTogglePin(id: string) {
  const userId = await getUserId();
  return dbTogglePin(id, userId);
}

export async function actionSyncLocalNotes(notes: Note[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      dbCreateNote(userId, {
        title: n.title,
        content: n.content,
        tags: n.tags,
        pinned: n.pinned,
      })
    )
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\sync-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// ── Notes ──────────────────────────────────────────────────────────────────────
export async function syncNotes(notes: any[]) {
  const userId
```


## License: unknown
https://github.com/Thiti-Dev/scraping-gateways/blob/7751be04cb07fee411a694657099b67c36b2258a/src/controllers/cores.ts

```
Let me read the current layout and auth files before making changes.   Now I have full context. Here's the plan:
1. Uninstall `next-auth`, remove `auth.ts`, `types/next-auth.d.ts`, the catch-all route
2. Install `@clerk/nextjs`
3. Create `middleware.ts` (not `proxy.ts` — Next.js uses `middleware.ts`)
4. Update `app/layout.tsx` with `ClerkProvider`
5. Update dashboard nav + sign-in page
6. Update `lib/notes-actions.ts` and `lib/sync-actions.ts` to use Clerk's `auth()`
````powershell
npm uninstall next-auth @auth/prisma-adapter && npm install @clerk/nextjs@latest
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/(.*)",
    "/(api|trpc)(.*)",
  ],
};
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\app\layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atomic Habits Companion",
  description: "Build better habits, one step at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\components\providers.tsx
"use client";

// SessionProvider removed — Clerk handles session state via ClerkProvider in layout.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
````

Now update the server actions to use Clerk's `auth()`, update the dashboard nav, replace the sign-in page, and delete the old auth files:
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\notes-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import {
  dbGetNotes,
  dbGetNoteById,
  dbCreateNote,
  dbUpdateNote,
  dbDeleteNote,
  dbTogglePin,
} from "@/lib/notes-db";
import type { Note } from "@/types/habit";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function actionGetNotes() {
  const userId = await getUserId();
  return dbGetNotes(userId);
}

export async function actionGetNoteById(id: string) {
  const userId = await getUserId();
  return dbGetNoteById(id, userId);
}

export async function actionCreateNote(data: Omit<Note, "id" | "createdAt" | "updatedAt">) {
  const userId = await getUserId();
  return dbCreateNote(userId, data);
}

export async function actionUpdateNote(id: string, data: Partial<Omit<Note, "id" | "createdAt">>) {
  const userId = await getUserId();
  return dbUpdateNote(id, userId, data);
}

export async function actionDeleteNote(id: string) {
  const userId = await getUserId();
  return dbDeleteNote(id, userId);
}

export async function actionTogglePin(id: string) {
  const userId = await getUserId();
  return dbTogglePin(id, userId);
}

export async function actionSyncLocalNotes(notes: Note[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      dbCreateNote(userId, {
        title: n.title,
        content: n.content,
        tags: n.tags,
        pinned: n.pinned,
      })
    )
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\sync-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// ── Notes ──────────────────────────────────────────────────────────────────────
export async function syncNotes(notes: any[]) {
  const userId
```


## License: unknown
https://github.com/Thiti-Dev/scraping-gateways/blob/7751be04cb07fee411a694657099b67c36b2258a/src/controllers/cores.ts

```
Let me read the current layout and auth files before making changes.   Now I have full context. Here's the plan:
1. Uninstall `next-auth`, remove `auth.ts`, `types/next-auth.d.ts`, the catch-all route
2. Install `@clerk/nextjs`
3. Create `middleware.ts` (not `proxy.ts` — Next.js uses `middleware.ts`)
4. Update `app/layout.tsx` with `ClerkProvider`
5. Update dashboard nav + sign-in page
6. Update `lib/notes-actions.ts` and `lib/sync-actions.ts` to use Clerk's `auth()`
````powershell
npm uninstall next-auth @auth/prisma-adapter && npm install @clerk/nextjs@latest
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/(.*)",
    "/(api|trpc)(.*)",
  ],
};
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\app\layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atomic Habits Companion",
  description: "Build better habits, one step at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\components\providers.tsx
"use client";

// SessionProvider removed — Clerk handles session state via ClerkProvider in layout.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
````

Now update the server actions to use Clerk's `auth()`, update the dashboard nav, replace the sign-in page, and delete the old auth files:
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\notes-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import {
  dbGetNotes,
  dbGetNoteById,
  dbCreateNote,
  dbUpdateNote,
  dbDeleteNote,
  dbTogglePin,
} from "@/lib/notes-db";
import type { Note } from "@/types/habit";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function actionGetNotes() {
  const userId = await getUserId();
  return dbGetNotes(userId);
}

export async function actionGetNoteById(id: string) {
  const userId = await getUserId();
  return dbGetNoteById(id, userId);
}

export async function actionCreateNote(data: Omit<Note, "id" | "createdAt" | "updatedAt">) {
  const userId = await getUserId();
  return dbCreateNote(userId, data);
}

export async function actionUpdateNote(id: string, data: Partial<Omit<Note, "id" | "createdAt">>) {
  const userId = await getUserId();
  return dbUpdateNote(id, userId, data);
}

export async function actionDeleteNote(id: string) {
  const userId = await getUserId();
  return dbDeleteNote(id, userId);
}

export async function actionTogglePin(id: string) {
  const userId = await getUserId();
  return dbTogglePin(id, userId);
}

export async function actionSyncLocalNotes(notes: Note[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      dbCreateNote(userId, {
        title: n.title,
        content: n.content,
        tags: n.tags,
        pinned: n.pinned,
      })
    )
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\sync-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// ── Notes ──────────────────────────────────────────────────────────────────────
export async function syncNotes(notes: any[]) {
  const userId
```


## License: unknown
https://github.com/Thiti-Dev/scraping-gateways/blob/7751be04cb07fee411a694657099b67c36b2258a/src/controllers/cores.ts

```
Let me read the current layout and auth files before making changes.   Now I have full context. Here's the plan:
1. Uninstall `next-auth`, remove `auth.ts`, `types/next-auth.d.ts`, the catch-all route
2. Install `@clerk/nextjs`
3. Create `middleware.ts` (not `proxy.ts` — Next.js uses `middleware.ts`)
4. Update `app/layout.tsx` with `ClerkProvider`
5. Update dashboard nav + sign-in page
6. Update `lib/notes-actions.ts` and `lib/sync-actions.ts` to use Clerk's `auth()`
````powershell
npm uninstall next-auth @auth/prisma-adapter && npm install @clerk/nextjs@latest
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/(.*)",
    "/(api|trpc)(.*)",
  ],
};
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\app\layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atomic Habits Companion",
  description: "Build better habits, one step at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\components\providers.tsx
"use client";

// SessionProvider removed — Clerk handles session state via ClerkProvider in layout.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
````

Now update the server actions to use Clerk's `auth()`, update the dashboard nav, replace the sign-in page, and delete the old auth files:
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\notes-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import {
  dbGetNotes,
  dbGetNoteById,
  dbCreateNote,
  dbUpdateNote,
  dbDeleteNote,
  dbTogglePin,
} from "@/lib/notes-db";
import type { Note } from "@/types/habit";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function actionGetNotes() {
  const userId = await getUserId();
  return dbGetNotes(userId);
}

export async function actionGetNoteById(id: string) {
  const userId = await getUserId();
  return dbGetNoteById(id, userId);
}

export async function actionCreateNote(data: Omit<Note, "id" | "createdAt" | "updatedAt">) {
  const userId = await getUserId();
  return dbCreateNote(userId, data);
}

export async function actionUpdateNote(id: string, data: Partial<Omit<Note, "id" | "createdAt">>) {
  const userId = await getUserId();
  return dbUpdateNote(id, userId, data);
}

export async function actionDeleteNote(id: string) {
  const userId = await getUserId();
  return dbDeleteNote(id, userId);
}

export async function actionTogglePin(id: string) {
  const userId = await getUserId();
  return dbTogglePin(id, userId);
}

export async function actionSyncLocalNotes(notes: Note[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      dbCreateNote(userId, {
        title: n.title,
        content: n.content,
        tags: n.tags,
        pinned: n.pinned,
      })
    )
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\sync-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// ── Notes ──────────────────────────────────────────────────────────────────────
export async function syncNotes(notes: any[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      prisma.note.upsert({
        where: { id: n.id },
        update: { title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
        create: { id: n.id, userId, title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
      })
    )
  );
}

// ── Part One ───────────────────────────────────────────────────────────────────
export async function syncPart
```


## License: unknown
https://github.com/Thiti-Dev/scraping-gateways/blob/7751be04cb07fee411a694657099b67c36b2258a/src/controllers/cores.ts

```
Let me read the current layout and auth files before making changes.   Now I have full context. Here's the plan:
1. Uninstall `next-auth`, remove `auth.ts`, `types/next-auth.d.ts`, the catch-all route
2. Install `@clerk/nextjs`
3. Create `middleware.ts` (not `proxy.ts` — Next.js uses `middleware.ts`)
4. Update `app/layout.tsx` with `ClerkProvider`
5. Update dashboard nav + sign-in page
6. Update `lib/notes-actions.ts` and `lib/sync-actions.ts` to use Clerk's `auth()`
````powershell
npm uninstall next-auth @auth/prisma-adapter && npm install @clerk/nextjs@latest
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/(.*)",
    "/(api|trpc)(.*)",
  ],
};
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\app\layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atomic Habits Companion",
  description: "Build better habits, one step at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\components\providers.tsx
"use client";

// SessionProvider removed — Clerk handles session state via ClerkProvider in layout.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
````

Now update the server actions to use Clerk's `auth()`, update the dashboard nav, replace the sign-in page, and delete the old auth files:
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\notes-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import {
  dbGetNotes,
  dbGetNoteById,
  dbCreateNote,
  dbUpdateNote,
  dbDeleteNote,
  dbTogglePin,
} from "@/lib/notes-db";
import type { Note } from "@/types/habit";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function actionGetNotes() {
  const userId = await getUserId();
  return dbGetNotes(userId);
}

export async function actionGetNoteById(id: string) {
  const userId = await getUserId();
  return dbGetNoteById(id, userId);
}

export async function actionCreateNote(data: Omit<Note, "id" | "createdAt" | "updatedAt">) {
  const userId = await getUserId();
  return dbCreateNote(userId, data);
}

export async function actionUpdateNote(id: string, data: Partial<Omit<Note, "id" | "createdAt">>) {
  const userId = await getUserId();
  return dbUpdateNote(id, userId, data);
}

export async function actionDeleteNote(id: string) {
  const userId = await getUserId();
  return dbDeleteNote(id, userId);
}

export async function actionTogglePin(id: string) {
  const userId = await getUserId();
  return dbTogglePin(id, userId);
}

export async function actionSyncLocalNotes(notes: Note[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      dbCreateNote(userId, {
        title: n.title,
        content: n.content,
        tags: n.tags,
        pinned: n.pinned,
      })
    )
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\sync-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// ── Notes ──────────────────────────────────────────────────────────────────────
export async function syncNotes(notes: any[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      prisma.note.upsert({
        where: { id: n.id },
        update: { title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
        create: { id: n.id, userId, title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
      })
    )
  );
}

// ── Part One ───────────────────────────────────────────────────────────────────
export async function syncPart
```


## License: unknown
https://github.com/Thiti-Dev/scraping-gateways/blob/7751be04cb07fee411a694657099b67c36b2258a/src/controllers/cores.ts

```
Let me read the current layout and auth files before making changes.   Now I have full context. Here's the plan:
1. Uninstall `next-auth`, remove `auth.ts`, `types/next-auth.d.ts`, the catch-all route
2. Install `@clerk/nextjs`
3. Create `middleware.ts` (not `proxy.ts` — Next.js uses `middleware.ts`)
4. Update `app/layout.tsx` with `ClerkProvider`
5. Update dashboard nav + sign-in page
6. Update `lib/notes-actions.ts` and `lib/sync-actions.ts` to use Clerk's `auth()`
````powershell
npm uninstall next-auth @auth/prisma-adapter && npm install @clerk/nextjs@latest
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/(.*)",
    "/(api|trpc)(.*)",
  ],
};
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\app\layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atomic Habits Companion",
  description: "Build better habits, one step at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\components\providers.tsx
"use client";

// SessionProvider removed — Clerk handles session state via ClerkProvider in layout.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
````

Now update the server actions to use Clerk's `auth()`, update the dashboard nav, replace the sign-in page, and delete the old auth files:
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\notes-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import {
  dbGetNotes,
  dbGetNoteById,
  dbCreateNote,
  dbUpdateNote,
  dbDeleteNote,
  dbTogglePin,
} from "@/lib/notes-db";
import type { Note } from "@/types/habit";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function actionGetNotes() {
  const userId = await getUserId();
  return dbGetNotes(userId);
}

export async function actionGetNoteById(id: string) {
  const userId = await getUserId();
  return dbGetNoteById(id, userId);
}

export async function actionCreateNote(data: Omit<Note, "id" | "createdAt" | "updatedAt">) {
  const userId = await getUserId();
  return dbCreateNote(userId, data);
}

export async function actionUpdateNote(id: string, data: Partial<Omit<Note, "id" | "createdAt">>) {
  const userId = await getUserId();
  return dbUpdateNote(id, userId, data);
}

export async function actionDeleteNote(id: string) {
  const userId = await getUserId();
  return dbDeleteNote(id, userId);
}

export async function actionTogglePin(id: string) {
  const userId = await getUserId();
  return dbTogglePin(id, userId);
}

export async function actionSyncLocalNotes(notes: Note[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      dbCreateNote(userId, {
        title: n.title,
        content: n.content,
        tags: n.tags,
        pinned: n.pinned,
      })
    )
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\sync-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// ── Notes ──────────────────────────────────────────────────────────────────────
export async function syncNotes(notes: any[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      prisma.note.upsert({
        where: { id: n.id },
        update: { title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
        create: { id: n.id, userId, title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
      })
    )
  );
}

// ── Part One ───────────────────────────────────────────────────────────────────
export async function syncPart
```


## License: unknown
https://github.com/Thiti-Dev/scraping-gateways/blob/7751be04cb07fee411a694657099b67c36b2258a/src/controllers/cores.ts

```
Let me read the current layout and auth files before making changes.   Now I have full context. Here's the plan:
1. Uninstall `next-auth`, remove `auth.ts`, `types/next-auth.d.ts`, the catch-all route
2. Install `@clerk/nextjs`
3. Create `middleware.ts` (not `proxy.ts` — Next.js uses `middleware.ts`)
4. Update `app/layout.tsx` with `ClerkProvider`
5. Update dashboard nav + sign-in page
6. Update `lib/notes-actions.ts` and `lib/sync-actions.ts` to use Clerk's `auth()`
````powershell
npm uninstall next-auth @auth/prisma-adapter && npm install @clerk/nextjs@latest
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/(.*)",
    "/(api|trpc)(.*)",
  ],
};
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\app\layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atomic Habits Companion",
  description: "Build better habits, one step at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\components\providers.tsx
"use client";

// SessionProvider removed — Clerk handles session state via ClerkProvider in layout.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
````

Now update the server actions to use Clerk's `auth()`, update the dashboard nav, replace the sign-in page, and delete the old auth files:
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\notes-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import {
  dbGetNotes,
  dbGetNoteById,
  dbCreateNote,
  dbUpdateNote,
  dbDeleteNote,
  dbTogglePin,
} from "@/lib/notes-db";
import type { Note } from "@/types/habit";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function actionGetNotes() {
  const userId = await getUserId();
  return dbGetNotes(userId);
}

export async function actionGetNoteById(id: string) {
  const userId = await getUserId();
  return dbGetNoteById(id, userId);
}

export async function actionCreateNote(data: Omit<Note, "id" | "createdAt" | "updatedAt">) {
  const userId = await getUserId();
  return dbCreateNote(userId, data);
}

export async function actionUpdateNote(id: string, data: Partial<Omit<Note, "id" | "createdAt">>) {
  const userId = await getUserId();
  return dbUpdateNote(id, userId, data);
}

export async function actionDeleteNote(id: string) {
  const userId = await getUserId();
  return dbDeleteNote(id, userId);
}

export async function actionTogglePin(id: string) {
  const userId = await getUserId();
  return dbTogglePin(id, userId);
}

export async function actionSyncLocalNotes(notes: Note[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      dbCreateNote(userId, {
        title: n.title,
        content: n.content,
        tags: n.tags,
        pinned: n.pinned,
      })
    )
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\sync-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// ── Notes ──────────────────────────────────────────────────────────────────────
export async function syncNotes(notes: any[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      prisma.note.upsert({
        where: { id: n.id },
        update: { title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
        create: { id: n.id, userId, title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
      })
    )
  );
}

// ── Part One ───────────────────────────────────────────────────────────────────
export async function syncPart
```


## License: unknown
https://github.com/Thiti-Dev/scraping-gateways/blob/7751be04cb07fee411a694657099b67c36b2258a/src/controllers/cores.ts

```
Let me read the current layout and auth files before making changes.   Now I have full context. Here's the plan:
1. Uninstall `next-auth`, remove `auth.ts`, `types/next-auth.d.ts`, the catch-all route
2. Install `@clerk/nextjs`
3. Create `middleware.ts` (not `proxy.ts` — Next.js uses `middleware.ts`)
4. Update `app/layout.tsx` with `ClerkProvider`
5. Update dashboard nav + sign-in page
6. Update `lib/notes-actions.ts` and `lib/sync-actions.ts` to use Clerk's `auth()`
````powershell
npm uninstall next-auth @auth/prisma-adapter && npm install @clerk/nextjs@latest
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/(.*)",
    "/(api|trpc)(.*)",
  ],
};
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\app\layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atomic Habits Companion",
  description: "Build better habits, one step at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\components\providers.tsx
"use client";

// SessionProvider removed — Clerk handles session state via ClerkProvider in layout.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
````

Now update the server actions to use Clerk's `auth()`, update the dashboard nav, replace the sign-in page, and delete the old auth files:
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\notes-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import {
  dbGetNotes,
  dbGetNoteById,
  dbCreateNote,
  dbUpdateNote,
  dbDeleteNote,
  dbTogglePin,
} from "@/lib/notes-db";
import type { Note } from "@/types/habit";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function actionGetNotes() {
  const userId = await getUserId();
  return dbGetNotes(userId);
}

export async function actionGetNoteById(id: string) {
  const userId = await getUserId();
  return dbGetNoteById(id, userId);
}

export async function actionCreateNote(data: Omit<Note, "id" | "createdAt" | "updatedAt">) {
  const userId = await getUserId();
  return dbCreateNote(userId, data);
}

export async function actionUpdateNote(id: string, data: Partial<Omit<Note, "id" | "createdAt">>) {
  const userId = await getUserId();
  return dbUpdateNote(id, userId, data);
}

export async function actionDeleteNote(id: string) {
  const userId = await getUserId();
  return dbDeleteNote(id, userId);
}

export async function actionTogglePin(id: string) {
  const userId = await getUserId();
  return dbTogglePin(id, userId);
}

export async function actionSyncLocalNotes(notes: Note[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      dbCreateNote(userId, {
        title: n.title,
        content: n.content,
        tags: n.tags,
        pinned: n.pinned,
      })
    )
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\sync-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// ── Notes ──────────────────────────────────────────────────────────────────────
export async function syncNotes(notes: any[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      prisma.note.upsert({
        where: { id: n.id },
        update: { title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
        create: { id: n.id, userId, title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
      })
    )
  );
}

// ── Part One ───────────────────────────────────────────────────────────────────
export async function syncPartOne(data: any) {
  const userId = await getUserId();
  const { projects = [], ...rest } = data;
  const record = await prisma.assessmentPartOne.upsert({
    where: { id: data.id ?? "" },
    update: { ...rest, userId },
    create: { ...rest, userId },
  });
  await prisma.project.deleteMany({ where: { assessmentPartOneId: record.id } });
  await prisma.project.createMany({
    data: projects.map((p: any) => ({ ...p, assessmentPartOneId: record.id })),
  });
}

// ── Part Two ───────────────────────────────────────────────────────────────────
export async function syncPartTwo(data: any) {
  const userId =
```


## License: unknown
https://github.com/Thiti-Dev/scraping-gateways/blob/7751be04cb07fee411a694657099b67c36b2258a/src/controllers/cores.ts

```
Let me read the current layout and auth files before making changes.   Now I have full context. Here's the plan:
1. Uninstall `next-auth`, remove `auth.ts`, `types/next-auth.d.ts`, the catch-all route
2. Install `@clerk/nextjs`
3. Create `middleware.ts` (not `proxy.ts` — Next.js uses `middleware.ts`)
4. Update `app/layout.tsx` with `ClerkProvider`
5. Update dashboard nav + sign-in page
6. Update `lib/notes-actions.ts` and `lib/sync-actions.ts` to use Clerk's `auth()`
````powershell
npm uninstall next-auth @auth/prisma-adapter && npm install @clerk/nextjs@latest
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/(.*)",
    "/(api|trpc)(.*)",
  ],
};
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\app\layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atomic Habits Companion",
  description: "Build better habits, one step at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\components\providers.tsx
"use client";

// SessionProvider removed — Clerk handles session state via ClerkProvider in layout.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
````

Now update the server actions to use Clerk's `auth()`, update the dashboard nav, replace the sign-in page, and delete the old auth files:
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\notes-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import {
  dbGetNotes,
  dbGetNoteById,
  dbCreateNote,
  dbUpdateNote,
  dbDeleteNote,
  dbTogglePin,
} from "@/lib/notes-db";
import type { Note } from "@/types/habit";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function actionGetNotes() {
  const userId = await getUserId();
  return dbGetNotes(userId);
}

export async function actionGetNoteById(id: string) {
  const userId = await getUserId();
  return dbGetNoteById(id, userId);
}

export async function actionCreateNote(data: Omit<Note, "id" | "createdAt" | "updatedAt">) {
  const userId = await getUserId();
  return dbCreateNote(userId, data);
}

export async function actionUpdateNote(id: string, data: Partial<Omit<Note, "id" | "createdAt">>) {
  const userId = await getUserId();
  return dbUpdateNote(id, userId, data);
}

export async function actionDeleteNote(id: string) {
  const userId = await getUserId();
  return dbDeleteNote(id, userId);
}

export async function actionTogglePin(id: string) {
  const userId = await getUserId();
  return dbTogglePin(id, userId);
}

export async function actionSyncLocalNotes(notes: Note[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      dbCreateNote(userId, {
        title: n.title,
        content: n.content,
        tags: n.tags,
        pinned: n.pinned,
      })
    )
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\sync-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// ── Notes ──────────────────────────────────────────────────────────────────────
export async function syncNotes(notes: any[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      prisma.note.upsert({
        where: { id: n.id },
        update: { title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
        create: { id: n.id, userId, title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
      })
    )
  );
}

// ── Part One ───────────────────────────────────────────────────────────────────
export async function syncPartOne(data: any) {
  const userId = await getUserId();
  const { projects = [], ...rest } = data;
  const record = await prisma.assessmentPartOne.upsert({
    where: { id: data.id ?? "" },
    update: { ...rest, userId },
    create: { ...rest, userId },
  });
  await prisma.project.deleteMany({ where: { assessmentPartOneId: record.id } });
  await prisma.project.createMany({
    data: projects.map((p: any) => ({ ...p, assessmentPartOneId: record.id })),
  });
}

// ── Part Two ───────────────────────────────────────────────────────────────────
export async function syncPartTwo(data: any) {
  const userId =
```


## License: unknown
https://github.com/Thiti-Dev/scraping-gateways/blob/7751be04cb07fee411a694657099b67c36b2258a/src/controllers/cores.ts

```
Let me read the current layout and auth files before making changes.   Now I have full context. Here's the plan:
1. Uninstall `next-auth`, remove `auth.ts`, `types/next-auth.d.ts`, the catch-all route
2. Install `@clerk/nextjs`
3. Create `middleware.ts` (not `proxy.ts` — Next.js uses `middleware.ts`)
4. Update `app/layout.tsx` with `ClerkProvider`
5. Update dashboard nav + sign-in page
6. Update `lib/notes-actions.ts` and `lib/sync-actions.ts` to use Clerk's `auth()`
````powershell
npm uninstall next-auth @auth/prisma-adapter && npm install @clerk/nextjs@latest
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/(.*)",
    "/(api|trpc)(.*)",
  ],
};
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\app\layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atomic Habits Companion",
  description: "Build better habits, one step at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\components\providers.tsx
"use client";

// SessionProvider removed — Clerk handles session state via ClerkProvider in layout.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
````

Now update the server actions to use Clerk's `auth()`, update the dashboard nav, replace the sign-in page, and delete the old auth files:
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\notes-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import {
  dbGetNotes,
  dbGetNoteById,
  dbCreateNote,
  dbUpdateNote,
  dbDeleteNote,
  dbTogglePin,
} from "@/lib/notes-db";
import type { Note } from "@/types/habit";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function actionGetNotes() {
  const userId = await getUserId();
  return dbGetNotes(userId);
}

export async function actionGetNoteById(id: string) {
  const userId = await getUserId();
  return dbGetNoteById(id, userId);
}

export async function actionCreateNote(data: Omit<Note, "id" | "createdAt" | "updatedAt">) {
  const userId = await getUserId();
  return dbCreateNote(userId, data);
}

export async function actionUpdateNote(id: string, data: Partial<Omit<Note, "id" | "createdAt">>) {
  const userId = await getUserId();
  return dbUpdateNote(id, userId, data);
}

export async function actionDeleteNote(id: string) {
  const userId = await getUserId();
  return dbDeleteNote(id, userId);
}

export async function actionTogglePin(id: string) {
  const userId = await getUserId();
  return dbTogglePin(id, userId);
}

export async function actionSyncLocalNotes(notes: Note[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      dbCreateNote(userId, {
        title: n.title,
        content: n.content,
        tags: n.tags,
        pinned: n.pinned,
      })
    )
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\sync-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// ── Notes ──────────────────────────────────────────────────────────────────────
export async function syncNotes(notes: any[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      prisma.note.upsert({
        where: { id: n.id },
        update: { title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
        create: { id: n.id, userId, title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
      })
    )
  );
}

// ── Part One ───────────────────────────────────────────────────────────────────
export async function syncPartOne(data: any) {
  const userId = await getUserId();
  const { projects = [], ...rest } = data;
  const record = await prisma.assessmentPartOne.upsert({
    where: { id: data.id ?? "" },
    update: { ...rest, userId },
    create: { ...rest, userId },
  });
  await prisma.project.deleteMany({ where: { assessmentPartOneId: record.id } });
  await prisma.project.createMany({
    data: projects.map((p: any) => ({ ...p, assessmentPartOneId: record.id })),
  });
}

// ── Part Two ───────────────────────────────────────────────────────────────────
export async function syncPartTwo(data: any) {
  const userId =
```


## License: unknown
https://github.com/Thiti-Dev/scraping-gateways/blob/7751be04cb07fee411a694657099b67c36b2258a/src/controllers/cores.ts

```
Let me read the current layout and auth files before making changes.   Now I have full context. Here's the plan:
1. Uninstall `next-auth`, remove `auth.ts`, `types/next-auth.d.ts`, the catch-all route
2. Install `@clerk/nextjs`
3. Create `middleware.ts` (not `proxy.ts` — Next.js uses `middleware.ts`)
4. Update `app/layout.tsx` with `ClerkProvider`
5. Update dashboard nav + sign-in page
6. Update `lib/notes-actions.ts` and `lib/sync-actions.ts` to use Clerk's `auth()`
````powershell
npm uninstall next-auth @auth/prisma-adapter && npm install @clerk/nextjs@latest
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/(.*)",
    "/(api|trpc)(.*)",
  ],
};
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\app\layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atomic Habits Companion",
  description: "Build better habits, one step at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\components\providers.tsx
"use client";

// SessionProvider removed — Clerk handles session state via ClerkProvider in layout.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
````

Now update the server actions to use Clerk's `auth()`, update the dashboard nav, replace the sign-in page, and delete the old auth files:
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\notes-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import {
  dbGetNotes,
  dbGetNoteById,
  dbCreateNote,
  dbUpdateNote,
  dbDeleteNote,
  dbTogglePin,
} from "@/lib/notes-db";
import type { Note } from "@/types/habit";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function actionGetNotes() {
  const userId = await getUserId();
  return dbGetNotes(userId);
}

export async function actionGetNoteById(id: string) {
  const userId = await getUserId();
  return dbGetNoteById(id, userId);
}

export async function actionCreateNote(data: Omit<Note, "id" | "createdAt" | "updatedAt">) {
  const userId = await getUserId();
  return dbCreateNote(userId, data);
}

export async function actionUpdateNote(id: string, data: Partial<Omit<Note, "id" | "createdAt">>) {
  const userId = await getUserId();
  return dbUpdateNote(id, userId, data);
}

export async function actionDeleteNote(id: string) {
  const userId = await getUserId();
  return dbDeleteNote(id, userId);
}

export async function actionTogglePin(id: string) {
  const userId = await getUserId();
  return dbTogglePin(id, userId);
}

export async function actionSyncLocalNotes(notes: Note[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      dbCreateNote(userId, {
        title: n.title,
        content: n.content,
        tags: n.tags,
        pinned: n.pinned,
      })
    )
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\sync-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// ── Notes ──────────────────────────────────────────────────────────────────────
export async function syncNotes(notes: any[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      prisma.note.upsert({
        where: { id: n.id },
        update: { title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
        create: { id: n.id, userId, title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
      })
    )
  );
}

// ── Part One ───────────────────────────────────────────────────────────────────
export async function syncPartOne(data: any) {
  const userId = await getUserId();
  const { projects = [], ...rest } = data;
  const record = await prisma.assessmentPartOne.upsert({
    where: { id: data.id ?? "" },
    update: { ...rest, userId },
    create: { ...rest, userId },
  });
  await prisma.project.deleteMany({ where: { assessmentPartOneId: record.id } });
  await prisma.project.createMany({
    data: projects.map((p: any) => ({ ...p, assessmentPartOneId: record.id })),
  });
}

// ── Part Two ───────────────────────────────────────────────────────────────────
export async function syncPartTwo(data: any) {
  const userId = await getUserId();
  const { dayLogs = [], ...rest } = data;
  const record = await prisma.assessmentPartTwo.upsert({
    where: { id: data.id ?? "" },
    update: { ...rest, userId },
    create: { ...rest, userId },
  });
  await prisma.dayLog.deleteMany({ where: { assessmentPartTwoId: record.id } });
  for (const day of dayLogs) {
    const { hourlyEntries = [], ...dayRest } = day;
    const dayRecord = await prisma.dayLog.create({
      data: { ...dayRest, assessmentPartTwoId: record.id },
    });
    await prisma.hourlyEntry.createMany({
      data: hourlyEntries.map((h: any) => ({ ...h, dayLogId: dayRecord.id })),
    });
  }
}

// ── Part Three ─────────────────────────────────────────────────────────────────
export async function syncPartThree(data: any) {
  const userId =
```


## License: unknown
https://github.com/Thiti-Dev/scraping-gateways/blob/7751be04cb07fee411a694657099b67c36b2258a/src/controllers/cores.ts

```
Let me read the current layout and auth files before making changes.   Now I have full context. Here's the plan:
1. Uninstall `next-auth`, remove `auth.ts`, `types/next-auth.d.ts`, the catch-all route
2. Install `@clerk/nextjs`
3. Create `middleware.ts` (not `proxy.ts` — Next.js uses `middleware.ts`)
4. Update `app/layout.tsx` with `ClerkProvider`
5. Update dashboard nav + sign-in page
6. Update `lib/notes-actions.ts` and `lib/sync-actions.ts` to use Clerk's `auth()`
````powershell
npm uninstall next-auth @auth/prisma-adapter && npm install @clerk/nextjs@latest
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/(.*)",
    "/(api|trpc)(.*)",
  ],
};
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\app\layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Atomic Habits Companion",
  description: "Build better habits, one step at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\components\providers.tsx
"use client";

// SessionProvider removed — Clerk handles session state via ClerkProvider in layout.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
````

Now update the server actions to use Clerk's `auth()`, update the dashboard nav, replace the sign-in page, and delete the old auth files:
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\notes-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import {
  dbGetNotes,
  dbGetNoteById,
  dbCreateNote,
  dbUpdateNote,
  dbDeleteNote,
  dbTogglePin,
} from "@/lib/notes-db";
import type { Note } from "@/types/habit";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function actionGetNotes() {
  const userId = await getUserId();
  return dbGetNotes(userId);
}

export async function actionGetNoteById(id: string) {
  const userId = await getUserId();
  return dbGetNoteById(id, userId);
}

export async function actionCreateNote(data: Omit<Note, "id" | "createdAt" | "updatedAt">) {
  const userId = await getUserId();
  return dbCreateNote(userId, data);
}

export async function actionUpdateNote(id: string, data: Partial<Omit<Note, "id" | "createdAt">>) {
  const userId = await getUserId();
  return dbUpdateNote(id, userId, data);
}

export async function actionDeleteNote(id: string) {
  const userId = await getUserId();
  return dbDeleteNote(id, userId);
}

export async function actionTogglePin(id: string) {
  const userId = await getUserId();
  return dbTogglePin(id, userId);
}

export async function actionSyncLocalNotes(notes: Note[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      dbCreateNote(userId, {
        title: n.title,
        content: n.content,
        tags: n.tags,
        pinned: n.pinned,
      })
    )
  );
}
````
````typescript
// filepath: c:\Users\caref\atomic-habits-companion\lib\sync-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// ── Notes ──────────────────────────────────────────────────────────────────────
export async function syncNotes(notes: any[]) {
  const userId = await getUserId();
  await Promise.all(
    notes.map((n) =>
      prisma.note.upsert({
        where: { id: n.id },
        update: { title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
        create: { id: n.id, userId, title: n.title, content: n.content, tags: n.tags, pinned: n.pinned },
      })
    )
  );
}

// ── Part One ───────────────────────────────────────────────────────────────────
export async function syncPartOne(data: any) {
  const userId = await getUserId();
  const { projects = [], ...rest } = data;
  const record = await prisma.assessmentPartOne.upsert({
    where: { id: data.id ?? "" },
    update: { ...rest, userId },
    create: { ...rest, userId },
  });
  await prisma.project.deleteMany({ where: { assessmentPartOneId: record.id } });
  await prisma.project.createMany({
    data: projects.map((p: any) => ({ ...p, assessmentPartOneId: record.id })),
  });
}

// ── Part Two ───────────────────────────────────────────────────────────────────
export async function syncPartTwo(data: any) {
  const userId = await getUserId();
  const { dayLogs = [], ...rest } = data;
  const record = await prisma.assessmentPartTwo.upsert({
    where: { id: data.id ?? "" },
    update: { ...rest, userId },
    create: { ...rest, userId },
  });
  await prisma.dayLog.deleteMany({ where: { assessmentPartTwoId: record.id } });
  for (const day of dayLogs) {
    const { hourlyEntries = [], ...dayRest } = day;
    const dayRecord = await prisma.dayLog.create({
      data: { ...dayRest, assessmentPartTwoId: record.id },
    });
    await prisma.hourlyEntry.createMany({
      data: hourlyEntries.map((h: any) => ({ ...h, dayLogId: dayRecord.id })),
    });
  }
}

// ── Part Three ─────────────────────────────────────────────────────────────────
export async function syncPartThree(data: any) {
  const userId =
```

