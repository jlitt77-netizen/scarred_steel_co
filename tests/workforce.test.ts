import { describe, it, expect } from "vitest";
import {
  workOrderEstimatedCostCents, workOrderActualCostCents, utilization, memberMonthlyCostCents,
} from "@/server/workforce/capacity";
import { compensationScenarios, recommendScenario, type ScenarioParams } from "@/server/workforce/scenarios";
import { toCents } from "@/lib/money";

describe("work order cost", () => {
  it("hourly uses rate × hours (override or shop rate)", () => {
    expect(workOrderEstimatedCostCents({ type: "hourly", status: "scheduled", estimatedHours: 24, hourlyRateCents: toCents(85) })).toBe(toCents(24 * 85));
    // falls back to shop rate when no override
    expect(workOrderEstimatedCostCents({ type: "hourly", status: "scheduled", estimatedHours: 10 }, toCents(85))).toBe(toCents(850));
    expect(workOrderActualCostCents({ type: "hourly", status: "in_progress", actualHours: 10, hourlyRateCents: toCents(85) })).toBe(toCents(850));
  });
  it("fixed uses fixed price / invoiced", () => {
    expect(workOrderEstimatedCostCents({ type: "fixed", status: "scheduled", fixedPriceCents: toCents(5200) })).toBe(toCents(5200));
    expect(workOrderActualCostCents({ type: "fixed", status: "invoiced", fixedPriceCents: toCents(5200), invoicedCents: toCents(5400) })).toBe(toCents(5400));
  });
});

describe("utilization", () => {
  it("flags overload from remaining committed hours vs monthly capacity", () => {
    const u = utilization(40, [
      { type: "hourly", status: "in_progress", estimatedHours: 24, actualHours: 10 }, // 14 remaining
      { type: "hourly", status: "scheduled", estimatedHours: 16 }, // 16
      { type: "hourly", status: "draft", estimatedHours: 100 }, // ignored (not active)
      { type: "fixed", status: "scheduled", fixedPriceCents: 999 }, // ignored (fixed)
    ]);
    expect(u.committedHoursPerMonth).toBe(30);
    expect(u.capacityHoursPerMonth).toBe(Math.round(40 * (13 / 3))); // ~173
    expect(u.overloaded).toBe(false);
  });
  it("marks overloaded when committed exceeds capacity", () => {
    const u = utilization(5, [{ type: "hourly", status: "scheduled", estimatedHours: 40 }]);
    expect(u.overloaded).toBe(true);
    expect(u.utilizationPct).toBeGreaterThan(100);
  });
});

describe("member monthly cost", () => {
  it("employee is fully loaded / 12", () => {
    const c = memberMonthlyCostCents({ engagementType: "employee", salaryCents: toCents(60000), benefitsCents: toCents(6000), payrollBurdenPct: 15 });
    // (60000 + 6000 + 9000) / 12 = 6250
    expect(c).toBe(toCents(6250));
  });
  it("contractor is rate × assigned hours", () => {
    expect(memberMonthlyCostCents({ engagementType: "contractor", hourlyRateCents: toCents(45) }, 40)).toBe(toCents(45 * 40));
  });
});

describe("compensation scenarios", () => {
  const p: ScenarioParams = {
    monthlyBuildHours: 100,
    partnerShopRateCents: toCents(85),
    partnerShopCapacityPerMonth: 120,
    dedicatedBayMonthlyCents: toCents(2000),
    dedicatedBayRateCents: toCents(65),
    dedicatedBayCapacityPerMonth: 130,
    jvMonthlyOverheadCents: toCents(1500),
    jvRateCents: toCents(55),
    jvCapacityPerMonth: 140,
    coreTeamMonthlyCents: toCents(11000),
    coreTeamCapacityPerMonth: 320,
    standaloneFacilityMonthlyCents: toCents(4500),
  };

  it("computes each scenario's monthly cost", () => {
    const r = compensationScenarios(p);
    const byName = Object.fromEntries(r.map((s) => [s.scenario, s]));
    expect(byName["Stay Partner Shop"].monthlyCostCents).toBe(toCents(8500)); // 100 * 85
    expect(byName["Dedicated Bay"].monthlyCostCents).toBe(toCents(2000 + 6500)); // 2000 + 100*65
    expect(byName["Joint Venture"].monthlyCostCents).toBe(toCents(1500 + 5500));
    expect(byName["Hire Core Team"].monthlyCostCents).toBe(toCents(11000));
    expect(byName["Standalone Facility"].monthlyCostCents).toBe(toCents(15500));
    expect(byName["Stay Partner Shop"].annualCostCents).toBe(toCents(8500 * 12));
    expect(byName["Stay Partner Shop"].costPerHourCents).toBe(toCents(85));
  });

  it("recommends the cheapest scenario that covers demand capacity", () => {
    // demand 130 hrs excludes Stay(120); cheapest feasible is JV (7000) < Dedicated(8500)
    const rec = recommendScenario(compensationScenarios(p), 130);
    expect(rec?.scenario).toBe("Joint Venture");
  });
});
