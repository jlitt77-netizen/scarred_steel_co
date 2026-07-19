# Phase 2 — Master Scheduling Engine — Completion Report

Status: **core complete**. Typecheck clean · 37 unit tests pass (9 new engine
tests) · production build compiles all 34 routes · scheduling engine verified
against the live Supabase seed data. Built entirely on the Scarred Steel Design
System. **Phase 3 not started.**

## 1. What was built

- **Rescheduling engine** (`src/server/scheduling/graph.ts`, `impact.ts`) — pure,
  DB-free, fully unit-tested:
  - Dependency graph traversal (transitive downstream, cycle-safe).
  - Cascade: move a task by N days → root + all downstream tasks shift
    (push-downstream model, finish-to-start + lag aware).
  - Owner **resource-conflict** detection (double-booking across projects).
  - Impact calculator: schedule shifts, four-date event shifts, **cash/revenue
    month movement**, deferred cash/revenue totals, sponsor-deliverable and
    milestone flags, headline counts.
- **Reschedule service** (`src/server/services/reschedule.ts`):
  - `previewReschedule` — computes the full impact without saving.
  - `applyReschedule` — one transaction: shift task dates, shift the four event
    dates, write the narrative **ChangeLog** (with the impact payload), a
    per-entity **AuditLog**, and **Notifications** to affected owners.
- **Master Calendar** (`/os/calendar`, replaces the placeholder):
  - Views: **Day / Week / Month** (real grids) + **Quarter / Year / Rolling-12**
    (month summaries) with prev/next/today navigation.
  - Every event expands into up to four occurrences by date field, colored by
    category — **work=steel · cash=rust · content=patina · revenue=brass**.
  - Filters: vehicle, project, and category toggles (all URL-driven).
  - Change-history panel.
- **Impact Preview Drawer** (`src/components/ui/ImpactDrawer.tsx`): slide-in
  drawer with SCHEDULE / RESOURCE / FINANCIAL / REVENUE / SPONSOR & MILESTONE
  sections and **Approve / Modify / Cancel** — nothing saves until approved.
- **Calendar data service** (`src/server/services/calendar.ts`) + pure date
  helpers (`src/lib/calendar-range.ts`).

## 2. PRD alignment (Sections 4, 5, 13, 14)

| Requirement | Status |
| --- | --- |
| Calendar views: Day/Week/Month/Quarter/Year/Rolling-12 | ✅ (Day/Week/Month grids; Quarter/Year/Rolling-12 summaries) |
| Operational + financial + content + revenue timing together | ✅ four-date occurrences, category colors |
| Detect dependencies + downstream + resource conflicts | ✅ |
| Schedule / cost / cash / revenue impact | ✅ |
| Sponsor/customer deadline impact | ⚠️ sponsor ✅; customer hooks land with the Customer Portal (Phase 11) |
| Show preview → require approval → apply → log → notify | ✅ preview drawer, approval gate, transaction, ChangeLog + AuditLog + Notifications |
| Reforecast the business | ✅ cash/revenue month movement in the preview (full 12-month forecast surface = Phase 4) |
| Change history | ✅ |

## 3. Deviations (intentional, documented)

- **Rescheduling interaction:** click-to-reschedule with a days delta, not native
  drag-and-drop — the PRD explicitly allows "drag/drop **or equivalent**." The
  ImpactDrawer + apply pipeline is drag-agnostic; DnD can bind to it later.
- **Cascade model:** push-downstream-by-delta rather than slack-aware CPM. Matches
  the PRD's illustrative output; slack/critical-path refinement is future work.
- **Reforecast:** the preview shows cash/revenue month deltas; the full Financial
  Command Center 12-month rolling forecast is Phase 4.

## 4. Tests & verification

- `tests/scheduling.test.ts` — **9 tests**: day math, transitive downstream,
  cascade shifts, owner-conflict detection, impact counts, four-date shifts,
  cross-month cash movement, no-op within month.
- Full suite: **37 passed / 8 skipped** (the 8 DB-integration tests run when
  `TEST_DATABASE_URL` is set).
- **Live-data verification:** the pure engine was run against rows fetched from
  the Supabase project — moving the suspension task +14 days shifts paint
  Jun 1 → Jun 15, the parts payment cash date Apr 20 → May 4, and moves $3,800
  from April to May. Matches the PRD scenario exactly.
- Typecheck clean; `npm run build` compiles `/os/calendar` (5.9 kB) and all routes.

## 5. Known gaps / follow-ups

- Native drag-and-drop and slack-aware CPM (above).
- Event-level dependencies (currently task-level; events cascade via their task).
- Customer-portal deadline impact (Phase 11); full reforecast (Phase 4).
- Live in-browser UI walkthrough couldn't run this session (the sandbox blocks
  bound HTTP servers); logic is covered by unit tests + live-data engine
  verification. Re-run `node tests/flow/verify.mjs` in an env that permits a
  server for screenshots.

## 6. Phase 3 readiness

Phase 3 (Vehicle & Build OS depth: detailed cost categories, documents, photos,
progress) builds on the existing vehicle/project/phase/task models and the
Design System. Ready on approval. **Phase 3 not started — awaiting approval.**
