import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { BUILD_PHASE_NAMES } from "@/lib/enums";
import {
  marginCents, marginPct, needsReorder, merchSummary,
  conversionRatePct, affiliateSummary, digitalSummary, blueprintCompletenessPct,
} from "@/server/commerce/economics";
import type { MerchProduct, AffiliateProduct, DigitalProduct, BlueprintSection } from "@prisma/client";

// Merchandise & Commerce + Digital Products (Sections 18–19). Gated commerce:*.

// ---- merch ------------------------------------------------------------------

export async function listMerchProducts(ctx: AuthContext) {
  requirePermission(ctx, "commerce:read");
  const products = await prisma.merchProduct.findMany({ orderBy: { createdAt: "asc" } });
  return products.map((p) => ({
    ...p,
    marginCents: marginCents(p.retailCents, p.cogsCents),
    marginPct: marginPct(p.retailCents, p.cogsCents),
    lowStock: needsReorder(p),
  }));
}

export async function getMerchSummary(ctx: AuthContext) {
  requirePermission(ctx, "commerce:read");
  const products = await prisma.merchProduct.findMany();
  const dropCount = products.filter((p) => p.isDrop).length;
  return { ...merchSummary(products), dropCount };
}

// ---- affiliate --------------------------------------------------------------

export async function listAffiliateProducts(ctx: AuthContext) {
  requirePermission(ctx, "commerce:read");
  const links = await prisma.affiliateProduct.findMany({ orderBy: { createdAt: "asc" } });
  return links.map((l) => ({ ...l, conversionRatePct: conversionRatePct(l.clicks, l.conversions) }));
}

export async function getAffiliateSummary(ctx: AuthContext) {
  requirePermission(ctx, "commerce:read");
  const links = await prisma.affiliateProduct.findMany();
  return affiliateSummary(links);
}

// ---- digital + blueprint ----------------------------------------------------

export async function listDigitalProducts(ctx: AuthContext) {
  requirePermission(ctx, "commerce:read");
  const products = await prisma.digitalProduct.findMany({
    include: { _count: { select: { sections: true } } },
    orderBy: { createdAt: "asc" },
  });
  return products.map((p) => ({ ...p, sectionCount: p._count.sections }));
}

export async function getDigitalSummary(ctx: AuthContext) {
  requirePermission(ctx, "commerce:read");
  const products = await prisma.digitalProduct.findMany();
  return digitalSummary(products);
}

export async function listBlueprintSections(ctx: AuthContext) {
  requirePermission(ctx, "commerce:read");
  const sections = await prisma.blueprintSection.findMany({
    include: { digitalProduct: { select: { name: true } } },
    orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
  });
  const completenessPct = blueprintCompletenessPct(sections.map((s) => s.phaseName), BUILD_PHASE_NAMES.length);
  return {
    sections: sections.map((s) => ({ ...s, productName: s.digitalProduct?.name ?? null })),
    completenessPct,
    totalPhases: BUILD_PHASE_NAMES.length,
  };
}

export async function listDigitalProductsForSelect(ctx: AuthContext) {
  requirePermission(ctx, "commerce:read");
  return prisma.digitalProduct.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}

// ---- writes -----------------------------------------------------------------

export async function createMerchProduct(ctx: AuthContext, data: Omit<MerchProduct, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">) {
  requirePermission(ctx, "commerce:write");
  const row = await prisma.merchProduct.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "MerchProduct", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

export async function createAffiliateProduct(ctx: AuthContext, data: Omit<AffiliateProduct, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">) {
  requirePermission(ctx, "commerce:write");
  const row = await prisma.affiliateProduct.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "AffiliateProduct", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

export async function createDigitalProduct(ctx: AuthContext, data: Omit<DigitalProduct, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">) {
  requirePermission(ctx, "commerce:write");
  const row = await prisma.digitalProduct.create({ data: { ...data, createdById: ctx.userId, updatedById: ctx.userId } });
  await writeAudit({ entityType: "DigitalProduct", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}

export async function createBlueprintSection(ctx: AuthContext, data: Omit<BlueprintSection, "id" | "createdAt" | "createdById">) {
  requirePermission(ctx, "commerce:write");
  const row = await prisma.blueprintSection.create({ data: { ...data, createdById: ctx.userId } });
  await writeAudit({ entityType: "BlueprintSection", entityId: row.id, action: "create", after: row, userId: ctx.userId });
  return row;
}
