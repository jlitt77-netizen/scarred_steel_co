// Money is stored as integer cents everywhere. These helpers are the ONLY
// sanctioned way to convert to/from dollars and to format for display, so we
// never do floating-point arithmetic on currency.

/** Convert a dollar amount to integer cents, rounding half-away-from-zero. */
export function toCents(dollars: number): number {
  if (!Number.isFinite(dollars)) throw new Error("toCents: non-finite input");
  return Math.round(dollars * 100);
}

/** Convert integer cents to a dollar number (for display / calculation only). */
export function toDollars(cents: number): number {
  return cents / 100;
}

/** Format integer cents as USD currency, e.g. 1234567 -> "$12,345.67". */
export function formatCents(
  cents: number | null | undefined,
  { blankIfNull = false }: { blankIfNull?: boolean } = {},
): string {
  if (cents == null) return blankIfNull ? "" : "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/** Sum a list of possibly-null cents values, treating null as 0. */
export function sumCents(values: Array<number | null | undefined>): number {
  return values.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}
