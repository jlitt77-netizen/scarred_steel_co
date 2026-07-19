# Phase 11 — External Portal (5 Experiences) — Completion Report

Status: **complete**. Typecheck clean · 96 unit tests pass (3 new) · build compiles
all routes · schema migration + seed applied to the live Supabase DB. **This is the
final phase — the platform is feature-complete.**

## 1. What was built (Section 28)

Five external, permission-scoped Portal experiences. The governing rule:
**the Portal never exposes confidential internal data** — no cost, margin, budget,
reserves, sponsor deal values, or compliance workflow. Every service returns an
explicit customer-safe field selection.

### Build Portal (`/portal/build`, `portal:customer`)
- Scoped to the customer's linked vehicle (`User.customerVehicleId`). Shows
  progress %, customer-facing timeline, build-phase status, and **build photos**.
- Contract economics via the pure `src/server/portal/customer.ts` engine:
  contract (customer-facing budget) + approved change orders − payments received
  = **balance due**. No internal cost/margin.
- **Approve / decline change orders** — the decision writes back to the internal
  `ChangeOrder` (audited), feeding the CEO dashboard's Customer Approvals tile.

### Sponsor Portal (`/portal/sponsor`, `portal:sponsor`)
- Scoped to the sponsor (`User.sponsorId`). Shows partnership level, exclusivity,
  renewal date, deliverables, and published content — with **no deal value or
  margin fields ever selected**.
- **Approve / request changes** on deliverables awaiting review → updates the
  internal deliverable status.

### Digital Products Portal (`/portal/digital`, `portal:digital`)
- "My Garage" of published blueprints/guides + Build Kits and affiliate shopping.

### Giveaway Portal (`/portal/giveaway`, `portal:giveaway`)
- Public giveaway experience: prize, key dates, entry, official-rules disclaimer.
  Only Live/Complete giveaways, **public-safe fields only — the compliance gates
  are never exposed**; winners show only once Complete.

### Community / Fan Portal (`/portal/community`, `portal:fan`)
- Public feed: active builds, latest published episodes, merch drops, blueprint
  releases, for-sale vehicles, and Finds & Rescues highlights.

## 2. Data + migration

- Schema: additive `User.customerVehicleId` + `User.sponsorId` (portal scoping).
  Migration `20260719064500_phase11_user_portal_links` applied to the live Supabase
  project.
- **CEO dashboard**: the "Customer Approvals" tile is now live — count of proposed
  change orders (was the last Phase-11 placeholder on the dashboard).
- Seed (`prisma/seed.ts` `seedPortal` + live DB): linked `customer@example.com` →
  F-150 and `sponsor@example.com` → Summit Racing; 2 change orders (one proposed,
  one approved); 3 build photos; one Summit deliverable set to Submitted for the
  sponsor to review. Idempotent.

## 3. Verification

- `npx tsc --noEmit` — clean (app + seed).
- `npx vitest run` — 96 passed / 8 skipped. 3 new tests in `tests/portal.test.ts`
  cover build financials (approved change orders + payments → balance, pending
  count) and progress clamping.
- `npx next build` — compiles; all five portal routes render real content.

## 4. Confidentiality guarantees

- Build/sponsor writes are **authorized against the caller's linked record** — a
  customer can only decide change orders on their own vehicle; a sponsor only
  reviews their own deliverables (service throws otherwise).
- Sponsor and giveaway services use narrow `select` clauses that omit all
  confidential columns by construction, not by filtering after the fact.

## 5. Platform complete

All 11 phases are delivered: the internal **CEO OS** (15 command centers) and the
external **Portal** (5 experiences), on Supabase + Netlify. Future work (real
purchase records for My Garage, an interactive Build Planner, public find-submission
intake, notification delivery) extends this foundation.
