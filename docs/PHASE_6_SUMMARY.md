# Phase 6 — Media & Content + Social — Completion Report

Status: **complete**. Typecheck clean · 62 unit tests pass (7 new) · build compiles
all routes · schema migration + seed applied to the live Supabase DB. Operational
content data gated on `media:read` / `media:write`. **Phase 7 not started.**

## 1. What was built (Sections 14–16)

- **Content series → episodes** — `ContentSeries` (one per major build) and
  `Episode` with the full production pipeline stage (Concept → Script → Filming →
  Editing → Review → Scheduled → Published), film / edit-due / planned-publish /
  published dates, runtime, production cost, and camera/editor links to Phase 5
  `TeamMember`s (camera + editing as tracked resources).
- **Attributed revenue** — `ContentRevenue` rows attach ad / sponsor / affiliate /
  merch revenue to an episode. Per-episode **net** (attributed revenue −
  production cost) and **ROI %** roll up to the series and to a media-wide summary.
- **Social publishing pipeline** — `SocialPost` across YouTube, Shorts, Instagram,
  Reels, TikTok, Facebook, Email, and SMS, moving through Idea → Draft → Creative
  Ready → Sponsor Review → Scheduled → Published. Posts link back to an episode.
- **Auto-generated post sets** — `defaultPostSet` spawns the standard multi-platform
  set from an episode (full episode, teaser, Shorts / Reels / TikTok, carousel,
  Facebook, email drop). The `generatePostSetForEpisode` service is re-runnable —
  it skips platform/title pairs that already exist.
- **Master Calendar integration** — `getCalendarItems` now surfaces episodes (on
  their publish date) and social posts (on their scheduled/published date) as
  `content` occurrences, tagged with a `source` of `episode`/`post`. No data
  duplication — the calendar reads the media tables directly. Content items carry
  no `taskId`, so the reschedule interaction is inert for them (detail-only).
- **Pure engine** (`src/server/media/pipeline.ts`, DB-free + tested) — episode
  revenue/net/ROI, revenue-by-source, stage and status funnels (canonical order
  with zeros), and `defaultPostSet`.
- **UI** (replacing the two placeholders):
  - `/os/media` — episodes/cost/revenue/net-ROI metrics, the production-pipeline
    funnel, per-series cost/revenue/net panels, and an episodes table with per-row
    economics. Add-Series / Add-Episode / Attribute-Revenue modals.
  - `/os/social` — total/review/scheduled/published metrics, the publishing funnel,
    a posts table (auto-generated posts flagged), an Add-Post modal, and a
    **Generate post set from episode** action.

## 2. Data + migration

- New models: `ContentSeries`, `Episode`, `SocialPost`, `ContentRevenue`
  (additive; media models use scalar `vehicleId`/`projectId` like `WorkOrder`, so
  `Vehicle`/`Project` are untouched). Migration
  `20260719050000_phase6_media_content` applied to the live Supabase project.
- Seed (canonical `prisma/seed.ts` `seedMedia` + live DB): 1 series (F-150 Patina
  Build), 3 episodes (published / editing / concept), 4 attributed-revenue rows
  ($5,750 total), 11 social posts (a published set on ep 1, three in-pipeline on
  ep 2). Idempotent — skips if a content series already exists.

## 3. Permissions

- All media and social surfaces: `media:read` to view, `media:write` to create
  series/episodes/posts, attribute revenue, and generate post sets. The
  `media_producer` role (Phase 1 catalog) has both.

## 4. Verification

- `npx tsc --noEmit` — clean (app + seed; `tsx` resolves the `@/` alias in the
  seed transitively).
- `npx vitest run` — 62 passed / 8 skipped. 7 new tests in `tests/media.test.ts`
  cover episode economics, ROI guards, both funnels, and the post-set composition.
- `npx next build` — compiles; `/os/media` and `/os/social` now render real content.

## 5. Not in this phase

Per-platform analytics, thumbnail/asset management, scheduled-publish automation,
and sponsor-approval routing (which ties into Phase 7 Sponsors) are deferred. The
episode → post-set → calendar seam is the foundation those build on.
