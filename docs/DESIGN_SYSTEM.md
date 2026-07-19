# Scarred Steel Design System

> A premium automotive command center built inside an old American fabrication shop.

This is the **permanent** UI/UX standard for the entire Scarred Steel Platform.
All current and future phases must use these tokens and components. Do not
introduce generic templates, default component styling, or ad-hoc colors.

## 1. Two experiences, one ecosystem

| | CEO OS (`/os/*`) | Portal (`/portal/*`) |
|---|---|---|
| Feel | Dark, premium, industrial, precise | Cinematic, emotional, brand-heavy |
| Balance | 80% command center / 20% garage | 40% software / 60% brand |
| Shell | `AppShell` — sidebar + command bar | `PortalShell` — cinematic top nav |
| Texture | Headers/empty states only | Broad hero/imagery use |

## 2. Design tokens (`tailwind.config.ts`)

**Backgrounds** `bg-*`: nearblack `#0A0A0A` · coal `#111111` · charcoal `#181818` · gunmetal `#232323` · panel `#2B2B2B`
**Text** `paper-*`: warm `#F2EFE8` · steel `#D8D8D4` · muted `#999999`
**Accents**: rust `#8B3A22` · burnt `#B85A2A` · amber `#C98532` · brass `#9A7138` · oxide `#713124` · patina `#365F66`
**Status** `status-*` (always with icon/label): healthy `#5B7F58` · attention `#C98532` · risk `#B85A2A` · critical `#B23A2E` · info `#4E848E` · inactive `#6B6B6B` · gain/loss `#5B7F58`/`#B24A3E`
**Calendar** `cal-*`: work=steel · cash=rust · content=patina · revenue=brass
**Radius**: 3–6px (restrained, never pill/SaaS). **Shadow**: `shadow-panel`, `shadow-raised`, `shadow-drawer`. **Border**: 1px `bg-gunmetal`/`bg-panel`.
**Texture**: `bg-steel-grain`, `bg-panel-sheen` — headers/login/empty/portal only, never behind tables or charts.

## 3. Typography

- **Headline / brand** — Bebas Neue (`font-display`), uppercase, wide tracking. Fallback: Oswald → Barlow Condensed → system.
- **Body / data** — Inter (`font-sans`). Fallback: system-ui.
- **Numbers** — always `tabular-nums` (`.tnum`, `.num`, tables, `.metric-value`).
- Loaded via `next/font` (self-hosted at build) in `src/app/fonts.ts`.

## 4. Logo (`src/components/ui/Logo.tsx`)

Official assets are user-supplied (never recreated/generated). Until provided,
a temporary type wordmark renders. To activate real assets: drop
`logo-full.svg`, `logo-compact.svg`, `logo-mono.svg` into `public/brand/` and set
`LOGO_ASSETS_AVAILABLE = true`. Variants: `full`, `compact`, `mono`.

## 5. Component library

Utility classes (in `globals.css`): `.panel`/`.card`, `.panel-raised`, `.btn`,
`.btn-secondary`, `.btn-ghost`, `.input`, `.select`, `.label`, `.badge`,
`.data-table`, `.surface-texture`, `.accent-bar`, `.num`, `.tnum`, `.scroll-steel`.

React components:

| Component | File | Role |
|---|---|---|
| `AppShell` | `components/AppShell.tsx` | CEO OS shell: collapsible sidebar + command bar + workspace + mobile drawer |
| `Sidebar` | `components/Sidebar.tsx` | Business-function nav, expanded + collapsed icon rail, logo |
| `CommandBar` | `components/CommandBar.tsx` | Search, Quick Add, date, notifications, risk indicator, profile |
| `PortalShell` | `components/PortalShell.tsx` | Cinematic external top-nav shell |
| `PageHeader` | `ui/primitives.tsx` | Textured page title + eyebrow + actions |
| `Panel` | `ui/primitives.tsx` | Standard surface, optional accent bar + title |
| `MetricCard` / `FinancialMetric` | `ui/primitives.tsx` | KPI tiles; signed money in muted green/red |
| `StatusBadge` / `RiskBadge` | `ui/primitives.tsx` | Status with dot + label (never color-only) |
| `ProgressBar` / `CapacityMeter` | `ui/primitives.tsx` | Build % and capacity (amber ≥80, red ≥95) |
| `EmptyState` | `ui/primitives.tsx` | Branded empty/placeholder |
| `DataTable<T>` | `ui/DataTable.tsx` | Sticky header, numeric alignment, clickable rows, empty row |
| `VehicleCard` | `ui/VehicleCard.tsx` | Gallery card with photo slot |
| `Modal` | `ui/Modal.tsx` | Accessible dialog (Esc/backdrop close) |
| `Logo` | `ui/Logo.tsx` | Swappable brand lockup |
| `ModulePlaceholder` | `components/ModulePlaceholder.tsx` | Branded "planned command center" |
| `icons` | `ui/icons.tsx` | Inline SVG set (no external dependency) |

Status mapping helpers live in `src/lib/status-colors.ts` (`statusTone`,
`severityTone`, `CALENDAR_CATEGORIES`).

## 6. Forward-standard components (documented, built when their feature lands)

`CalendarEvent`, `Timeline`, `ImpactDrawer` (reschedule preview — Section 14),
`ApprovalModal`, `ActivityFeed`, `PhotoGallery`, `DocumentViewer`,
`NotificationCenter`, `QuickAdd` (hosted in CommandBar as placeholder actions).
These must be built with the tokens/components above — no fake functionality;
use disabled/placeholder states until the owning phase implements them.

## 7. Required UX principle (Section 26)

Every major screen answers: Where am I? · What's happening? · What needs
attention? · What's next? · What can I do? · What's the financial impact?

## 8. Accessibility

Dark theme with AA-oriented contrast (warm-white on charcoal); status never
color-only; visible focus rings (`:focus-visible` amber); semantic landmarks
(`header`/`nav`/`main`), `aria-current` on active nav, labelled controls,
keyboard-closable modals/menus.
