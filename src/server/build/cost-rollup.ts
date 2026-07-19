// Pure build-cost rollup (Sections 9 & 11). Given cost line items, summarize
// budget / committed / actual / variance by category and in total. No DB, fully
// testable. Money in integer cents throughout.

export interface CostItemLite {
  category: string;
  budgetCents?: number | null;
  committedCents?: number | null;
  actualCents?: number | null;
}

export interface CategorySummary {
  category: string;
  budgetCents: number;
  committedCents: number;
  actualCents: number;
  /** budget − actual. Positive = under budget (remaining); negative = over. */
  varianceCents: number;
  itemCount: number;
}

export interface CostRollup {
  categories: CategorySummary[];
  totals: {
    budgetCents: number;
    committedCents: number;
    actualCents: number;
    varianceCents: number;
  };
  itemCount: number;
}

const n = (v: number | null | undefined) => v ?? 0;

export function rollupCosts(items: CostItemLite[]): CostRollup {
  const byCat = new Map<string, CategorySummary>();

  for (const it of items) {
    const cur =
      byCat.get(it.category) ??
      {
        category: it.category,
        budgetCents: 0,
        committedCents: 0,
        actualCents: 0,
        varianceCents: 0,
        itemCount: 0,
      };
    cur.budgetCents += n(it.budgetCents);
    cur.committedCents += n(it.committedCents);
    cur.actualCents += n(it.actualCents);
    cur.itemCount += 1;
    byCat.set(it.category, cur);
  }

  const categories = [...byCat.values()]
    .map((c) => ({ ...c, varianceCents: c.budgetCents - c.actualCents }))
    .sort((a, b) => b.budgetCents - a.budgetCents || a.category.localeCompare(b.category));

  const totals = categories.reduce(
    (t, c) => ({
      budgetCents: t.budgetCents + c.budgetCents,
      committedCents: t.committedCents + c.committedCents,
      actualCents: t.actualCents + c.actualCents,
      varianceCents: 0,
    }),
    { budgetCents: 0, committedCents: 0, actualCents: 0, varianceCents: 0 },
  );
  totals.varianceCents = totals.budgetCents - totals.actualCents;

  return {
    categories,
    totals,
    itemCount: items.length,
  };
}
