// Pure date helpers for the Master Calendar. All arithmetic is in UTC so a day
// cell key (YYYY-MM-DD) is stable regardless of server timezone.

export type CalendarView = "day" | "week" | "month" | "quarter" | "year" | "rolling12";

export const CALENDAR_VIEWS: CalendarView[] = ["day", "week", "month", "quarter", "year", "rolling12"];

export const VIEW_LABEL: Record<CalendarView, string> = {
  day: "Day", week: "Week", month: "Month", quarter: "Quarter", year: "Year", rolling12: "Rolling 12",
};

function utc(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d));
}

export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseAnchor(s: string | undefined, fallback: Date): Date {
  if (!s) return fallback;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return fallback;
  return utc(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function startOfWeek(d: Date): Date {
  const day = d.getUTCDay(); // 0 = Sun
  return utc(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
}
export function addDaysUTC(d: Date, n: number): Date {
  return utc(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n);
}
export function addMonths(d: Date, n: number): Date {
  return utc(d.getUTCFullYear(), d.getUTCMonth() + n, 1);
}
export function startOfMonth(d: Date): Date {
  return utc(d.getUTCFullYear(), d.getUTCMonth(), 1);
}
export function endOfMonth(d: Date): Date {
  return utc(d.getUTCFullYear(), d.getUTCMonth() + 1, 0);
}

export interface Range {
  from: Date;
  to: Date;
}

/** Inclusive [from,to] window for a view anchored at `anchor`. */
export function computeRange(view: CalendarView, anchor: Date): Range {
  switch (view) {
    case "day":
      return { from: anchor, to: addDaysUTC(anchor, 1) };
    case "week": {
      const from = startOfWeek(anchor);
      return { from, to: addDaysUTC(from, 7) };
    }
    case "month": {
      // Full weeks covering the month (for a 6x7 grid).
      const from = startOfWeek(startOfMonth(anchor));
      const to = addDaysUTC(from, 42);
      return { from, to };
    }
    case "quarter": {
      const qStartMonth = Math.floor(anchor.getUTCMonth() / 3) * 3;
      const from = utc(anchor.getUTCFullYear(), qStartMonth, 1);
      return { from, to: addMonths(from, 3) };
    }
    case "year": {
      const from = utc(anchor.getUTCFullYear(), 0, 1);
      return { from, to: utc(anchor.getUTCFullYear() + 1, 0, 1) };
    }
    case "rolling12": {
      const from = startOfMonth(anchor);
      return { from, to: addMonths(from, 12) };
    }
  }
}

/** Step the anchor forward/back by one view unit. */
export function stepAnchor(view: CalendarView, anchor: Date, dir: 1 | -1): Date {
  switch (view) {
    case "day": return addDaysUTC(anchor, dir);
    case "week": return addDaysUTC(anchor, 7 * dir);
    case "month": return addMonths(anchor, dir);
    case "quarter": return addMonths(anchor, 3 * dir);
    case "year": return addMonths(anchor, 12 * dir);
    case "rolling12": return addMonths(anchor, dir);
  }
}

/** 6 weeks × 7 days of Date cells for the month grid. */
export function monthMatrix(anchor: Date): Date[][] {
  const start = startOfWeek(startOfMonth(anchor));
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: Date[] = [];
    for (let d = 0; d < 7; d++) row.push(addDaysUTC(start, w * 7 + d));
    weeks.push(row);
  }
  return weeks;
}

/** Month keys (YYYY-MM) spanning a range, for summary views. */
export function monthsInRange(range: Range): string[] {
  const out: string[] = [];
  let cur = startOfMonth(range.from);
  while (cur < range.to) {
    out.push(cur.toISOString().slice(0, 7));
    cur = addMonths(cur, 1);
  }
  return out;
}

export function humanRange(view: CalendarView, anchor: Date): string {
  const monthYear = anchor.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  switch (view) {
    case "day": return anchor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
    case "week": {
      const from = startOfWeek(anchor);
      const to = addDaysUTC(from, 6);
      return `${from.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} – ${to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}`;
    }
    case "month": return monthYear;
    case "quarter": return `Q${Math.floor(anchor.getUTCMonth() / 3) + 1} ${anchor.getUTCFullYear()}`;
    case "year": return String(anchor.getUTCFullYear());
    case "rolling12": return `Rolling 12 — from ${monthYear}`;
  }
}
