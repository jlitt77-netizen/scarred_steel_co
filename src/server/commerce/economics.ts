// Pure commerce math (Sections 18–19). No DB. Money in cents.
//
// Merch unit economics (margin, inventory value, reorder), affiliate
// performance (conversion rate), and digital-product / blueprint rollups.

export interface MerchLite {
  status?: string;
  cogsCents?: number | null;
  retailCents?: number | null;
  inventoryQty?: number | null;
  reorderPoint?: number | null;
  active?: boolean;
}

/** Per-unit gross margin (retail − cogs). */
export function marginCents(retailCents?: number | null, cogsCents?: number | null): number {
  return (retailCents ?? 0) - (cogsCents ?? 0);
}

/** Gross margin as a whole-number percent of retail. 0 retail → 0. */
export function marginPct(retailCents?: number | null, cogsCents?: number | null): number {
  const r = retailCents ?? 0;
  if (r <= 0) return 0;
  return Math.round((marginCents(r, cogsCents) / r) * 100);
}

/** A stocked product at or below its reorder point needs restocking. */
export function needsReorder(p: MerchLite): boolean {
  const qty = p.inventoryQty ?? 0;
  const point = p.reorderPoint ?? 0;
  return p.active !== false && point > 0 && qty <= point;
}

export interface MerchSummary {
  productCount: number;
  inventoryUnits: number;
  inventoryCostCents: number; // units × cogs (capital tied up)
  inventoryRetailCents: number; // units × retail (potential revenue)
  lowStockCount: number;
}

export function merchSummary(products: MerchLite[]): MerchSummary {
  let inventoryUnits = 0, inventoryCostCents = 0, inventoryRetailCents = 0, lowStockCount = 0;
  for (const p of products) {
    const qty = p.inventoryQty ?? 0;
    inventoryUnits += qty;
    inventoryCostCents += qty * (p.cogsCents ?? 0);
    inventoryRetailCents += qty * (p.retailCents ?? 0);
    if (needsReorder(p)) lowStockCount++;
  }
  return { productCount: products.length, inventoryUnits, inventoryCostCents, inventoryRetailCents, lowStockCount };
}

// ---- affiliate --------------------------------------------------------------

export interface AffiliateLite {
  clicks?: number | null;
  conversions?: number | null;
  revenueCents?: number | null;
}

/** Conversions ÷ clicks as a percentage (one decimal). 0 clicks → 0. */
export function conversionRatePct(clicks?: number | null, conversions?: number | null): number {
  const c = clicks ?? 0;
  if (c <= 0) return 0;
  return Math.round(((conversions ?? 0) / c) * 1000) / 10;
}

export interface AffiliateSummary {
  linkCount: number;
  clicks: number;
  conversions: number;
  revenueCents: number;
  conversionRatePct: number;
}

export function affiliateSummary(links: AffiliateLite[]): AffiliateSummary {
  const clicks = links.reduce((s, l) => s + (l.clicks ?? 0), 0);
  const conversions = links.reduce((s, l) => s + (l.conversions ?? 0), 0);
  const revenueCents = links.reduce((s, l) => s + (l.revenueCents ?? 0), 0);
  return { linkCount: links.length, clicks, conversions, revenueCents, conversionRatePct: conversionRatePct(clicks, conversions) };
}

// ---- digital products + blueprint -------------------------------------------

export interface DigitalLite {
  status?: string;
  salesCount?: number | null;
  revenueCents?: number | null;
}

export interface DigitalSummary {
  productCount: number;
  publishedCount: number;
  totalSales: number;
  revenueCents: number;
}

export function digitalSummary(products: DigitalLite[]): DigitalSummary {
  return {
    productCount: products.length,
    publishedCount: products.filter((p) => p.status === "Published").length,
    totalSales: products.reduce((s, p) => s + (p.salesCount ?? 0), 0),
    revenueCents: products.reduce((s, p) => s + (p.revenueCents ?? 0), 0),
  };
}

/**
 * Blueprint completeness: fraction of the build's phases that have at least one
 * captured section, as a whole-number percent. Captured DURING the build.
 */
export function blueprintCompletenessPct(capturedPhaseNames: (string | null | undefined)[], totalPhases: number): number {
  if (totalPhases <= 0) return 0;
  const covered = new Set(capturedPhaseNames.filter((p): p is string => !!p));
  return Math.round((Math.min(covered.size, totalPhases) / totalPhases) * 100);
}
