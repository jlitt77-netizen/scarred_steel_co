// Navigation catalogs for both products. Every one of the 15 locked CEO OS
// command centers and 5 Portal experiences is represented, organized by the
// business-function grouping in the Design System (Section 8). Items marked
// `placeholder` are scaffolded now and implemented in the phase noted.

export interface NavItem {
  label: string;
  href: string;
  /** Permission required to see/enter the item (null = any user in the product). */
  permission: string | null;
  phase: number;
  placeholder: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// ---- INTERNAL: Scarred Steel Co. CEO OS ----
export const CEO_OS_NAV: NavSection[] = [
  {
    title: "Executive",
    items: [
      { label: "CEO Command Center", href: "/os/ceo", permission: "ceo:dashboard", phase: 10, placeholder: true },
      { label: "Risk & Decisions", href: "/os/risk", permission: "risk:read", phase: 10, placeholder: true },
      { label: "Forecast & Scenarios", href: "/os/forecast", permission: "forecast:read", phase: 10, placeholder: true },
    ],
  },
  {
    title: "Scheduling",
    items: [
      { label: "Master Calendar", href: "/os/calendar", permission: "calendar:read", phase: 2, placeholder: true },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Vehicles & Builds", href: "/os/vehicles", permission: "vehicle:read", phase: 1, placeholder: false },
      { label: "Partner Shop", href: "/os/partner-shop", permission: "project:read", phase: 5, placeholder: true },
      { label: "Team & Workforce", href: "/os/workforce", permission: "project:read", phase: 5, placeholder: true },
      { label: "Fleet & Assets", href: "/os/fleet", permission: "vehicle:read", phase: 9, placeholder: true },
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
      { label: "Sponsors & Partnerships", href: "/os/sponsors", permission: "sponsor:read", phase: 7, placeholder: true },
    ],
  },
  {
    title: "Commerce",
    items: [
      { label: "Merchandise", href: "/os/commerce", permission: "commerce:read", phase: 8, placeholder: true },
      { label: "Digital Products", href: "/os/digital", permission: "commerce:read", phase: 8, placeholder: true },
      { label: "Giveaways", href: "/os/giveaways", permission: "giveaway:read", phase: 9, placeholder: true },
    ],
  },
  {
    title: "Programs",
    items: [
      { label: "Finds", href: "/os/finds", permission: "vehicle:read", phase: 9, placeholder: true },
      { label: "Rescues", href: "/os/rescues", permission: "vehicle:read", phase: 9, placeholder: true },
      { label: "Build Lab", href: "/os/build-lab", permission: "project:read", phase: 11, placeholder: true },
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

// "System" (utilities) and "Programs" (integrated programs) are not among the
// 15 locked command centers.
const NON_COMMAND_CENTER_SECTIONS = new Set(["System", "Programs"]);

/** Count of locked CEO OS command centers (acceptance check = 15). */
export const CEO_OS_COMMAND_CENTER_COUNT = CEO_OS_NAV.filter(
  (s) => !NON_COMMAND_CENTER_SECTIONS.has(s.title),
).reduce((acc, s) => acc + s.items.length, 0);
