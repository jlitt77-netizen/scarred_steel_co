# Phase 5 — Partner Shop + Workforce & Compensation — Completion Report

Status: **complete**. Typecheck clean · 55 unit tests pass (8 new) · build compiles
all routes · schema migration + seed applied to the live Supabase DB. Operational
surfaces gated on `project:*`; compensation amounts + operating-model scenarios are
confidential (`finance:read`) per Section 32. **Phase 6 not started.**

## 1. What was built (Sections 12 & 13)

- **Partner shops + work orders** — `PartnerShop` (hourly rate, weekly capacity)
  and `WorkOrder` (hourly / fixed / retainer, estimated vs actual hours, rate
  override, fixed price, scheduled window, invoiced/paid). Work orders can link to
  a project and vehicle.
- **Capacity / overload engine** (`src/server/workforce/capacity.ts`, pure +
  tested) — monthly capacity from weekly hours (`WEEKS_PER_MONTH = 13/3`),
  **committed hours** = remaining estimated work (estimated − actual) on scheduled
  and in-progress orders, utilization %, and an **overloaded** flag when committed
  exceeds capacity. Fixed-price orders count toward spend but not hourly capacity.
  Work-order estimated/actual cost (fixed → price/invoiced; hourly → hours × rate
  override-or-shop-default). Fully-loaded member monthly cost (employee =
  (salary + benefits + payroll burden + bonus) / 12; contractor/partner-shop =
  hourly × assigned-hours/month).
- **Team, engagement & compensation** — `TeamMember` (relationship, role,
  engagement type contractor / partner_shop / employee, rate/salary/benefits/
  burden/bonus, capacity) and `Assignment` (member → project, hours/week). Roster
  shows assigned vs capacity hours; compensation columns and monthly-labor total
  render **only** for finance roles.
- **Operating-model scenario engine** (`src/server/workforce/scenarios.ts`, pure +
  tested) — Section 13's decision tool. Given monthly build-hour demand and cost
  assumptions, compares the five models — **Stay Partner Shop · Dedicated Bay ·
  Joint Venture · Hire Core Team · Standalone Facility** — on monthly/annual cost,
  capacity, and effective cost-per-hour, and **recommends** the cheapest model
  that still covers demand capacity. "Stay Partner Shop" uses live shop rate and
  capacity; the rest use documented, labeled planning assumptions.
- **UI** (replacing the two placeholders):
  - `/os/partner-shop` — active-shop / work-order / scheduled-spend / overloaded
    metric cards, per-shop capacity meters with estimated/actual/scheduled spend,
    and a work-orders table. Add-Work-Order modal (`project:write`).
  - `/os/workforce` — roster with engagement badges and finance-gated comp, plus
    the confidential operating-model scenario comparison table with the
    recommended model highlighted and per-scenario "when it makes sense" notes.
    Add-Team-Member modal (`project:write`).

## 2. Data + migration

- New models: `PartnerShop`, `WorkOrder`, `TeamMember`, `Assignment` (additive; no
  changes to existing tables). Migration applied to the live Supabase project via
  the management API.
- Seed (canonical `prisma/seed.ts` `seedWorkforce` + live DB): 1 partner shop
  (In-Law Fab & Speed, $85/hr, 40 hrs/wk), 3 work orders (two hourly suspension/
  chassis, one fixed-price paint), 6 team members (partner-shop fabricator,
  contractors, one salaried admin), 3 assignments to the F-150 build. Idempotent —
  skips if a partner shop already exists.

## 3. Permissions

- Partner-shop and work-order surfaces: `project:read` / `project:write`.
- Compensation amounts (roster columns, monthly labor) and the entire scenario
  comparison: `finance:read`. Non-finance roles see the roster without money and a
  "compensation is confidential" note.

## 4. Verification

- `npx tsc --noEmit` — clean (app + seed).
- `npx vitest run` — 55 passed / 8 skipped (DB integration tests skip without
  `TEST_DATABASE_URL`). 8 new tests in `tests/workforce.test.ts` cover work-order
  cost, utilization/overload, member monthly cost, scenario costs, and the
  recommendation.
- `npx next build` — compiles; `/os/partner-shop` and `/os/workforce` now render
  real content.

## 5. Not in this phase

Editable scenario assumptions via settings, per-member scheduling conflicts across
work orders, and payroll export are deferred to later passes. The capacity and cost
engines are the seam those build on.
