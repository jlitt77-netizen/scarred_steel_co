import { describe, it, expect } from "vitest";
import { computeVehicleMetrics } from "@/lib/vehicle-metrics";
import { toCents } from "@/lib/money";

describe("vehicle metrics", () => {
  it("computes true cash invested net of sponsor offsets", () => {
    const m = computeVehicleMetrics({
      acquisitionCostCents: toCents(8500),
      actualCostCents: toCents(14200),
      sponsorCashCents: toCents(3000),
      sponsorProductOffsetsCents: toCents(4500),
    });
    // 8500 + 14200 - 3000 - 4500 = 15200
    expect(m.trueCashInvestedCents).toBe(toCents(15200));
    expect(m.vehicleProfitCents).toBeNull(); // unsold
    expect(m.roi).toBeNull();
  });

  it("computes profit and ROI when sold", () => {
    const m = computeVehicleMetrics({
      acquisitionCostCents: toCents(10000),
      actualCostCents: toCents(10000),
      actualSalePriceCents: toCents(30000),
    });
    expect(m.trueCashInvestedCents).toBe(toCents(20000));
    expect(m.vehicleProfitCents).toBe(toCents(10000));
    expect(m.roi).toBeCloseTo(0.5, 5);
  });

  it("computes holding period and profit per month", () => {
    const m = computeVehicleMetrics(
      {
        acquisitionCostCents: toCents(10000),
        actualSalePriceCents: toCents(22000),
        acquiredAt: new Date("2026-01-01"),
        soldAt: new Date("2026-07-01"),
      },
      new Date("2026-08-01"),
    );
    expect(m.holdingPeriodMonths).toBe(6);
    expect(m.vehicleProfitCents).toBe(toCents(12000));
    expect(m.profitPerMonthCents).toBe(toCents(2000));
  });

  it("handles empty vehicle without throwing", () => {
    const m = computeVehicleMetrics({});
    expect(m.trueCashInvestedCents).toBe(0);
    expect(m.holdingPeriodMonths).toBeNull();
  });
});
