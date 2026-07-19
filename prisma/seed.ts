import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import {
  PERMISSIONS,
  ROLES,
  assertCatalogIntegrity,
  resolveRolePermissions,
} from "../src/lib/rbac-catalog";
import { toCents } from "../src/lib/money";

const prisma = new PrismaClient();

// Dev-only password shared by every seeded account. NEVER use in production.
const DEV_PASSWORD = "password123";

const USERS = [
  { email: "ceo@scarredsteel.co", name: "Jesse (CEO)", isInternal: true, roleKey: "ceo" },
  { email: "ops@scarredsteel.co", name: "Ops Manager", isInternal: true, roleKey: "ops_manager" },
  { email: "finance@scarredsteel.co", name: "Finance Manager", isInternal: true, roleKey: "finance_manager" },
  { email: "media@scarredsteel.co", name: "Media Producer", isInternal: true, roleKey: "media_producer" },
  { email: "admin@scarredsteel.co", name: "System Admin", isInternal: true, roleKey: "admin" },
  { email: "customer@example.com", name: "Build Customer", isInternal: false, roleKey: "build_customer" },
  { email: "fan@example.com", name: "Community Fan", isInternal: false, roleKey: "fan" },
  { email: "digital@example.com", name: "Digital Customer", isInternal: false, roleKey: "digital_customer" },
  { email: "sponsor@example.com", name: "Sponsor Rep", isInternal: false, roleKey: "sponsor" },
  { email: "giveaway@example.com", name: "Giveaway Entrant", isInternal: false, roleKey: "giveaway_participant" },
];

async function seedRbac() {
  assertCatalogIntegrity();

  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { description: p.description, category: p.category, isConfidential: !!p.isConfidential },
      create: { key: p.key, description: p.description, category: p.category, isConfidential: !!p.isConfidential },
    });
  }

  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { key: r.key },
      update: { name: r.name, description: r.description, isInternal: r.isInternal },
      create: { key: r.key, name: r.name, description: r.description, isInternal: r.isInternal },
    });

    const permKeys = resolveRolePermissions(r);
    const perms = await prisma.permission.findMany({ where: { key: { in: permKeys } } });
    // Reset and reattach so the catalog is authoritative.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const perm of perms) {
      await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: perm.id } });
    }
  }
}

async function seedUsers() {
  const passwordHash = await hashPassword(DEV_PASSWORD);
  for (const u of USERS) {
    const role = await prisma.role.findUnique({ where: { key: u.roleKey } });
    if (!role) throw new Error(`Seed error: role ${u.roleKey} missing`);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, isInternal: u.isInternal, isActive: true },
      create: { email: u.email, name: u.name, isInternal: u.isInternal, passwordHash },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });
  }
}

async function seedSettings() {
  const settings = [
    { key: "company.name", value: "Scarred Steel Co.", category: "company", description: "Legal / display company name" },
    { key: "company.fiscal_year_start", value: "01-01", category: "company", description: "Fiscal year start (MM-DD)" },
    { key: "finance.protected_reserve_cents", value: String(toCents(25000)), category: "finance", description: "Protected household reserve (cents)" },
    { key: "giveaway.launch_requires_attorney_review", value: "true", category: "giveaway", description: "Hard compliance gate before giveaway launch" },
    { key: "platform.default_timezone", value: "America/Chicago", category: "platform", description: "Default scheduling timezone" },
  ];
  for (const s of settings) {
    await prisma.appSetting.upsert({ where: { key: s.key }, update: { value: s.value, category: s.category, description: s.description }, create: s });
  }
}

