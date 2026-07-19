// Pure sponsorship CRM math (Section 17). No DB. Money in cents.
//
// The sales pipeline (Prospect → … → Active → Renewal), blended deal value
// (cash + product), the deliverable lifecycle, and the "what's due / renewing"
// summaries that feed the dashboard and calendar.

import { SPONSOR_STAGES, DELIVERABLE_STATUSES } from "@/lib/enums";

export interface SponsorLite {
  stage: string;
  active?: boolean;
  cashValueCents?: number | null;
  productValueCents?: number | null;
  renewalDate?: Date | string | null;
}

export interface DeliverableLite {
  status: string;
  dueDate?: Date | string | null;
  completedDate?: Date | string | null;
}

const DONE_DELIVERABLE = new Set(["Published"]);

/** Blended annual value of a sponsor: cash + in-kind product. */
export function sponsorTotalValueCents(s: SponsorLite): number {
  return (s.cashValueCents ?? 0) + (s.productValueCents ?? 0);
}

export interface FunnelBucket {
  stage: string;
  count: number;
  valueCents: number;
}

/** Sponsor counts + blended value per pipeline stage, canonical order. */
export function pipelineFunnel(sponsors: SponsorLite[]): FunnelBucket[] {
  const counts = new Map<string, number>(SPONSOR_STAGES.map((s) => [s, 0]));
  const values = new Map<string, number>(SPONSOR_STAGES.map((s) => [s, 0]));
  for (const s of sponsors) {
    counts.set(s.stage, (counts.get(s.stage) ?? 0) + 1);
    values.set(s.stage, (values.get(s.stage) ?? 0) + sponsorTotalValueCents(s));
  }
  return SPONSOR_STAGES.map((stage) => ({ stage, count: counts.get(stage) ?? 0, valueCents: values.get(stage) ?? 0 }));
}

/** Total blended value of currently-active sponsors. */
export function activeValueCents(sponsors: SponsorLite[]): number {
  return sponsors
    .filter((s) => s.active !== false && (s.stage === "Active" || s.stage === "Renewal"))
    .reduce((sum, s) => sum + sponsorTotalValueCents(s), 0);
}

/** Deliverable counts per status, canonical order (zeros included). */
export function deliverableFunnel(deliverables: { status: string }[]): { status: string; count: number }[] {
  const counts = new Map<string, number>(DELIVERABLE_STATUSES.map((s) => [s, 0]));
  for (const d of deliverables) counts.set(d.status, (counts.get(d.status) ?? 0) + 1);
  return DELIVERABLE_STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 }));
}

function asDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null;
  return d instanceof Date ? d : new Date(d);
}

/** Is a deliverable past due and not yet published? */
export function isOverdue(d: DeliverableLite, asOf: Date): boolean {
  const due = asDate(d.dueDate);
  return !!due && !DONE_DELIVERABLE.has(d.status) && due < asOf;
}

export interface DueSummary {
  overdue: number;
  dueSoon: number; // due within the window, not yet overdue
  openTotal: number; // all not-yet-published deliverables
}

/**
 * Deliverables status relative to `asOf`. `dueSoon` = due within `withinDays`.
 * Published deliverables are considered closed and never count as due/overdue.
 */
export function deliverablesDue(deliverables: DeliverableLite[], asOf: Date, withinDays = 14): DueSummary {
  const horizon = new Date(asOf.getTime() + withinDays * 86400000);
  let overdue = 0, dueSoon = 0, openTotal = 0;
  for (const d of deliverables) {
    if (DONE_DELIVERABLE.has(d.status)) continue;
    openTotal++;
    const due = asDate(d.dueDate);
    if (!due) continue;
    if (due < asOf) overdue++;
    else if (due <= horizon) dueSoon++;
  }
  return { overdue, dueSoon, openTotal };
}

/** Active sponsors whose renewal falls within `withinDays` of `asOf`. */
export function renewalsDue(sponsors: SponsorLite[], asOf: Date, withinDays = 60): number {
  const horizon = new Date(asOf.getTime() + withinDays * 86400000);
  return sponsors.filter((s) => {
    const r = asDate(s.renewalDate);
    return !!r && r >= asOf && r <= horizon;
  }).length;
}
