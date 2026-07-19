# Phase 9 — Fleet · Finds · Rescues · Giveaways — Completion Report

Status: **complete**. Typecheck clean · 85 unit tests pass (9 new) · build compiles
all routes · schema migration + seed applied to the live Supabase DB. **Phase 10
not started.**

Four command centers in one phase, all in the vehicle/giveaway domain.

## 1. What was built (Sections 20–23)

### Fleet & Long-Term Assets (`/os/fleet`, `vehicle:read/write`)
- `FleetAssessment` (one per vehicle) captures annual **cost** (insurance,
  storage, opportunity) and annual **value** (media, sponsor, affiliate, merch,
  event, brand).
- Pure engine `src/server/fleet/keep-sell.ts` computes net annual value and a
  **KEEP / REVIEW ANNUALLY / SELL CANDIDATE** recommendation (KEEP when value ≥
  1.5× cost, SELL when cash-flow negative, REVIEW in between / when unmodeled).
  Invested cash reuses the shared `computeVehicleMetrics`.
- UI: KEEP/REVIEW/SELL tally + net annual value, a fleet table with per-vehicle
  economics and a color-coded recommendation, and an assessment modal.

### Scarred Steel Finds (`/os/finds`, `vehicle:read/write`)
- `VehicleFind` — public submissions (submitter, vehicle, location, asking price,
  photo) through the acquisition pipeline **New → Saved → Contacted → Evaluating →
  Acquired / Rejected**, with a value path (Acquisition / Content / Referral /
  Brokerage / Marketplace) and a link to the Vehicle when acquired.
- UI: pipeline funnel, finds table with an **inline stage advancer**, add modal.

### Scarred Steel Rescues (`/os/rescues`, `vehicle:read/write`)
- `Rescue` — **Find → Rescue → Revive → Decide → Complete** with an outcome
  (Build / Sell / Giveaway / Keep / Pass Along) and content/vehicle links.
- UI: pipeline funnel + outcome breakdown, rescues table with inline stage
  advancer, add modal.

### Giveaway Planning & Compliance (`/os/giveaways`, `giveaway:read/write`)
- `Giveaway` with five **hard launch gates** (attorney review, official rules,
  eligibility, tax plan, prize funding), workflow stage, dates, and post-draw
  winner fulfillment (selected / verified / prize transferred / tax docs).
- Pure engine `src/server/giveaways/compliance.ts` computes launch readiness +
  blocked reasons and the fulfillment checklist. The `launchGiveaway` **service
  refuses to go live** unless every gate passes — a real gate, not just UI.
- UI: per-giveaway compliance card with toggleable gates, a **LAUNCH BLOCKED /
  READY TO LAUNCH / LIVE** banner + gate meter, a Launch button that's disabled
  until ready, and the fulfillment checklist once live.
- Programs pipeline helper `src/server/programs/pipeline.ts` (stage/outcome
  funnels) backs Finds + Rescues.

## 2. Data + migration

- New models: `FleetAssessment` (unique per vehicle), `VehicleFind`, `Rescue`,
  `Giveaway`. Migration `20260719061000_phase9_...` applied to the live Supabase
  project.
- **Master Calendar**: giveaway launch / draw / end dates now surface as `work`
  occurrences (Section 23 — "all giveaway dates flow through the Master Calendar").
- Seed (`prisma/seed.ts` `seedPrograms` + live DB): 1 fleet assessment (KEEP), 5
  finds across the pipeline, 3 rescues, 2 giveaways (one Planning + launch-blocked
  on tax/funding, one Live). Idempotent per table.

## 3. Verification

- `npx tsc --noEmit` — clean (app + seed).
- `npx vitest run` — 85 passed / 8 skipped. 9 new tests in `tests/programs.test.ts`
  cover fleet keep/sell (all four branches), giveaway launch gating + fulfillment,
  and the stage/outcome funnels.
- `npx next build` — compiles; all four routes render real content.

## 4. Not in this phase

Public find-submission intake form (external), automated fleet opportunity-cost
modeling, and the external **Giveaway Participant Experience** (Phase 11,
`portal:giveaway`) build on this. Acquired finds and rescue outcomes are the seams
into the Vehicle Portfolio.
