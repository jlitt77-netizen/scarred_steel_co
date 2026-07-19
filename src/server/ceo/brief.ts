// Pure "Monday Morning CEO Brief" generator (Section 24). No DB.
//
// Takes aggregated cross-domain metrics and produces a prioritized list of
// attention items — what the CEO should look at, worst first. Deterministic and
// testable; the service supplies the live numbers.

import { formatCents } from "@/lib/money";

export type BriefSeverity = "critical" | "attention" | "info" | "good";

export interface BriefItem {
  severity: BriefSeverity;
  area: string;
  message: string;
}

export interface BriefInputs {
  availableOperatingCents: number;
  protectedReserveCents: number;
  net30Cents: number;
  cashTroughCents?: number | null;
  runwayMonths?: number | null;
  buildsOverBudget: number;
  buildsAtRisk: number;
  openRisks: number;
  criticalRisks: number;
  sponsorDeliverablesOverdue: number;
  sponsorDeliverablesDueSoon: number;
  giveawaysBlocked: number;
  socialInReview: number;
  lowStockCount: number;
}

const RANK: Record<BriefSeverity, number> = { critical: 0, attention: 1, info: 2, good: 3 };

export function buildBrief(i: BriefInputs): BriefItem[] {
  const items: BriefItem[] = [];

  // Cash — the CEO's first question.
  if (i.availableOperatingCents < 0) {
    items.push({ severity: "critical", area: "Cash", message: `Operating cash is negative (${formatCents(i.availableOperatingCents)}). Immediate action required.` });
  } else if (i.cashTroughCents != null && i.cashTroughCents < 0) {
    items.push({ severity: "critical", area: "Cash", message: `Forecast dips below zero (${formatCents(i.cashTroughCents)}). Pull revenue forward or defer spend.` });
  } else if (i.runwayMonths != null) {
    items.push({ severity: "attention", area: "Cash", message: `Runway ends in ${i.runwayMonths} month${i.runwayMonths === 1 ? "" : "s"} at the current burn.` });
  } else {
    items.push({ severity: "good", area: "Cash", message: `Operating cash ${formatCents(i.availableOperatingCents)}, 30-day net ${i.net30Cents >= 0 ? "+" : ""}${formatCents(i.net30Cents)}.` });
  }

  // Risk.
  if (i.criticalRisks > 0) {
    items.push({ severity: "critical", area: "Risk", message: `${i.criticalRisks} critical risk${i.criticalRisks === 1 ? "" : "s"} open — review responses before they escalate.` });
  } else if (i.openRisks > 0) {
    items.push({ severity: "attention", area: "Risk", message: `${i.openRisks} open risk${i.openRisks === 1 ? "" : "s"} on the register.` });
  }

  // Builds.
  if (i.buildsOverBudget > 0) {
    items.push({ severity: "attention", area: "Builds", message: `${i.buildsOverBudget} build${i.buildsOverBudget === 1 ? "" : "s"} over budget.` });
  }
  if (i.buildsAtRisk > 0) {
    items.push({ severity: "attention", area: "Builds", message: `${i.buildsAtRisk} build${i.buildsAtRisk === 1 ? "" : "s"} carrying open risk.` });
  }

  // Sponsors.
  if (i.sponsorDeliverablesOverdue > 0) {
    items.push({ severity: "critical", area: "Sponsors", message: `${i.sponsorDeliverablesOverdue} sponsor deliverable${i.sponsorDeliverablesOverdue === 1 ? "" : "s"} overdue.` });
  } else if (i.sponsorDeliverablesDueSoon > 0) {
    items.push({ severity: "attention", area: "Sponsors", message: `${i.sponsorDeliverablesDueSoon} sponsor deliverable${i.sponsorDeliverablesDueSoon === 1 ? "" : "s"} due in the next 14 days.` });
  }

  // Giveaway compliance.
  if (i.giveawaysBlocked > 0) {
    items.push({ severity: "attention", area: "Giveaways", message: `${i.giveawaysBlocked} giveaway${i.giveawaysBlocked === 1 ? "" : "s"} launch-blocked on compliance.` });
  }

  // Content + commerce backlog.
  if (i.socialInReview > 0) {
    items.push({ severity: "info", area: "Content", message: `${i.socialInReview} social post${i.socialInReview === 1 ? "" : "s"} awaiting sponsor review.` });
  }
  if (i.lowStockCount > 0) {
    items.push({ severity: "info", area: "Commerce", message: `${i.lowStockCount} merch product${i.lowStockCount === 1 ? "" : "s"} low on stock.` });
  }

  if (items.every((it) => it.severity === "good")) {
    items.push({ severity: "good", area: "Overall", message: "No exceptions flagged. Steady week." });
  }

  return items.sort((a, b) => RANK[a.severity] - RANK[b.severity]);
}