async function seedVehicles(ceoId: string) {
  // Idempotency: skip if already seeded (vehicles have no natural unique key).
  const existing = await prisma.vehicle.count();
  if (existing > 0) {
    console.log(`  vehicles already present (${existing}) — skipping vehicle seed`);
    return;
  }

  // ---- 1979 Ford F-150 ----
  const f150 = await prisma.vehicle.create({
    data: {
      year: 1979, make: "Ford", model: "F-150", trim: "Ranger XLT", nickname: "Patina King",
      status: "Active Build", classification: "Content Asset",
      acquisitionCostCents: toCents(8500), buildBudgetCents: toCents(32000),
      actualCostCents: toCents(14200), sponsorCashCents: toCents(3000),
      sponsorProductOffsetsCents: toCents(4500), currentMarketValueCents: toCents(28000),
      targetSalePriceCents: toCents(45000), requiredSalePriceCents: toCents(38000),
      acquiredAt: new Date("2026-02-10"),
      createdById: ceoId, updatedById: ceoId,
    },
  });

  const f150Project = await prisma.project.create({
    data: {
      vehicleId: f150.id, name: "F-150 Patina Restomod", status: "Active",
      budgetCents: toCents(32000), actualCostCents: toCents(14200), percentComplete: 45,
      plannedStart: new Date("2026-02-15"), plannedEnd: new Date("2026-08-30"),
      actualStart: new Date("2026-02-18"),
      createdById: ceoId, updatedById: ceoId,
    },
  });

  const phaseNames: [string, number, string][] = [
    ["Acquisition", 0, "Complete"],
    ["Inspection", 1, "Complete"],
    ["Teardown", 2, "Complete"],
    ["Suspension", 3, "In Progress"],
    ["Lowering / Lifting", 4, "In Progress"],
    ["Paint", 5, "Not Started"],
    ["Patina", 6, "Not Started"],
    ["Reveal", 7, "Not Started"],
  ];
  const phases: Record<string, string> = {};
  for (const [name, seq, status] of phaseNames) {
    const p = await prisma.buildPhase.create({
      data: { projectId: f150Project.id, name, sequence: seq, status, createdById: ceoId, updatedById: ceoId },
    });
    phases[name] = p.id;
  }

  const suspensionTask = await prisma.task.create({
    data: {
      projectId: f150Project.id, phaseId: phases["Suspension"],
      title: "Install front coilovers & drop spindles", status: "In Progress",
      ownerId: ceoId, plannedStart: new Date("2026-05-01"), plannedEnd: new Date("2026-05-14"),
      estimatedHours: 24, budgetCents: toCents(3800), percentComplete: 30,
      createdById: ceoId, updatedById: ceoId,
    },
  });
  const paintTask = await prisma.task.create({
    data: {
      projectId: f150Project.id, phaseId: phases["Paint"],
      title: "Cab & bed paint prep", status: "Not Started",
      plannedStart: new Date("2026-06-01"), plannedEnd: new Date("2026-06-20"),
      estimatedHours: 40, budgetCents: toCents(5200),
      createdById: ceoId, updatedById: ceoId,
    },
  });
  // Paint depends on suspension (finish-to-start).
  await prisma.dependency.create({
    data: { predecessorId: suspensionTask.id, successorId: paintTask.id, type: "finish_to_start", createdById: ceoId },
  });

  // Four-date events on the F-150 build.
  await prisma.event.createMany({
    data: [
      { title: "Coilover parts payment", type: "cash_outflow", projectId: f150Project.id, vehicleId: f150.id, taskId: suspensionTask.id, workDate: new Date("2026-05-01"), cashDate: new Date("2026-04-20"), amountCents: toCents(3800), createdById: ceoId, updatedById: ceoId },
      { title: "Suspension install b-roll shoot", type: "content", projectId: f150Project.id, vehicleId: f150.id, contentDate: new Date("2026-05-08"), createdById: ceoId, updatedById: ceoId },
      { title: "Episode 3 publish", type: "content", projectId: f150Project.id, vehicleId: f150.id, contentDate: new Date("2026-05-25"), revenueDate: new Date("2026-06-25"), amountCents: toCents(1200), createdById: ceoId, updatedById: ceoId },
      { title: "Reveal & sale target", type: "vehicle_sale", projectId: f150Project.id, vehicleId: f150.id, workDate: new Date("2026-08-30"), revenueDate: new Date("2026-09-30"), amountCents: toCents(45000), createdById: ceoId, updatedById: ceoId },
    ],
  });

  await prisma.risk.create({
    data: {
      category: "Parts Delay", title: "Drop spindles backordered 3 weeks",
      description: "Vendor quoted 3-week backorder on drop spindles; threatens suspension phase.",
      severity: "high", likelihood: "medium", status: "open", responseOption: "Expedite Shipping",
      projectId: f150Project.id, vehicleId: f150.id, ownerId: ceoId,
      dueDate: new Date("2026-04-25"), createdById: ceoId, updatedById: ceoId,
    },
  });

  // ---- F-150 build detail (Phase 3): costs, parts, document, issue ----
  await prisma.costItem.createMany({
    data: [
      { projectId: f150Project.id, category: "Vehicle acquisition", description: "1979 F-150 purchase", vendor: "Marketplace seller", status: "paid", budgetCents: toCents(8500), committedCents: toCents(8500), actualCents: toCents(8500), paidDate: new Date("2026-02-10"), createdById: ceoId, updatedById: ceoId },
      { projectId: f150Project.id, phaseId: phases["Suspension"], category: "Coilovers", description: "Front coilover conversion", vendor: "Summit Racing", status: "committed", budgetCents: toCents(3800), committedCents: toCents(3800), scheduledCashDate: new Date("2026-04-20"), createdById: ceoId, updatedById: ceoId },
      { projectId: f150Project.id, category: "Wheels", description: "17x8 US Mags set of 4", status: "planned", budgetCents: toCents(2400), createdById: ceoId, updatedById: ceoId },
      { projectId: f150Project.id, category: "Tires", description: "BFG Radial T/A staggered", status: "planned", budgetCents: toCents(1200), createdById: ceoId, updatedById: ceoId },
      { projectId: f150Project.id, phaseId: phases["Paint"], category: "Paint", description: "Single-stage cab & bed", status: "planned", budgetCents: toCents(5200), createdById: ceoId, updatedById: ceoId },
      { projectId: f150Project.id, category: "Partner-shop labor", description: "Fab + install hours", vendor: "Partner Shop", status: "actual", budgetCents: toCents(6000), committedCents: toCents(3000), actualCents: toCents(2400), createdById: ceoId, updatedById: ceoId },
      { projectId: f150Project.id, category: "Brakes", description: "Front disc conversion", vendor: "Summit Racing", status: "paid", budgetCents: toCents(1600), committedCents: toCents(1600), actualCents: toCents(1600), paidDate: new Date("2026-03-15"), createdById: ceoId, updatedById: ceoId },
      { projectId: f150Project.id, category: "Engine", description: "Rebuilt 351W long block", status: "planned", budgetCents: toCents(4500), createdById: ceoId, updatedById: ceoId },
    ],
  });
  await prisma.partsOrder.createMany({
    data: [
      { projectId: f150Project.id, phaseId: phases["Suspension"], manufacturer: "Belltech", partName: "Drop spindles", partNumber: "2600", quantity: 2, unitCostCents: toCents(210), status: "ordered", vendor: "Summit Racing", orderedAt: new Date("2026-04-18"), expectedAt: new Date("2026-05-09"), createdById: ceoId, updatedById: ceoId },
      { projectId: f150Project.id, phaseId: phases["Suspension"], manufacturer: "Belltech", partName: "Coilover kit", partNumber: "SP2-0810", quantity: 1, unitCostCents: toCents(899), status: "quoted", vendor: "Summit Racing", createdById: ceoId, updatedById: ceoId },
    ],
  });
  await prisma.document.create({
    data: { vehicleId: f150.id, projectId: f150Project.id, name: "F-150 Title", category: "Title", notes: "Clean TX title on file", createdById: ceoId },
  });
  await prisma.issue.create({
    data: { projectId: f150Project.id, title: "Driver floor pan rust-through found during teardown", description: "Larger than expected; needs a patch panel before interior.", severity: "high", status: "open", createdById: ceoId, updatedById: ceoId },
  });

  // ---- 1969 Ford F-100 ----
  const f100 = await prisma.vehicle.create({
    data: {
      year: 1969, make: "Ford", model: "F-100", trim: "Styleside", nickname: "Shop Hauler",
      status: "Planned Build", classification: "Shop Vehicle",
      acquisitionCostCents: toCents(6200), buildBudgetCents: toCents(24000),
      currentMarketValueCents: toCents(18000), targetSalePriceCents: toCents(35000),
      acquiredAt: new Date("2026-03-05"),
      createdById: ceoId, updatedById: ceoId,
    },
  });
  await prisma.project.create({
    data: {
      vehicleId: f100.id, name: "F-100 Slammed Shop Truck", status: "Planned",
      budgetCents: toCents(24000), percentComplete: 0,
      plannedStart: new Date("2026-09-01"), plannedEnd: new Date("2027-03-01"),
      createdById: ceoId, updatedById: ceoId,
    },
  });

  // ---- 1975 Ford F-250 Highboy ----
  const highboy = await prisma.vehicle.create({
    data: {
      year: 1975, make: "Ford", model: "F-250", trim: "Highboy", nickname: "Highboy",
      status: "Under Evaluation", classification: "Inventory",
      acquisitionCostCents: toCents(12000), buildBudgetCents: toCents(40000),
      currentMarketValueCents: toCents(22000), targetSalePriceCents: toCents(60000),
      createdById: ceoId, updatedById: ceoId,
    },
  });
  await prisma.project.create({
    data: {
      vehicleId: highboy.id, name: "Highboy 4x4 Revival", status: "Planned",
      budgetCents: toCents(40000), percentComplete: 0,
      plannedStart: new Date("2026-10-01"), plannedEnd: new Date("2027-06-01"),
      createdById: ceoId, updatedById: ceoId,
    },
  });
  // A CEO-decision risk mirroring the PRD example (delay Highboy engine purchase).
  await prisma.risk.create({
    data: {
      category: "Cash Shortage", title: "September cash outflow high — consider delaying Highboy engine",
      description: "Partner-shop capacity ~94% and September outflow is heavy; delaying the engine purchase to October improves cash with no major downstream revenue loss.",
      severity: "medium", likelihood: "high", status: "open", responseOption: "Delay Purchase",
      vehicleId: highboy.id, ownerId: ceoId, dueDate: new Date("2026-09-15"),
      createdById: ceoId, updatedById: ceoId,
    },
  });
}

