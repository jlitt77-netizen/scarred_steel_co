// Pure risk scoring + exposure (Section 6). No DB. Money in cents.
//
// Turns severity × likelihood into a priority score and aggregates the modeled
// impact (schedule, cost, revenue, cash) across the open risk register.

const SEVERITY_WEIGHT: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
const LIKELIHOOD_WEIGHT: Record<string, number> = { low: 1, medium: 2, high: 3 };

/** Priority score 1–12 (severity 1–4 × likelihood 1–3). Unknown → 0. */
export function riskScore(severity: string, likelihood: string): number {
  return (SEVERITY_WEIGHT[severity] ?? 0) * (LIKELIHOOD_WEIGHT[likelihood] ?? 0);
}

export interface RiskLite {
  severity: string;
  likelihood: string;
  status: string;
  scheduleImpactDays?: number | null;
  costImpactCents?: number | null;
  revenueImpactCents?: number | null;
  cashImpactCents?: number | null;
}

const OPEN = new Set(["open", "mitigating"]);

export interface RiskExposure {
  openCount: number;
  criticalCount: number;
  topScore: number;
  scheduleImpactDays: number;
  costImpactCents: number;
  revenueImpactCents: number;
  cashImpactCents: number;
  bySeverity: Record<string, number>;
}

/** Aggregate modeled impact across still-open risks. */
export function riskExposure(risks: RiskLite[]): RiskExposure {
  const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  let openCount = 0, criticalCount = 0, topScore = 0;
  let scheduleImpactDays = 0, costImpactCents = 0, revenueImpactCents = 0, cashImpactCents = 0;

  for (const r of risks) {
    if (!OPEN.has(r.status)) continue;
    openCount++;
    bySeverity[r.severity] = (bySeverity[r.severity] ?? 0) + 1;
    if (r.severity === "critical") criticalCount++;
    topScore = Math.max(topScore, riskScore(r.severity, r.likelihood));
    scheduleImpactDays += r.scheduleImpactDays ?? 0;
    costImpactCents += r.costImpactCents ?? 0;
    revenueImpactCents += r.revenueImpactCents ?? 0;
    cashImpactCents += r.cashImpactCents ?? 0;
  }

  return { openCount, criticalCount, topScore, scheduleImpactDays, costImpactCents, revenueImpactCents, cashImpactCents, bySeverity };
}

/** Sort key: highest score first, then by absolute cash impact. */
export function byPriority(a: RiskLite, b: RiskLite): number {
  const s = riskScore(b.severity, b.likelihood) - riskScore(a.severity, a.likelihood);
  if (s !== 0) return s;
  return Math.abs(b.cashImpactCents ?? 0) - Math.abs(a.cashImpactCents ?? 0);
}
