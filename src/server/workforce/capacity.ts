// Pure partner-shop + workforce math (Sections 12 & 13). No DB. Money in cents.

export const WEEKS_PER_MONTH = 13 / 3; // 4.3333…

export interface WorkOrderLite {
  type: string; // hourly | fixed | retainer
  status: string;
  estimatedHours?: number | null;
  actualHours?: number | null;
  hourlyRateCents?: number | null;
  fixedPriceCents?: number | null;
  invoicedCents?: number | null;
}

/** Effective hourly rate for a work order (its override, else the shop rate). */
function rate(wo: WorkOrderLite, shopRateCents: number | null | undefined): number {
  return wo.hourlyRateCents ?? shopRateCents ?? 0;
}

export function workOrderEstimatedCostCents(wo: WorkOrderLite, shopRateCents?: number | null): number {
  if (wo.type === "fixed") return wo.fixedPriceCents ?? 0;
  return Math.round((wo.estimatedHours ?? 0) * rate(wo, shopRateCents));
}

export function workOrderActualCostCents(wo: WorkOrderLite, shopRateCents?: number | null): number {
  if (wo.type === "fixed") return wo.invoicedCents ?? wo.fixedPriceCents ?? 0;
  return Math.round((wo.actualHours ?? 0) * rate(wo, shopRateCents));
}

const ACTIVE = new Set(["scheduled", "in_progress"]);

export interface Utilization {
  capacityHoursPerMonth: number;
  committedHoursPerMonth: number;
  utilizationPct: number; // 0..∞ (×100)
  overloaded: boolean;
}

/**
 * Shop/person utilization from remaining committed hours vs monthly capacity.
 * "Committed" = remaining estimated hours (estimated − actual) on active work
 * orders. Overloaded when committed exceeds capacity.
 */
export function utilization(capacityHoursPerWeek: number | null | undefined, workOrders: WorkOrderLite[]): Utilization {
  const capacityHoursPerMonth = Math.round((capacityHoursPerWeek ?? 0) * WEEKS_PER_MONTH);
  const committedHoursPerMonth = workOrders.reduce((s, wo) => {
    if (!ACTIVE.has(wo.status) || wo.type === "fixed") return s;
    const remaining = Math.max(0, (wo.estimatedHours ?? 0) - (wo.actualHours ?? 0));
    return s + remaining;
  }, 0);
  const utilizationPct = capacityHoursPerMonth > 0 ? Math.round((committedHoursPerMonth / capacityHoursPerMonth) * 100) : 0;
  return {
    capacityHoursPerMonth,
    committedHoursPerMonth,
    utilizationPct,
    overloaded: committedHoursPerMonth > capacityHoursPerMonth && capacityHoursPerMonth > 0,
  };
}

export interface TeamMemberLite {
  engagementType: string; // contractor | partner_shop | employee
  hourlyRateCents?: number | null;
  salaryCents?: number | null; // annual
  benefitsCents?: number | null; // annual
  payrollBurdenPct?: number | null;
  bonusCents?: number | null; // annual
  capacityHoursPerWeek?: number | null;
}

/**
 * Fully-loaded monthly cost of a team member. Employees: (salary + benefits +
 * payroll burden + bonus) / 12. Contractors/partner-shop: hourly × hours/month
 * (assigned hours if given, else their weekly capacity).
 */
export function memberMonthlyCostCents(m: TeamMemberLite, assignedHoursPerMonth?: number): number {
  if (m.engagementType === "employee") {
    const salary = m.salaryCents ?? 0;
    const monthly = salary / 12 + (m.benefitsCents ?? 0) / 12 + (salary * (m.payrollBurdenPct ?? 0)) / 100 / 12 + (m.bonusCents ?? 0) / 12;
    return Math.round(monthly);
  }
  const hours = assignedHoursPerMonth ?? (m.capacityHoursPerWeek ?? 0) * WEEKS_PER_MONTH;
  return Math.round((m.hourlyRateCents ?? 0) * hours);
}
