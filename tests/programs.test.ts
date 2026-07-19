import { describe, it, expect } from "vitest";
import { assessFleetAsset, annualCostCents, annualValueCents } from "@/server/fleet/keep-sell";
import { launchReadiness, fulfillmentSteps, LAUNCH_GATES } from "@/server/giveaways/compliance";
import { countByStage, countByOutcome } from "@/server/programs/pipeline";
import { FIND_STAGES, RESCUE_OUTCOMES } from "@/lib/enums";
import { toCents } from "@/lib/money";

describe("fleet keep-vs-sell", () => {
  it("sums annual cost and value", () => {
    expect(annualCostCents({ insuranceAnnualCents: toCents(1200), storageAnnualCents: toCents(600), opportunityCostAnnualCents: toCents(1000) })).toBe(toCents(2800));
    expect(annualValueCents({ mediaValueAnnualCents: toCents(3000), brandValueAnnualCents: toCents(2000) })).toBe(toCents(5000));
  });

  it("recommends KEEP when value is well above cost", () => {
    const r = assessFleetAsset({ insuranceAnnualCents: toCents(1000), mediaValueAnnualCents: toCents(4000) });
    expect(r.recommendation).toBe("KEEP");
    expect(r.netAnnualCents).toBe(toCents(3000));
  });

  it("recommends SELL CANDIDATE when cost exceeds value", () => {
    const r = assessFleetAsset({ storageAnnualCents: toCents(3000), mediaValueAnnualCents: toCents(1000) });
    expect(r.recommendation).toBe("SELL CANDIDATE");
  });

  it("recommends REVIEW in the marginal band and when empty", () => {
    expect(assessFleetAsset({ insuranceAnnualCents: toCents(1000), mediaValueAnnualCents: toCents(1200) }).recommendation).toBe("REVIEW ANNUALLY");
    expect(assessFleetAsset({}).recommendation).toBe("REVIEW ANNUALLY");
  });
});

describe("giveaway compliance gates", () => {
  it("blocks launch until every gate passes", () => {
    const partial = launchReadiness({ attorneyReviewed: true, rulesApproved: true });
    expect(partial.launchReady).toBe(false);
    expect(partial.passedCount).toBe(2);
    expect(partial.totalGates).toBe(LAUNCH_GATES.length);
    expect(partial.blockedReasons).toContain("Prize funded");
  });

  it("clears launch when all gates pass", () => {
    const r = launchReadiness({ attorneyReviewed: true, rulesApproved: true, eligibilityDefined: true, taxPlanApproved: true, funded: true });
    expect(r.launchReady).toBe(true);
    expect(r.blockedReasons).toHaveLength(0);
  });

  it("tracks post-draw fulfillment", () => {
    const steps = fulfillmentSteps({ winnerName: "A. Entrant", winnerVerified: true });
    expect(steps.find((s) => s.key === "selected")?.done).toBe(true);
    expect(steps.find((s) => s.key === "transferred")?.done).toBe(false);
  });
});

describe("program funnels", () => {
  it("counts finds by stage in canonical order", () => {
    const f = countByStage([{ stage: "New" }, { stage: "New" }, { stage: "Acquired" }], FIND_STAGES);
    expect(f.map((b) => b.stage)).toEqual([...FIND_STAGES]);
    expect(Object.fromEntries(f.map((b) => [b.stage, b.count]))["New"]).toBe(2);
  });

  it("counts rescue outcomes, ignoring null", () => {
    const f = countByOutcome([{ outcome: "Build" }, { outcome: null }, { outcome: "Giveaway" }], RESCUE_OUTCOMES);
    const by = Object.fromEntries(f.map((b) => [b.stage, b.count]));
    expect(by["Build"]).toBe(1);
    expect(by["Giveaway"]).toBe(1);
    expect(by["Keep"]).toBe(0);
  });
});
