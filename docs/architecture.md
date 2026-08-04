# Atomic Habits Companion Architecture and Data Flows

## Purpose
This document maps the current system architecture and runtime data flows for the app, with direct references to implementation files.

## 1) System Context

```mermaid
flowchart LR
  U[User Browser]
  C[Clerk Auth]
  W[Clerk Webhooks]
  N[Next.js App Router\napp/*]
  CC[Client Components\ncomponents/*]
  SA[Server Actions\nlib/actions/*]
  DS[Domain Services\nlib/*]
  P[Prisma Client + PrismaPg Adapter\nlib/prisma.ts]
  DB[(PostgreSQL)]
  LS[(localStorage / sessionStorage)]

  U --> N
  U --> C
  C --> W
  W --> N

  N --> CC
  CC --> SA
  SA --> DS
  DS --> P
  P --> DB

  CC <--> LS
  N --> SA
```

### Anchors
- Route and app entry boundaries: [app/layout.tsx](app/layout.tsx)
- Auth webhook ingress: [app/api/webhooks/clerk/route.ts](app/api/webhooks/clerk/route.ts)
- Client sync bridge: [components/auth/post-signin-sync.tsx](components/auth/post-signin-sync.tsx)
- DB adapter and Prisma client: [lib/prisma.ts](lib/prisma.ts)

## 2) Layered Architecture

```mermaid
flowchart TB
  subgraph L1[Presentation Layer]
    P1[App Router Pages\napp/**/page.tsx]
    P2[Client UI Components\ncomponents/**]
  end

  subgraph L2[Application Layer]
    A1[Server Actions\nlib/actions/*]
    A2[Feature Action Files\nlib/notes-actions.ts\nlib/checklists-actions.ts\nlib/sync-actions.ts]
  end

  subgraph L3[Domain and Data Access]
    D1[Domain Reads and Aggregation\nlib/assessment-reads.ts\nlib/profile-data.ts]
    D2[Calculation Services\nlib/energy-analysis.ts]
    D3[DB Access\nlib/notes-db.ts + Prisma]
  end

  subgraph L4[Infrastructure]
    I1[Prisma Client + Adapter]
    I2[PostgreSQL]
    I3[Clerk + Svix]
  end

  P1 --> P2
  P2 --> A1
  P2 --> A2
  A1 --> D1
  A1 --> D3
  A2 --> D3
  D1 --> I1
  D3 --> I1
  I1 --> I2
  I3 --> A1
```

## 3) Core Runtime Flows

### 3.1 Auth Webhook and User Provisioning

```mermaid
sequenceDiagram
  autonumber
  participant Clerk as Clerk
  participant API as app/api/webhooks/clerk/route.ts
  participant Actions as lib/actions/user-actions.ts
  participant Prisma as lib/prisma.ts
  participant DB as PostgreSQL

  Clerk->>API: user.created / user.updated / user.deleted
  API->>API: Verify svix-id/timestamp/signature
  API->>Actions: createUser / updateUser / deleteUser
  Actions->>Prisma: Prisma calls
  Prisma->>DB: write changes
  API-->>Clerk: { received: true }
```

Implementation anchors:
- [app/api/webhooks/clerk/route.ts](app/api/webhooks/clerk/route.ts)
- [lib/actions/user-actions.ts](lib/actions/user-actions.ts)

### 3.2 Post-Sign-In Client Sync (localStorage to DB)

```mermaid
sequenceDiagram
  autonumber
  participant UI as components/auth/post-signin-sync.tsx
  participant Sync as lib/sync-actions.ts
  participant Prisma as lib/prisma.ts
  participant DB as PostgreSQL
  participant Storage as localStorage/sessionStorage

  UI->>Storage: Read SYNC_FLAG and assessment/note keys
  UI->>Sync: ensureDbUser()
  Sync->>Prisma: upsert/find user
  Prisma->>DB: ensure user row

  alt first sync this session
    UI->>Sync: syncNotes(notes)
    UI->>Sync: syncPartOne(payload)
    UI->>Sync: syncPartTwo(payload)
    UI->>Sync: syncPartThree(payload)
    Sync->>Prisma: upsert assessment and note rows
    Prisma->>DB: persist data
    UI->>Storage: set SYNC_FLAG
  else already synced
    UI-->>UI: skip sync
  end
```

Implementation anchors:
- [components/auth/post-signin-sync.tsx](components/auth/post-signin-sync.tsx)
- [lib/sync-actions.ts](lib/sync-actions.ts)

### 3.3 Assessment Part Four and Next Step Lifecycle

