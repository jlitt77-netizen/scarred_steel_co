import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import {
  costItemCreateSchema,
  partsOrderCreateSchema,
  documentCreateSchema,
  photoCreateSchema,
  issueCreateSchema,
} from "@/lib/validation";
import { rollupCosts } from "@/server/build/cost-rollup";

// Build OS services (Phase 3). All read/write gated on project permissions and
// audited. Empty affiliate/url strings are normalized to null.
const nn = (v: unknown) => (v === "" || v === undefined ? null : v);

// ---- Cost items -------------------------------------------------------------
export async function listCostItems(ctx: AuthContext, projectId: string) {
  requirePermission(ctx, "project:read");
  const items = await prisma.costItem.findMany({
    where: { projectId },
    include: { phase: { select: { name: true } } },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });
  return { items, rollup: rollupCosts(items) };
}

export async function createCostItem(ctx: AuthContext, input: unknown) {
  requirePermission(ctx, "project:write");
  const data = costItemCreateSchema.parse(input);
  const item = await prisma.costItem.create({
    data: { ...data, createdById: ctx.userId, updatedById: ctx.userId },
  });
  await writeAudit({ entityType: "CostItem", entityId: item.id, action: "create", after: item, userId: ctx.userId });
  return item;
}

export async function updateCostItem(ctx: AuthContext, id: string, input: unknown) {
  requirePermission(ctx, "project:write");
  const data = costItemCreateSchema.partial().omit({ projectId: true }).parse(input);
  const before = await prisma.costItem.findUnique({ where: { id } });
  if (!before) throw new Error("Cost item not found");
  const item = await prisma.costItem.update({ where: { id }, data: { ...data, updatedById: ctx.userId } });
  await writeAudit({ entityType: "CostItem", entityId: id, action: "update", before, after: item, userId: ctx.userId });
  return item;
}

// ---- Parts orders -----------------------------------------------------------
export async function listPartsOrders(ctx: AuthContext, projectId: string) {
  requirePermission(ctx, "project:read");
  return prisma.partsOrder.findMany({
    where: { projectId },
    include: { phase: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function createPartsOrder(ctx: AuthContext, input: unknown) {
  requirePermission(ctx, "project:write");
  const data = partsOrderCreateSchema.parse(input);
  const order = await prisma.partsOrder.create({
    data: { ...data, affiliateUrl: nn(data.affiliateUrl) as string | null, createdById: ctx.userId, updatedById: ctx.userId },
  });
  await writeAudit({ entityType: "PartsOrder", entityId: order.id, action: "create", after: order, userId: ctx.userId });
  return order;
}

// ---- Documents --------------------------------------------------------------
export async function listDocuments(ctx: AuthContext, opts: { vehicleId?: string; projectId?: string }) {
  requirePermission(ctx, "vehicle:read");
  return prisma.document.findMany({
    where: { OR: [opts.vehicleId ? { vehicleId: opts.vehicleId } : {}, opts.projectId ? { projectId: opts.projectId } : {}] },
    orderBy: { createdAt: "desc" },
  });
}

export async function createDocument(ctx: AuthContext, input: unknown) {
  requirePermission(ctx, "vehicle:write");
  const data = documentCreateSchema.parse(input);
  const doc = await prisma.document.create({
    data: { ...data, url: nn(data.url) as string | null, createdById: ctx.userId },
  });
  await writeAudit({ entityType: "Document", entityId: doc.id, action: "create", after: doc, userId: ctx.userId });
  return doc;
}

// ---- Photos -----------------------------------------------------------------
export async function listPhotos(ctx: AuthContext, opts: { vehicleId?: string; projectId?: string }) {
  requirePermission(ctx, "vehicle:read");
  return prisma.photo.findMany({
    where: { OR: [opts.vehicleId ? { vehicleId: opts.vehicleId } : {}, opts.projectId ? { projectId: opts.projectId } : {}] },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPhoto(ctx: AuthContext, input: unknown) {
  requirePermission(ctx, "vehicle:write");
  const data = photoCreateSchema.parse(input);
  const photo = await prisma.photo.create({ data: { ...data, createdById: ctx.userId } });
  await writeAudit({ entityType: "Photo", entityId: photo.id, action: "create", after: photo, userId: ctx.userId });
  return photo;
}

// ---- Issues -----------------------------------------------------------------
export async function listIssues(ctx: AuthContext, projectId: string) {
  requirePermission(ctx, "project:read");
  return prisma.issue.findMany({
    where: { projectId },
    orderBy: [{ status: "asc" }, { severity: "desc" }],
  });
}

export async function createIssue(ctx: AuthContext, input: unknown) {
  requirePermission(ctx, "project:write");
  const data = issueCreateSchema.parse(input);
  const issue = await prisma.issue.create({
    data: { ...data, createdById: ctx.userId, updatedById: ctx.userId },
  });
  await writeAudit({ entityType: "Issue", entityId: issue.id, action: "create", after: issue, userId: ctx.userId });
  return issue;
}

// ---- Cross-cutting: everything for a vehicle's primary project --------------
export async function getVehicleBuildBundle(ctx: AuthContext, vehicleId: string) {
  requirePermission(ctx, "vehicle:read");
  const project = await prisma.project.findFirst({
    where: { vehicleId },
    orderBy: { createdAt: "asc" },
    include: {
      phases: { orderBy: { sequence: "asc" }, include: { tasks: true } },
    },
  });
  return project;
}
