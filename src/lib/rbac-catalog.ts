// Source of truth for the permission + role matrix (Sections 32). Consumed by
// the seed script, the RBAC runtime, and the RBAC tests. Changing access control
// happens HERE, in one auditable place.

export interface PermissionDef {
  key: string;
  description: string;
  category: string;
  /** CEO-OS-only. Confidential permissions must never be attached to an
   *  external (Portal) role. Enforced by assertCatalogIntegrity() + tests. */
  isConfidential?: boolean;
}

export interface RoleDef {
  key: string;
  name: string;
  description: string;
  isInternal: boolean;
  /** Explicit permission keys, or "*" to grant every permission (CEO only). */
  permissions: string[] | "*";
}

export const PERMISSIONS: PermissionDef[] = [
  // Operations
  { key: "vehicle:read", description: "View vehicles & portfolio", category: "operations" },
  { key: "vehicle:write", description: "Create / edit vehicles", category: "operations" },
  { key: "project:read", description: "View build projects", category: "operations" },
  { key: "project:write", description: "Create / edit build projects", category: "operations" },
  { key: "task:read", description: "View build tasks", category: "operations" },
  { key: "task:write", description: "Create / edit build tasks", category: "operations" },

  // Scheduling
  { key: "calendar:read", description: "View master operating calendar", category: "scheduling" },
  { key: "event:read", description: "View scheduled events", category: "scheduling" },
  { key: "event:write", description: "Create / edit / reschedule events", category: "scheduling" },
  { key: "dependency:read", description: "View task dependencies", category: "scheduling" },
  { key: "dependency:write", description: "Create / edit dependencies", category: "scheduling" },

  // Finance (confidential — bank balances, payroll, reserves, margins)
  { key: "finance:read", description: "View financial summaries", category: "finance", isConfidential: true },
  { key: "finance:read_confidential", description: "View bank balances, payroll, reserves, internal margins", category: "finance", isConfidential: true },
  { key: "finance:write", description: "Record financial transactions", category: "finance", isConfidential: true },

  // Risk / decisions / forecast (internal-only per Section 32)
  { key: "risk:read", description: "View risk, decisions & exceptions center", category: "risk", isConfidential: true },
  { key: "risk:write", description: "Manage risks & decisions", category: "risk", isConfidential: true },
  { key: "forecast:read", description: "View forecast & scenario planning", category: "forecast", isConfidential: true },

  // Executive
  { key: "ceo:dashboard", description: "View CEO command center", category: "executive", isConfidential: true },

  // Growth / commerce (internal management surfaces)
  { key: "media:read", description: "View media & content", category: "media" },
  { key: "media:write", description: "Manage media & content", category: "media" },
  { key: "sponsor:read", description: "View sponsor CRM", category: "sponsor" },
  { key: "sponsor:write", description: "Manage sponsor CRM", category: "sponsor" },
  { key: "commerce:read", description: "View commerce (merch, affiliate, digital)", category: "commerce" },
  { key: "commerce:write", description: "Manage commerce", category: "commerce" },
  { key: "giveaway:read", description: "View giveaway planning & compliance", category: "giveaway" },
  { key: "giveaway:write", description: "Manage giveaway planning & compliance", category: "giveaway" },

  // System / governance
  { key: "audit:read", description: "View audit & change history", category: "system", isConfidential: true },
  { key: "settings:read", description: "View application settings", category: "system" },
  { key: "settings:write", description: "Edit application settings", category: "system" },
  { key: "user:read", description: "View users", category: "system" },
  { key: "user:write", description: "Create / edit users", category: "system" },
  { key: "role:manage", description: "Manage roles & permissions", category: "system" },

  // External Portal experiences (never confidential)
  { key: "portal:customer", description: "Access Build Customer Portal", category: "portal" },
  { key: "portal:fan", description: "Access Fan / Community Portal", category: "portal" },
  { key: "portal:digital", description: "Access Digital Product Portal", category: "portal" },
  { key: "portal:sponsor", description: "Access Sponsor Portal", category: "portal" },
  { key: "portal:giveaway", description: "Access Giveaway Participant Experience", category: "portal" },
];

