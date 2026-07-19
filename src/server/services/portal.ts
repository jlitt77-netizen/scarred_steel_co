import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { buildFinancials, displayProgressPct } from "@/server/portal/customer";

// External Portal (Section 28). Five experiences, each gated on its portal:*
// permission. CRITICAL: only customer-safe fields are ever returned — never
// internal cost, margin, budget, reserves, sponsor deal value, or compliance.

async function portalUser(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { customerVehicleId: true, sponsorId: true } });
}

// ---- Build Portal (portal:customer) -----------------------------------------

export async function getMyBuild(ctx: AuthContext) {
  requirePermission(ctx, "portal:customer");
  const u = await portalUser(ctx.userId);
  if (!u?.customerVehicleId) return null;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: u.customerVehicleId },
    select: { id: true, year: true, make: true, model: true, trim: true, nickname: true, status: true },
  });
  if (!vehicle) return null;

  const project = await prisma.project.findFirst({
    where: { vehicleId: vehicle.id },
    select: { id: true, name: true, status: true, percentComplete: true, plannedStart: true, plannedEnd: true, budgetCents: true,
      phases: { select: { name: true, status: true, sequence: true }, orderBy: { sequence: "asc" } },
      changeOrders: { select: { id: true, title: true, description: true, amountCents: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" } },
    },
  });

  const [photos, payments] = await Promise.all([
    prisma.photo.findMany({ where: { vehicleId: vehicle.id }, select: { url: true, caption: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.receivable.findMany({ where: { type: "Customer Build Invoice" }, select: { amountCents: true, status: true, description: true, dueDate: true } }),
  ]);

  // Contract amount is the customer-facing budget (not internal cost/margin).
  const contractCents = project?.budgetCents ?? 0;
  const financials = buildFinancials(contractCents, project?.changeOrders ?? [], payments);

  return {
    vehicle,
    project: project ? { name: project.name, status: project.status, percentComplete: displayProgressPct(project.percentComplete), plannedStart: project.plannedStart, plannedEnd: project.plannedEnd } : null,
    phases: project?.phases ?? [],
    changeOrders: project?.changeOrders ?? [],
    photos,
    financials,
  };
}

export async function respondToChangeOrder(ctx: AuthContext, changeOrderId: string, approve: boolean) {
  requirePermission(ctx, "portal:customer");
  const u = await portalUser(ctx.userId);
  const co = await prisma.changeOrder.findUnique({ where: { id: changeOrderId }, include: { project: { select: { vehicleId: true } } } });
  if (!co) throw new Error("Change order not found.");
  // Authorize: the change order must belong to this customer's vehicle.
  if (!u?.customerVehicleId || co.project.vehicleId !== u.customerVehicleId) throw new Error("Not authorized for this change order.");
  if (co.status !== "proposed") throw new Error("This change order has already been decided.");
  const row = await prisma.changeOrder.update({ where: { id: changeOrderId }, data: { status: approve ? "approved" : "declined", updatedById: ctx.userId } });
  await writeAudit({ entityType: "ChangeOrder", entityId: changeOrderId, action: "customer_decision", field: "status", before: "proposed", after: row.status, userId: ctx.userId });
  return row;
}

// ---- Sponsor Portal (portal:sponsor) ----------------------------------------

export async function getMySponsorship(ctx: AuthContext) {
  requirePermission(ctx, "portal:sponsor");
  const u = await portalUser(ctx.userId);
  if (!u?.sponsorId) return null;

  const sponsor = await prisma.sponsor.findUnique({
    where: { id: u.sponsorId },
    // NOTE: deliberately NO cash/product value, discount, or margin fields.
    select: { id: true, name: true, level: true, stage: true, exclusive: true, exclusiveCategory: true, contractStart: true, contractEnd: true, renewalDate: true,
      deliverables: { select: { id: true, title: true, type: true, status: true, dueDate: true, episodeId: true }, orderBy: { dueDate: "asc" } },
    },
  });
  if (!sponsor) return null;

  // Published content tied to the sponsor's deliverables' episodes.
  const episodeIds = sponsor.deliverables.map((d) => d.episodeId).filter((x): x is string => !!x);
  const posts = episodeIds.length
    ? await prisma.socialPost.findMany({ where: { episodeId: { in: episodeIds } }, select: { title: true, platform: true, status: true, publishedDate: true }, orderBy: { publishedDate: "desc" }, take: 20 })
    : [];

  return { sponsor, deliverables: sponsor.deliverables, posts };
}

export async function respondToDeliverable(ctx: AuthContext, deliverableId: string, approve: boolean) {
  requirePermission(ctx, "portal:sponsor");
  const u = await portalUser(ctx.userId);
  const d = await prisma.sponsorDeliverable.findUnique({ where: { id: deliverableId }, select: { id: true, sponsorId: true, status: true } });
  if (!d) throw new Error("Deliverable not found.");
  if (!u?.sponsorId || d.sponsorId !== u.sponsorId) throw new Error("Not authorized for this deliverable.");
  if (d.status !== "Submitted" && d.status !== "Sponsor Review") throw new Error("This deliverable isn't awaiting your review.");
  const status = approve ? "Approved" : "Needs Revision";
  const row = await prisma.sponsorDeliverable.update({ where: { id: deliverableId }, data: { status, updatedById: ctx.userId } });
  await writeAudit({ entityType: "SponsorDeliverable", entityId: deliverableId, action: "sponsor_decision", field: "status", before: d.status, after: status, userId: ctx.userId });
  return row;
}

// ---- Digital Products Portal (portal:digital) -------------------------------

export async function getMyGarage(ctx: AuthContext) {
  requirePermission(ctx, "portal:digital");
  const [products, affiliates] = await Promise.all([
    prisma.digitalProduct.findMany({ where: { status: "Published" }, select: { id: true, name: true, type: true, priceCents: true, description: true }, orderBy: { createdAt: "asc" } }),
    prisma.affiliateProduct.findMany({ where: { active: true }, select: { id: true, name: true, vendor: true, url: true }, orderBy: { createdAt: "asc" } }),
  ]);
  return { products, affiliates };
}

// ---- Giveaway Portal (portal:giveaway) --------------------------------------

export async function getPublicGiveaways(ctx: AuthContext) {
  requirePermission(ctx, "portal:giveaway");
  // Only live/complete giveaways, and only public-safe fields — NEVER the
  // internal compliance gates.
  const giveaways = await prisma.giveaway.findMany({
    where: { status: { in: ["Live", "Complete"] } },
    select: { id: true, name: true, prizeDescription: true, prizeValueCents: true, launchDate: true, endDate: true, drawDate: true, status: true, winnerName: true },
    orderBy: { launchDate: "desc" },
  });
  return giveaways.map((g) => ({
    ...g,
    // Winner shown only once complete; live giveaways hide it.
    winnerName: g.status === "Complete" ? g.winnerName : null,
  }));
}

// ---- Community / Fan Portal (portal:fan) -------------------------------------

export async function getCommunityFeed(ctx: AuthContext) {
  requirePermission(ctx, "portal:fan");
  const [builds, episodes, drops, releases, forSale, finds, rescues] = await Promise.all([
    prisma.vehicle.findMany({ where: { status: "Active Build" }, select: { id: true, year: true, make: true, model: true, nickname: true }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.episode.findMany({ where: { stage: "Published" }, select: { title: true, publishedDate: true, youtubeUrl: true }, orderBy: { publishedDate: "desc" }, take: 8 }),
    prisma.merchProduct.findMany({ where: { isDrop: true, status: { in: ["Active", "Sold Out"] } }, select: { name: true, dropDate: true, retailCents: true }, orderBy: { dropDate: "desc" }, take: 6 }),
    prisma.digitalProduct.findMany({ where: { status: "Published", type: { in: ["Build Blueprint", "Complete Build Guide"] } }, select: { name: true, type: true, priceCents: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.vehicle.findMany({ where: { status: "For Sale" }, select: { year: true, make: true, model: true, targetSalePriceCents: true }, take: 6 }),
    prisma.vehicleFind.findMany({ where: { stage: { in: ["Saved", "Contacted", "Evaluating", "Acquired"] } }, select: { vehicleDesc: true, location: true, stage: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.rescue.findMany({ select: { title: true, stage: true, outcome: true }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  return { builds, episodes, drops, releases, forSale, finds, rescues };
}
