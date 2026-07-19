import { describe, it, expect } from "vitest";
import { toCents, toDollars, formatCents, sumCents } from "@/lib/money";

describe("money (integer cents, no float drift)", () => {
  it("converts dollars to cents with rounding", () => {
    expect(toCents(12.34)).toBe(1234);
    expect(toCents(0.1 + 0.2)).toBe(30); // classic float trap -> 0.30000000004
    expect(toCents(45000)).toBe(4500000);
  });

  it("round-trips through dollars", () => {
    expect(toDollars(1234)).toBeCloseTo(12.34, 5);
  });

  it("formats as USD", () => {
    expect(formatCents(1234567)).toBe("$12,345.67");
    expect(formatCents(null)).toBe("$0.00");
    expect(formatCents(null, { blankIfNull: true })).toBe("");
  });

  it("sums nullable cents treating null as zero", () => {
    expect(sumCents([100, null, 250, undefined])).toBe(350);
  });

  it("rejects non-finite input", () => {
    expect(() => toCents(Infinity)).toThrow();
  });
});
