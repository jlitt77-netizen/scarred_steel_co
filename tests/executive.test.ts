import { describe, it, expect } from "vitest";
import { projectForecast } from "@/server/forecast/scenario";
import { riskScore, riskExposure, byPriority } from "@/server/risk/scoring";
import { buildBrief, type BriefInputs } from "@/server/ceo/brief";
import { toCents } from "@/lib/money";

const base = [
  { month: "2026-08", inflowCents: toCents(5000), outflowCents: toCents(4000) },
  { month: "2026-09", inflowCents: toCents(3000), outflowCents: toCents(4000) },
  { month: "2026-10", inflowCents: toCents(3000), outflowCents: toCents(4000) },
];

describe("forecast scenarios", () => {
  it("projects the base rolling balance and trough", () => {
    const r = projectForecast(toCents(2000), base);
    // 2000 +1000 =3000; -1000 =2000; -1000 =1000
    expect(r.endingCents).toBe(toCents(1000));
    expect(r.trough?.balanceCents).toBe(toCents(1000));
    expect(r.runwayMonths).toBeNull();
  });

  it("applies a one-time cash-out and reports runway when it goes negative", () => {
    const r = projectForecast(toCents(2000), base, { oneTimeCents: -toCents(5000), oneTimeMonthIndex: 0 });
    // month0: 2000 +1000 -5000 = -2000  → runway at index 0
    expect(r.buckets[0].endingBalanceCents).toBe(-toCents(2000));
    expect(r.runwayMonths).toBe(0);
    expect(r.trough?.balanceCents).toBeLessThan(0);
  });

  it("applies a revenue haircut and a recurring cost", () => {
    const r = projectForecast(toCents(10000), base, { revenueMultiplier: 0.5, recurringCents: -toCents(1000), recurringStartIndex: 1 });
    // m0: 2500 in, 4000 out → 10000-1500=8500
    expect(r.buckets[0].endingBalanceCents).toBe(toCents(8500));
    // m1: 1500 in, 5000 out → -3500 → 5000
    expect(r.buckets[1].endingBalanceCents).toBe(toCents(5000));
  });
});

describe("risk scoring", () => {
  it("scores severity × likelihood", () => {
    expect(riskScore("critical", "high")).toBe(12);
    expect(riskScore("low", "low")).toBe(1);
    expect(riskScore("bogus", "high")).toBe(0);
  });

  it("aggregates exposure over open risks only", () => {
    const e = riskExposure([
      { severity: "critical", likelihood: "high", status: "open", cashImpactCents: toCents(5000), costImpactCents: toCents(2000), scheduleImpactDays: 14 },
      { severity: "medium", likelihood: "low", status: "mitigating", cashImpactCents: toCents(1000) },
      { severity: "high", likelihood: "high", status: "resolved", cashImpactCents: toCents(9999) }, // ignored
    ]);
    expect(e.openCount).toBe(2);
    expect(e.criticalCount).toBe(1);
    expect(e.topScore).toBe(12);
    expect(e.cashImpactCents).toBe(toCents(6000));
    expect(e.scheduleImpactDays).toBe(14);
  });

  it("sorts by priority then cash impact", () => {
    const risks = [
      { severity: "low", likelihood: "low", status: "open", cashImpactCents: toCents(100) },
      { severity: "critical", likelihood: "high", status: "open", cashImpactCents: toCents(50) },
    ];
    const sorted = [...risks].sort(byPriority);
    expect(sorted[0].severity).toBe("critical");
  });
});

describe("CEO brief", () => {
  const healthy: BriefInputs = {
    availableOperatingCents: toCents(40000), protectedReserveCents: toCents(25000), net30Cents: toCents(2000),
    cashTroughCents: toCents(15000), runwayMonths: null,
    buildsOverBudget: 0, buildsAtRisk: 0, openRisks: 0, criticalRisks: 0,
    sponsorDeliverablesOverdue: 0, sponsorDeliverablesDueSoon: 0, giveawaysBlocked: 0, socialInReview: 0, lowStockCount: 0,
  };

  it("returns an all-clear when nothing is wrong", () => {
    const b = buildBrief(healthy);
    expect(b.some((i) => i.area === "Overall" && i.severity === "good")).toBe(true);
  });

  it("surfaces critical items first", () => {
    const b = buildBrief({ ...healthy, cashTroughCents: -toCents(5000), criticalRisks: 2, sponsorDeliverablesOverdue: 1, lowStockCount: 3 });
    expect(b[0].severity).toBe("critical");
    expect(b.some((i) => i.area === "Sponsors" && i.severity === "critical")).toBe(true);
    // info items rank after critical/attention
    const lastNonGood = b.filter((i) => i.severity !== "good");
    expect(lastNonGood[lastNonGood.length - 1].severity).toBe("info");
  });
});
