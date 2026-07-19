# Phase 3 — Vehicle & Build OS — Completion Report

Status: **complete**. Typecheck clean · 41 unit tests pass (4 new) · build compiles
all 34 routes · migration + seed applied to the live Supabase DB and verified.
Built on the Scarred Steel Design System. **Phase 4 not started.**

## 1. What was built

- **Detailed build costs** (Sections 9 & 11) — `CostItem` line items across the full
  48-category expense list, each with budget / committed / actual, independent
  scheduled-cash vs paid dates, vendor, phase link, and notes.
- **Cost rollup engine** (`src/server/build/cost-rollup.ts`) — pure, unit-tested:
  per-category and total budget / committed / actual / variance.
- **Parts orders** (`PartsOrder`) — manufacturer, part #, qty, unit cost, status
  (needed→installed), vendor, affiliate URL, order/expected/received dates.
- **Documents** (`Document`) — titles, invoices, inspections, contracts (URL + notes).
- **Photos** (`Photo`) — build photos by URL (gallery).
- **Open issues** (`Issue`) — build problems with severity + status.
- **Change orders** (`ChangeOrder`) — model in place (customer-portal wiring is Phase 11).
- **Functional tabbed vehicle page** (`/os/vehicles/[id]?tab=`): Overview (economics +
  cost rollup + progress), Build Plan (phases + tasks + progress), Costs (rollup cards +
  by-category table + line items + add), Parts, Documents, Photos, Issues, and History
  (change log + audit trail) — plus a "Calendar" link filtered to the vehicle.
- **Services** (`src/server/services/build.ts`) — validated (zod) + audited create/list
  for every entity, gated on `project:*` / `vehicle:*` permissions.

## 2. Data + migration

- New models: `CostItem`, `PartsOrder`, `Document`, `Photo`, `Issue`, `ChangeOrder`
  (purely additive — no changes to existing tables).
- Migration `20260719033000_phase3_build_os` generated offline (schema-diff) and applied
  to the live Supabase project via the management API.
- Seed: F-150 build detail (9 cost items, 2 parts, 1 document, 1 issue) added to the
  canonical `prisma/seed.ts` and loaded into the live DB. Verified rollup on live data:
  budget $33,500 · committed $16,900 · actual $12,500 · variance $21,000.

## 3. PRD alignment (Phase 3)

| Requirement | Status |
| --- | --- |
| Multi-vehicle portfolio | ✅ (Phase 1, extended) |
| Project phases | ✅ Build Plan tab |
| Detailed build cost categories | ✅ 48-category cost items + rollup |
| Suspension / lowering / wheels / paint / patina | ✅ present in the category list + cost items |
| Documents | ✅ |
| Photos | ✅ (URL-based; upload deferred) |
| Progress | ✅ project + phase progress |
| Parts orders, open issues, change orders (Section 11) | ✅ parts + issues live; change orders modeled |

## 4. Tests & verification

- `tests/cost-rollup.test.ts` — 4 tests: grouping, totals, variance, sort, empty/missing.
- Full suite: **41 passed / 8 skipped** (DB integration runs with `TEST_DATABASE_URL`).
- Typecheck clean; build compiles `/os/vehicles/[id]` (4.25 kB).
- Live-DB verification of the seeded cost rollup via the Supabase API.

## 5. Deviations / deferred (documented)

- **Photo/document upload** — entries are URL-based this pass. Direct file upload via
  **Supabase Storage** (bucket + `NEXT_PUBLIC_SUPABASE_URL` / anon key + signed uploads)
  is a clean follow-up.
- **Change orders** — modeled and creatable internally; the customer approval flow that
  feeds schedule/forecast is **Phase 11 (Customer Portal)**.
- **Cost → vehicle actual-cost sync** — the cost rollup is computed live; auto-writing
  `Vehicle.actualCostCents` from cost items lands with the **Phase 4 Financial Center**.
- Inline edit/delete of line items (create + list this pass; edit service exists for
  cost items, UI edit is a follow-up).

## 6. Phase 4 readiness

The cost-item substrate (budget/committed/actual + scheduled-cash/paid dates, integer
cents) is the foundation the **Financial Command Center (Phase 4)** aggregates into A/P,
cash-flow timing, and the 12-month rolling forecast. Ready on approval. **Phase 4 not
started — awaiting approval.**
