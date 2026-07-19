import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import {
  sponsorTotalValueCents, pipelineFunnel, activeValueCents,
  deliverableFunnel, isOverdue, deliverablesDue, renewalsDue,
} from "@/server/sponsors/pipeline";
import type { Sponsor, SponsorDeliverable } from "@prisma/client";

// Sponsorship & Partnership CRM (Section 17). Operational — gated on sponsor:*.

export async function listSponsors(ctx: AuthContext) {
  requirePermission(ctx, "sponsor:read");
  const sponsors = await prisma.sponsor.findMany({
    include: { deliverables: { select: { status: true, dueDate: true } } },
    orderBy: { createdAt: "asc" },
  });
  const now = new Date();
  return sponsors.map((s) => {
    const openDeliverables = s.deliverables.filter((d) => d.status !== "Published").length;
    const overdueDeliverables = s.deliverables.filter((d) => isOverdue(d, now)).length;
    return { ...s, totalValueCents: sponsorTotalValueCents(s), openDeliverables, overdueDeliverables };
  });
}

export async function getSponsorSummary(ctx: AuthContext) {
  requirePermission(ctx, "sponsor:read");
  const now = new Date();
  const [sponsors, deliverables] = await Promise.all([
    prisma.sponsor.findMany({ select: { stage: true, active: true, cashValueCents: true, productValueCents: true, renewalDate: true } }),
    prisma.sponsorDeliverable.findMany({ select: { status: true, dueDate: true } }),
  ]);
  const activeSponsors = sponsors.filter((s) => s.stage === "Active" || s.stage === "Renewal").length;
  return {
    sponsorCount: sponsors.length,
    activeSponsors,
    activeValueCents: activeValueCents(sponsors),
    pipelineValueCents: sponsors.reduce((sum, s) => sum + sponsorTotalValueCents(s), 0),
    funnel: pipelineFunnel(sponsors),
    deliverableFunnel: deliverableFunnel(deliverables),
    due: deliverablesDue(deliverables, now),
    renewalsDue: renewalsDue(sponsors, now),
  };
}

export async function listDeliverables(ctx: AuthContext) {
  requirePermission(ctx, "sponsor:read");
  const now = new Date();
  const rows = await prisma.sponsorDeliverable.findMany({
    include: { sponsor: { select: { name: true } } },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((d) => ({ ...d, sponsorName: d.sponsor?.name ?? null, overdue: isOverdue(d, now) }));
}

/** Count of open sponsor deliverables due soon or overdue — for the dashboard. */
export async function getDeliverablesDueCount(ctx: AuthContext) {
  requirePermission(ctx, "sponsor:read");
  const deliverables = await prisma.sponsorDeliverable.findMany({ select: { status: true, dueDate: true } });
  const { overdue, dueSoon } = deliverablesDue(deliverables, new Date());
  return { overdue, dueSoon, total: overdue + dueSoon };
}

export async function listSponsorsForSelect(ctx: AuthContext) {
  requirePermission(ctx, "sponsor:read");
  return prisma.sponsor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}

// ---- writes -----------------------------------------------------------------

export async function createSponsor(ctx: AuthContext, data: Omit<Sponsor, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">) {
  requirePermission(ctx, "sponsor:write");
  const row = await prisma.sponsor.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "Sponsor", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

export async function createDeliverable(ctx: AuthContext, data: Omit<SponsorDeliverable, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">) {
  requirePermission(ctx, "sponsor:write");
  const row = await prisma.sponsorDeliverable.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "SponsorDeliverable", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

/** Advance a deliverable's status (e.g. approve). Stamps completedDate on Published. */
export async function setDeliverableStatus(ctx: AuthContext, id: string, status: string) {
  requirePermission(ctx, "sponsor:write");
  const before = await prisma.sponsorDeliverable.findUnique({ where: { id } });
  if (!before) throw new Error("Deliverable not found.");
  const row = await prisma.sponsorDeliverable.update({
    where: { id },
    data: {
      status,
      completedDate: status === "Published" ? (before.completedDate ?? new Date()) : before.completedDate,
      updatedById: ctx.userId,
    },
  });
  await writeAudit({ entityType: "SponsorDeliverable", entityId: id, action: "status", field: "status", before: before.status, after: status, userId: ctx.userId });
  return row;
}