```mermaid
sequenceDiagram
  autonumber
  participant Page as app/goals/page.tsx + app/identity/page.tsx
  participant UI as components/habit-assessment/*
  participant P4 as lib/actions/assessment-part-four-actions.ts
  participant NS as lib/actions/assessment-next-step-actions.ts
  participant WG as lib/actions/identity-goal-actions.ts
  participant Prisma as lib/prisma.ts
  participant DB as PostgreSQL

  Page->>UI: Render form with fetched data
  UI->>P4: fetchPartFour() / upsertPartFour(payload)
  UI->>NS: fetchNextStep() / upsertNextStep(payload)
  UI->>WG: attach/update identity and goal mappings after assessment completion
  P4->>Prisma: findUnique/upsert + child sync
  NS->>Prisma: findUnique/upsert + goal entries replace
  WG->>Prisma: update identity/goal linkage records
  Prisma->>DB: write and read records
  DB-->>Prisma: persisted state
  Prisma-->>UI: normalized records
```

Implementation anchors:
- [lib/actions/assessment-part-four-actions.ts](lib/actions/assessment-part-four-actions.ts)
- [lib/actions/assessment-next-step-actions.ts](lib/actions/assessment-next-step-actions.ts)
- [lib/actions/identity-goal-actions.ts](lib/actions/identity-goal-actions.ts)

### 3.4 Goal to Tracked Habit to Cue Flow

```mermaid
sequenceDiagram
  autonumber
  participant Goals as NextStepGoalEntry
  participant HabitActions as lib/actions/habit-actions.ts
  participant Prisma as lib/prisma.ts
  participant DB as PostgreSQL

  HabitActions->>Prisma: actionGetOrCreateHabitsForGoal(goalId)
  Prisma->>DB: upsert TrackedHabit rows
  DB-->>Prisma: tracked habits

  HabitActions->>Prisma: actionAddHabitCue(habitId, cue)
  Prisma->>DB: insert HabitCue
  DB-->>Prisma: cue rows

  HabitActions->>Prisma: actionGetHabitCues(habitId)
  Prisma->>DB: query cues
  DB-->>HabitActions: cue timeline
```

Implementation anchors:
- [lib/actions/habit-actions.ts](lib/actions/habit-actions.ts)
- [components/habits/habit-tracker.tsx](components/habits/habit-tracker.tsx)

### 3.5 Notes by Profile Entity

```mermaid
sequenceDiagram
  autonumber
  participant UI as components/notes/*
  participant Actions as lib/notes-actions.ts
  participant DBLayer as lib/notes-db.ts
  participant Prisma as lib/prisma.ts
  participant DB as PostgreSQL

  UI->>Actions: actionCreateNote(payload)
  Actions->>DBLayer: create/update/get calls
  DBLayer->>Prisma: prisma.note.*
  Prisma->>DB: write/read Note
  DB-->>UI: notes tagged by profileEntityType/profileEntityId
```

Implementation anchors:
- [lib/notes-actions.ts](lib/notes-actions.ts)
- [lib/notes-db.ts](lib/notes-db.ts)
- [components/notes/profile-notes-panel.tsx](components/notes/profile-notes-panel.tsx)

### 3.6 Energy Analysis Pipeline

```mermaid
flowchart LR
  P2[AssessmentPartTwo.days[]] --> DL[DayLog[]]
  DL --> HE[HourlyEntry[]]
  HE --> EA[analyzePartTwoEnergy(days)]
  EA --> OUT[EnergyAnalysis aggregate\nTop UP hours\nTop DOWN hours\nActivity patterns]
```

Implementation anchors:
- [lib/energy-analysis.ts](lib/energy-analysis.ts)
- [lib/assessment-reads.ts](lib/assessment-reads.ts)

## 4) Logical Data Model (Prisma)

```mermaid
erDiagram
  User ||--o{ Note : owns
  User ||--o| AssessmentPartOne : has
  User ||--o| AssessmentPartTwo : has
  User ||--o| AssessmentPartThree : has
  User ||--o| AssessmentPartFour : has
  User ||--o| AssessmentNextStep : has
  User ||--o{ Checklist : owns
  User ||--o{ TrackedHabit : owns

  AssessmentPartOne ||--o{ Project : includes
  AssessmentPartTwo ||--o{ DayLog : includes
  DayLog ||--o{ HourlyEntry : includes

  AssessmentPartThree ||--o{ HabitRecord : beneficial_or_successful
  AssessmentPartThree ||--o{ HabitAttempt : includes
  AssessmentPartThree ||--o| HabitScorecard : morning
  AssessmentPartThree ||--o| HabitScorecard : afternoon
  AssessmentPartThree ||--o| HabitScorecard : evening
  HabitScorecard ||--o{ HabitScorecardEntry : includes

  AssessmentPartFour ||--o{ DomainVisionEntry : includes
  AssessmentPartFour ||--o{ IdentityRecord : includes

  AssessmentNextStep ||--o{ NextStepGoalEntry : includes
  NextStepGoalEntry ||--o{ TrackedHabit : seeds
  TrackedHabit ||--o{ HabitCue : logs
```

