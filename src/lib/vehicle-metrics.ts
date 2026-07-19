// Derived vehicle economics (Section 10). Never stored — always computed from
// stored cents fields so the numbers can't drift out of sync.

export interface VehicleMoneyFields {
  acquisitionCostCents?: number | null;
  actualCostCents?: number | null;
  buildBudgetCents?: number | null;
  revisedBudgetCents?: number | null;
  sponsorProductOffsetsCents?: number | null;
  sponsorCashCents?: number | null;
  actualSalePriceCents?: number | null;
  targetSalePriceCents?: number | null;
  requiredSalePriceCents?: number | null;
  currentMarketValueCents?: number | null;
  acquiredAt?: Date | null;
  soldAt?: Date | null;
}

export interface VehicleMetrics {
  /** Cash actually invested after sponsor offsets: acquisition + actual cost
   *  − sponsor product offsets − sponsor cash. */
  trueCashInvestedCents: number;
  /** Realized profit when sold: sale price − true cash invested (null if unsold). */
  vehicleProfitCents: number | null;
  /** Return on invested cash as a fraction (0.25 = 25%); null if unsold or zero basis. */
  roi: number | null;
  /** Whole months the vehicle has been (or was) held. */
  holdingPeriodMonths: number | null;
  /** Realized profit per month held (null if unsold / unknown holding period). */
  profitPerMonthCents: number | null;
}

const n = (v: number | null | undefined) => v ?? 0;

export function computeVehicleMetrics(
  v: VehicleMoneyFields,
  now: Date = new Date(),
): VehicleMetrics {
  const trueCashInvestedCents =
    n(v.acquisitionCostCents) +
    n(v.actualCostCents) -
    n(v.sponsorProductOffsetsCents) -
    n(v.sponsorCashCents);

  const sold = v.actualSalePriceCents != null && v.actualSalePriceCents > 0;
  const vehicleProfitCents = sold
    ? (v.actualSalePriceCents as number) - trueCashInvestedCents
    : null;

  const roi =
    vehicleProfitCents != null && trueCashInvestedCents > 0
      ? vehicleProfitCents / trueCashInvestedCents
      : null;

  let holdingPeriodMonths: number | null = null;
  if (v.acquiredAt) {
    const end = v.soldAt ?? now;
    const ms = end.getTime() - v.acquiredAt.getTime();
    if (ms >= 0) holdingPeriodMonths = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24 * 30.4375)));
  }

  const profitPerMonthCents =
    vehicleProfitCents != null && holdingPeriodMonths
      ? Math.round(vehicleProfitCents / holdingPeriodMonths)
      : null;

  return {
    trueCashInvestedCents,
    vehicleProfitCents,
    roi,
    holdingPeriodMonths,
    profitPerMonthCents,
  };
}
