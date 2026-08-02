# Folder Structure Reference

This document captures the current organization of the App Router, UI components, server-side helpers, and Prisma data model.

## Route structure (app/)

The app uses the Next.js App Router. Route groups are indicated with parentheses and do not affect the URL path.

```text
app/
├── (auth)/
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
├── api/
│   └── webhooks/
│       └── clerk/route.ts
├── checklists/
│   ├── [id]/page.tsx
│   ├── new/page.tsx
│   ├── page.tsx
│   └── templates/
│       ├── new/page.tsx
│       └── page.tsx
├── commitments/page.tsx
├── committments/page.tsx
├── dashboard/page.tsx
├── goals/
│   ├── [goalId]/page.tsx
│   ├── new/page.tsx
│   └── page.tsx
├── habit-assessment/[id]/
│   ├── next-step/page.tsx
│   ├── page.tsx
│   ├── part-five/page.tsx
│   ├── part-four/page.tsx
│   ├── part-three/page.tsx
│   ├── part-two/page.tsx
│   └── review/page.tsx
├── habits/
│   ├── [habitId]/page.tsx
│   ├── category/[slug]/page.tsx
│   ├── new/page.tsx
│   └── page.tsx
├── ideals/page.tsx
├── identities/
│   ├── [identityId]/goals/[goalId]/habits/[habitId]/page.tsx
│   ├── [identityId]/goals/[goalId]/page.tsx
│   ├── [identityId]/page.tsx
│   ├── new/page.tsx
│   └── page.tsx
├── identity/page.tsx
├── laws/
│   ├── 0/page.tsx
│   ├── 1/page.tsx
│   ├── 2/page.tsx
│   ├── 3/page.tsx
│   └── 4/page.tsx
├── notes/
│   ├── [id]/page.tsx
│   ├── new/page.tsx
│   └── page.tsx
├── page.tsx
├── profile/page.tsx
├── settings/page.tsx
├── vision/page.tsx
└── layout.tsx
```

Key notes:
- The app is grouped by feature area rather than by technical layer.
- The auth pages live under the route group [app/(auth)](../app/(auth)) and are still served from `/sign-in` and `/sign-up`.
- The canonical content page for commitments is currently [app/committments/page.tsx](../app/committments/page.tsx); [app/commitments/page.tsx](../app/commitments/page.tsx) redirects to it.
- Dynamic segments use bracket notation, for example [app/habits/[habitId]/page.tsx](../app/habits/[habitId]/page.tsx) and [app/identities/[identityId]/page.tsx](../app/identities/[identityId]/page.tsx).

## Components folder (components/)

The components folder is organized by feature domain and contains mostly presentational UI plus a few client-side orchestration components.

### Shared components
- [components/site-navbar.tsx](../components/site-navbar.tsx): top navigation shell.
- [components/providers.tsx](../components/providers.tsx): app-wide providers wrapper.
- [components/HabitCard.tsx](../components/HabitCard.tsx): generic habit card used across pages.
- [components/Textarea.tsx](../components/Textarea.tsx): reusable textarea input.

### Feature folders
- [components/auth](../components/auth): Clerk and post-sign-in sync UI.
- [components/assessment-review](../components/assessment-review): review experience for assessment output.
- [components/checklists](../components/checklists): checklist editors, modals, and client views.
- [components/dashboard](../components/dashboard): onboarding and dashboard UIs.
- [components/goals](../components/goals): goal cards and goal pages.
- [components/habit-assessment](../components/habit-assessment): multi-step assessment forms.
- [components/habits](../components/habits): habit tracker, calendar, category views, and check-ins.
- [components/identity](../components/identity): identity cards, editors, and tree visualization.
- [components/laws](../components/laws): law content shell.
- [components/notes](../components/notes): rich editor, note cards, note reader, and notes panel.
- [components/profile](../components/profile): profile page sections and settings form.

## Lib folder (lib/)

The lib folder contains server-side logic, data access helpers, and domain utilities. It is the bridge between route-level components and Prisma.

### Server actions
- [lib/actions](../lib/actions): feature-level server actions for dashboard, habits, profile settings, part-four assessment, next-step planning, and user provisioning.

### Data access and domain helpers
- [lib/prisma.ts](../lib/prisma.ts): Prisma client singleton and database adapter wiring.
- [lib/assessment-reads.ts](../lib/assessment-reads.ts): reads for assessment-related data.
- [lib/profile-data.ts](../lib/profile-data.ts): profile snapshots and related data reads.
- [lib/profile-settings.ts](../lib/profile-settings.ts) and [lib/profile-settings-server.ts](../lib/profile-settings-server.ts): profile-setting helpers split between client-safe and server-safe logic.
- [lib/energy-analysis.ts](../lib/energy-analysis.ts): pure analysis logic for energy and activity patterns.

### Notes and checklist support
- [lib/notes-actions.ts](../lib/notes-actions.ts), [lib/notes-db.ts](../lib/notes-db.ts), and [lib/notes-store.ts](../lib/notes-store.ts): note CRUD, persistence helpers, and local store support.
- [lib/checklists-actions.ts](../lib/checklists-actions.ts): checklist CRUD and related actions.
- [lib/sync-actions.ts](../lib/sync-actions.ts): sync flow for moving local assessment/note data into the database.

### Utilities
- [lib/utils.ts](../lib/utils.ts): small shared utilities.

## Prisma schema (prisma/schema.prisma)

The Prisma schema is the source of truth for the PostgreSQL-backed data model. The generated client is emitted under [app/generated/prisma](../app/generated/prisma), but the editable schema lives at [prisma/schema.prisma](../prisma/schema.prisma).

### Model groups

#### Auth and identity
- `User`: the primary user record, with one-to-many relationships to notes, checklists, and tracked habits, plus one-to-one links to the assessment models.
- `Account`, `Session`, `VerificationToken`: compatibility/auth models present alongside the current Clerk-based approach.

#### Notes
- `Note`: rich text note content plus metadata such as tags, pinning, and optional profile entity references.

#### Habit assessment models
- `AssessmentPartOne`, `AssessmentPartTwo`, `AssessmentPartThree`, `AssessmentPartFour`: one per user, each storing the responses for a different assessment stage.
- `Project`, `DayLog`, `HourlyEntry`, `HabitRecord`, `HabitAttempt`, `HabitScorecard`, `HabitScorecardEntry`, `DomainVisionEntry`, `IdentityRecord`: child records that support the assessment workflow and the later identity/goal planning flow.

#### Next-step planning
- `AssessmentNextStep` and `NextStepGoalEntry`: goal planning records that can be linked to an identity and to tracked habits.

#### Checklists
- `ChecklistTemplate` and `Checklist`: reusable checklist templates plus user-specific checklist instances.

#### Habit tracking
- `TrackedHabit`, `HabitCue`, and `HabitCheckIn`: the habit-tracking layer that supports cues, categories, and daily check-ins.

### Structural patterns
- The schema uses a single `User` root for most domain data.
- Many child records are deleted automatically when their parent record is removed (`onDelete: Cascade`).
- Some relationships are optional and use `SetNull` for parent-child links that should survive the parent deletion, such as goal entries and tracked habits linked to identities.
- The schema is configured for PostgreSQL and uses the generated Prisma client output from [app/generated/prisma](../app/generated/prisma).
