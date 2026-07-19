import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { toCents } from "@/lib/money";
import {
  utilization, workOrderEstimatedCostCents, workOrderActualCostCents,
  memberMonthlyCostCents, WEEKS_PER_MONTH,
} from "@/server/workforce/capacity";
import { compensationScenarios, recommendScenario, type ScenarioParams } from "@/server/workforce/scenarios";
import type { PartnerShop, WorkOrder, TeamMember, Assignment } from "@prisma/client";

// Partner-shop + work-order surfaces = operations (project:*). Compensation
// amounts + scenario modeling are confidential (finance:read).

export async function listPartnerShops(ctx: AuthContext) {
  requirePermission(ctx, "project:read");
  const shops = await prisma.partnerShop.findMany({
    where: { active: true },
    include: { workOrders: true },
    orderBy: { name: "asc" },
  });
  return shops.map((s) => {
    const util = utilization(s.capacityHoursPerWeek, s.workOrders);
    const estimatedCents = s.workOrders.reduce((sum, wo) => sum + workOrderEstimatedCostCents(wo, s.hourlyRateCents), 0);
    const actualCents = s.workOrders.reduce((sum, wo) => sum + workOrderActualCostCents(wo, s.hourlyRateCents), 0);
    const scheduledCents = s.workOrders
      .filter((wo) => wo.status === "scheduled" || wo.status === "in_progress")
      .reduce((sum, wo) => sum + workOrderEstimatedCostCents(wo, s.hourlyRateCents), 0);
    return { ...s, util, estimatedCents, actualCents, scheduledCents, workOrderCount: s.workOrders.length };
  });
}

export async function listWorkOrders(ctx: AuthContext, opts: { projectId?: string } = {}) {
  requirePermission(ctx, "project:read");
  const orders = await prisma.workOrder.findMany({
    where: opts.projectId ? { projectId: opts.projectId } : undefined,
    include: { partnerShop: { select: { name: true, hourlyRateCents: true } } },
    orderBy: { createdAt: "asc" },
  });
  return orders.map((wo) => ({
    ...wo,
    estimatedCostCents: workOrderEstimatedCostCents(wo, wo.partnerShop?.hourlyRateCents),
    actualCostCents: workOrderActualCostCents(wo, wo.partnerShop?.hourlyRateCents),
  }));
}

export async function listTeamMembers(ctx: AuthContext) {
  requirePermission(ctx, "project:read");
  const members = await prisma.teamMember.findMany({
    where: { active: true },
    include: { assignments: true },
    orderBy: { createdAt: "asc" },
  });
  return members.map((m) => {
    const assignedHoursPerWeek = m.assignments.reduce((s, a) => s + (a.hoursPerWeek ?? 0), 0);
    const monthlyCostCents = memberMonthlyCostCents(m, assignedHoursPerWeek * WEEKS_PER_MONTH);
    return { ...m, assignedHoursPerWeek, monthlyCostCents };
  });
}

/** Compensation scenario comparison (confidential). Uses live partner-shop data
 *  for "Stay Partner Shop" and labeled planning assumptions for the rest. */
export async function getScenarios(ctx: AuthContext) {
  requirePermission(ctx, "finance:read");
  const shops = await prisma.partnerShop.findMany({ where: { active: true }, include: { workOrders: true } });
  const shop = shops[0];
  const shopRate = shop?.hourlyRateCents ?? toCents(85);
  const shopCapPerMonth = Math.round((shop?.capacityHoursPerWeek ?? 40) * WEEKS_PER_MONTH);
  const committed = shops.reduce((s, sh) => s + utilization(sh.capacityHoursPerWeek, sh.workOrders).committedHoursPerMonth, 0);
  const monthlyBuildHours = committed > 0 ? Math.max(committed, 60) : 90;

  // Planning assumptions (documented; editable via settings in a later pass).
  const assumptions = {
    dedicatedBayMonthlyCents: toCents(2000),
    dedicatedBayRateCents: toCents(65),
    dedicatedBayCapacityPerMonth: 130,
    jvMonthlyOverheadCents: toCents(1500),
    jvRateCents: toCents(55),
    jvCapacityPerMonth: 150,
    coreTeamMonthlyCents: toCents(11500), // ~2 fully-loaded builders
    coreTeamCapacityPerMonth: 320,
    standaloneFacilityMonthlyCents: toCents(4500),
  };

  const params: ScenarioParams = {
    monthlyBuildHours,
    partnerShopRateCents: shopRate,
    partnerShopCapacityPerMonth: shopCapPerMonth,
    ...assumptions,
  };
  const results = compensationScenarios(params);
  return { params, results, recommended: recommendScenario(results, monthlyBuildHours) };
}

// ---- writes -----------------------------------------------------------------
export async function createWorkOrder(ctx: AuthContext, data: Omit<WorkOrder, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById" | "invoiceDate" | "paidDate">) {
  requirePermission(ctx, "project:write");
  const row = await prisma.workOrder.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "WorkOrder", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

export async function createTeamMember(ctx: AuthContext, data: Omit<TeamMember, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">) {
  requirePermission(ctx, "project:write");
  const row = await prisma.teamMember.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "TeamMember", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

export async function createAssignment(ctx: AuthContext, data: Omit<Assignment, "id" | "createdAt" | "createdById">) {
  requirePermission(ctx, "project:write");
  const row = await prisma.assignment.create({ data: { ...data, createdById: ctx.userId } });
  await writeAudit({ entityType: "Assignment", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

export async function listPartnerShopsForSelect(ctx: AuthContext) {
  requirePermission(ctx, "project:read");
  return prisma.partnerShop.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
}