Schema source of truth:
- [prisma/schema.prisma](prisma/schema.prisma)

## 5) Route and Feature Map

| Route | Main Concern | Typical Component/Action Chain |
|---|---|---|
| /dashboard | Status and navigation hub | page -> dashboard client -> [lib/actions/dashboard-actions.ts](lib/actions/dashboard-actions.ts) |
| /habit-assessment/[id] | Guided assessments | page -> assessment forms -> part actions |
| /goals | Next step system design | page -> goal page component -> [lib/actions/next-step-actions.ts](lib/actions/next-step-actions.ts) |
| /habits and /habits/[habitId] | Habit and cue tracking | page -> habit tracker -> [lib/actions/habit-actions.ts](lib/actions/habit-actions.ts) |
| /notes and /notes/[id] | Rich notes CRUD | page -> notes components -> [lib/notes-actions.ts](lib/notes-actions.ts) |
| /checklists and /checklists/[id] | Checklist storage | page -> checklist UI -> [lib/checklists-actions.ts](lib/checklists-actions.ts) |
| /profile and /settings | Profile and settings | page -> profile components -> profile actions/settings services |
| /api/webhooks/clerk | Auth event ingestion | API route -> user actions -> Prisma |

## 6) Known Structural Notes

1. Commitments route naming is inverted from expected spelling.
- Canonical content page is currently at [app/committments/page.tsx](app/committments/page.tsx).
- [app/commitments/page.tsx](app/commitments/page.tsx) redirects to /committments.

2. Auth schema includes compatibility models while Clerk is the active provider.
- `Account`, `Session`, and `VerificationToken` exist in [prisma/schema.prisma](prisma/schema.prisma).

3. Laws pages are hardcoded as numeric folders.
- Current structure is [app/laws](app/laws) with subfolders 0..4, not a single dynamic segment.

4. localStorage keys are currently literal strings in sync logic.
- Key usage is visible in [components/auth/post-signin-sync.tsx](components/auth/post-signin-sync.tsx).

5. Checklist content is serialized JSON text in the DB.
- `Checklist.content` is stored as `String` in [prisma/schema.prisma](prisma/schema.prisma).

## 7) File and Symbol Index

### Authentication and provisioning
- [app/api/webhooks/clerk/route.ts](app/api/webhooks/clerk/route.ts): `POST`, `extractUserFields`
- [lib/actions/user-actions.ts](lib/actions/user-actions.ts): `createUser`, `updateUser`, `deleteUser`

### Sync bridge
- [components/auth/post-signin-sync.tsx](components/auth/post-signin-sync.tsx): `PostSigninSync`
- [lib/sync-actions.ts](lib/sync-actions.ts): `ensureDbUser`, `syncPartOne`, `syncPartTwo`, `syncPartThree`, `syncNotes`

### Assessments and goals
- [lib/actions/part-four-actions.ts](lib/actions/part-four-actions.ts): `fetchPartFour`, `upsertPartFour`
- [lib/actions/next-step-actions.ts](lib/actions/next-step-actions.ts): `fetchNextStep`, `upsertNextStep`

### Habits and cues
- [lib/actions/habit-actions.ts](lib/actions/habit-actions.ts): tracked habit and cue server actions

### Notes
- [lib/notes-actions.ts](lib/notes-actions.ts): notes server actions
- [lib/notes-db.ts](lib/notes-db.ts): low-level notes persistence helpers

### Domain reads and analysis
- [lib/profile-data.ts](lib/profile-data.ts): profile snapshots and commitments reads
- [lib/assessment-reads.ts](lib/assessment-reads.ts): assessment retrieval
- [lib/energy-analysis.ts](lib/energy-analysis.ts): pure energy aggregation pipeline

### Schema
- [prisma/schema.prisma](prisma/schema.prisma): full data model

## 8) Read This First for Future Changes

When adding features, align changes to this path:
1. Route/page entry in app.
2. Client UI in components.
3. Server action in lib/actions.
4. Domain/data utility in lib.
5. Prisma model and migration updates in prisma.

This keeps feature ownership explicit and data flow traceable end-to-end.
