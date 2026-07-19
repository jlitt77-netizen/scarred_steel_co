// Navigation catalogs for both products. Every one of the 15 locked CEO OS
// command centers and 5 Portal experiences is represented. Items marked
// `placeholder` are scaffolded in Phase 1 and implemented in later phases.

export interface NavItem {
  label: string;
  href: string;
  /** Permission required to see/enter the item (null = any authenticated user in the product). */
  permission: string | null;
  phase: number; // PRD phase that delivers the functional module
  placeholder: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// ---- INTERNAL: Scarred Steel Co. CEO OS (15 command centers) ----
export const CEO_OS_NAV: NavSection[] = [
  {
    title: "Executive",
    items: [
      { label: "CEO Command Center", href: "/os/ceo", permission: "ceo:dashboard", phase: 10, placeholder: true },
      { label: "Risk, Decisions & Exceptions", href: "/os/risk", permission: "risk:read", phase: 10, placeholder: true },
      { label: "Master Forecast & Scenario", href: "/os/forecast", permission: "forecast:read", phase: 10, placeholder: true },
    ],
  },
  {
    title: "Scheduling",
    items: [
      { label: "Master Operating Calendar", href: "/os/calendar", permission: "calendar:read", phase: 2, placeholder: true },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Vehicle Portfolio & Build", href: "/os/vehicles", permission: "vehicle:read", phase: 1, placeholder: false },
      { label: "Partner-Shop Production", href: "/os/partner-shop", permission: "project:read", phase: 5, placeholder: true },
      { label: "Team, Workforce & Comp", href: "/os/workforce", permission: "project:read", phase: 5, placeholder: true },
      { label: "Fleet & Long-Term Assets", href: "/os/fleet", permission: "vehicle:read", phase: 9, placeholder: true },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Financial Command Center", href: "/os/finance", permission: "finance:read", phase: 4, placeholder: true },
    ],
  },
  {
    title: "Media & Growth",
    items: [
      { label: "Media & Content", href: "/os/media", permission: "media:read", phase: 6, placeholder: true },
      { label: "Social Media", href: "/os/social", permission: "media:read", phase: 6, placeholder: true },
      { label: "Sponsorship & Partnership CRM", href: "/os/sponsors", permission: "sponsor:read", phase: 7, placeholder: true },
    ],
  },
  {
    title: "Commerce",
    items: [
      { label: "Merchandise & Commerce", href: "/os/commerce", permission: "commerce:read", phase: 8, placeholder: true },
      { label: "Blueprint, Guide & Build Kit", href: "/os/digital", permission: "commerce:read", phase: 8, placeholder: true },
      { label: "Giveaway Planning & Compliance", href: "/os/giveaways", permission: "giveaway:read", phase: 9, placeholder: true },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Audit & History", href: "/os/audit", permission: "audit:read", phase: 1, placeholder: false },
      { label: "Settings", href: "/os/settings", permission: "settings:read", phase: 1, placeholder: false },
      { label: "Users & Roles", href: "/os/users", permission: "user:read", phase: 1, placeholder: false },
    ],
  },
];

// ---- EXTERNAL: Scarred Steel Co. Portal (5 experiences) ----
export const PORTAL_NAV: NavSection[] = [
  {
    title: "Portal",
    items: [
      { label: "My Build", href: "/portal/build", permission: "portal:customer", phase: 11, placeholder: true },
      { label: "Fan / Community", href: "/portal/community", permission: "portal:fan", phase: 11, placeholder: true },
      { label: "Digital Products", href: "/portal/digital", permission: "portal:digital", phase: 11, placeholder: true },
      { label: "Sponsor Portal", href: "/portal/sponsor", permission: "portal:sponsor", phase: 11, placeholder: true },
      { label: "Giveaways", href: "/portal/giveaway", permission: "portal:giveaway", phase: 11, placeholder: true },
    ],
  },
];

// The "System" section holds cross-cutting utilities (audit/settings/users),
// not one of the 15 locked command centers.
const NON_COMMAND_CENTER_SECTIONS = new Set(["System"]);

/** Count of locked CEO OS command centers (acceptance check = 15). */
export const CEO_OS_COMMAND_CENTER_COUNT = CEO_OS_NAV.filter(
  (s) => !NON_COMMAND_CENTER_SECTIONS.has(s.title),
).reduce((acc, s) => acc + s.items.length, 0);
