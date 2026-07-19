import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { countByStage, countByOutcome } from "@/server/programs/pipeline";
import { FIND_STAGES, RESCUE_STAGES, RESCUE_OUTCOMES } from "@/lib/enums";
import type { VehicleFind, Rescue } from "@prisma/client";

// Scarred Steel Finds (Section 21) + Rescues (Section 22). Vehicle-domain
// acquisition/content programs. Gated on vehicle:read / vehicle:write.

// ---- Finds ------------------------------------------------------------------

export async function listFinds(ctx: AuthContext) {
  requirePermission(ctx, "vehicle:read");
  const finds = await prisma.vehicleFind.findMany({ orderBy: { createdAt: "desc" } });
  const funnel = countByStage(finds, FIND_STAGES);
  const active = finds.filter((f) => f.stage !== "Rejected" && f.stage !== "Acquired").length;
  const acquired = finds.filter((f) => f.stage === "Acquired").length;
  return { finds, funnel, active, acquired, total: finds.length };
}

export async function createFind(ctx: AuthContext, data: Omit<VehicleFind, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">) {
  requirePermission(ctx, "vehicle:write");
  const row = await prisma.vehicleFind.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "VehicleFind", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

export async function setFindStage(ctx: AuthContext, id: string, stage: string) {
  requirePermission(ctx, "vehicle:write");
  const before = await prisma.vehicleFind.findUnique({ where: { id } });
  if (!before) throw new Error("Find not found.");
  const row = await prisma.vehicleFind.update({ where: { id }, data: { stage, updatedById: ctx.userId } });
  await writeAudit({ entityType: "VehicleFind", entityId: id, action: "stage", field: "stage", before: before.stage, after: stage, userId: ctx.userId });
  return row;
}

// ---- Rescues ----------------------------------------------------------------

export async function listRescues(ctx: AuthContext) {
  requirePermission(ctx, "vehicle:read");
  const rescues = await prisma.rescue.findMany({ orderBy: { createdAt: "desc" } });
  const funnel = countByStage(rescues, RESCUE_STAGES);
  const outcomes = countByOutcome(rescues, RESCUE_OUTCOMES);
  const active = rescues.filter((r) => r.stage !== "Complete").length;
  return { rescues, funnel, outcomes, active, total: rescues.length };
}

export async function createRescue(ctx: AuthContext, data: Omit<Rescue, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">) {
  requirePermission(ctx, "vehicle:write");
  const row = await prisma.rescue.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "Rescue", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

export async function setRescueStage(ctx: AuthContext, id: string, stage: string) {
  requirePermission(ctx, "vehicle:write");
  const before = await prisma.rescue.findUnique({ where: { id } });
  if (!before) throw new Error("Rescue not found.");
  const row = await prisma.rescue.update({ where: { id }, data: { stage, updatedById: ctx.userId } });
  await writeAudit({ entityType: "Rescue", entityId: id, action: "stage", field: "stage", before: before.stage, after: stage, userId: ctx.userId });
  return row;
}
