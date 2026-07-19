// Pure forecast scenario modeling (Section 25). No DB. Money in cents.
//
// Takes the base rolling forecast (opening balance + per-month inflow/outflow)
// and applies a what-if adjustment — a one-time cash event, a recurring monthly
// delta, and/or a revenue haircut — then recomputes running balance, the cash
// trough, and runway (first month the balance goes negative).

export interface ForecastBucketLite {
  month: string; // YYYY-MM
  inflowCents: number;
  outflowCents: number;
}

export interface ScenarioParams {
  /** Signed one-time cash event (+in / −out) applied at `oneTimeMonthIndex`. */
  oneTimeCents?: number;
  oneTimeMonthIndex?: number;
  /** Signed recurring monthly delta (+revenue / −cost) from `recurringStartIndex`. */
  recurringCents?: number;
  recurringStartIndex?: number;
  /** Multiplier on each month's inflow (0.7 = a 30% revenue drop). */
  revenueMultiplier?: number;
}

export interface ProjectedBucket {
  month: string;
  inflowCents: number;
  outflowCents: number;
  netCents: number;
  endingBalanceCents: number;
}

export interface ForecastResult {
  buckets: ProjectedBucket[];
  endingCents: number;
  trough: { month: string; balanceCents: number } | null;
  runwayMonths: number | null; // index of first negative-balance month; null if never
}

export function projectForecast(
  openingCents: number,
  base: ForecastBucketLite[],
  p: ScenarioParams = {},
): ForecastResult {
  const mult = p.revenueMultiplier ?? 1;
  let balance = openingCents;
  let trough: { month: string; balanceCents: number } | null = null;
  let runwayMonths: number | null = null;

  const buckets: ProjectedBucket[] = base.map((b, i) => {
    let inflow = Math.round(b.inflowCents * mult);
    let outflow = b.outflowCents;

    if (p.oneTimeCents != null && i === (p.oneTimeMonthIndex ?? 0)) {
      if (p.oneTimeCents >= 0) inflow += p.oneTimeCents;
      else outflow += -p.oneTimeCents;
    }
    if (p.recurringCents != null && i >= (p.recurringStartIndex ?? 0)) {
      if (p.recurringCents >= 0) inflow += p.recurringCents;
      else outflow += -p.recurringCents;
    }

    const netCents = inflow - outflow;
    balance += netCents;
    if (!trough || balance < trough.balanceCents) trough = { month: b.month, balanceCents: balance };
    if (runwayMonths === null && balance < 0) runwayMonths = i;

    return { month: b.month, inflowCents: inflow, outflowCents: outflow, netCents, endingBalanceCents: balance };
  });

  return { buckets, endingCents: balance, trough, runwayMonths };
}
