# Scarred Steel Co. Platform

Two connected products built on one shared relational data model:

1. **Scarred Steel Co. CEO OS** — internal business operating system (`/os/*`)
2. **Scarred Steel Co. Portal** — external role-based experiences (`/portal/*`)

> **Nothing important moves silently.** Every material change is validated,
> permission-checked, and written to an audit trail.

This repository currently implements **Phase 1 — Application Foundation**. The
remaining phases (2–11) build on this foundation; every command center and
portal experience is already represented in navigation and the data model.

---

## Proposed stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 15** (App Router, RSC, Server Actions) | One codebase for internal + external, SSR, server actions, edge middleware |
| Language | **TypeScript** (strict) | Typed data models end-to-end |
| ORM / DB | **Prisma 6** + **SQLite** (dev) | Relational, migrations, Postgres-promotable — the schema avoids DB-specific features |
| AuthN | Custom cookie session (**jose** HS256 JWT) + **bcryptjs** | Simple, dependency-light, edge-verifiable |
| AuthZ | Catalog-driven **RBAC** with confidential gating | Single source of truth, defense-in-depth |
| Validation | **zod** | Runtime validation at every service boundary |
| Styling | **Tailwind CSS** | Accessible, responsive, fast |
| Tests | **Vitest** (unit + integration) + HTTP flow smoke test | Fast, deterministic |

Money is stored as **integer cents** everywhere (never floats) for exact
financial math — see `src/lib/money.ts`.

---

## Quick start

```bash
npm run setup      # installs deps, generates client, migrates, seeds (idempotent)
npm run dev        # http://localhost:3000
```

Or manually:

```bash
npm install
cp .env.example .env          # then edit SESSION_SECRET for anything non-local
npx prisma migrate deploy
npm run db:seed
npm run dev
```

### Test users (seed) — dev password `password123`

| Email | Scope | Role | Sees |
| --- | --- | --- | --- |
| `ceo@scarredsteel.co` | Internal | CEO / Owner | Everything, incl. confidential finance/risk/forecast |
| `ops@scarredsteel.co` | Internal | Operations Manager | Builds, scheduling, media, sponsors, commerce (no confidential finance/risk) |
| `finance@scarredsteel.co` | Internal | Finance Manager | Confidential finance + operational reads |
| `media@scarredsteel.co` | Internal | Media Producer | Media, social, calendar |
| `admin@scarredsteel.co` | Internal | System Administrator | Users, roles, settings, audit |
| `customer@example.com` | External | Build Customer | Portal: My Build |
| `fan@example.com` | External | Fan / Community | Portal: Community |
| `digital@example.com` | External | Digital Product Customer | Portal: Digital Products |
| `sponsor@example.com` | External | Sponsor | Portal: Sponsor |
| `giveaway@example.com` | External | Giveaway Participant | Portal: Giveaways |

---

## Checks

```bash
npm run check      # typecheck + unit/integration tests (36 tests)
npm run test:flow  # HTTP flow test — start `npm run start` in another shell first
```

`npm run check` runs on a dedicated `test.db` (auto-reset). The flow test signs a
real session cookie and exercises the live middleware + RBAC over HTTP.

---

## Route map

**Public**: `/login`, `/logout`

**CEO OS** (`/os/*`, internal users only — enforced by `src/middleware.ts`):

- Live in Phase 1: `/os` (dashboard), `/os/vehicles`, `/os/vehicles/[id]`,
  `/os/settings`, `/os/audit`, `/os/users`
- Scaffolded command centers: `/os/ceo`, `/os/risk`, `/os/forecast`,
  `/os/calendar`, `/os/partner-shop`, `/os/workforce`, `/os/fleet`,
  `/os/finance`, `/os/media`, `/os/social`, `/os/sponsors`, `/os/commerce`,
  `/os/digital`, `/os/giveaways`

**Portal** (`/portal/*`, any authenticated user): `/portal`, `/portal/build`,
`/portal/community`, `/portal/digital`, `/portal/sponsor`, `/portal/giveaway`

The 15 locked CEO OS command centers are defined in `src/lib/navigation.ts`
(`CEO_OS_COMMAND_CENTER_COUNT` is asserted to equal 15 in tests).

---

## Module structure

```
prisma/
  schema.prisma          # shared relational data model + audit fields
  migrations/            # SQL migration history
  seed.ts                # RBAC catalog, users, 3 Ford trucks with build data
src/
  lib/                   # money, password, session, rbac, audit, validation, enums, navigation
  server/services/       # typed, validated, audited domain services (vehicles, projects, tasks, events, dependencies, risks, settings)
  components/            # Sidebar, ModulePlaceholder
  app/                   # Next.js routes (login, os/*, portal/*)
  middleware.ts          # edge product-boundary gate
tests/                   # vitest unit + integration; flow/ HTTP smoke test
```

---

## Security model (Section 32)

- **Strict RBAC** driven by one catalog (`src/lib/rbac-catalog.ts`). Changing
  access happens in one auditable place.
- **Confidential permissions** (bank balances, payroll, reserves, margins, legal
  notes, **risk center**, **scenario/forecast**) are flagged in the catalog.
- **`assertCatalogIntegrity()`** fails the seed/tests if an external role is ever
  granted a confidential permission.
- **Defense in depth**: `can()` refuses a confidential permission to any external
  user even if one were mistakenly attached to their role.
- The external Portal renders no internal financials, margins, reserves, payroll,
  confidential contracts, legal notes, or risk/scenario data.

---

## Data model highlights

- **Four independent event dates** (Section 3): every `Event` carries
  `workDate`, `cashDate`, `contentDate`, `revenueDate` — each nullable and moved
  independently (`moveEventDate`). This is the substrate the Master Calendar
  (Phase 2) and Financial Command Center (Phase 4) build on.
- **Dependencies** with cycle prevention (`wouldCreateCycle`) so the Phase 2
  cascade engine is guaranteed to terminate.
- **Audit trail** (`AuditLog`) + domain **ChangeLog** for narrative schedule/
  budget history.
- **Vehicle economics** (true cash invested, profit, ROI, holding period) are
  derived in code (`src/lib/vehicle-metrics.ts`), never stored, so they can't
  drift.

See `docs/PHASE_1_SUMMARY.md` for the full Phase 1 report, PRD comparison, known
gaps, and the Phase 2 readiness checklist.
