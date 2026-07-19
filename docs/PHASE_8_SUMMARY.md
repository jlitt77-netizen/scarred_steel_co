# Phase 8 — Merchandise & Commerce + Digital Products — Completion Report

Status: **complete**. Typecheck clean · 76 unit tests pass (7 new) · build compiles
all routes · schema migration + seed applied to the live Supabase DB. Operational —
gated on `commerce:read` / `commerce:write`. **Phase 9 not started.**

## 1. What was built (Sections 18–19)

- **Merchandise** — `MerchProduct` with SKU, category, status, COGS / retail (→
  computed **margin** cents + %), inventory quantity, **reorder point** (→ low-stock
  flag), and limited-**drop** fields (drop date + quantity). Links to build /
  episode / sponsor via scalars.
- **Affiliate commerce** — `AffiliateProduct` with URL, vendor, clicks,
  conversions (→ **conversion rate**), revenue, and commission %.
- **Digital products** — `DigitalProduct` typed as Build Sheet (free lead magnet),
  Build Blueprint, Complete Build Guide (premium), or Build Kit, with price, sales
  count, revenue, and status.
- **Blueprint captured during the build** — `BlueprintSection` rows tie to a
  digital product, a build phase, and a vehicle, each with a captured date. The
  service computes **blueprint coverage** = fraction of the build's phases with at
  least one captured section — enforcing "captured during the build, not
  reconstructed later."
- **Pure engine** (`src/server/commerce/economics.ts`, DB-free + tested) — margin
  cents/%, reorder detection, merch inventory rollup (units, cost, retail,
  low-stock), affiliate conversion rate + summary, digital catalog summary, and
  blueprint completeness.
- **UI** (replacing the two placeholders):
  - `/os/commerce` — merch metrics (products / inventory value / low-stock /
    affiliate revenue), a merch table with margin and low-stock warnings, and an
    affiliate table with clicks / conversions / rate / revenue. Add-Merch and
    Add-Affiliate modals.
  - `/os/digital` — digital metrics (products / units sold / revenue / blueprint
    coverage), a products table, and a blueprint-sections table with a coverage
    meter. Add-Product and Capture-Section modals.

## 2. Data + migration

- New models: `MerchProduct`, `AffiliateProduct`, `DigitalProduct`,
  `BlueprintSection` (additive; scalar vehicle/episode/sponsor links keep other
  models untouched; the only relation is product → sections). Migration
  `20260719055000_phase8_commerce_digital` applied to the live Supabase project.
- Seed (canonical `prisma/seed.ts` `seedCommerce` + live DB): 4 merch products
  (one low-stock, one drop), 3 affiliate products, 3 digital products (published
  guide, free build sheet, draft kit), 4 blueprint sections. Idempotent — skips if
  a merch product already exists.

## 3. Permissions

- All commerce and digital surfaces: `commerce:read` to view, `commerce:write` to
  add merch / affiliate / digital products and capture blueprint sections. The
  `operations_lead` role has both.

## 4. Verification

- `npx tsc --noEmit` — clean (app + seed).
- `npx vitest run` — 76 passed / 8 skipped. 7 new tests in `tests/commerce.test.ts`
  cover margin, reorder, inventory rollup, conversion rate + affiliate summary,
  digital summary, and blueprint completeness.
- `npx next build` — compiles; `/os/commerce` and `/os/digital` render real content.

## 5. Not in this phase

Order/fulfillment tracking, storefront checkout, per-drop sell-through analytics,
and the external **Digital Product Portal** (Phase 11, `portal:digital`) build on
this. Realized merch/affiliate/digital sales roll into the Financial Command
Center's revenue segments (Merchandise, Affiliate, Digital Products).