const INTERNAL_READ = [
  "vehicle:read", "project:read", "task:read",
  "calendar:read", "event:read", "dependency:read",
  "media:read", "sponsor:read", "commerce:read", "giveaway:read",
  "settings:read",
];

const INTERNAL_OPS_WRITE = [
  "vehicle:write", "project:write", "task:write",
  "event:write", "dependency:write",
];

export const ROLES: RoleDef[] = [
  {
    key: "ceo",
    name: "CEO / Owner",
    description: "Full access to the entire CEO OS, including confidential finance, risk, and forecast.",
    isInternal: true,
    permissions: "*",
  },
  {
    key: "ops_manager",
    name: "Operations Manager",
    description: "Runs builds, scheduling, media, sponsors, commerce. No confidential finance/risk/forecast.",
    isInternal: true,
    permissions: [
      ...INTERNAL_READ,
      ...INTERNAL_OPS_WRITE,
      "media:write", "sponsor:write", "commerce:write", "giveaway:write",
    ],
  },
  {
    key: "finance_manager",
    name: "Finance Manager",
    description: "Confidential financial visibility plus operational read access.",
    isInternal: true,
    permissions: [
      ...INTERNAL_READ,
      "finance:read", "finance:read_confidential", "finance:write",
      "audit:read",
    ],
  },
  {
    key: "media_producer",
    name: "Media Producer",
    description: "Media, social, and calendar management for content production.",
    isInternal: true,
    permissions: [
      "vehicle:read", "project:read", "task:read",
      "calendar:read", "event:read", "event:write",
      "media:read", "media:write",
    ],
  },
  {
    key: "admin",
    name: "System Administrator",
    description: "User, role, settings, and audit administration.",
    isInternal: true,
    permissions: [
      "user:read", "user:write", "role:manage",
      "settings:read", "settings:write", "audit:read",
      "vehicle:read", "project:read", "task:read", "calendar:read",
    ],
  },

  // External Portal roles — strictly one portal permission each.
  { key: "build_customer", name: "Build Customer", description: "External customer following their own build.", isInternal: false, permissions: ["portal:customer"] },
  { key: "fan", name: "Fan / Community Member", description: "External community member.", isInternal: false, permissions: ["portal:fan"] },
  { key: "digital_customer", name: "Digital Product Customer", description: "External buyer of blueprints / guides / kits.", isInternal: false, permissions: ["portal:digital"] },
  { key: "sponsor", name: "Sponsor", description: "External sponsor reviewing deliverables & performance.", isInternal: false, permissions: ["portal:sponsor"] },
  { key: "giveaway_participant", name: "Giveaway Participant", description: "External giveaway entrant.", isInternal: false, permissions: ["portal:giveaway"] },
];

const CONFIDENTIAL_KEYS = new Set(
  PERMISSIONS.filter((p) => p.isConfidential).map((p) => p.key),
);
const PERMISSION_KEYS = new Set(PERMISSIONS.map((p) => p.key));

/**
 * Validates the catalog's safety invariants. Called by the seed and by tests so
 * an unsafe access-control change fails loudly instead of shipping silently.
 *  1. Every referenced permission key exists.
 *  2. No EXTERNAL role holds a confidential permission (Section 32).
 */
export function assertCatalogIntegrity(): void {
  for (const role of ROLES) {
    if (role.permissions === "*") continue;
    for (const key of role.permissions) {
      if (!PERMISSION_KEYS.has(key)) {
        throw new Error(`Role "${role.key}" references unknown permission "${key}".`);
      }
      if (!role.isInternal && CONFIDENTIAL_KEYS.has(key)) {
        throw new Error(
          `SECURITY: external role "${role.key}" must not hold confidential permission "${key}".`,
        );
      }
    }
  }
}

/** Resolve a role definition to its concrete permission key list. */
export function resolveRolePermissions(role: RoleDef): string[] {
  if (role.permissions === "*") return PERMISSIONS.map((p) => p.key);
  return role.permissions;
}
