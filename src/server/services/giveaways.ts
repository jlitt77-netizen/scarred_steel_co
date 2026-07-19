import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { launchReadiness, fulfillmentSteps } from "@/server/giveaways/compliance";
import type { Giveaway } from "@prisma/client";

// Giveaway Planning & Compliance (Section 23). LAUNCH BLOCKED until every gate
// passes. Gated on giveaway:read / giveaway:write.

export async function listGiveaways(ctx: AuthContext) {
  requirePermission(ctx, "giveaway:read");
  const giveaways = await prisma.giveaway.findMany({ orderBy: { createdAt: "desc" } });
  return giveaways.map((g) => ({
    ...g,
    readiness: launchReadiness(g),
    fulfillment: fulfillmentSteps(g),
  }));
}

export async function getGiveawaySummary(ctx: AuthContext) {
  requirePermission(ctx, "giveaway:read");
  const giveaways = await prisma.giveaway.findMany();
  const live = giveaways.filter((g) => g.status === "Live").length;
  const blocked = giveaways.filter((g) => g.status !== "Complete" && g.status !== "Cancelled" && !launchReadiness(g).launchReady).length;
  const readyToLaunch = giveaways.filter((g) => g.status === "Planning" && launchReadiness(g).launchReady).length;
  const prizeValueCents = giveaways.filter((g) => g.status === "Live" || g.status === "Planning").reduce((s, g) => s + (g.prizeValueCents ?? 0), 0);
  return { count: giveaways.length, live, blocked, readyToLaunch, prizeValueCents };
}

export async function createGiveaway(ctx: AuthContext, data: Omit<Giveaway, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">) {
  requirePermission(ctx, "giveaway:write");
  const row = await prisma.giveaway.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "Giveaway", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

/** Toggle a single compliance/fulfillment boolean gate. */
export async function setGiveawayGate(ctx: AuthContext, id: string, gate: string, value: boolean) {
  requirePermission(ctx, "giveaway:write");
  const allowed = new Set(["attorneyReviewed", "rulesApproved", "eligibilityDefined", "taxPlanApproved", "funded", "winnerVerified", "prizeTransferred", "taxDocsSent"]);
  if (!allowed.has(gate)) throw new Error("Unknown gate.");
  const row = await prisma.giveaway.update({ where: { id }, data: { [gate]: value, updatedById: ctx.userId } });
  await writeAudit({ entityType: "Giveaway", entityId: id, action: "gate", field: gate, after: value, userId: ctx.userId });
  return row;
}

/**
 * Launch a giveaway — only permitted once every compliance gate passes.
 * This is the hard gate: the service refuses otherwise.
 */
export async function launchGiveaway(ctx: AuthContext, id: string) {
  requirePermission(ctx, "giveaway:write");
  const g = await prisma.giveaway.findUnique({ where: { id } });
  if (!g) throw new Error("Giveaway not found.");
  if (!launchReadiness(g).launchReady) throw new Error("LAUNCH BLOCKED — complete every compliance gate first.");
  const row = await prisma.giveaway.update({ where: { id }, data: { status: "Live", stage: "Live", updatedById: ctx.userId } });
  await writeAudit({ entityType: "Giveaway", entityId: id, action: "launch", after: { status: "Live" }, userId: ctx.userId });
  return row;
}
