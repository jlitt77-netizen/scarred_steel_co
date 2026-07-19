import { describe, it, expect } from "vitest";
import { buildFinancials, displayProgressPct } from "@/server/portal/customer";
import { toCents } from "@/lib/money";

describe("customer build financials", () => {
  it("adds approved change orders and subtracts payments", () => {
    const f = buildFinancials(
      toCents(30000),
      [
        { status: "approved", amountCents: toCents(2500) },
        { status: "proposed", amountCents: toCents(1000) }, // not counted, but pending
        { status: "declined", amountCents: toCents(999) },
      ],
      [
        { status: "received", amountCents: toCents(10000) },
        { status: "received", amountCents: toCents(5000) },
        { status: "open", amountCents: toCents(3000) }, // not paid
      ],
    );
    expect(f.approvedChangeOrdersCents).toBe(toCents(2500));
    expect(f.totalContractCents).toBe(toCents(32500));
    expect(f.paidCents).toBe(toCents(15000));
    expect(f.balanceDueCents).toBe(toCents(17500));
    expect(f.pendingApprovals).toBe(1);
  });

  it("handles a clean contract with no changes or payments", () => {
    const f = buildFinancials(toCents(20000), [], []);
    expect(f.balanceDueCents).toBe(toCents(20000));
    expect(f.pendingApprovals).toBe(0);
  });

  it("clamps display progress to 0–100", () => {
    expect(displayProgressPct(45)).toBe(45);
    expect(displayProgressPct(-5)).toBe(0);
    expect(displayProgressPct(150)).toBe(100);
    expect(displayProgressPct(null)).toBe(0);
  });
});
