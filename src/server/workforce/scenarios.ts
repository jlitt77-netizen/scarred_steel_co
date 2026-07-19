// Pure operating-model comparison (Section 13): Stay Partner Shop vs Dedicated
// Bay vs Joint Venture vs Hire Core Team vs Standalone Facility. Given demand +
// cost assumptions, returns monthly/annual cost, capacity, and effective
// cost-per-hour for each — the "when does X make sense" decision tool. No DB.

export interface ScenarioParams {
  monthlyBuildHours: number; // demand
  partnerShopRateCents: number;
  partnerShopCapacityPerMonth: number;
  dedicatedBayMonthlyCents: number;
  dedicatedBayRateCents: number;
  dedicatedBayCapacityPerMonth: number;
  jvMonthlyOverheadCents: number;
  jvRateCents: number;
  jvCapacityPerMonth: number;
  coreTeamMonthlyCents: number;
  coreTeamCapacityPerMonth: number;
  standaloneFacilityMonthlyCents: number;
}

export interface ScenarioResult {
  scenario: string;
  monthlyCostCents: number;
  annualCostCents: number;
  capacityHoursPerMonth: number;
  costPerHourCents: number;
  fixed: boolean; // cost independent of build volume?
  note: string;
}

export function compensationScenarios(p: ScenarioParams): ScenarioResult[] {
  const hrs = p.monthlyBuildHours;
  const perHour = (monthly: number) => (hrs > 0 ? Math.round(monthly / hrs) : 0);

  const raw: Omit<ScenarioResult, "annualCostCents" | "costPerHourCents">[] = [
    {
      scenario: "Stay Partner Shop",
      monthlyCostCents: Math.round(hrs * p.partnerShopRateCents),
      capacityHoursPerMonth: p.partnerShopCapacityPerMonth,
      fixed: false,
      note: "Pure hourly. No overhead; scales with build volume; capped by shop capacity.",
    },
    {
      scenario: "Dedicated Bay",
      monthlyCostCents: p.dedicatedBayMonthlyCents + Math.round(hrs * p.dedicatedBayRateCents),
      capacityHoursPerMonth: p.dedicatedBayCapacityPerMonth,
      fixed: false,
      note: "Monthly bay retainer + reduced hourly. Priority scheduling; makes sense at steady volume.",
    },
    {
      scenario: "Joint Venture",
      monthlyCostCents: p.jvMonthlyOverheadCents + Math.round(hrs * p.jvRateCents),
      capacityHoursPerMonth: p.jvCapacityPerMonth,
      fixed: false,
      note: "Shared overhead + JV hourly. Aligns incentives; more capacity, shared risk.",
    },
    {
      scenario: "Hire Core Team",
      monthlyCostCents: p.coreTeamMonthlyCents,
      capacityHoursPerMonth: p.coreTeamCapacityPerMonth,
      fixed: true,
      note: "Fixed payroll regardless of volume. Wins once demand fills the team; risk when idle.",
    },
    {
      scenario: "Standalone Facility",
      monthlyCostCents: p.standaloneFacilityMonthlyCents + p.coreTeamMonthlyCents,
      capacityHoursPerMonth: p.coreTeamCapacityPerMonth,
      fixed: true,
      note: "Facility + core team. Highest fixed cost and control; justified at scale.",
    },
  ];

  return raw.map((r) => ({
    ...r,
    annualCostCents: r.monthlyCostCents * 12,
    costPerHourCents: perHour(r.monthlyCostCents),
  }));
}

/** The lowest-monthly-cost scenario that still covers demand capacity. */
export function recommendScenario(results: ScenarioResult[], demandHours: number): ScenarioResult | null {
  const feasible = results.filter((r) => r.capacityHoursPerMonth >= demandHours);
  const pool = feasible.length ? feasible : results;
  return pool.reduce((best, r) => (r.monthlyCostCents < best.monthlyCostCents ? r : best), pool[0] ?? null);
}
