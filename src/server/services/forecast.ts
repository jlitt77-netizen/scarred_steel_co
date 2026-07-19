import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/rbac";
import { getForecast } from "@/server/services/finance";
import { projectForecast, type ForecastBucketLite, type ScenarioParams } from "@/server/forecast/scenario";
import { toCents } from "@/lib/money";

// Master Forecast & Scenario (Section 25). Confidential — gated on forecast:read
// (held only by the CEO role, which also carries finance:read for the base).

export interface ScenarioDef {
  key: string;
  label: string;
  description: string;
  params: ScenarioParams;
}

export async function getForecastScenarios(ctx: AuthContext) {
  requirePermission(ctx, "forecast:read");
  const forecast = await getForecast(ctx, 12);
  const openingCents = forecast.openingCents;
  const base: ForecastBucketLite[] = forecast.buckets.map((b) => ({
    month: b.month, inflowCents: b.inflowCents, outflowCents: b.outflowCents,
  }));

  // Live inputs for a couple of scenarios.
  const [topSponsor, cheapestAcquisition] = await Promise.all([
    prisma.sponsor.findFirst({ where: { stage: { in: ["Active", "Renewal"] } }, orderBy: { cashValueCents: "desc" } }),
    prisma.vehicleFind.findFirst({ where: { stage: { in: ["Evaluating", "Contacted", "Saved"] }, askingPriceCents: { not: null } }, orderBy: { askingPriceCents: "asc" } }),
  ]);
  const sponsorMonthlyCents = topSponsor?.cashValueCents ? Math.round(topSponsor.cashValueCents / 12) : toCents(250);
  const acquisitionCents = cheapestAcquisition?.askingPriceCents ?? toCents(8500);

  const scenarios: ScenarioDef[] = [
    {
      key: "buy_vehicle",
      label: `Buy a vehicle (${cheapestAcquisition ? cheapestAcquisition.vehicleDesc : "next acquisition"})`,
      description: "One-time acquisition cash-out this month.",
      params: { oneTimeCents: -acquisitionCents, oneTimeMonthIndex: 0 },
    },
    {
      key: "lose_sponsor",
      label: `Lose top sponsor${topSponsor ? ` (${topSponsor.name})` : ""}`,
      description: "Recurring monthly sponsor revenue disappears.",
      params: { recurringCents: -sponsorMonthlyCents, recurringStartIndex: 1 },
    },
    {
      key: "hire_team",
      label: "Hire a core team",
      description: "Add ~$11,500/mo fully-loaded payroll.",
      params: { recurringCents: -toCents(11500), recurringStartIndex: 1 },
    },
    {
      key: "revenue_drop",
      label: "30% revenue drop",
      description: "Stress test: every month's inflow cut by 30%.",
      params: { revenueMultiplier: 0.7 },
    },
    {
      key: "budget_overrun",
      label: "Build budget overrun",
      description: "One-time $5,000 unplanned build cost next month.",
      params: { oneTimeCents: -toCents(5000), oneTimeMonthIndex: 1 },
    },
    {
      key: "open_facility",
      label: "Open a standalone facility",
      description: "Facility + core team: ~$16,000/mo fixed.",
      params: { recurringCents: -toCents(16000), recurringStartIndex: 1 },
    },
  ];

  const baseResult = projectForecast(openingCents, base);
  const results = scenarios.map((s) => ({ ...s, result: projectForecast(openingCents, base, s.params) }));

  return { openingCents, base: baseResult, scenarios: results };
}
