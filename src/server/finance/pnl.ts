// Pure P&L-by-segment rollup (Section 8). Aggregates realized transactions into
// revenue / expense / net per segment. No DB.

export interface TxnLite {
  segment: string;
  direction: string; // "income" | "expense"
  amountCents: number;
}

export interface SegmentPnl {
  segment: string;
  revenueCents: number;
  expenseCents: number;
  netCents: number;
}

export interface PnlResult {
  segments: SegmentPnl[];
  totals: { revenueCents: number; expenseCents: number; netCents: number };
}

export function segmentPnl(txns: TxnLite[]): PnlResult {
  const map = new Map<string, SegmentPnl>();
  for (const t of txns) {
    const s = map.get(t.segment) ?? { segment: t.segment, revenueCents: 0, expenseCents: 0, netCents: 0 };
    if (t.direction === "income") s.revenueCents += t.amountCents;
    else s.expenseCents += t.amountCents;
    map.set(t.segment, s);
  }
  const segments = [...map.values()]
    .map((s) => ({ ...s, netCents: s.revenueCents - s.expenseCents }))
    .sort((a, b) => b.revenueCents - a.revenueCents || a.segment.localeCompare(b.segment));

  const totals = segments.reduce(
    (t, s) => ({
      revenueCents: t.revenueCents + s.revenueCents,
      expenseCents: t.expenseCents + s.expenseCents,
      netCents: 0,
    }),
    { revenueCents: 0, expenseCents: 0, netCents: 0 },
  );
  totals.netCents = totals.revenueCents - totals.expenseCents;
  return { segments, totals };
}
