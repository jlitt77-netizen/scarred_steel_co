import { describe, it, expect } from "vitest";
import {
  marginCents, marginPct, needsReorder, merchSummary,
  conversionRatePct, affiliateSummary, digitalSummary, blueprintCompletenessPct,
} from "@/server/commerce/economics";
import { toCents } from "@/lib/money";

describe("merch economics", () => {
  it("computes margin in cents and percent", () => {
    expect(marginCents(toCents(30), toCents(12))).toBe(toCents(18));
    expect(marginPct(toCents(30), toCents(12))).toBe(60);
    expect(marginPct(0, toCents(12))).toBe(0);
  });

  it("flags reorder only for active, stocked-out-below-point products", () => {
    expect(needsReorder({ inventoryQty: 5, reorderPoint: 10 })).toBe(true);
    expect(needsReorder({ inventoryQty: 10, reorderPoint: 10 })).toBe(true);
    expect(needsReorder({ inventoryQty: 11, reorderPoint: 10 })).toBe(false);
    expect(needsReorder({ inventoryQty: 0, reorderPoint: 0 })).toBe(false); // no reorder point set
    expect(needsReorder({ inventoryQty: 1, reorderPoint: 10, active: false })).toBe(false);
  });

  it("rolls up inventory value and low-stock count", () => {
    const s = merchSummary([
      { cogsCents: toCents(10), retailCents: toCents(30), inventoryQty: 20, reorderPoint: 5 },
      { cogsCents: toCents(5), retailCents: toCents(15), inventoryQty: 3, reorderPoint: 10 }, // low
    ]);
    expect(s.inventoryUnits).toBe(23);
    expect(s.inventoryCostCents).toBe(toCents(10 * 20 + 5 * 3));
    expect(s.inventoryRetailCents).toBe(toCents(30 * 20 + 15 * 3));
    expect(s.lowStockCount).toBe(1);
  });
});

describe("affiliate performance", () => {
  it("computes conversion rate with one decimal", () => {
    expect(conversionRatePct(1000, 25)).toBe(2.5);
    expect(conversionRatePct(0, 5)).toBe(0);
  });

  it("aggregates clicks, conversions, and revenue", () => {
    const s = affiliateSummary([
      { clicks: 600, conversions: 12, revenueCents: toCents(240) },
      { clicks: 400, conversions: 8, revenueCents: toCents(160) },
    ]);
    expect(s.clicks).toBe(1000);
    expect(s.conversions).toBe(20);
    expect(s.revenueCents).toBe(toCents(400));
    expect(s.conversionRatePct).toBe(2);
  });
});

describe("digital products + blueprint", () => {
  it("summarizes digital catalog", () => {
    const s = digitalSummary([
      { status: "Published", salesCount: 40, revenueCents: toCents(1200) },
      { status: "Published", salesCount: 10, revenueCents: toCents(500) },
      { status: "Draft", salesCount: 0, revenueCents: 0 },
    ]);
    expect(s.productCount).toBe(3);
    expect(s.publishedCount).toBe(2);
    expect(s.totalSales).toBe(50);
    expect(s.revenueCents).toBe(toCents(1700));
  });

  it("computes blueprint completeness from captured phases", () => {
    expect(blueprintCompletenessPct(["Suspension", "Paint", "Suspension", null], 8)).toBe(25);
    expect(blueprintCompletenessPct([], 8)).toBe(0);
    expect(blueprintCompletenessPct(["A", "B"], 0)).toBe(0);
  });
});
