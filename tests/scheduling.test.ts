import { describe, it, expect } from "vitest";
import {
  addDays,
  diffDays,
  downstreamTaskIds,
  computeCascade,
  detectOwnerConflicts,
  type TaskNode,
  type DependencyEdge,
} from "@/server/scheduling/graph";
import { computeImpact, type EventNode } from "@/server/scheduling/impact";

const d = (s: string) => new Date(s + "T00:00:00.000Z");

const tasks: TaskNode[] = [
  { id: "a", title: "Suspension", projectId: "p", ownerId: "u1", plannedStart: d("2026-05-01"), plannedEnd: d("2026-05-14") },
  { id: "b", title: "Paint", projectId: "p", ownerId: "u1", plannedStart: d("2026-06-01"), plannedEnd: d("2026-06-20") },
  { id: "c", title: "Reveal", projectId: "p", ownerId: "u2", plannedStart: d("2026-08-25"), plannedEnd: d("2026-08-30") },
];
const edges: DependencyEdge[] = [
  { predecessorId: "a", successorId: "b", type: "finish_to_start", lagDays: 0 },
  { predecessorId: "b", successorId: "c", type: "finish_to_start", lagDays: 0 },
];

describe("graph helpers", () => {
  it("adds and diffs days", () => {
    expect(diffDays(addDays(d("2026-05-01"), 14), d("2026-05-01"))).toBe(14);
  });

  it("finds transitive downstream tasks", () => {
    expect(downstreamTaskIds("a", edges).sort()).toEqual(["b", "c"]);
    expect(downstreamTaskIds("b", edges)).toEqual(["c"]);
    expect(downstreamTaskIds("c", edges)).toEqual([]);
  });
});

describe("computeCascade", () => {
  it("shifts the root and all downstream tasks by the delta", () => {
    const shifts = computeCascade(tasks, edges, "a", 14);
    expect(shifts).toHaveLength(3);
    const a = shifts.find((s) => s.taskId === "a")!;
    expect(a.newStart!.toISOString().slice(0, 10)).toBe("2026-05-15");
    expect(a.newEnd!.toISOString().slice(0, 10)).toBe("2026-05-28");
    const c = shifts.find((s) => s.taskId === "c")!;
    expect(c.newStart!.toISOString().slice(0, 10)).toBe("2026-09-08");
  });

  it("only shifts the root when it has no successors", () => {
    const shifts = computeCascade(tasks, edges, "c", 5);
    expect(shifts).toHaveLength(1);
    expect(shifts[0].taskId).toBe("c");
  });
});

describe("detectOwnerConflicts", () => {
  it("flags an owner double-booking created by the shift", () => {
    // Give u1 another task overlapping paint's new window.
    const extra: TaskNode = { id: "x", title: "Other u1 job", projectId: "p2", ownerId: "u1", plannedStart: d("2026-06-10"), plannedEnd: d("2026-06-18") };
    const all = [...tasks, extra];
    const shifts = computeCascade(all, edges, "a", 0); // no move, but b overlaps x already
    // Force a real overlap: move 'a' so paint(b) lands on x's window (b already 06-01..06-20 overlaps x 06-10..06-18)
    const conflicts = detectOwnerConflicts(all, shifts);
    expect(conflicts.some((c) => c.ownerId === "u1")).toBe(true);
  });

  it("does not flag different owners", () => {
    const shifts = computeCascade(tasks, edges, "a", 14);
    // a,b are u1 (sequential, non-overlapping), c is u2
    const conflicts = detectOwnerConflicts(tasks, shifts);
    expect(conflicts).toHaveLength(0);
  });
});

describe("computeImpact", () => {
  const events: EventNode[] = [
    { id: "e_cash", title: "Parts payment", type: "cash_outflow", taskId: "a", amountCents: 380000, workDate: d("2026-05-01"), cashDate: d("2026-04-20"), contentDate: null, revenueDate: null },
    { id: "e_content", title: "Episode publish", type: "content", taskId: "b", amountCents: 120000, workDate: null, cashDate: null, contentDate: d("2026-05-25"), revenueDate: d("2026-06-25") },
    { id: "e_sale", title: "Reveal & sale", type: "vehicle_sale", taskId: "c", amountCents: 4500000, workDate: d("2026-08-30"), cashDate: null, contentDate: null, revenueDate: d("2026-09-30") },
    { id: "e_sponsor", title: "Sponsor spot", type: "sponsor_deliverable", taskId: "b", amountCents: null, workDate: null, cashDate: null, contentDate: d("2026-05-26"), revenueDate: null },
  ];

  it("summarizes counts, shifts every date field, and defers cash/revenue", () => {
    const shifts = computeCascade(tasks, edges, "a", 14);
    const impact = computeImpact("a", 14, shifts, events, []);

    expect(impact.counts.downstreamTasks).toBe(2);
    expect(impact.counts.sponsorDeliverables).toBe(1);
    expect(impact.counts.milestones).toBe(1);
    expect(impact.counts.cashEvents).toBe(1);
    expect(impact.counts.revenueEvents).toBe(2);

    // The cash event's cashDate shifts 14 days: 2026-04-20 -> 2026-05-04
    const cashShift = impact.eventShifts.find((e) => e.eventId === "e_cash")!;
    expect(cashShift.changes.cashDate!.next.toISOString().slice(0, 10)).toBe("2026-05-04");
    expect(cashShift.changes.workDate!.next.toISOString().slice(0, 10)).toBe("2026-05-15");

    // Deferred cash = sum of cash-event amounts when delaying
    expect(impact.financial.deferredCashCents).toBe(380000);
    expect(impact.financial.deferredRevenueCents).toBe(120000 + 4500000);

    expect(impact.sponsorDeliverableTitles).toEqual(["Sponsor spot"]);
    expect(impact.milestoneTitles).toEqual(["Reveal & sale"]);
  });

  it("computes cross-month cash movement when a payment slips into the next month", () => {
    // cashDate 2026-04-20 + 14d = 2026-05-04 -> money leaves April, enters May
    const shifts = computeCascade(tasks, edges, "a", 14);
    const impact = computeImpact("a", 14, shifts, events, []);
    const april = impact.financial.cashMonthDeltas.find((m) => m.month === "2026-04");
    const may = impact.financial.cashMonthDeltas.find((m) => m.month === "2026-05");
    expect(april?.deltaCents).toBe(-380000);
    expect(may?.deltaCents).toBe(380000);
  });

  it("produces no month delta when the shift stays within the month", () => {
    const shifts = computeCascade(tasks, edges, "a", 2); // 04-20 -> 04-22, same month
    const impact = computeImpact("a", 2, shifts, events, []);
    expect(impact.financial.cashMonthDeltas).toHaveLength(0);
  });
});
