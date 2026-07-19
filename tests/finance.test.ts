import { describe, it, expect } from "vitest";
import { buildForecast, periodTotals, lowestBalance, type CashFlow } from "@/server/finance/cashflow";
import { segmentPnl, type TxnLite } from "@/server/finance/pnl";
import { toCents } from "@/lib/money";

const d = (s: string) => new Date(s + "T00:00:00.000Z");
const NOW = d("2026-07-19");

describe("cash-flow forecast", () => {
  const inflows: CashFlow[] = [
    { date: d("2026-07-25"), amountCents: toCents(5000) },
    { date: d("2026-08-15"), amountCents: toCents(3000) },
    { date: d("2026-09-30"), amountCents: toCents(8000) },
  ];
  const outflows: CashFlow[] = [
    { date: d("2026-07-22"), amountCents: toCents(2000) },
    { date: d("2026-08-05"), amountCents: toCents(3000) },
  ];

  it("buckets flows by month with a running balance", () => {
    const f = buildForecast(toCents(85000), inflows, outflows, 4, NOW);
    expect(f.map((b) => b.month)).toEqual(["2026-07", "2026-08", "2026-09", "2026-10"]);
    // July: +5000 -2000 = +3000 -> 88000
    expect(f[0].netCents).toBe(toCents(3000));
    expect(f[0].endingBalanceCents).toBe(toCents(88000));
    // Aug: +3000 -3000 = 0 -> 88000
    expect(f[1].netCents).toBe(0);
    expect(f[1].endingBalanceCents).toBe(toCents(88000));
    // Sep: +8000 -> 96000
    expect(f[2].endingBalanceCents).toBe(toCents(96000));
  });

  it("clamps past-dated outstanding flows into the first month", () => {
    const f = buildForecast(0, [{ date: d("2026-05-01"), amountCents: toCents(1000) }], [], 3, NOW);
    expect(f[0].inflowCents).toBe(toCents(1000));
  });

  it("periodTotals sums the next N days", () => {
    const p = periodTotals(inflows, outflows, NOW, 30); // through ~Aug 18
    expect(p.inflowCents).toBe(toCents(5000 + 3000));
    expect(p.outflowCents).toBe(toCents(2000 + 3000));
    expect(p.netCents).toBe(toCents(3000));
  });

  it("finds the lowest projected balance", () => {
    const f = buildForecast(toCents(1000), [], [{ date: d("2026-08-10"), amountCents: toCents(4000) }], 3, NOW);
    const lo = lowestBalance(f)!;
    expect(lo.balanceCents).toBe(toCents(-3000)); // 1000 - 4000
    expect(lo.month).toBe("2026-08"); // trough hits in August and stays
  });
});

describe("segment P&L", () => {
  const txns: TxnLite[] = [
    { segment: "Automotive", direction: "expense", amountCents: toCents(8500) },
    { segment: "Automotive", direction: "expense", amountCents: toCents(1600) },
    { segment: "Media", direction: "income", amountCents: toCents(800) },
    { segment: "Media", direction: "expense", amountCents: toCents(600) },
    { segment: "Sponsorship", direction: "income", amountCents: toCents(2000) },
  ];

  it("aggregates revenue/expense/net per segment", () => {
    const r = segmentPnl(txns);
    const auto = r.segments.find((s) => s.segment === "Automotive")!;
    expect(auto.expenseCents).toBe(toCents(10100));
    expect(auto.netCents).toBe(toCents(-10100));
    const media = r.segments.find((s) => s.segment === "Media")!;
    expect(media.netCents).toBe(toCents(200));
  });

  it("computes correct totals", () => {
    const r = segmentPnl(txns);
    expect(r.totals.revenueCents).toBe(toCents(2800));
    expect(r.totals.expenseCents).toBe(toCents(10700));
    expect(r.totals.netCents).toBe(toCents(-7900));
  });
});
