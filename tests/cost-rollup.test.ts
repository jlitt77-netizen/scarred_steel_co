import { describe, it, expect } from "vitest";
import { rollupCosts, type CostItemLite } from "@/server/build/cost-rollup";
import { toCents } from "@/lib/money";

const items: CostItemLite[] = [
  { category: "Vehicle acquisition", budgetCents: toCents(8500), actualCents: toCents(8500) },
  { category: "Coilovers", budgetCents: toCents(3800), committedCents: toCents(3800) },
  { category: "Partner-shop labor", budgetCents: toCents(6000), committedCents: toCents(3000), actualCents: toCents(2400) },
  { category: "Partner-shop labor", budgetCents: toCents(1000), actualCents: toCents(900) },
  { category: "Brakes", budgetCents: toCents(1600), actualCents: toCents(1600) },
];

describe("rollupCosts", () => {
  it("groups by category and sums budget/committed/actual", () => {
    const r = rollupCosts(items);
    const labor = r.categories.find((c) => c.category === "Partner-shop labor")!;
    expect(labor.itemCount).toBe(2);
    expect(labor.budgetCents).toBe(toCents(7000));
    expect(labor.committedCents).toBe(toCents(3000));
    expect(labor.actualCents).toBe(toCents(3300));
    expect(labor.varianceCents).toBe(toCents(7000) - toCents(3300)); // budget - actual
  });

  it("computes correct totals and variance", () => {
    const r = rollupCosts(items);
    expect(r.totals.budgetCents).toBe(toCents(8500 + 3800 + 6000 + 1000 + 1600));
    expect(r.totals.actualCents).toBe(toCents(8500 + 2400 + 900 + 1600));
    expect(r.totals.varianceCents).toBe(r.totals.budgetCents - r.totals.actualCents);
    expect(r.itemCount).toBe(5);
  });

  it("sorts categories by budget descending", () => {
    const r = rollupCosts(items);
    const budgets = r.categories.map((c) => c.budgetCents);
    expect(budgets).toEqual([...budgets].sort((a, b) => b - a));
  });

  it("treats missing amounts as zero and handles empty input", () => {
    expect(rollupCosts([]).totals.budgetCents).toBe(0);
    const r = rollupCosts([{ category: "Tires" }]);
    expect(r.categories[0].budgetCents).toBe(0);
    expect(r.categories[0].varianceCents).toBe(0);
  });
});
