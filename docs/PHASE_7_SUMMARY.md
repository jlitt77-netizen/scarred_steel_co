# Phase 7 — Sponsorship & Partnership CRM — Completion Report

Status: **complete**. Typecheck clean · 69 unit tests pass (7 new) · build compiles
all routes · schema migration + seed applied to the live Supabase DB. Operational —
gated on `sponsor:read` / `sponsor:write`. **Phase 8 not started.**

## 1. What was built (Section 17)

- **Sponsor pipeline** — `Sponsor` model with the sales stage (Prospect →
  Contacted → Proposal → Negotiating → Active → Renewal, plus Lost), partner
  **level** (Product → Founding Partner), category **exclusivity**, blended deal
  value (annual cash + in-kind product, plus discount % and affiliate commission
  %), and contract start / end / renewal dates.
- **Deliverables** — `SponsorDeliverable` with type (social post, episode mention,
  logo placement, product feature, event appearance, …), the approval lifecycle
  (Planned → In Progress → Submitted → Needs Revision → Approved → Published), due
  date, and an optional link to a content **episode** — the seam into Phase 6.
- **Pure engine** (`src/server/sponsors/pipeline.ts`, DB-free + tested) — blended
  deal value, pipeline funnel (count + value per stage), active-sponsor value,
  deliverable status funnel, overdue detection, a due/overdue window summary, and
  renewals-due — the numbers the dashboard and calendar consume.
- **Master Calendar integration** — open deliverable due dates now surface as
  `work` occurrences on the Master Calendar (they "feed internal scheduling"),
  read directly from the deliverables table — no duplication, detail-only (no
  reschedule).
- **CEO dashboard wiring** — the "Sponsor Deliverables Due" tile is now live: it
  shows the count due in the next 14 days, turns **risk** when any are overdue,
  and is gated on `sponsor:read` (falls back to the phase placeholder otherwise).
- **UI** (`/os/sponsors`, replacing the placeholder) — active-sponsors / active
  value / deliverables-due / renewals metrics, the sales-pipeline funnel with
  per-stage value, a sponsors table (stage, level, exclusivity, value, open /
  overdue deliverables, renewal), and a deliverables table with an **inline status
  advancer** (approve/publish without leaving the page). Add-Sponsor and
  Add-Deliverable modals.

## 2. Data + migration

- New models: `Sponsor`, `SponsorDeliverable` (additive; deliverable → sponsor is
  the only relation, `episodeId`/`vehicleId` are scalars). Migration
  `20260719053000_phase7_sponsors` applied to the live Supabase project.
- Seed (canonical `prisma/seed.ts` `seedSponsors` + live DB): 3 sponsors (Summit
  Racing active/official, Ridetech negotiating/exclusive, Hagerty prospect) and 4
  deliverables across the lifecycle, one linked to Episode 2. Idempotent — skips
  if a sponsor already exists.

## 3. Permissions

- All CRM surfaces: `sponsor:read` to view, `sponsor:write` to add sponsors /
  deliverables and advance deliverable status. The `operations_lead` role has
  both; the dashboard tile degrades gracefully without `sponsor:read`.

## 4. Verification

- `npx tsc --noEmit` — clean (app + seed).
- `npx vitest run` — 69 passed / 8 skipped. 7 new tests in `tests/sponsors.test.ts`
  cover deal value, the funnel (count + value), active value, overdue detection,
  the due-window summary, and renewals.
- `npx next build` — compiles; `/os/sponsors` renders real content and the
  dashboard tile is live.

## 5. Not in this phase

Proposal/contract document storage, automated renewal reminders, and the external
**Sponsor Portal** (Phase 11, `portal:sponsor`) build on this. The deliverable →
episode link and the social pipeline's "Sponsor Review" status are the seams that
connect the CRM to content.