async function seedFinance(ceoId: string) {
  if ((await prisma.account.count()) > 0) return;
  await prisma.account.createMany({
    data: [
      { name: "Operating Bank", type: "Bank Cash", balanceCents: toCents(42000), description: "Primary business checking", sortOrder: 0, createdById: ceoId, updatedById: ceoId },
      { name: "Protected Household Reserve", type: "Protected Household Reserve", balanceCents: toCents(25000), sortOrder: 1, createdById: ceoId, updatedById: ceoId },
      { name: "Business Reserve", type: "Business Reserve", balanceCents: toCents(10000), sortOrder: 2, createdById: ceoId, updatedById: ceoId },
      { name: "Acquisition Reserve", type: "Acquisition Reserve", balanceCents: toCents(8000), sortOrder: 3, createdById: ceoId, updatedById: ceoId },
      { name: "Giveaway Reserve", type: "Giveaway Reserve", balanceCents: 0, sortOrder: 4, createdById: ceoId, updatedById: ceoId },
    ],
  });
  await prisma.receivable.createMany({
    data: [
      { type: "Sponsor Invoice", segment: "Sponsorship", description: "Summit Racing episode sponsorship", amountCents: toCents(3000), status: "open", dueDate: new Date("2026-08-15"), createdById: ceoId, updatedById: ceoId },
      { type: "Vehicle Deposit", segment: "Automotive", description: "Customer deposit — F-100 build slot", amountCents: toCents(5000), status: "open", dueDate: new Date("2026-07-25"), createdById: ceoId, updatedById: ceoId },
      { type: "Platform Revenue", segment: "Media", description: "YouTube ad revenue — May", amountCents: toCents(1200), status: "open", dueDate: new Date("2026-06-25"), createdById: ceoId, updatedById: ceoId },
      { type: "Affiliate Receivable", segment: "Affiliate", description: "Affiliate payout", amountCents: toCents(450), status: "open", dueDate: new Date("2026-08-01"), createdById: ceoId, updatedById: ceoId },
      { type: "Customer Build Invoice", segment: "Automotive", description: "F-100 progress invoice #1", amountCents: toCents(8000), status: "open", dueDate: new Date("2026-09-30"), createdById: ceoId, updatedById: ceoId },
    ],
  });
  await prisma.payable.createMany({
    data: [
      { category: "Partner Shop", segment: "Automotive", vendor: "Partner Shop", description: "F-150 fab + install progress", amountCents: toCents(3000), status: "scheduled", dueDate: new Date("2026-08-05"), scheduledCashDate: new Date("2026-08-05"), createdById: ceoId, updatedById: ceoId },
      { category: "Parts Vendor", segment: "Automotive", vendor: "Summit Racing", description: "Coilover kit balance", amountCents: toCents(1798), status: "open", dueDate: new Date("2026-08-10"), createdById: ceoId, updatedById: ceoId },
      { category: "Camera Crew", segment: "Media", vendor: "Freelance DP", description: "Suspension shoot day rate", amountCents: toCents(600), status: "open", dueDate: new Date("2026-07-30"), createdById: ceoId, updatedById: ceoId },
      { category: "Insurance", segment: "Other", vendor: "Hagerty", description: "Business + vehicle insurance", amountCents: toCents(450), status: "open", dueDate: new Date("2026-08-01"), createdById: ceoId, updatedById: ceoId },
      { category: "Legal", segment: "Other", vendor: "Sweepstakes counsel", description: "Giveaway official rules review", amountCents: toCents(1500), status: "open", dueDate: new Date("2026-09-15"), createdById: ceoId, updatedById: ceoId },
    ],
  });
  await prisma.transaction.createMany({
    data: [
      { date: new Date("2026-02-10"), direction: "expense", amountCents: toCents(8500), segment: "Automotive", category: "Vehicle acquisition", description: "1979 F-150 purchase", createdById: ceoId },
      { date: new Date("2026-03-15"), direction: "expense", amountCents: toCents(1600), segment: "Automotive", category: "Brakes", description: "Front disc conversion", createdById: ceoId },
      { date: new Date("2026-05-08"), direction: "expense", amountCents: toCents(600), segment: "Media", category: "Camera", description: "Suspension shoot", createdById: ceoId },
      { date: new Date("2026-05-20"), direction: "income", amountCents: toCents(2000), segment: "Sponsorship", category: "Sponsor", description: "Product partner activation", createdById: ceoId },
      { date: new Date("2026-06-15"), direction: "income", amountCents: toCents(300), segment: "Affiliate", category: "Affiliate", description: "June affiliate payout", createdById: ceoId },
      { date: new Date("2026-06-30"), direction: "income", amountCents: toCents(800), segment: "Media", category: "Platform", description: "YouTube ad revenue", createdById: ceoId },
    ],
  });
}

async function main() {
  console.log("Seeding Scarred Steel Co. Platform (Phase 1)…");
  await seedRbac();
  console.log("  ✓ permissions & roles");
  await seedUsers();
  console.log("  ✓ users");
  await seedSettings();
  console.log("  ✓ settings");
  const ceo = await prisma.user.findUnique({ where: { email: "ceo@scarredsteel.co" } });
  if (!ceo) throw new Error("CEO user missing after seed");
  await seedVehicles(ceo.id);
  console.log("  ✓ vehicles, projects, phases, tasks, events, risks");
  await seedFinance(ceo.id);
  console.log("  ✓ finance (accounts, A/R, A/P, transactions)");
  console.log("Seed complete. Dev password for all accounts: " + DEV_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
