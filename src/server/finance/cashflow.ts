// Pure cash-flow forecast (Sections 8 & 9). Buckets dated inflows/outflows into
// months and computes a running projected balance from opening cash. No DB —
// fully testable. Money in integer cents. This is the seam Phase 2 feeds: moving
// an event's cash/revenue date changes which month a flow lands in.

export interface CashFlow {
  date: Date;
  amountCents: number; // always positive; direction is implied by the list
}

export interface MonthBucket {
  month: string; // YYYY-MM
  inflowCents: number;
  outflowCents: number;
  netCents: number;
  endingBalanceCents: number;
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function addMonthsUTC(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

/**
 * Rolling monthly forecast starting from the month containing `now`, for
 * `months` months. Running balance = openingCents + cumulative net.
 */
export function buildForecast(
  openingCents: number,
  inflows: CashFlow[],
  outflows: CashFlow[],
  months: number,
  now: Date,
): MonthBucket[] {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const keys: string[] = [];
  const index = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const k = monthKey(addMonthsUTC(start, i));
    keys.push(k);
    index.set(k, i);
  }

  const buckets: MonthBucket[] = keys.map((month) => ({
    month, inflowCents: 0, outflowCents: 0, netCents: 0, endingBalanceCents: 0,
  }));

  const place = (flows: CashFlow[], key: "inflowCents" | "outflowCents") => {
    for (const f of flows) {
      // Clamp past-dated flows into the first bucket (still outstanding today).
      const mk = f.date < start ? keys[0] : monthKey(f.date);
      const i = index.get(mk);
      if (i === undefined) continue; // beyond horizon
      buckets[i][key] += f.amountCents;
    }
  };
  place(inflows, "inflowCents");
  place(outflows, "outflowCents");

  let running = openingCents;
  for (const b of buckets) {
    b.netCents = b.inflowCents - b.outflowCents;
    running += b.netCents;
    b.endingBalanceCents = running;
  }
  return buckets;
}

/** Sum flows falling within the next `days` days (inclusive of today). */
export function periodTotals(
  inflows: CashFlow[],
  outflows: CashFlow[],
  now: Date,
  days: number,
): { inflowCents: number; outflowCents: number; netCents: number } {
  const end = new Date(now.getTime() + days * 86400000);
  const sum = (flows: CashFlow[]) =>
    flows.reduce((s, f) => (f.date <= end ? s + f.amountCents : s), 0);
  const inflowCents = sum(inflows);
  const outflowCents = sum(outflows);
  return { inflowCents, outflowCents, netCents: inflowCents - outflowCents };
}

/** Lowest projected ending balance across the horizon (cash-trough / runway). */
export function lowestBalance(buckets: MonthBucket[]): { month: string; balanceCents: number } | null {
  if (buckets.length === 0) return null;
  return buckets.reduce(
    (lo, b) => (b.endingBalanceCents < lo.balanceCents ? { month: b.month, balanceCents: b.endingBalanceCents } : lo),
    { month: buckets[0].month, balanceCents: buckets[0].endingBalanceCents },
  );
}
