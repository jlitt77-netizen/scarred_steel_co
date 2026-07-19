// Pure reschedule-impact calculator. Given a cascade (task shifts) and the
// events attached to the affected tasks, produce the structured preview the
// ImpactDrawer renders and the apply step persists. No DB, fully testable.

import { addDays, type TaskShift, type ResourceConflict } from "./graph";

export interface EventNode {
  id: string;
  title: string;
  type: string;
  taskId: string | null;
  amountCents: number | null;
  workDate: Date | null;
  cashDate: Date | null;
  contentDate: Date | null;
  revenueDate: Date | null;
}

export type DateField = "workDate" | "cashDate" | "contentDate" | "revenueDate";
const DATE_FIELDS: DateField[] = ["workDate", "cashDate", "contentDate", "revenueDate"];

export interface EventShift {
  eventId: string;
  title: string;
  type: string;
  changes: Partial<Record<DateField, { old: Date; next: Date }>>;
  amountCents: number | null;
}

export interface MonthDelta {
  month: string; // YYYY-MM
  deltaCents: number; // signed: +into month, -out of month
}

export interface ImpactPreview {
  rootTaskId: string;
  deltaDays: number;
  // Headline counts (mirror the PRD "Move suspension install 14 days" example)
  counts: {
    downstreamTasks: number;
    cameraSessions: number;
    editingAssignments: number;
    contentPublishes: number;
    socialPosts: number;
    sponsorDeliverables: number;
    cashEvents: number;
    revenueEvents: number;
    milestones: number;
  };
  taskShifts: TaskShift[];
  eventShifts: EventShift[];
  resourceConflicts: ResourceConflict[];
  financial: {
    cashMonthDeltas: MonthDelta[];
    revenueMonthDeltas: MonthDelta[];
    deferredCashCents: number; // cash pushed later (delay>0)
    deferredRevenueCents: number;
  };
  sponsorDeliverableTitles: string[];
  milestoneTitles: string[];
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Aggregate signed money movement between months for a given date field. */
function monthDeltas(shifts: EventShift[], field: DateField): MonthDelta[] {
  const map = new Map<string, number>();
  for (const s of shifts) {
    const ch = s.changes[field];
    if (!ch || s.amountCents == null) continue;
    const oldM = monthKey(ch.old);
    const newM = monthKey(ch.next);
    if (oldM === newM) continue;
    map.set(oldM, (map.get(oldM) ?? 0) - s.amountCents);
    map.set(newM, (map.get(newM) ?? 0) + s.amountCents);
  }
  return [...map.entries()]
    .map(([month, deltaCents]) => ({ month, deltaCents }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function computeImpact(
  rootTaskId: string,
  deltaDays: number,
  taskShifts: TaskShift[],
  affectedEvents: EventNode[],
  resourceConflicts: ResourceConflict[],
): ImpactPreview {
  const eventShifts: EventShift[] = affectedEvents.map((e) => {
    const changes: EventShift["changes"] = {};
    for (const f of DATE_FIELDS) {
      const cur = e[f];
      if (cur) changes[f] = { old: cur, next: addDays(cur, deltaDays) };
    }
    return { eventId: e.id, title: e.title, type: e.type, changes, amountCents: e.amountCents };
  });

  const has = (e: EventNode, f: DateField) => e[f] != null;
  const cashEvents = affectedEvents.filter((e) => has(e, "cashDate"));
  const revenueEvents = affectedEvents.filter((e) => has(e, "revenueDate"));
  const contentEvents = affectedEvents.filter((e) => has(e, "contentDate"));

  const cashMonthDeltas = monthDeltas(eventShifts, "cashDate");
  const revenueMonthDeltas = monthDeltas(eventShifts, "revenueDate");

  const deferredCashCents =
    deltaDays > 0 ? cashEvents.reduce((s, e) => s + (e.amountCents ?? 0), 0) : 0;
  const deferredRevenueCents =
    deltaDays > 0 ? revenueEvents.reduce((s, e) => s + (e.amountCents ?? 0), 0) : 0;

  const sponsorDeliverables = affectedEvents.filter((e) => e.type === "sponsor_deliverable");
  const milestones = affectedEvents.filter(
    (e) => e.type === "vehicle_sale" || e.type === "milestone",
  );

  return {
    rootTaskId,
    deltaDays,
    counts: {
      downstreamTasks: Math.max(0, taskShifts.length - 1),
      cameraSessions: affectedEvents.filter((e) => e.type === "camera").length,
      editingAssignments: affectedEvents.filter((e) => e.type === "editing").length,
      contentPublishes: contentEvents.length,
      socialPosts: affectedEvents.filter((e) => e.type === "social").length,
      sponsorDeliverables: sponsorDeliverables.length,
      cashEvents: cashEvents.length,
      revenueEvents: revenueEvents.length,
      milestones: milestones.length,
    },
    taskShifts,
    eventShifts,
    resourceConflicts,
    financial: {
      cashMonthDeltas,
      revenueMonthDeltas,
      deferredCashCents,
      deferredRevenueCents,
    },
    sponsorDeliverableTitles: sponsorDeliverables.map((e) => e.title),
    milestoneTitles: milestones.map((e) => e.title),
  };
}
