/**
 * Emits the Phase 1 seed as a single SQL script (stdout).
 * Reuses the RBAC catalog + money helpers so the SQL matches the app exactly.
 * Used to seed Supabase via the management API (no DB password required).
 * Idempotent: every INSERT uses ON CONFLICT DO NOTHING / DO UPDATE.
 */
import bcrypt from "bcryptjs";
import {
  PERMISSIONS,
  ROLES,
  assertCatalogIntegrity,
  resolveRolePermissions,
} from "../src/lib/rbac-catalog";
import { toCents } from "../src/lib/money";

const NOW = "now()";
const q = (v: unknown): string => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (v instanceof Date) return `'${v.toISOString()}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
};
const slug = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, "_");

const lines: string[] = [];
assertCatalogIntegrity();

// Permissions
for (const p of PERMISSIONS) {
  lines.push(
    `INSERT INTO "Permission" ("id","key","description","category","isConfidential","createdAt") VALUES (${q("perm_" + slug(p.key))},${q(p.key)},${q(p.description)},${q(p.category)},${q(!!p.isConfidential)},${NOW}) ON CONFLICT ("key") DO NOTHING;`,
  );
}
// Roles + RolePermissions
for (const r of ROLES) {
  lines.push(
    `INSERT INTO "Role" ("id","key","name","description","isInternal","createdAt","updatedAt") VALUES (${q("role_" + slug(r.key))},${q(r.key)},${q(r.name)},${q(r.description)},${q(r.isInternal)},${NOW},${NOW}) ON CONFLICT ("key") DO NOTHING;`,
  );
  for (const permKey of resolveRolePermissions(r)) {
    lines.push(
      `INSERT INTO "RolePermission" ("id","roleId","permissionId") VALUES (${q("rp_" + slug(r.key) + "_" + slug(permKey))},${q("role_" + slug(r.key))},${q("perm_" + slug(permKey))}) ON CONFLICT ("roleId","permissionId") DO NOTHING;`,
    );
  }
}

// Users + UserRoles (dev password shared)
const hash = bcrypt.hashSync("password123", 10);
const USERS = [
  ["ceo@scarredsteel.co", "Jesse (CEO)", true, "ceo"],
  ["ops@scarredsteel.co", "Ops Manager", true, "ops_manager"],
  ["finance@scarredsteel.co", "Finance Manager", true, "finance_manager"],
  ["media@scarredsteel.co", "Media Producer", true, "media_producer"],
  ["admin@scarredsteel.co", "System Admin", true, "admin"],
  ["customer@example.com", "Build Customer", false, "build_customer"],
  ["fan@example.com", "Community Fan", false, "fan"],
  ["digital@example.com", "Digital Customer", false, "digital_customer"],
  ["sponsor@example.com", "Sponsor Rep", false, "sponsor"],
  ["giveaway@example.com", "Giveaway Entrant", false, "giveaway_participant"],
] as const;
for (const [email, name, isInternal, roleKey] of USERS) {
  const uid = "usr_" + slug(email.split("@")[0]);
  lines.push(
    `INSERT INTO "User" ("id","email","name","passwordHash","isActive","isInternal","createdAt","updatedAt") VALUES (${q(uid)},${q(email)},${q(name)},${q(hash)},TRUE,${q(isInternal)},${NOW},${NOW}) ON CONFLICT ("email") DO NOTHING;`,
  );
  lines.push(
    `INSERT INTO "UserRole" ("id","userId","roleId") VALUES (${q("ur_" + slug(email.split("@")[0]))},${q(uid)},${q("role_" + slug(roleKey))}) ON CONFLICT ("userId","roleId") DO NOTHING;`,
  );
}

// Settings
const SETTINGS: [string, string, string, string][] = [
  ["company.name", "Scarred Steel Co.", "company", "Legal / display company name"],
  ["company.fiscal_year_start", "01-01", "company", "Fiscal year start (MM-DD)"],
  ["finance.protected_reserve_cents", String(toCents(25000)), "finance", "Protected household reserve (cents)"],
  ["giveaway.launch_requires_attorney_review", "true", "giveaway", "Hard compliance gate before giveaway launch"],
  ["platform.default_timezone", "America/Chicago", "platform", "Default scheduling timezone"],
];
for (const [key, value, category, description] of SETTINGS) {
  lines.push(
    `INSERT INTO "AppSetting" ("id","key","value","category","description","createdAt","updatedAt") VALUES (${q("set_" + slug(key))},${q(key)},${q(value)},${q(category)},${q(description)},${NOW},${NOW}) ON CONFLICT ("key") DO NOTHING;`,
  );
}

const CEO = "usr_ceo";

// Vehicles
const veh = (
  id: string, year: number, model: string, trim: string, nickname: string,
  status: string, classification: string, money: Record<string, number | null>,
  acquiredAt?: string,
) => {
  const cols = [
    "id","year","make","model","trim","nickname","status","classification",
    "acquisitionCostCents","buildBudgetCents","actualCostCents","sponsorProductOffsetsCents",
    "sponsorCashCents","currentMarketValueCents","targetSalePriceCents","requiredSalePriceCents",
    "acquiredAt","createdById","updatedById","createdAt","updatedAt",
  ];
  const vals = [
    q(id), year, q("Ford"), q(model), q(trim), q(nickname), q(status), q(classification),
    money.acq ?? "NULL", money.budget ?? "NULL", money.actual ?? "NULL", money.spOffset ?? "NULL",
    money.spCash ?? "NULL", money.market ?? "NULL", money.target ?? "NULL", money.required ?? "NULL",
    acquiredAt ? q(new Date(acquiredAt)) : "NULL", q(CEO), q(CEO), NOW, NOW,
  ];
  lines.push(`INSERT INTO "Vehicle" (${cols.map((c) => `"${c}"`).join(",")}) VALUES (${vals.join(",")}) ON CONFLICT ("id") DO NOTHING;`);
};

veh("veh_f150", 1979, "F-150", "Ranger XLT", "Patina King", "Active Build", "Content Asset",
  { acq: toCents(8500), budget: toCents(32000), actual: toCents(14200), spOffset: toCents(4500), spCash: toCents(3000), market: toCents(28000), target: toCents(45000), required: toCents(38000) },
  "2026-02-10");
veh("veh_f100", 1969, "F-100", "Styleside", "Shop Hauler", "Planned Build", "Shop Vehicle",
  { acq: toCents(6200), budget: toCents(24000), actual: null, spOffset: null, spCash: null, market: toCents(18000), target: toCents(35000), required: null },
  "2026-03-05");
veh("veh_highboy", 1975, "F-250", "Highboy", "Highboy", "Under Evaluation", "Inventory",
  { acq: toCents(12000), budget: toCents(40000), actual: null, spOffset: null, spCash: null, market: toCents(22000), target: toCents(60000), required: null });

// Projects
const proj = (id: string, vehicleId: string, name: string, status: string, budget: number, actual: number | null, pct: number, ps: string, pe: string, as_?: string) => {
  lines.push(
    `INSERT INTO "Project" ("id","vehicleId","name","status","budgetCents","actualCostCents","percentComplete","plannedStart","plannedEnd","actualStart","createdById","updatedById","createdAt","updatedAt") VALUES (${q(id)},${q(vehicleId)},${q(name)},${q(status)},${budget},${actual ?? "NULL"},${pct},${q(new Date(ps))},${q(new Date(pe))},${as_ ? q(new Date(as_)) : "NULL"},${q(CEO)},${q(CEO)},${NOW},${NOW}) ON CONFLICT ("id") DO NOTHING;`,
  );
};
proj("prj_f150", "veh_f150", "F-150 Patina Restomod", "Active", toCents(32000), toCents(14200), 45, "2026-02-15", "2026-08-30", "2026-02-18");
proj("prj_f100", "veh_f100", "F-100 Slammed Shop Truck", "Planned", toCents(24000), null, 0, "2026-09-01", "2027-03-01");
proj("prj_highboy", "veh_highboy", "Highboy 4x4 Revival", "Planned", toCents(40000), null, 0, "2026-10-01", "2027-06-01");

// Phases (F-150)
const PHASES: [string, number, string][] = [
  ["Acquisition", 0, "Complete"], ["Inspection", 1, "Complete"], ["Teardown", 2, "Complete"],
  ["Suspension", 3, "In Progress"], ["Lowering / Lifting", 4, "In Progress"], ["Paint", 5, "Not Started"],
  ["Patina", 6, "Not Started"], ["Reveal", 7, "Not Started"],
];
for (const [name, seq, status] of PHASES) {
  lines.push(
    `INSERT INTO "BuildPhase" ("id","projectId","name","sequence","status","createdById","updatedById","createdAt","updatedAt") VALUES (${q("ph_f150_" + seq)},${q("prj_f150")},${q(name)},${seq},${q(status)},${q(CEO)},${q(CEO)},${NOW},${NOW}) ON CONFLICT ("projectId","sequence") DO NOTHING;`,
  );
}

// Tasks + dependency (F-150)
lines.push(
  `INSERT INTO "Task" ("id","projectId","phaseId","title","status","ownerId","plannedStart","plannedEnd","estimatedHours","budgetCents","percentComplete","createdById","updatedById","createdAt","updatedAt") VALUES (${q("tsk_susp")},${q("prj_f150")},${q("ph_f150_3")},${q("Install front coilovers & drop spindles")},${q("In Progress")},${q(CEO)},${q(new Date("2026-05-01"))},${q(new Date("2026-05-14"))},24,${toCents(3800)},30,${q(CEO)},${q(CEO)},${NOW},${NOW}) ON CONFLICT ("id") DO NOTHING;`,
);
lines.push(
  `INSERT INTO "Task" ("id","projectId","phaseId","title","status","plannedStart","plannedEnd","estimatedHours","budgetCents","percentComplete","createdById","updatedById","createdAt","updatedAt") VALUES (${q("tsk_paint")},${q("prj_f150")},${q("ph_f150_5")},${q("Cab & bed paint prep")},${q("Not Started")},${q(new Date("2026-06-01"))},${q(new Date("2026-06-20"))},40,${toCents(5200)},0,${q(CEO)},${q(CEO)},${NOW},${NOW}) ON CONFLICT ("id") DO NOTHING;`,
);
lines.push(
  `INSERT INTO "Dependency" ("id","predecessorId","successorId","type","lagDays","createdById","createdAt") VALUES (${q("dep_susp_paint")},${q("tsk_susp")},${q("tsk_paint")},${q("finish_to_start")},0,${q(CEO)},${NOW}) ON CONFLICT ("predecessorId","successorId") DO NOTHING;`,
);

// Events (four-date)
const EVENTS = [
  ["evt_partspay", "Coilover parts payment", "cash_outflow", "tsk_susp", { workDate: "2026-05-01", cashDate: "2026-04-20" }, toCents(3800)],
  ["evt_broll", "Suspension install b-roll shoot", "content", null, { contentDate: "2026-05-08" }, null],
  ["evt_ep3", "Episode 3 publish", "content", null, { contentDate: "2026-05-25", revenueDate: "2026-06-25" }, toCents(1200)],
  ["evt_reveal", "Reveal & sale target", "vehicle_sale", null, { workDate: "2026-08-30", revenueDate: "2026-09-30" }, toCents(45000)],
] as const;
for (const [id, title, type, taskId, dates, amt] of EVENTS) {
  const d = dates as Record<string, string>;
  lines.push(
    `INSERT INTO "Event" ("id","title","type","status","projectId","vehicleId","taskId","workDate","cashDate","contentDate","revenueDate","amountCents","createdById","updatedById","createdAt","updatedAt") VALUES (${q(id)},${q(title)},${q(type)},'Scheduled',${q("prj_f150")},${q("veh_f150")},${taskId ? q(taskId) : "NULL"},${d.workDate ? q(new Date(d.workDate)) : "NULL"},${d.cashDate ? q(new Date(d.cashDate)) : "NULL"},${d.contentDate ? q(new Date(d.contentDate)) : "NULL"},${d.revenueDate ? q(new Date(d.revenueDate)) : "NULL"},${amt ?? "NULL"},${q(CEO)},${q(CEO)},${NOW},${NOW}) ON CONFLICT ("id") DO NOTHING;`,
  );
}

// Risks
lines.push(
  `INSERT INTO "Risk" ("id","category","title","description","severity","likelihood","status","responseOption","projectId","vehicleId","ownerId","dueDate","createdById","updatedById","createdAt","updatedAt") VALUES (${q("rsk_spindles")},${q("Parts Delay")},${q("Drop spindles backordered 3 weeks")},${q("Vendor quoted 3-week backorder on drop spindles; threatens suspension phase.")},${q("high")},${q("medium")},${q("open")},${q("Expedite Shipping")},${q("prj_f150")},${q("veh_f150")},${q(CEO)},${q(new Date("2026-04-25"))},${q(CEO)},${q(CEO)},${NOW},${NOW}) ON CONFLICT ("id") DO NOTHING;`,
);
lines.push(
  `INSERT INTO "Risk" ("id","category","title","description","severity","likelihood","status","responseOption","vehicleId","ownerId","dueDate","createdById","updatedById","createdAt","updatedAt") VALUES (${q("rsk_highboy_cash")},${q("Cash Shortage")},${q("September cash outflow high — consider delaying Highboy engine")},${q("Partner-shop capacity ~94% and September outflow is heavy; delaying the engine purchase to October improves cash with no major downstream revenue loss.")},${q("medium")},${q("high")},${q("open")},${q("Delay Purchase")},${q("veh_highboy")},${q(CEO)},${q(new Date("2026-09-15"))},${q(CEO)},${q(CEO)},${NOW},${NOW}) ON CONFLICT ("id") DO NOTHING;`,
);

process.stdout.write(lines.join("\n") + "\n");
