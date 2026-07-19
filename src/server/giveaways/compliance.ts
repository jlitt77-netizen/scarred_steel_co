// Pure giveaway compliance gating (Section 23). No DB.
//
// A giveaway is LAUNCH BLOCKED until every legal/financial gate passes:
// attorney review, official rules, eligibility, tax plan, and prize funding.
// This is a hard gate — the UI refuses to mark a giveaway live otherwise.

export interface GiveawayGates {
  attorneyReviewed?: boolean;
  rulesApproved?: boolean;
  eligibilityDefined?: boolean;
  taxPlanApproved?: boolean;
  funded?: boolean;
}

export const LAUNCH_GATES: { key: keyof GiveawayGates; label: string }[] = [
  { key: "attorneyReviewed", label: "Attorney review" },
  { key: "rulesApproved", label: "Official rules approved" },
  { key: "eligibilityDefined", label: "Eligibility defined" },
  { key: "taxPlanApproved", label: "Tax plan approved" },
  { key: "funded", label: "Prize funded" },
];

export interface LaunchReadiness {
  launchReady: boolean;
  passedCount: number;
  totalGates: number;
  blockedReasons: string[]; // labels of the gates still open
}

export function launchReadiness(g: GiveawayGates): LaunchReadiness {
  const blockedReasons = LAUNCH_GATES.filter((gate) => !g[gate.key]).map((gate) => gate.label);
  const passedCount = LAUNCH_GATES.length - blockedReasons.length;
  return {
    launchReady: blockedReasons.length === 0,
    passedCount,
    totalGates: LAUNCH_GATES.length,
    blockedReasons,
  };
}

export interface FulfillmentStep {
  key: string;
  label: string;
  done: boolean;
}

/** Post-draw winner fulfillment checklist. */
export function fulfillmentSteps(g: {
  winnerName?: string | null;
  winnerVerified?: boolean;
  prizeTransferred?: boolean;
  taxDocsSent?: boolean;
}): FulfillmentStep[] {
  return [
    { key: "selected", label: "Winner selected", done: !!g.winnerName },
    { key: "verified", label: "Winner verified", done: !!g.winnerVerified },
    { key: "transferred", label: "Prize transferred", done: !!g.prizeTransferred },
    { key: "tax", label: "Tax docs sent", done: !!g.taxDocsSent },
  ];
}
