// Pure customer-build math for the Build Portal (Section 28). No DB.
//
// Customer-facing contract economics: contract amount + approved change orders −
// payments received = balance due. Deliberately excludes internal cost, margin,
// and budget — the portal never shows those.

export interface ChangeOrderLite {
  status: string; // proposed | approved | declined
  amountCents?: number | null;
}

export interface PaymentLite {
  amountCents: number;
  status: string; // received | open | ...
}

export interface BuildFinancials {
  contractCents: number;
  approvedChangeOrdersCents: number;
  totalContractCents: number; // contract + approved change orders
  paidCents: number;
  balanceDueCents: number;
  pendingApprovals: number;
}

const OPEN_PROPOSED = "proposed";

export function buildFinancials(
  contractCents: number,
  changeOrders: ChangeOrderLite[],
  payments: PaymentLite[],
  paidStatuses: string[] = ["received", "paid"],
): BuildFinancials {
  const approvedChangeOrdersCents = changeOrders
    .filter((c) => c.status === "approved")
    .reduce((s, c) => s + (c.amountCents ?? 0), 0);
  const totalContractCents = contractCents + approvedChangeOrdersCents;
  const paidCents = payments
    .filter((p) => paidStatuses.includes(p.status))
    .reduce((s, p) => s + p.amountCents, 0);
  return {
    contractCents,
    approvedChangeOrdersCents,
    totalContractCents,
    paidCents,
    balanceDueCents: totalContractCents - paidCents,
    pendingApprovals: changeOrders.filter((c) => c.status === OPEN_PROPOSED).length,
  };
}

/** Customer-facing completion: clamp the stored percent to 0–100. */
export function displayProgressPct(percentComplete: number | null | undefined): number {
  return Math.max(0, Math.min(100, percentComplete ?? 0));
}
